import { execFile } from 'child_process';
import path from 'path';
import { promisify } from 'util';

const execFileAsync = promisify(execFile);

// In-memory cache for query embeddings to ensure sub-millisecond retrieval on common queries
const vectorCache = new Map<string, number[]>();

/**
 * Computes a 384-dimensional dense vector embedding for a given text query
 * using sentence-transformers/all-MiniLM-L6-v2.
 */
export async function getQueryEmbedding(text: string): Promise<number[]> {
  const normalizedText = text.trim();
  if (!normalizedText) {
    throw new Error('Query text cannot be empty');
  }

  // Check in-memory cache
  if (vectorCache.has(normalizedText)) {
    return vectorCache.get(normalizedText)!;
  }

  const scriptPath = path.join(process.cwd(), 'scripts', 'embed_query.py');
  const pythonPath = process.env.PYTHON_PATH || '/Users/amritraj/venv/bin/python';

  try {
    const { stdout, stderr } = await execFileAsync(pythonPath, [scriptPath, normalizedText], {
      env: {
        ...process.env,
        HF_HUB_OFFLINE: '1',
        TRANSFORMERS_OFFLINE: '1',
      },
      timeout: 10000,
    });

    if (stderr && stderr.includes('Error encoding query')) {
      throw new Error(stderr);
    }

    const vector: number[] = JSON.parse(stdout.trim());
    if (!Array.isArray(vector) || vector.length !== 384) {
      throw new Error(`Invalid embedding vector dimension: expected 384, got ${vector.length}`);
    }

    // Save to cache (limit size to 500 items to prevent unbounded memory growth)
    if (vectorCache.size >= 500) {
      const firstKey = vectorCache.keys().next().value;
      if (firstKey) vectorCache.delete(firstKey);
    }
    vectorCache.set(normalizedText, vector);

    return vector;
  } catch (error: any) {
    console.error('[Embeddings Error]: Failed to generate query vector:', error);
    throw new Error(`Embedding model failure: ${error.message}`);
  }
}

/**
 * Formats a float array into PostgreSQL pgvector literal: '[val1, val2, ...]'
 */
export function formatVectorForPostgres(vector: number[]): string {
  return `[${vector.map((val) => val.toFixed(6)).join(',')}]`;
}
