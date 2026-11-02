import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import MarketOverviewCard from '@/components/MarketOverviewCard';
import AnomalyTable, { AnomalyItem } from '@/components/AnomalyTable';
import { ArrowUpRight, ArrowDownRight, Layers, ExternalLink } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getDashboardData() {
  try {
    // 1. Stats and latest trade date
    const statsRes = await query(`
      SELECT 
        (SELECT COUNT(*) FROM stock WHERE is_active = TRUE)::INT AS total_stocks,
        (SELECT COUNT(*) FROM company)::INT AS total_companies,
        (SELECT COUNT(*) FROM anomaly)::INT AS total_anomalies,
        (SELECT COUNT(*) FROM anomaly WHERE severity_level = 'CRITICAL')::INT AS critical_anomalies,
        (SELECT COUNT(*) FROM anomaly WHERE severity_level = 'HIGH')::INT AS high_anomalies,
        TO_CHAR((SELECT MAX(trade_date) FROM market_data), 'YYYY-MM-DD') AS latest_trade_date
    `);

    // 2. Latest market breadth
    const breadthRes = await query(`
      WITH latest_date AS (SELECT MAX(trade_date) AS max_date FROM market_data),
      changes AS (
        SELECT 
          s.ticker,
          md.close_price,
          ROUND(((md.close_price - md.open_price) / NULLIF(md.open_price, 0)) * 100, 2) AS return_pct
        FROM market_data md
        JOIN stock s ON md.stock_id = s.stock_id
        WHERE md.trade_date = (SELECT max_date FROM latest_date)
      )
      SELECT 
        COUNT(*) FILTER (WHERE return_pct > 0)::INT AS gainers_count,
        COUNT(*) FILTER (WHERE return_pct < 0)::INT AS losers_count,
        COUNT(*) FILTER (WHERE return_pct = 0)::INT AS unchanged_count
      FROM changes;
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
      LIMIT 4;
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
      LIMIT 4;
    `);

    // 4. Sector Performance
    const sectorRes = await query(`
      WITH latest_date AS (SELECT MAX(trade_date) AS max_date FROM market_data)
      SELECT 
        sec.name AS sector_name,
        COUNT(DISTINCT s.stock_id)::INT AS stocks_count,
        ROUND(AVG(((md.close_price - md.open_price) / NULLIF(md.open_price, 0)) * 100), 2)::FLOAT AS avg_return_pct,
        ROUND(SUM(md.turnover) / 1000000.0, 1)::FLOAT AS turnover_millions
      FROM sector sec
      JOIN company c ON sec.sector_id = c.sector_id
      JOIN stock s ON c.company_id = s.company_id
      JOIN market_data md ON s.stock_id = md.stock_id
      WHERE md.trade_date = (SELECT max_date FROM latest_date)
      GROUP BY sec.name
      ORDER BY avg_return_pct DESC;
    `);

    // 5. Recent Anomalies
    const anomalyRes = await query(`
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
      ORDER BY a.anomaly_id DESC
      LIMIT 15;
    `);

    return {
      stats: statsRes.rows[0] || {},
      breadth: breadthRes.rows[0] || {},
      topGainers: gainersRes.rows || [],
      topLosers: losersRes.rows || [],
      sectors: sectorRes.rows || [],
      anomalies: anomalyRes.rows as AnomalyItem[],
    };
  } catch (error) {
    console.error('Error loading dashboard data from PostgreSQL:', error);
    return {
      stats: { total_stocks: 20, total_anomalies: 0 },
      breadth: { gainers_count: 0, losers_count: 0 },
      topGainers: [],
      topLosers: [],
      sectors: [],
      anomalies: [],
    };
  }
}

export default async function DashboardPage() {
  const data = await getDashboardData();

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Market Analytics &amp; Crash Detection
          </h1>
          <p className="text-xs text-slate-400">
            Real-time equity time-series monitoring, Z-score volatility divergence &amp; pgvector semantic event correlation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/anomalies"
            className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition flex items-center gap-1.5 shadow-sm"
          >
            <span>Anomaly Audit Center</span>
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>

      {/* Overview Metric Cards */}
      <MarketOverviewCard stats={data.stats} breadth={data.breadth} />

      {/* Middle Grid: Top Movers & Sector Heatmap */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Gainers & Losers */}
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <ArrowUpRight className="h-4 w-4 text-emerald-400" />
            Top Movers &amp; Market Dispersion
          </h3>
          <div className="space-y-3">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">
                Top Advancers
              </div>
              <div className="space-y-1.5">
                {data.topGainers.map((stk) => (
                  <Link
                    key={stk.ticker}
                    href={`/stocks/${stk.ticker}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{stk.ticker}</span>
                      <span className="text-[11px] text-slate-400 ml-2">{stk.company_name}</span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">
                      +{stk.return_pct}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5 mt-2">
                Top Decliners
              </div>
              <div className="space-y-1.5">
                {data.topLosers.map((stk) => (
                  <Link
                    key={stk.ticker}
                    href={`/stocks/${stk.ticker}`}
                    className="flex items-center justify-between p-2 rounded-lg bg-slate-900/60 hover:bg-slate-800/80 transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-white">{stk.ticker}</span>
                      <span className="text-[11px] text-slate-400 ml-2">{stk.company_name}</span>
                    </div>
                    <span className="font-mono font-bold text-rose-400">
                      {stk.return_pct}%
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Sector Performance Breakdown */}
        <div className="lg:col-span-2 bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm">
          <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
            <Layers className="h-4 w-4 text-blue-400" />
            Sector Performance &amp; Capital Turnover
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {data.sectors.map((sec) => (
              <div
                key={sec.sector_name}
                className="p-3 rounded-lg bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition"
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="font-semibold text-xs text-white">{sec.sector_name}</span>
                  <span
                    className={`font-mono text-xs font-bold ${
                      sec.avg_return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {sec.avg_return_pct >= 0 ? `+${sec.avg_return_pct}%` : `${sec.avg_return_pct}%`}
                  </span>
                </div>
                <div className="flex justify-between text-[11px] text-slate-500">
                  <span>{sec.stocks_count} Equities</span>
                  <span>Turnover: ${sec.turnover_millions}M</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Section: Recent Detected Anomalies Table */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">Recent Market Anomaly Audit Feed</h3>
          <Link href="/anomalies" className="text-xs text-blue-400 hover:text-blue-300">
            View All Detected Anomalies &rarr;
          </Link>
        </div>
        <AnomalyTable initialAnomalies={data.anomalies} />
      </div>
    </div>
  );
}
