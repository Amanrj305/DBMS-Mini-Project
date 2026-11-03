#!/usr/bin/env python3
"""
Lightweight CLI vector encoder for user natural language search queries
Output: JSON array of 384-dimensional dense float vector
"""

import os
import sys
import json

os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

try:
    from sentence_transformers import SentenceTransformer

    query_text = sys.argv[1] if len(sys.argv) > 1 else sys.stdin.read().strip()
    if not query_text:
        print("[]")
        sys.exit(0)

    model = SentenceTransformer('all-MiniLM-L6-v2', local_files_only=True)
    embedding = model.encode(query_text, normalize_embeddings=True).tolist()
    print(json.dumps(embedding))
except Exception as e:
    sys.stderr.write(f"Error encoding query: {e}\n")
    sys.exit(1)
