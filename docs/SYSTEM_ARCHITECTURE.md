# System Architecture: Financial Market Anomaly & Crash Detection System

**PES University • Department of Computer Science & Engineering**  
**Course:** DBMS Experiential Learning — Level 3 Project  
**Author:** Aman Raj (PES2UG24CS053)  

---

## 1. High-Level System Architecture

```
+-------------------------------------------------------------------------+
|                       Next.js Presentation Layer                         |
|  (Interactive Dashboard, Pure SVG Candlesticks, Anomaly Audit Center)  |
+-------------------------------------------------------------------------+
                                   ▲
                                   │  HTTP / JSON (REST API Routes)
                                   ▼
+-------------------------------------------------------------------------+
|                       Next.js API & Backend Layer                        |
|  - Connection Pool Manager (pg.Pool with environment variables)         |
|  - /api/stocks, /api/anomalies, /api/analytics, /api/semantic-search    |
+-------------------------------------------------------------------------+
                                   ▲
                                   │  SQL Queries & Procedure Calls
                                   ▼
+-------------------------------------------------------------------------+
|                PostgreSQL 17.11 Relational & Vector Engine               |
|                                                                         |
|  [Relational Core]                      [pgvector Extension]            |
|  - 18 Normalized Tables                 - 384-dimensional Embeddings    |
|  - Multi-Column Constraints             - HNSW Cosine Index             |
|  - Stored Procedures & Triggers         - <=> Distance Search           |
|  - Analytical Views (Rollups)           - MiniLM-L6-v2 Model Pipeline   |
+-------------------------------------------------------------------------+
                                   ▲
                                   │  Data Seeding / ETL Batches
                                   ▼
+-------------------------------------------------------------------------+
|                       Python Ingestion Pipeline                         |
|  - seed_market_data.py (Generates 1-year OHLCV + synthetic crash days)  |
|  - seed_news_embeddings.py (Computes dense vectors via PyTorch)         |
+-------------------------------------------------------------------------+
```

---

## 2. Statistical Anomaly Detection Formulation

The detection engine (`sp_detect_market_anomalies`) uses moving statistical windows over the preceding $N = 20$ trading sessions to detect outliers without lookahead bias:

### A. Simple Moving Average (SMA)
$$\mu_t = \frac{1}{N} \sum_{i=1}^{N} P_{t-i}$$
where $P_{t-i}$ represents the closing price on session $t-i$.

### B. Sample Standard Deviation
$$\sigma_t = \sqrt{\frac{1}{N-1} \sum_{i=1}^{N} (P_{t-i} - \mu_t)^2}$$

### C. Price Z-Score Deviation
$$Z_t = \frac{P_t - \mu_t}{\sigma_t}$$

### D. Volume Surge Multiplier
$$V_{\text{ratio}} = \frac{V_t}{\frac{1}{N} \sum_{i=1}^{N} V_{t-i}}$$

### E. Anomaly Severity Classification Matrix
| Anomaly Type | Condition | Assigned Severity | Score Formula |
| :--- | :--- | :---: | :--- |
| **FLASH_CRASH_COLLAPSE** | $Z_t \le -3.0$ and $V_{\text{ratio}} \ge 3.0$ | `CRITICAL` | $\text{Score} = 1.5 \cdot \|Z_t\| + V_{\text{ratio}}$ |
| **ABNORMAL_PRICE_DROP** | $Z_t \le -2.0$ | `HIGH` | $\text{Score} = \|Z_t\| + 0.5 \cdot V_{\text{ratio}}$ |
| **SPECULATIVE_SURGE** | $Z_t \ge +3.0$ | `HIGH` | $\text{Score} = Z_t + 0.4 \cdot V_{\text{ratio}}$ |
| **UNUSUAL_VOLUME_OUTLIER** | $V_{\text{ratio}} \ge 2.5$ | `MEDIUM` | $\text{Score} = V_{\text{ratio}} + 0.3 \cdot \|Z_t\|$ |

---

## 3. Vector Database Justification (`pgvector`)

1. **Transactional Consistency (ACID):** Storing vector embeddings directly inside PostgreSQL eliminates the complexity of dual-write synchronization between a relational database and external vector DBs (e.g. Pinecone/Qdrant).
2. **Hybrid Queries in Single Statements:** A single SQL query can join relational metadata (e.g., event impact level, tickers involved) with vector cosine distance ordering:
   ```sql
   SELECT title, content, 1 - (embedding <=> $1) AS similarity
   FROM news_article
   WHERE published_at >= '2024-01-01'
   ORDER BY embedding <=> $1 ASC
   LIMIT 5;
   ```
3. **HNSW Cosine Index Acceleration:** Hierarchical Navigable Small World (HNSW) graphs offer logarithmic sub-millisecond retrieval latency even across tens of thousands of articles.

---

## 4. Security & Connection Pool Architecture

- **Zero Hardcoded Secrets:** Credentials are read from `process.env.DB_*` at runtime.
- **Connection Pooling:** Uses `pg.Pool` with `max: 20` clients and `idleTimeoutMillis: 30000`, preventing socket exhaustion during high concurrent dashboard traffic.
- **Atomic Transactions:** Uses `BEGIN ... COMMIT` with `ROLLBACK` handlers on all multi-row ingestion routines.
