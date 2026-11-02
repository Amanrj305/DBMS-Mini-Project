import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { ticker: string } }
) {
  try {
    const ticker = params.ticker.toUpperCase();

    // 1. Fetch Company & Stock Profile
    const profileRes = await query(
      `
      SELECT 
        s.stock_id,
        s.ticker,
        s.isin,
        s.currency,
        c.name AS company_name,
        c.industry,
        c.country,
        c.website,
        sec.name AS sector_name,
        e.code AS exchange_code,
        e.name AS exchange_name,
        e.timezone
      FROM stock s
      JOIN company c ON s.company_id = c.company_id
      JOIN sector sec ON c.sector_id = sec.sector_id
      JOIN exchange e ON s.exchange_id = e.exchange_id
      WHERE s.ticker = $1
      LIMIT 1;
      `,
      [ticker]
    );

    if (profileRes.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: `Stock ticker '${ticker}' not found` },
        { status: 404 }
      );
    }

    const stock = profileRes.rows[0];

    // 2. Fetch Historical OHLCV Series with Rolling 20-day SMA & Anomaly Flags
    const historyRes = await query(
      `
      SELECT 
        md.market_data_id,
        TO_CHAR(md.trade_date, 'YYYY-MM-DD') AS trade_date,
        md.open_price::FLOAT AS open,
        md.high_price::FLOAT AS high,
        md.low_price::FLOAT AS low,
        md.close_price::FLOAT AS close,
        md.volume::BIGINT AS volume,
        ROUND(AVG(md.close_price) OVER (
          ORDER BY md.trade_date 
          ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
        ), 2)::FLOAT AS sma_20,
        a.anomaly_id,
        a.anomaly_type,
        a.severity_level,
        a.score::FLOAT AS anomaly_score,
        a.description AS anomaly_desc
      FROM market_data md
      LEFT JOIN anomaly a ON md.market_data_id = a.market_data_id
      WHERE md.stock_id = $1
      ORDER BY md.trade_date ASC;
      `,
      [stock.stock_id]
    );

    return NextResponse.json({
      success: true,
      stock,
      history: historyRes.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch stock history' },
      { status: 500 }
    );
  }
}
