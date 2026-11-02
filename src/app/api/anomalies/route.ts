import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const ticker = searchParams.get('ticker');
    const limit = parseInt(searchParams.get('limit') || '50', 10);

    let sql = `
      SELECT 
        a.anomaly_id,
        a.anomaly_type,
        a.severity_level,
        a.score::FLOAT AS anomaly_score,
        a.description,
        a.detected_at,
        TO_CHAR(md.trade_date, 'YYYY-MM-DD') AS trade_date,
        s.ticker,
        c.name AS company_name,
        sec.name AS sector_name,
        md.open_price::FLOAT AS open_price,
        md.close_price::FLOAT AS close_price,
        md.volume::BIGINT AS volume,
        ROUND(((md.close_price - md.open_price) / NULLIF(md.open_price, 0)) * 100, 2)::FLOAT AS return_pct
      FROM anomaly a
      JOIN market_data md ON a.market_data_id = md.market_data_id
      JOIN stock s ON md.stock_id = s.stock_id
      JOIN company c ON s.company_id = c.company_id
      JOIN sector sec ON c.sector_id = sec.sector_id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (severity && severity !== 'ALL') {
      params.push(severity.toUpperCase());
      sql += ` AND a.severity_level = $${params.length}`;
    }

    if (ticker) {
      params.push(ticker.toUpperCase());
      sql += ` AND s.ticker = $${params.length}`;
    }

    sql += ` ORDER BY a.anomaly_id DESC LIMIT $${params.length + 1};`;
    params.push(limit);

    const result = await query(sql, params);
    return NextResponse.json({ success: true, data: result.rows });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch anomalies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const tradeDate = body.trade_date || '2024-08-05';
    const threshold = body.threshold || 2.0;

    const sql = `SELECT * FROM sp_detect_market_anomalies($1::DATE, $2::NUMERIC);`;
    const result = await query(sql, [tradeDate, threshold]);

    return NextResponse.json({
      success: true,
      message: `Anomaly detection executed for ${tradeDate} at ${threshold}σ threshold.`,
      result: result.rows[0],
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to run anomaly detection procedure' },
      { status: 500 }
    );
  }
}
