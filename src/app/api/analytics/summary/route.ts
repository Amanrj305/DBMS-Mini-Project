import { NextResponse } from 'next/server';
import { query } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Overall counts
    const countsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM stock WHERE is_active = TRUE) AS total_stocks,
        (SELECT COUNT(*) FROM company) AS total_companies,
        (SELECT COUNT(*) FROM anomaly) AS total_anomalies,
        (SELECT COUNT(*) FROM anomaly WHERE severity_level = 'CRITICAL') AS critical_anomalies,
        (SELECT COUNT(*) FROM anomaly WHERE severity_level = 'HIGH') AS high_anomalies,
        (SELECT MAX(trade_date) FROM market_data) AS latest_trade_date
    `);

    // 2. Latest market breadth (gainers vs losers on latest date)
    const breadthRes = await query(`
      WITH latest_date AS (SELECT MAX(trade_date) AS max_date FROM market_data),
      changes AS (
        SELECT 
          s.ticker,
          c.name AS company_name,
          md.close_price,
          ROUND(((md.close_price - md.open_price) / NULLIF(md.open_price, 0)) * 100, 2) AS return_pct
        FROM market_data md
        JOIN stock s ON md.stock_id = s.stock_id
        JOIN company c ON s.company_id = c.company_id
        WHERE md.trade_date = (SELECT max_date FROM latest_date)
      )
      SELECT 
        (SELECT COUNT(*) FROM changes WHERE return_pct > 0) AS gainers_count,
        (SELECT COUNT(*) FROM changes WHERE return_pct < 0) AS losers_count,
        (SELECT COUNT(*) FROM changes WHERE return_pct = 0) AS unchanged_count
    `);

    // 3. Top Gainers & Losers
    const gainersRes = await query(`
      WITH latest_date AS (SELECT MAX(trade_date) AS max_date FROM market_data)
      SELECT 
        s.ticker,
        c.name AS company_name,
        md.close_price::FLOAT,
        ROUND(((md.close_price - md.open_price) / NULLIF(md.open_price, 0)) * 100, 2)::FLOAT AS return_pct
      FROM market_data md
      JOIN stock s ON md.stock_id = s.stock_id
      JOIN company c ON s.company_id = c.company_id
      WHERE md.trade_date = (SELECT max_date FROM latest_date)
      ORDER BY return_pct DESC
      LIMIT 5;
    `);

    const losersRes = await query(`
      WITH latest_date AS (SELECT MAX(trade_date) AS max_date FROM market_data)
      SELECT 
        s.ticker,
        c.name AS company_name,
        md.close_price::FLOAT,
        ROUND(((md.close_price - md.open_price) / NULLIF(md.open_price, 0)) * 100, 2)::FLOAT AS return_pct
      FROM market_data md
      JOIN stock s ON md.stock_id = s.stock_id
      JOIN company c ON s.company_id = c.company_id
      WHERE md.trade_date = (SELECT max_date FROM latest_date)
      ORDER BY return_pct ASC
      LIMIT 5;
    `);

    // 4. Sector Performance Breakdown
    const sectorRes = await query(`
      WITH latest_date AS (SELECT MAX(trade_date) AS max_date FROM market_data)
      SELECT 
        sec.name AS sector_name,
        COUNT(DISTINCT s.stock_id) AS stocks_count,
        ROUND(AVG(((md.close_price - md.open_price) / NULLIF(md.open_price, 0)) * 100), 2)::FLOAT AS avg_return_pct,
        SUM(md.turnover)::FLOAT AS total_turnover
      FROM sector sec
      JOIN company c ON sec.sector_id = c.sector_id
      JOIN stock s ON c.company_id = s.company_id
      JOIN market_data md ON s.stock_id = md.stock_id
      WHERE md.trade_date = (SELECT max_date FROM latest_date)
      GROUP BY sec.name
      ORDER BY avg_return_pct DESC;
    `);

    return NextResponse.json({
      success: true,
      stats: countsRes.rows[0],
      breadth: breadthRes.rows[0],
      topGainers: gainersRes.rows,
      topLosers: losersRes.rows,
      sectors: sectorRes.rows,
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch analytics summary' },
      { status: 500 }
    );
  }
}
