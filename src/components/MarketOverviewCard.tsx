'use client';

import React from 'react';
import { AlertOctagon, TrendingDown, TrendingUp, DollarSign, Layers } from 'lucide-react';

interface MarketStatsProps {
  stats?: {
    total_stocks?: number;
    total_companies?: number;
    total_anomalies?: number;
    critical_anomalies?: number;
    high_anomalies?: number;
    latest_trade_date?: string;
  };
  breadth?: {
    gainers_count?: number;
    losers_count?: number;
    unchanged_count?: number;
  };
}

export default function MarketOverviewCard({ stats, breadth }: MarketStatsProps) {
  const totalStocks = stats?.total_stocks || 20;
  const totalAnomalies = stats?.total_anomalies || 0;
  const critical = stats?.critical_anomalies || 0;
  const high = stats?.high_anomalies || 0;
  const gainers = breadth?.gainers_count || 0;
  const losers = breadth?.losers_count || 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* 1. Tracked Stocks */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase font-semibold tracking-wider">Securities Tracked</span>
          <Layers className="h-4 w-4 text-blue-400" />
        </div>
        <div className="text-2xl font-bold text-white">{totalStocks} Equities</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
          <span className="text-blue-400 font-medium">8 Sectors</span> across NASDAQ, NYSE & NSE
        </div>
      </div>

      {/* 2. Detected Anomalies */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase font-semibold tracking-wider">Detected Anomalies</span>
          <AlertOctagon className="h-4 w-4 text-rose-500" />
        </div>
        <div className="text-2xl font-bold text-rose-400">{totalAnomalies} Incidents</div>
        <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
          <span className="px-1.5 py-0.5 rounded bg-rose-950/60 text-rose-400 font-semibold border border-rose-800/40">
            {critical} Critical
          </span>
          <span className="px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-400 font-semibold border border-amber-800/40">
            {high} High
          </span>
        </div>
      </div>

      {/* 3. Market Breadth */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase font-semibold tracking-wider">Market Breadth</span>
          <div className="flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
          </div>
        </div>
        <div className="text-2xl font-bold text-white">
          <span className="text-emerald-400">{gainers} ▲</span>
          <span className="text-slate-500 mx-2">/</span>
          <span className="text-rose-400">{losers} ▼</span>
        </div>
        <div className="text-xs text-slate-400 mt-1">
          Advancers vs. Decliners ratio
        </div>
      </div>

      {/* 4. Latest Pipeline Status */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm hover:border-slate-700 transition">
        <div className="flex items-center justify-between text-slate-400 mb-2">
          <span className="text-xs uppercase font-semibold tracking-wider">Detection Engine</span>
          <DollarSign className="h-4 w-4 text-emerald-400" />
        </div>
        <div className="text-2xl font-bold text-emerald-400">Live Active</div>
        <div className="text-xs text-slate-400 mt-1">
          Rolling 20-Day Z-Score & Volume Outlier
        </div>
      </div>
    </div>
  );
}
