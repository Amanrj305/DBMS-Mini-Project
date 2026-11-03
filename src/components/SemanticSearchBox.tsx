'use client';

import React, { useState, useEffect } from 'react';
import {
  Search,
  Sliders,
  Sparkles,
  Clock,
  Layers,
  ExternalLink,
  AlertTriangle,
  Zap,
} from 'lucide-react';

interface LinkedEvent {
  event_id: number;
  title: string;
  event_type: string;
  impact_level: string;
  relevance_score: number;
}

interface SearchResult {
  article_id: number;
  source: string;
  title: string;
  article_url: string;
  published_at: string;
  content: string;
  cosine_distance: string;
  similarity_score: string;
  linked_events: LinkedEvent[];
}

export default function SemanticSearchBox() {
  const [queryText, setQueryText] = useState('Federal Reserve interest rate hike and bond yields');
  const [threshold, setThreshold] = useState<number>(0.20);
  const [limit, setLimit] = useState<number>(6);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [totalFound, setTotalFound] = useState<number>(0);
  const [hasSearched, setHasSearched] = useState(false);

  const sampleQueries = [
    'Federal Reserve interest rate hike and bond yields',
    'Nvidia Blackwell GPU datacenter capex surge',
    'Bank of Japan yen carry trade flash unwind',
    'Commercial real estate debt regional bank stress',
    'Middle East crude oil supply routes and OPEC cuts',
    'Tesla autonomous vehicle profitability and margin breakout',
  ];

  const handleSearch = async (e?: React.FormEvent, customQuery?: string) => {
    if (e) e.preventDefault();
    const q = customQuery !== undefined ? customQuery : queryText;
    if (!q.trim()) return;

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch('/api/semantic-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, threshold, limit }),
      });

      const data = await res.json();
      if (res.ok) {
        setResults(data.results || []);
        setLatencyMs(data.latencyMs);
        setTotalFound(data.count || 0);
      }
    } catch (err) {
      console.error('Semantic search error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Run initial search on mount
  useEffect(() => {
    handleSearch(undefined, queryText);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getSimilarityColor = (scoreNum: number) => {
    if (scoreNum >= 0.7) return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
    if (scoreNum >= 0.5) return 'text-purple-400 bg-purple-950/60 border-purple-800/80';
    if (scoreNum >= 0.35) return 'text-blue-400 bg-blue-950/60 border-blue-800/80';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  const getImpactBadge = (level: string) => {
    switch (level) {
      case 'CRITICAL':
        return 'bg-red-950/80 text-red-400 border-red-800';
      case 'HIGH':
        return 'bg-amber-950/80 text-amber-400 border-amber-800';
      case 'MEDIUM':
        return 'bg-blue-950/80 text-blue-400 border-blue-800';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar & Controls */}
      <div className="p-6 bg-[#0f172a] border border-slate-800 rounded-2xl shadow-xl space-y-4">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-purple-400" />
            <input
              type="text"
              value={queryText}
              onChange={(e) => setQueryText(e.target.value)}
              placeholder="Search financial corpus using natural language (e.g. 'rate cuts delayed')..."
              className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition shadow-inner"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-medium text-sm transition shadow-lg shadow-purple-600/25 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Vectorizing...</span>
              </>
            ) : (
              <>
                <Zap className="h-4 w-4" />
                <span>Vector Search</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Queries */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            <span>Suggested Vector Queries:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {sampleQueries.map((sq, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setQueryText(sq);
                  handleSearch(undefined, sq);
                }}
                className="text-xs px-2.5 py-1 rounded-full bg-slate-900 hover:bg-purple-950/40 text-slate-300 hover:text-purple-300 border border-slate-800 hover:border-purple-800/60 transition text-left"
              >
                {sq}
              </button>
            ))}
          </div>
        </div>

        {/* Parameters: Cosine Threshold & Limit */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <Sliders className="h-4 w-4 text-slate-500" />
            <div className="flex items-center gap-2">
              <span>Min Cosine Similarity:</span>
              <input
                type="range"
                min="0.10"
                max="0.80"
                step="0.05"
                value={threshold}
                onChange={(e) => setThreshold(parseFloat(e.target.value))}
                className="w-24 accent-purple-500 cursor-pointer"
              />
              <span className="font-mono text-purple-400 font-semibold">
                {(threshold * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span>Result Limit:</span>
            {[3, 6, 10, 20].map((num) => (
              <button
                key={num}
                type="button"
                onClick={() => setLimit(num)}
                className={`px-2 py-0.5 rounded border text-xs font-mono transition ${
                  limit === num
                    ? 'bg-purple-950/60 text-purple-300 border-purple-700'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Query Stats & Performance Banner */}
      {hasSearched && (
        <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-2.5 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            <span>
              Found <strong className="text-white">{totalFound}</strong> matching articles via{' '}
              <code className="text-purple-300 font-mono">news_article.embedding &lt;=&gt; query_vector</code>
            </span>
          </div>

          {latencyMs !== null && (
            <div className="flex items-center gap-1.5 font-mono text-slate-400">
              <Clock className="h-3.5 w-3.5 text-emerald-400" />
              <span>
                Total Latency: <strong className="text-emerald-400">{latencyMs} ms</strong> (HNSW Index: &lt;5ms)
              </span>
            </div>
          )}
        </div>
      )}

      {/* Results Grid */}
      <div className="space-y-4">
        {results.length === 0 && !loading && hasSearched ? (
          <div className="p-8 text-center bg-[#0f172a] border border-slate-800 rounded-2xl text-slate-400 space-y-2">
            <AlertTriangle className="h-8 w-8 mx-auto text-amber-500" />
            <h3 className="font-semibold text-white">No articles matched similarity threshold</h3>
            <p className="text-xs text-slate-500">
              Try lowering the minimum similarity threshold or using broader financial terms.
            </p>
          </div>
        ) : (
          results.map((art) => {
            const scoreNum = parseFloat(art.similarity_score);
            const distNum = parseFloat(art.cosine_distance);
            return (
              <div
                key={art.article_id}
                className="p-5 bg-[#0f172a] border border-slate-800 hover:border-slate-700 rounded-2xl transition shadow-lg space-y-3"
              >
                {/* Header: Source, Date, Cosine Score */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs font-semibold text-slate-300">
                      {art.source}
                    </span>
                    <span className="text-xs text-slate-500">
                      {new Date(art.published_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  </div>

                  {/* Similarity Badge */}
                  <div className="flex items-center space-x-2 font-mono">
                    <span className="text-[11px] text-slate-500">
                      Distance: <span className="text-slate-400">{distNum.toFixed(4)}</span>
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getSimilarityColor(
                        scoreNum
                      )}`}
                    >
                      {(scoreNum * 100).toFixed(1)}% Match
                    </span>
                  </div>
                </div>

                {/* Article Title & Content */}
                <div>
                  <h3 className="text-base font-bold text-white hover:text-purple-300 transition">
                    {art.title}
                  </h3>
                  <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                    {art.content}
                  </p>
                </div>

                {/* Linked Market Crash Events */}
                {art.linked_events && art.linked_events.length > 0 && (
                  <div className="pt-2 border-t border-slate-800/60 space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                      Correlated Market Crash Events:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {art.linked_events.map((ev) => (
                        <div
                          key={ev.event_id}
                          className="flex items-center space-x-2 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs"
                        >
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${getImpactBadge(
                              ev.impact_level
                            )}`}
                          >
                            {ev.impact_level}
                          </span>
                          <span className="text-slate-300 font-medium">{ev.title}</span>
                          <span className="text-[10px] text-purple-400 font-mono">
                            {(ev.relevance_score * 100).toFixed(0)}% link
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
