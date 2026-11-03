'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Bookmark,
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Search,
  CheckCircle2,
  Sliders,
} from 'lucide-react';

interface WatchlistItem {
  watchlist_id: number;
  watchlist_name: string;
  stock_id: number;
  ticker: string;
  currency: string;
  company_name: string;
  sector_name: string;
  exchange_code: string;
  close_price: string;
  open_price: string;
  daily_change_pct: string;
  latest_date: string;
  added_at: string;
  active_anomalies_count: string;
}

interface AvailableStock {
  stock_id: number;
  ticker: string;
  company_name: string;
  sector_name: string;
  exchange_code: string;
}

export default function WatchlistManager() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [allStocks, setAllStocks] = useState<AvailableStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStockId, setSelectedStockId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Preference state
  const [thresholdPreference, setThresholdPreference] = useState('2.0');
  const [inAppAlerts, setInAppAlerts] = useState(true);

  const fetchWatchlist = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/watchlist');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      }
    } catch (err) {
      console.error('Failed to fetch watchlist:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableStocks = async () => {
    try {
      const res = await fetch('/api/stocks');
      if (res.ok) {
        const data = await res.json();
        setAllStocks(data.stocks || []);
      }
    } catch (err) {
      console.error('Failed to fetch stocks list:', err);
    }
  };

  useEffect(() => {
    fetchWatchlist();
    fetchAvailableStocks();
  }, []);

  const handleAddStock = async () => {
    if (!selectedStockId) return;
    setAdding(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/watchlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stock_id: selectedStockId }),
      });

      if (res.ok) {
        await fetchWatchlist();
        setFeedback('Stock successfully added to watchlist!');
        setSelectedStockId(null);
        setTimeout(() => setFeedback(null), 3000);
      }
    } catch (err) {
      console.error('Error adding stock:', err);
    } finally {
      setAdding(false);
    }
  };

  const handleRemoveStock = async (stockId: number) => {
    try {
      const res = await fetch(`/api/watchlist?stock_id=${stockId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setItems((prev) => prev.filter((item) => item.stock_id !== stockId));
      }
    } catch (err) {
      console.error('Error removing stock:', err);
    }
  };

  // Filter available stocks not yet in watchlist
  const watchedStockIds = new Set(items.map((i) => i.stock_id));
  const availableToAdd = allStocks.filter(
    (s) =>
      !watchedStockIds.has(s.stock_id) &&
      (s.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.company_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-8">
      {/* Add Stock Card */}
      <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bookmark className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white">Subscribe to Stock Watchlist</h2>
          </div>
          <span className="text-xs text-slate-400">
            {items.length} stocks currently monitored
          </span>
        </div>

        {feedback && (
          <div className="p-3 rounded-lg bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4" />
            <span>{feedback}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Filter available equities (e.g. AAPL, NVDA, TSLA, TCS)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <select
            value={selectedStockId || ''}
            onChange={(e) => setSelectedStockId(Number(e.target.value) || null)}
            className="px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white focus:outline-none focus:border-emerald-500 transition sm:w-64"
          >
            <option value="">Select an equity to watch...</option>
            {availableToAdd.map((s) => (
              <option key={s.stock_id} value={s.stock_id}>
                {s.ticker} — {s.company_name} ({s.exchange_code})
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={handleAddStock}
            disabled={!selectedStockId || adding}
            className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-sm transition shadow-lg shadow-emerald-600/20 disabled:opacity-40 flex items-center justify-center gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>{adding ? 'Adding...' : 'Add Stock'}</span>
          </button>
        </div>
      </div>

      {/* Watched Stocks Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Active Watchlist Positions</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {items.length} Equities
          </span>
        </h3>

        {loading ? (
          <div className="p-8 text-center text-slate-500 text-xs">Loading watchlist...</div>
        ) : items.length === 0 ? (
          <div className="p-8 text-center bg-[#0f172a] border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <Bookmark className="h-8 w-8 mx-auto text-slate-600" />
            <div className="font-semibold text-white">Your watchlist is currently empty</div>
            <p className="text-xs text-slate-500">
              Select stocks above to monitor volatility spikes, price collapses, and automated trigger alerts.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {items.map((item) => {
              const chg = parseFloat(item.daily_change_pct || '0');
              const isPositive = chg >= 0;
              const anomalyCount = parseInt(item.active_anomalies_count || '0', 10);

              return (
                <div
                  key={item.stock_id}
                  className="p-5 bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-2xl transition shadow-lg space-y-3 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="text-base font-extrabold text-white tracking-wide">
                            {item.ticker}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-mono">
                            {item.exchange_code}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 truncate max-w-[200px]">
                          {item.company_name}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveStock(item.stock_id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 transition"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    {/* Price & Daily Return */}
                    <div className="flex items-baseline justify-between pt-1">
                      <div className="text-xl font-bold font-mono text-white">
                        {item.currency === 'USD' ? '$' : '₹'}
                        {parseFloat(item.close_price || '0').toFixed(2)}
                      </div>

                      <div
                        className={`flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full ${
                          isPositive
                            ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-800/80'
                            : 'text-red-400 bg-red-950/60 border border-red-800/80'
                        }`}
                      >
                        {isPositive ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {isPositive ? '+' : ''}
                          {chg.toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Anomaly Status & Link */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    {anomalyCount > 0 ? (
                      <span className="flex items-center gap-1 text-red-400 font-semibold text-[11px]">
                        <AlertTriangle className="h-3.5 w-3.5" />
                        <span>{anomalyCount} Anomaly Flag{anomalyCount > 1 ? 's' : ''}</span>
                      </span>
                    ) : (
                      <span className="text-slate-500 text-[11px]">Within Normal Bands</span>
                    )}

                    <Link
                      href={`/stocks/${item.ticker}`}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 text-xs"
                    >
                      <span>Chart</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Alert Sensitivity Rules & Preference Card */}
      <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <div className="flex items-center space-x-2 text-white font-bold text-sm">
          <Sliders className="h-4 w-4 text-purple-400" />
          <span>User Anomaly Alert Sensitivity Preferences</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-300">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-semibold text-white">Rolling Standard Deviation Threshold (Z-score)</div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Stored procedure <code className="text-purple-300">sp_detect_market_anomalies</code> fires an alert trigger
              when daily return Z-score breaches this standard deviation band:
            </p>
            <div className="flex items-center gap-2 pt-1">
              {['1.5', '2.0', '2.5', '3.0'].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setThresholdPreference(val)}
                  className={`px-3 py-1 rounded-lg border font-mono text-xs transition ${
                    thresholdPreference === val
                      ? 'bg-purple-950/60 text-purple-300 border-purple-600 font-bold'
                      : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                  }`}
                >
                  {val}σ
                </button>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
            <div className="font-semibold text-white">Notification Channels</div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Trigger <code className="text-purple-300">trg_on_anomaly_create_alert</code> records in-app notifications
              in real-time for your monitored stocks.
            </p>
            <div className="flex items-center space-x-4 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={inAppAlerts}
                  onChange={(e) => setInAppAlerts(e.target.checked)}
                  className="accent-purple-500 rounded"
                />
                <span className="text-xs text-white">In-App Notification Bell</span>
              </label>
              <label className="flex items-center space-x-2 text-slate-500 cursor-not-allowed">
                <input type="checkbox" checked disabled className="accent-slate-600 rounded" />
                <span className="text-xs">Database Audit Feed</span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
