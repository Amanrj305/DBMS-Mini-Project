'use client';

import React from 'react';
import { Search, Sparkles } from 'lucide-react';

export default function SemanticSearchPage() {
  return (
    <div className="py-12 max-w-2xl mx-auto text-center space-y-4">
      <div className="inline-flex p-3 rounded-2xl bg-purple-950/50 text-purple-400 border border-purple-800/40">
        <Sparkles className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold text-white">
        pgvector Semantic News &amp; Event Search
      </h1>
      <p className="text-xs text-slate-400 leading-relaxed">
        This module enables natural language semantic similarity matching between financial news articles and market crash events using 384-dimensional vector embeddings and HNSW cosine distance indexing (<code className="text-purple-300">&lt;=&gt;</code>).
      </p>

      <div className="p-4 bg-[#111827] border border-slate-800 rounded-xl text-left text-xs text-slate-300">
        <div className="font-semibold text-white mb-1">Assigned Module:</div>
        <div className="text-slate-400">
          Implemented by <strong>Amrit Raj Anmol</strong> (SRN: PES2UG24CS056) under GitHub Issue #2, #4, and #6.
        </div>
      </div>
    </div>
  );
}
