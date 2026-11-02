'use client';

import React, { useState, useEffect } from 'react';
import AnomalyTable, { AnomalyItem } from '@/components/AnomalyTable';
import { AlertOctagon, Play, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function AnomaliesPage() {
  const [anomalies, setAnomalies] = useState<AnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [simDate, setSimDate] = useState('2024-08-05');
  const [simThreshold, setSimThreshold] = useState('2.0');
  const [simulating, setSimulating] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);

  const fetchAnomalies = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/anomalies?limit=100');
      const json = await res.json();
      if (json.success) {
        setAnomalies(json.data);
      }
    } catch (err) {
      console.error('Failed to load anomalies:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnomalies();
  }, []);

  const handleRunDetection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSimulating(true);
      setSimResult(null);
      const res = await fetch('/api/anomalies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trade_date: simDate,
          threshold: parseFloat(simThreshold),
        }),
      });
      const data = await res.json();
      setSimResult(data);
      // Refresh the table
      await fetchAnomalies();
    } catch (err) {
      console.error('Error running detection:', err);
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <AlertOctagon className="h-6 w-6 text-rose-500" />
            Anomaly &amp; Crash Detection Center
          </h1>
          <p className="text-xs text-slate-400">
            Audit log of statistical outliers detected via 20-day moving window Z-scores and volume surges.
          </p>
        </div>
        <button
          onClick={fetchAnomalies}
          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition self-start"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Manual Anomaly Detection Runner (Interactive Demo for Evaluation) */}
      <div className="bg-[#111827] border border-blue-900/40 rounded-xl p-5 shadow-md">
        <div className="flex items-center gap-2 mb-2 text-sm font-bold text-white">
          <Play className="h-4 w-4 text-blue-400" />
          <span>Interactive Execution: Stored Procedure `sp_detect_market_anomalies`</span>
        </div>
        <p className="text-xs text-slate-400 mb-4">
          Execute the SQL stored procedure in real time to calculate rolling 20-day Z-scores and volume multipliers for a given trading session.
        </p>

        <form onSubmit={handleRunDetection} className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Trading Session Date
            </label>
            <input
              type="date"
              value={simDate}
              onChange={(e) => setSimDate(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-slate-300 mb-1">
              Z-Score Threshold (σ)
            </label>
            <select
              value={simThreshold}
              onChange={(e) => setSimThreshold(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:border-blue-500"
            >
              <option value="1.5">1.5σ (High Sensitivity)</option>
              <option value="2.0">2.0σ (Standard 95% Confidence)</option>
              <option value="2.5">2.5σ (Elevated Deviation)</option>
              <option value="3.0">3.0σ (Extreme Outliers Only)</option>
            </select>
          </div>

          <button
            type="submit"
            disabled={simulating}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {simulating ? (
              <>
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                <span>Running Procedure...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                <span>Run Stored Procedure</span>
              </>
            )}
          </button>
        </form>

        {/* Execution Output */}
        {simResult && (
          <div className="mt-4 p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-xs text-emerald-300 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-0.5 shrink-0" />
            <div>
              <div className="font-bold">{simResult.message}</div>
              {simResult.result && (
                <div className="text-[11px] text-emerald-400/80 mt-1">
                  Detected: {simResult.result.detected_anomalies_count} | Critical: {simResult.result.critical_count} | High: {simResult.result.high_count} | Medium: {simResult.result.medium_count}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main Anomaly Table */}
      {loading ? (
        <div className="p-12 text-center text-xs text-slate-500">
          Loading anomaly data from PostgreSQL...
        </div>
      ) : (
        <AnomalyTable initialAnomalies={anomalies} />
      )}
    </div>
  );
}
