import type { Metadata } from 'next';
import './globals.css';
import Link from 'next/link';
import { Activity, AlertTriangle, BarChart3, Search, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Financial Market Anomaly & Crash Detection System',
  description: 'PostgreSQL 17 + pgvector Level 3 DBMS Experiential Learning System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col">
        {/* Top Navbar */}
        <header className="border-b border-slate-800 bg-[#0f172a]/80 backdrop-blur-md sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-600/20 text-blue-400 p-2 rounded-lg border border-blue-500/30">
                <Activity className="h-5 w-5" />
              </div>
              <Link href="/" className="font-bold text-lg text-white hover:text-blue-400 transition">
                MarketGuard <span className="text-xs px-2 py-0.5 rounded-full bg-blue-900/50 text-blue-300 border border-blue-700/50">DBMS L3</span>
              </Link>
            </div>

            {/* Nav Links */}
            <nav className="flex items-center space-x-1 sm:space-x-4 text-sm font-medium">
              <Link
                href="/"
                className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5"
              >
                <BarChart3 className="h-4 w-4 text-blue-400" />
                <span>Dashboard</span>
              </Link>
              <Link
                href="/anomalies"
                className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5"
              >
                <AlertTriangle className="h-4 w-4 text-amber-400" />
                <span>Anomalies</span>
              </Link>
              <Link
                href="/semantic-search"
                className="px-3 py-1.5 rounded-md hover:bg-slate-800 text-slate-300 hover:text-white transition flex items-center gap-1.5"
              >
                <Search className="h-4 w-4 text-purple-400" />
                <span>Vector Search</span>
              </Link>
            </nav>

            {/* Right Meta badge */}
            <div className="hidden md:flex items-center space-x-3 text-xs text-slate-400">
              <div className="flex items-center gap-1 bg-emerald-950/40 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-800/40">
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>PostgreSQL 17 + pgvector</span>
              </div>
              <span className="text-slate-600">|</span>
              <span>PESU Sem 5</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-800/80 bg-[#0b0f19] py-4 text-center text-xs text-slate-500">
          <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
            <div>
              Financial Market Anomaly & Crash Detection System • Section A
            </div>
            <div>
              Developed by <strong>Aman Raj</strong> (PES2UG24CS053) & <strong>Amrit Raj Anmol</strong> (PES2UG24CS056)
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
