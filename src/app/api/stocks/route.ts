import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = `
      WITH latest_date AS (
        SELECT MAX(trade_date) as max_date FROM market_data
      ),
      latest_quotes AS (
        SELECT 
          s.stock_id,
          s.ticker,
          c.name AS company_name,
          sec.name AS sector_name,
          e.code AS exchange_code,
          s.currency,
          md.close_price,
          md.open_price,
          ROUND(((md.close_price - md.open_price) / NULLIF(md.open_price, 0)) * 100, 2) AS daily_change_pct,
          md.volume,
          md.trade_date,
          (
            SELECT COUNT(*) 
            FROM anomaly a 
            WHERE a.market_data_id = md.market_data_id
          ) AS has_anomaly
        FROM stock s
        JOIN company c ON s.company_id = c.company_id
        JOIN sector sec ON c.sector_id = sec.sector_id
        JOIN exchange e ON s.exchange_id = e.exchange_id
        JOIN market_data md ON s.stock_id = md.stock_id
        WHERE md.trade_date = (SELECT max_date FROM latest_date)
          AND s.is_active = TRUE
      )
      SELECT * FROM latest_quotes
      ORDER BY ticker ASC;
    `;
    const result = await query(sql);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stocks' },
      { status: 500 }
    );
  }
}
