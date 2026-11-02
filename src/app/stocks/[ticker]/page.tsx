import React from 'react';
import Link from 'next/link';
import { query } from '@/lib/db';
import StockChart from '@/components/StockChart';
import { ArrowLeft, Globe, MapPin, Building, ShieldAlert } from 'lucide-react';

export const dynamic = 'force-dynamic';

async function getStockData(ticker: string) {
  try {
    const formattedTicker = ticker.toUpperCase();

    // 1. Profile
    const profileRes = await query(
      `
      SELECT 
        s.stock_id,
        s.ticker,
        s.isin,
        s.currency,
        s.instrument_type,
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
      WHERE s.ticker = $1;
      `,
      [formattedTicker]
    );

    if (profileRes.rows.length === 0) return null;
    const stock = profileRes.rows[0];

    // 2. OHLCV Series with Rolling SMA
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

    // 3. Anomalies specific to this stock
    const anomaliesRes = await query(
      `
      SELECT 
        a.anomaly_id,
        a.anomaly_type,
        a.severity_level,
        a.score::FLOAT AS anomaly_score,
        a.description,
        TO_CHAR(md.trade_date, 'YYYY-MM-DD') AS trade_date,
        md.close_price::FLOAT,
        md.volume::BIGINT
      FROM anomaly a
      JOIN market_data md ON a.market_data_id = md.market_data_id
      WHERE md.stock_id = $1
      ORDER BY md.trade_date DESC;
      `,
      [stock.stock_id]
    );

    return {
      stock,
      history: historyRes.rows,
      anomalies: anomaliesRes.rows,
    };
  } catch (error) {
    console.error(`Error loading stock details for ${ticker}:`, error);
    return null;
  }
}

export default async function StockDetailPage({
  params,
}: {
  params: { ticker: string };
}) {
  const data = await getStockData(params.ticker);

  if (!data) {
    return (
      <div className="py-12 text-center">
        <h2 className="text-xl font-bold text-white mb-2">Ticker Not Found</h2>
        <p className="text-xs text-slate-400 mb-4">
          The stock ticker &apos;{params.ticker}&apos; does not exist in the database.
        </p>
        <Link
          href="/"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold"
        >
          &larr; Return to Dashboard
        </Link>
      </div>
    );
  }

  const { stock, history, anomalies } = data;
  const latestQuote = history[history.length - 1];
  const previousQuote = history[history.length - 2];
  const priceChange = latestQuote && previousQuote ? latestQuote.close - previousQuote.close : 0;
  const returnPct =
    latestQuote && previousQuote
      ? ((priceChange / previousQuote.close) * 100).toFixed(2)
      : '0.00';

  return (
    <div className="space-y-6">
      {/* Back button & Breadcrumb */}
      <div>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition mb-3"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Market Dashboard</span>
        </Link>
      </div>

      {/* Stock Header & Live Metrics */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black text-white">{stock.ticker}</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 font-medium">
              {stock.exchange_code}
            </span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-950/60 text-blue-300 border border-blue-800/40">
              {stock.sector_name}
            </span>
          </div>
          <div className="text-sm text-slate-400 mt-1">{stock.company_name}</div>
        </div>

        {/* Price & Quote summary */}
        {latestQuote && (
          <div className="text-left md:text-right">
            <div className="text-3xl font-extrabold text-white font-mono">
              {stock.currency} {latestQuote.close.toFixed(2)}
            </div>
            <div className={`text-xs font-mono font-bold mt-1 ${priceChange >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
              {priceChange >= 0 ? `+${priceChange.toFixed(2)}` : priceChange.toFixed(2)} ({returnPct}%)
            </div>
          </div>
        )}
      </div>

      {/* Interactive Candlestick Chart */}
      <StockChart ticker={stock.ticker} currency={stock.currency} history={history} />

      {/* Company Metadata & Fundamentals */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
            Company Profile
          </div>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Industry</span>
              <span className="text-slate-200">{stock.industry || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">ISIN Code</span>
              <span className="font-mono text-slate-200">{stock.isin || 'N/A'}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-800/60">
              <span className="text-slate-500">Country</span>
              <span className="text-slate-200">{stock.country}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500">Exchange</span>
              <span className="text-slate-200">{stock.exchange_name} ({stock.timezone})</span>
            </div>
          </div>
        </div>

        {/* Detected Anomalies Log for this stock */}
        <div className="md:col-span-2 bg-[#111827] border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-400" />
              <span>Historical Anomalies Recorded ({anomalies.length})</span>
            </div>
          </div>

          {anomalies.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-500 italic">
              No crash anomalies recorded for {stock.ticker} within the current dataset.
            </div>
          ) : (
            <div className="space-y-2">
              {anomalies.map((anom) => (
                <div
                  key={anom.anomaly_id}
                  className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono font-semibold text-slate-300">{anom.trade_date}</span>
                      <span
                        className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                          anom.severity_level === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-800'
                            : 'bg-amber-950 text-amber-300 border-amber-800'
                        }`}
                      >
                        {anom.severity_level}
                      </span>
                      <span className="font-semibold text-white">{anom.anomaly_type}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">{anom.description}</div>
                  </div>
                  <div className="text-right font-mono">
                    <div className="text-slate-300">Score: {anom.anomaly_score.toFixed(2)}</div>
                    <div className="text-[10px] text-slate-500">Close: {anom.close_price}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
