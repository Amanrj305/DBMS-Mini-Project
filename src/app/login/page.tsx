'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShieldCheck, LogIn, UserCheck, AlertCircle, Sparkles } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to authenticate');
      }

      window.location.href = '/watchlist';
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  return (
    <div className="py-10 max-w-md mx-auto space-y-6">
      {/* Title Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex p-3 rounded-2xl bg-blue-950/60 text-blue-400 border border-blue-800/40">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">MarketGuard Access</h1>
        <p className="text-xs text-slate-400">
          Sign in to manage personal stock watchlists and receive real-time anomaly alerts.
        </p>
      </div>

      {/* Main Form */}
      <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-xl space-y-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-950/50 border border-red-800/60 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. analyst@pes.edu"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm transition shadow-lg shadow-blue-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <LogIn className="h-4 w-4" />
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
          </button>
        </form>

        <div className="text-center pt-2">
          <p className="text-xs text-slate-400">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-blue-400 hover:underline font-semibold">
              Register here
            </Link>
          </p>
        </div>
      </div>

      {/* Quick Demo Credentials Box for Examiners */}
      <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl space-y-2.5 text-xs">
        <div className="flex items-center gap-1.5 text-slate-300 font-semibold">
          <Sparkles className="h-4 w-4 text-purple-400" />
          <span>Examiner Quick-Login Credentials:</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => handleQuickLogin('admin@pes.edu', 'admin123')}
            className="p-2.5 text-left rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-purple-800/40 text-slate-200 transition"
          >
            <div className="font-semibold text-purple-300">Admin Role</div>
            <div className="text-[11px] text-slate-400">admin@pes.edu</div>
            <div className="text-[10px] text-slate-500">Pass: admin123</div>
          </button>

          <button
            type="button"
            onClick={() => handleQuickLogin('analyst@pes.edu', 'analyst123')}
            className="p-2.5 text-left rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-blue-800/40 text-slate-200 transition"
          >
            <div className="font-semibold text-blue-300">Analyst Role</div>
            <div className="text-[11px] text-slate-400">analyst@pes.edu</div>
            <div className="text-[10px] text-slate-500">Pass: analyst123</div>
          </button>
        </div>
      </div>
    </div>
  );
}
