import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser, ensureDemoUsersExist } from '@/lib/auth';

/**
 * Helper to get user ID or fall back to demo user
 */
async function resolveUserId(request: Request): Promise<number> {
  await ensureDemoUsersExist();
  const session = await getAuthUser(request);
  if (session) return session.userId;

  // Default to first user if unauthenticated for smooth demo evaluation
  const demo = await query('SELECT user_id FROM app_user ORDER BY user_id ASC LIMIT 1;');
  return demo.rows[0]?.user_id || 1;
}

export async function GET(request: Request) {
  try {
    const userId = await resolveUserId(request);

    // 1. Fetch user's watchlists
    const watchlistsRes = await query(
      `SELECT watchlist_id, name, created_at 
       FROM watchlist 
       WHERE user_id = $1 
       ORDER BY watchlist_id ASC;`,
      [userId]
    );

    // If user has no watchlist yet, create a default one
    if (watchlistsRes.rows.length === 0) {
      const newWl = await query(
        `INSERT INTO watchlist (user_id, name) VALUES ($1, $2) RETURNING watchlist_id, name, created_at;`,
        [userId, 'Primary Watchlist']
      );
      watchlistsRes.rows.push(newWl.rows[0]);
    }

    // 2. Fetch all stocks on user's watchlists with current prices & latest anomaly flags
    const itemsRes = await query(
      `SELECT 
         w.watchlist_id,
         w.name AS watchlist_name,
         wi.stock_id,
         s.ticker,
         s.currency,
         c.name AS company_name,
         sec.name AS sector_name,
         e.code AS exchange_code,
         md.close_price,
         md.open_price,
         ROUND(((md.close_price - md.open_price) / NULLIF(md.open_price, 0) * 100)::numeric, 2) AS daily_change_pct,
         md.trade_date AS latest_date,
         wi.added_at,
         (
           SELECT COUNT(*) 
           FROM anomaly a 
           WHERE a.market_data_id = md.market_data_id
         ) AS active_anomalies_count
       FROM watchlist w
       JOIN watchlist_item wi ON w.watchlist_id = wi.watchlist_id
       JOIN stock s ON wi.stock_id = s.stock_id
       JOIN company c ON s.company_id = c.company_id
       JOIN sector sec ON c.sector_id = sec.sector_id
       JOIN exchange e ON s.exchange_id = e.exchange_id
       LEFT JOIN LATERAL (
         SELECT close_price, open_price, trade_date, market_data_id
         FROM market_data md2
         WHERE md2.stock_id = s.stock_id
         ORDER BY trade_date DESC
         LIMIT 1
       ) md ON TRUE
       WHERE w.user_id = $1
       ORDER BY w.watchlist_id, s.ticker;`,
      [userId]
    );

    return NextResponse.json({
      success: true,
      userId,
      watchlists: watchlistsRes.rows,
      items: itemsRes.rows,
    });
  } catch (error: any) {
    console.error('[Watchlist GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to fetch watchlists: ' + error.message },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json();
    const { stock_id, ticker, watchlist_id } = body;

    let targetStockId = stock_id;
    if (!targetStockId && ticker) {
      const stockRes = await query('SELECT stock_id FROM stock WHERE ticker = $1 LIMIT 1;', [ticker.toUpperCase()]);
      if (stockRes.rows.length === 0) {
        return NextResponse.json({ error: `Stock with ticker ${ticker} not found` }, { status: 404 });
      }
      targetStockId = stockRes.rows[0].stock_id;
    }

    if (!targetStockId) {
      return NextResponse.json({ error: 'stock_id or ticker is required' }, { status: 400 });
    }

    // Determine target watchlist
    let targetWlId = watchlist_id;
    if (!targetWlId) {
      const wlRes = await query('SELECT watchlist_id FROM watchlist WHERE user_id = $1 ORDER BY watchlist_id ASC LIMIT 1;', [userId]);
      if (wlRes.rows.length > 0) {
        targetWlId = wlRes.rows[0].watchlist_id;
      } else {
        const newWl = await query('INSERT INTO watchlist (user_id, name) VALUES ($1, $2) RETURNING watchlist_id;', [userId, 'Primary Watchlist']);
        targetWlId = newWl.rows[0].watchlist_id;
      }
    }

    // Verify ownership
    const ownerCheck = await query('SELECT watchlist_id FROM watchlist WHERE watchlist_id = $1 AND user_id = $2;', [targetWlId, userId]);
    if (ownerCheck.rows.length === 0) {
      return NextResponse.json({ error: 'Watchlist not found or access denied' }, { status: 403 });
    }

    // Insert item
    await query(
      `INSERT INTO watchlist_item (watchlist_id, stock_id)
       VALUES ($1, $2)
       ON CONFLICT (watchlist_id, stock_id) DO NOTHING;`,
      [targetWlId, targetStockId]
    );

    return NextResponse.json({
      success: true,
      message: 'Stock added to watchlist successfully',
      watchlistId: targetWlId,
      stockId: targetStockId,
    });
  } catch (error: any) {
    console.error('[Watchlist POST Error]:', error);
    return NextResponse.json(
      { error: 'Failed to add stock to watchlist: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await resolveUserId(request);
    const { searchParams } = new URL(request.url);
    const stockId = searchParams.get('stock_id');
    const watchlistId = searchParams.get('watchlist_id');

    if (!stockId) {
      return NextResponse.json({ error: 'stock_id is required' }, { status: 400 });
    }

    if (watchlistId) {
      await query(
        `DELETE FROM watchlist_item wi
         USING watchlist w
         WHERE wi.watchlist_id = w.watchlist_id
           AND w.user_id = $1
           AND wi.watchlist_id = $2
           AND wi.stock_id = $3;`,
        [userId, parseInt(watchlistId, 10), parseInt(stockId, 10)]
      );
    } else {
      // Remove from all watchlists of this user
      await query(
        `DELETE FROM watchlist_item wi
         USING watchlist w
         WHERE wi.watchlist_id = w.watchlist_id
           AND w.user_id = $1
           AND wi.stock_id = $2;`,
        [userId, parseInt(stockId, 10)]
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Stock removed from watchlist',
    });
  } catch (error: any) {
    console.error('[Watchlist DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Failed to remove stock from watchlist: ' + error.message },
      { status: 500 }
    );
  }
}
