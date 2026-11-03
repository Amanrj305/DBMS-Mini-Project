import type { Metadata } from 'next';
import './globals.css';
import Navbar from '@/components/Navbar';

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
        <Navbar />

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
