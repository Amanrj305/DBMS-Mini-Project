import React from 'react';
import WatchlistManager from '@/components/WatchlistManager';
import { Bookmark, ShieldCheck, Bell } from 'lucide-react';

export const metadata = {
  title: 'Stock Watchlist & Alert Preferences | MarketGuard',
  description: 'Manage personalized stock watchlists and automated anomaly alert rules.',
};

export default function WatchlistPage() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto py-4">
      {/* Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
              <Bookmark className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Personalized Stock Watchlists &amp; Alerts
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Monitor real-time equity positions and configure automated database trigger alerts (<code className="text-emerald-300">trg_on_anomaly_create_alert</code>)
            for high volatility swings, volume surges, and market crashes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 text-xs">
            <Bell className="h-3.5 w-3.5" />
            <span>Automated Triggers</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Watchlist Manager */}
      <WatchlistManager />
    </div>
  );
}
