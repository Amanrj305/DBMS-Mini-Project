'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, CheckCheck, AlertTriangle, ExternalLink, X } from 'lucide-react';
import Link from 'next/link';

interface AlertItem {
  alert_id: number;
  anomaly_id: number;
  alert_type: string;
  message: string;
  is_read: boolean;
  created_at: string;
  severity_level: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  score: string;
  ticker: string;
  company_name: string;
  trade_date: string;
}

export default function AlertDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchAlerts = async () => {
    try {
      const res = await fetch('/api/alerts?limit=15');
      if (res.ok) {
        const data = await res.json();
        setAlerts(data.alerts || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch (err) {
      console.error('Failed to fetch alerts:', err);
    }
  };

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 15000); // Polling every 15s for live notifications
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markAllAsRead = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mark_all_read: true }),
      });
      if (res.ok) {
        setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
        setUnreadCount(0);
      }
    } catch (err) {
      console.error('Failed to mark all alerts read:', err);
    } finally {
      setLoading(false);
    }
  };

  const markSingleAsRead = async (alertId: number) => {
    try {
      await fetch('/api/alerts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alert_id: alertId }),
      });
      setAlerts((prev) =>
        prev.map((a) => (a.alert_id === alertId ? { ...a, is_read: true } : a))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark alert read:', err);
    }
  };

  const getSeverityBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950/70 text-red-400 border-red-800/80';
      case 'HIGH':
        return 'bg-amber-950/70 text-amber-400 border-amber-800/80';
      case 'MEDIUM':
        return 'bg-blue-950/70 text-blue-400 border-blue-800/80';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 transition"
        aria-label="Market Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white shadow-md animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-800 bg-[#0f172a] shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 bg-slate-900/60">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-semibold text-white">Anomaly Alerts</span>
              {unreadCount > 0 ? (
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-medium text-red-400 border border-red-500/30">
                  {unreadCount} unread
                </span>
              ) : (
                <span className="rounded-full bg-slate-800 px-2 py-0.5 text-xs text-slate-400">
                  All caught up
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={markAllAsRead}
                disabled={loading}
                className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition disabled:opacity-50"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                <span>Mark all read</span>
              </button>
            )}
          </div>

          {/* Alert List */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60">
            {alerts.length === 0 ? (
              <div className="px-4 py-8 text-center text-xs text-slate-500 space-y-2">
                <AlertTriangle className="h-6 w-6 mx-auto text-slate-600" />
                <p>No alerts recorded yet.</p>
                <p className="text-[11px] text-slate-600">
                  Add stocks to your Watchlist to receive automatic triggers when anomalies strike.
                </p>
              </div>
            ) : (
              alerts.map((alert) => (
                <div
                  key={alert.alert_id}
                  className={`p-3.5 transition hover:bg-slate-800/40 flex flex-col space-y-1.5 ${
                    !alert.is_read ? 'bg-blue-950/15' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-xs text-white bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                        {alert.ticker}
                      </span>
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.2 rounded-full border ${getSeverityBadge(
                          alert.severity_level
                        )}`}
                      >
                        {alert.severity_level}
                      </span>
                    </div>
                    {!alert.is_read && (
                      <button
                        type="button"
                        onClick={() => markSingleAsRead(alert.alert_id)}
                        className="text-[10px] text-slate-400 hover:text-white"
                        title="Mark as read"
                      >
                        ✓
                      </button>
                    )}
                  </div>

                  <p className="text-xs text-slate-300 leading-snug line-clamp-2">
                    {alert.message}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-0.5">
                    <span>
                      {new Date(alert.created_at).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <Link
                      href={`/stocks/${alert.ticker}`}
                      onClick={() => setIsOpen(false)}
                      className="text-blue-400 hover:underline flex items-center gap-0.5"
                    >
                      <span>Inspect stock</span>
                      <ExternalLink className="h-2.5 w-2.5" />
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-800 px-4 py-2.5 bg-slate-950/70 text-center">
            <Link
              href="/watchlist"
              onClick={() => setIsOpen(false)}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium"
            >
              Manage Watchlist &amp; Alert Preferences →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
