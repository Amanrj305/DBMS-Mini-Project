import React from 'react';
import SemanticSearchBox from '@/components/SemanticSearchBox';
import { Sparkles, Database, Network, Binary, ShieldCheck } from 'lucide-react';

export const metadata = {
  title: 'pgvector Semantic Search | Financial Market Anomaly System',
  description: 'Sub-millisecond vector similarity search using PostgreSQL 17 pgvector HNSW indexing.',
};

export default function SemanticSearchPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto py-4">
      {/* Page Title & Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-2 rounded-lg bg-purple-950/60 text-purple-400 border border-purple-800/40">
              <Sparkles className="h-5 w-5" />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              pgvector Semantic Search &amp; Event Correlation
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-400 max-w-2xl leading-relaxed">
            Execute natural language similarity queries against financial news articles and correlate them
            with market crash anomalies using 384-dimensional vector embeddings and PostgreSQL 17 HNSW indexing.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-950/50 text-purple-300 border border-purple-800/50 text-xs">
            <Binary className="h-3.5 w-3.5" />
            <span>VECTOR(384)</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-950/50 text-blue-300 border border-blue-800/50 text-xs">
            <Network className="h-3.5 w-3.5" />
            <span>HNSW Cosine Index</span>
          </div>
        </div>
      </div>

      {/* Main Interactive Search Component */}
      <SemanticSearchBox />

      {/* DBMS Architectural Callout Card for Examination Viva */}
      <div className="p-6 bg-[#0f172a] border border-slate-800/80 rounded-2xl space-y-4 shadow-xl">
        <div className="flex items-center space-x-2 text-purple-400 font-semibold text-sm">
          <Database className="h-4 w-4" />
          <span>DBMS Architecture &amp; pgvector Technical Implementation</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1">
              <span className="text-purple-400">01.</span> Model &amp; Embedding
            </div>
            <p className="text-slate-400 leading-relaxed">
              Articles and queries are transformed into <strong>384-dimensional dense vectors</strong> using{' '}
              <code className="text-purple-300">all-MiniLM-L6-v2</code>, capturing contextual semantic meaning beyond keyword matching.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1">
              <span className="text-purple-400">02.</span> HNSW Indexing
            </div>
            <p className="text-slate-400 leading-relaxed">
              Indexed via <code className="text-purple-300">USING hnsw (embedding vector_cosine_ops)</code>. Provides logarithmic
              search complexity <code className="text-purple-300">O(log N)</code> and sub-10ms query latency.
            </p>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
            <div className="font-bold text-white flex items-center gap-1">
              <span className="text-purple-400">03.</span> Relational Hybrid JOINs
            </div>
            <p className="text-slate-400 leading-relaxed">
              Stored procedure <code className="text-purple-300">fn_match_news_semantic</code> performs vector distance ranking
              combined with relational foreign keys to <code className="text-purple-300">market_event</code> and <code className="text-purple-300">event_news</code>.
            </p>
          </div>
        </div>

        <div className="pt-2 text-right text-[11px] text-slate-500">
          Implemented by <strong>Amrit Raj Anmol</strong> (PES2UG24CS056) • DBMS Experiential Learning Level 3
        </div>
      </div>
    </div>
  );
}
