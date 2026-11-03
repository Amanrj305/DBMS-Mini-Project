import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getAuthUser, ensureDemoUsersExist } from '@/lib/auth';

async function resolveUserId(request: Request): Promise<number> {
  await ensureDemoUsersExist();
  const session = await getAuthUser(request);
  if (session) return session.userId;

  const demo = await query('SELECT user_id FROM app_user ORDER BY user_id ASC LIMIT 1;');
  return demo.rows[0]?.user_id || 1;
}

export async function GET(request: Request) {
  try {
    const userId = await resolveUserId(request);
    const { searchParams } = new URL(request.url);
    const unreadOnly = searchParams.get('unread') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    const filterClause = unreadOnly ? 'AND al.is_read = FALSE' : '';

    const res = await query(
      `SELECT 
         al.alert_id,
         al.anomaly_id,
         al.alert_type,
         al.message,
         al.is_read,
         al.created_at,
         an.severity_level,
         an.score,
         an.anomaly_type,
         an.description AS anomaly_description,
         s.ticker,
         c.name AS company_name,
         md.trade_date,
         md.close_price
       FROM alert al
       JOIN anomaly an ON al.anomaly_id = an.anomaly_id
       JOIN market_data md ON an.market_data_id = md.market_data_id
       JOIN stock s ON md.stock_id = s.stock_id
       JOIN company c ON s.company_id = c.company_id
       WHERE al.user_id = $1 ${filterClause}
       ORDER BY al.created_at DESC, al.alert_id DESC
       LIMIT $2;`,
      [userId, limit]
    );

    const countRes = await query(
      `SELECT 
         COUNT(*) AS total_count,
         COUNT(*) FILTER (WHERE is_read = FALSE) AS unread_count
       FROM alert
       WHERE user_id = $1;`,
      [userId]
    );

    const counts = countRes.rows[0] || { total_count: 0, unread_count: 0 };

    return NextResponse.json({
      success: true,
      userId,
      unreadCount: parseInt(counts.unread_count, 10),
      totalCount: parseInt(counts.total_count, 10),
      alerts: res.rows,
    });
  } catch (error: any) {
    console.error('[Alerts GET Error]:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve alerts: ' + error.message },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const userId = await resolveUserId(request);
    const body = await request.json().catch(() => ({}));
    const { alert_id, mark_all_read } = body;

    if (mark_all_read) {
      await query(
        `UPDATE alert 
         SET is_read = TRUE 
         WHERE user_id = $1 AND is_read = FALSE;`,
        [userId]
      );
      return NextResponse.json({
        success: true,
        message: 'All alerts marked as read',
      });
    }

    if (!alert_id) {
      return NextResponse.json(
        { error: 'alert_id or mark_all_read: true is required' },
        { status: 400 }
      );
    }

    await query(
      `UPDATE alert 
       SET is_read = TRUE 
       WHERE alert_id = $1 AND user_id = $2;`,
      [alert_id, userId]
    );

    return NextResponse.json({
      success: true,
      message: `Alert ${alert_id} marked as read`,
    });
  } catch (error: any) {
    console.error('[Alerts PATCH Error]:', error);
    return NextResponse.json(
      { error: 'Failed to update alert: ' + error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const userId = await resolveUserId(request);
    const { searchParams } = new URL(request.url);
    const alertId = searchParams.get('alert_id');
    const clearRead = searchParams.get('clear_read') === 'true';

    if (clearRead) {
      await query(
        `DELETE FROM alert 
         WHERE user_id = $1 AND is_read = TRUE;`,
        [userId]
      );
      return NextResponse.json({
        success: true,
        message: 'Read alerts cleared successfully',
      });
    }

    if (alertId) {
      await query(
        `DELETE FROM alert 
         WHERE alert_id = $1 AND user_id = $2;`,
        [alertId, userId]
      );
      return NextResponse.json({
        success: true,
        message: `Alert ${alertId} deleted successfully`,
      });
    }

    return NextResponse.json(
      { error: 'Provide alert_id or clear_read=true' },
      { status: 400 }
    );
  } catch (error: any) {
    console.error('[Alerts DELETE Error]:', error);
    return NextResponse.json(
      { error: 'Failed to delete alert: ' + error.message },
      { status: 500 }
    );
  }
}
