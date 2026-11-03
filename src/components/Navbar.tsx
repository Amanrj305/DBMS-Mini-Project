'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Search,
  Bookmark,
  ShieldCheck,
  User,
  LogOut,
  LogIn,
} from 'lucide-react';
import AlertDropdown from './AlertDropdown';

interface UserSession {
  userId: number;
  email: string;
  name: string;
  role: 'Admin' | 'Analyst';
}

export default function Navbar() {
  const pathname = usePathname();
  const [user, setUser] = useState<UserSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          }
        }
      } catch (err) {
        console.error('Failed to verify session:', err);
      } finally {
        setLoading(false);
      }
    }
    checkAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      window.location.href = '/login';
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: BarChart3, color: 'text-blue-400' },
    { href: '/anomalies', label: 'Anomalies', icon: AlertTriangle, color: 'text-amber-400' },
    { href: '/semantic-search', label: 'Vector Search', icon: Search, color: 'text-purple-400' },
    { href: '/watchlist', label: 'Watchlist', icon: Bookmark, color: 'text-emerald-400' },
  ];

  return (
    <header className="border-b border-slate-800 bg-[#0f172a]/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg border border-blue-500/30">
            <Activity className="h-5 w-5" />
          </div>
          <Link href="/" className="font-bold text-lg text-white hover:text-blue-400 transition flex items-center gap-2">
            <span>MarketGuard</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/50">
              DBMS L3
            </span>
          </Link>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center space-x-1 sm:space-x-2 text-sm font-medium">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-1.5 rounded-md transition flex items-center gap-1.5 ${
                  isActive
                    ? 'bg-slate-800 text-white font-semibold shadow-inner'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${link.color}`} />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right Section: Alerts + User Profile / Login */}
        <div className="flex items-center space-x-3">
          {/* Live Anomaly Notification Bell */}
          <AlertDropdown />

          {/* User Profile / Auth State */}
          {user ? (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs">
              <div className="flex flex-col text-right">
                <span className="font-semibold text-white leading-tight">{user.name}</span>
                <span
                  className={`text-[10px] font-medium leading-none ${
                    user.role === 'Admin' ? 'text-purple-400' : 'text-blue-400'
                  }`}
                >
                  {user.role} Role
                </span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="p-1 rounded text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                title="Log Out"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition shadow-sm"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </Link>
          )}

          {/* PostgreSQL 17 + pgvector Pill */}
          <div className="hidden lg:flex items-center gap-1 bg-emerald-950/40 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800/40 text-xs">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>PostgreSQL 17</span>
          </div>
        </div>
      </div>
    </header>
  );
}
