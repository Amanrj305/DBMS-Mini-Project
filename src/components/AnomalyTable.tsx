'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ChevronRight, Filter, Search, X } from 'lucide-react';

export interface AnomalyItem {
  anomaly_id: number;
  anomaly_type: string;
  severity_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  anomaly_score: number;
  description: string;
  detected_at: string;
  trade_date: string;
  ticker: string;
  company_name: string;
  sector_name: string;
  open_price: number;
  close_price: number;
  volume: number;
  return_pct: number;
}

interface AnomalyTableProps {
  initialAnomalies: AnomalyItem[];
}

export default function AnomalyTable({ initialAnomalies }: AnomalyTableProps) {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedAnomaly, setSelectedAnomaly] = useState<AnomalyItem | null>(null);

  const filtered = initialAnomalies.filter((item) => {
    const matchesSeverity = severityFilter === 'ALL' || item.severity_level === severityFilter;
    const matchesSearch =
      item.ticker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.anomaly_type.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSeverity && matchesSearch;
  });

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-rose-950/80 text-rose-300 border-rose-800';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-300 border-amber-800';
      case 'MEDIUM':
        return 'bg-yellow-950/80 text-yellow-300 border-yellow-800';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl overflow-hidden shadow-sm">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Severity Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
          {['ALL', 'CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSeverityFilter(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                severityFilter === lvl
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-500" />
          <input
            type="text"
            placeholder="Search ticker, company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table Element */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-[#0b0f19] text-slate-400 border-b border-slate-800 uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Ticker / Company</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Anomaly Type</th>
              <th className="py-3 px-4">Severity</th>
              <th className="py-3 px-4 text-right">Day Return</th>
              <th className="py-3 px-4 text-right">Score</th>
              <th className="py-3 px-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 text-slate-200">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 italic">
                  No market anomalies found matching the current filters.
                </td>
              </tr>
            ) : (
              filtered.map((item) => (
                <tr
                  key={item.anomaly_id}
                  className="hover:bg-slate-800/40 transition cursor-pointer"
                  onClick={() => setSelectedAnomaly(item)}
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Link
                        href={`/stocks/${item.ticker}`}
                        className="hover:text-blue-400 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {item.ticker}
                      </Link>
                    </div>
                    <div className="text-[11px] text-slate-400">{item.company_name}</div>
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-300">{item.trade_date}</td>
                  <td className="py-3 px-4">
                    <span className="font-medium text-slate-300">{item.anomaly_type}</span>
                    <div className="text-[10px] text-slate-500 truncate max-w-xs">{item.description}</div>
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold border ${getSeverityBadge(
                        item.severity_level
                      )}`}
                    >
                      {item.severity_level}
                    </span>
                  </td>
                  <td className={`py-3 px-4 text-right font-mono font-semibold ${item.return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {item.return_pct > 0 ? `+${item.return_pct}%` : `${item.return_pct}%`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">
                    {item.anomaly_score.toFixed(2)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAnomaly(item);
                      }}
                      className="p-1 rounded hover:bg-slate-700 text-slate-400 hover:text-white"
                      title="Inspect indicator breakdown"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Drill-Down Indicator Modal */}
      {selectedAnomaly && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="bg-[#111827] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setSelectedAnomaly(null)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-2 mb-3">
              <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getSeverityBadge(selectedAnomaly.severity_level)}`}>
                {selectedAnomaly.severity_level}
              </span>
              <span className="text-lg font-bold text-white">{selectedAnomaly.ticker}</span>
              <span className="text-xs text-slate-400">• {selectedAnomaly.trade_date}</span>
            </div>

            <h4 className="text-sm font-semibold text-slate-200 mb-2">
              {selectedAnomaly.anomaly_type}
            </h4>
            <p className="text-xs text-slate-400 mb-4 bg-slate-900/60 p-3 rounded-lg border border-slate-800">
              {selectedAnomaly.description}
            </p>

            <div className="space-y-3 mb-6">
              <h5 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Price & Volume Impact
              </h5>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">Open Price</div>
                  <div className="font-mono text-white font-bold">{selectedAnomaly.open_price}</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">Close Price</div>
                  <div className="font-mono text-white font-bold">{selectedAnomaly.close_price}</div>
                </div>
                <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                  <div className="text-[10px] text-slate-500">Day Return</div>
                  <div className={`font-mono font-bold ${selectedAnomaly.return_pct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {selectedAnomaly.return_pct}%
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Link
                href={`/stocks/${selectedAnomaly.ticker}`}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg transition"
              >
                View Full Stock Chart
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
