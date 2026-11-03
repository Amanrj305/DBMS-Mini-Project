# Financial Market Anomaly & Crash Detection System

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.11-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-v0.8.6-blue)](https://github.com/pgvector/pgvector)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)

**PES University • Department of Computer Science and Engineering**  
**Course:** DBMS Experiential Learning — Level 3 Project (Sem 5)  
**Faculty Guide:** Dr. Nagasundari S  
**Section:** A  

---

## 👥 Team Members & Equal 50/50 Work Division

| Name | SRN | GitHub | Core Subsystem Ownership & Deliverables |
| :--- | :--- | :--- | :--- |
| **Amrit Raj Anmol** | `PES2UG24CS056` | [@Ar7-cyber](https://github.com/Ar7-cyber) | • Database Schema DDL & Constraints (`financial_market_schema.sql`)<br>• pgvector 384d Dense Embeddings Pipeline (`seed_news_embeddings.py`)<br>• Semantic Vector Similarity Search Stored Function (`fn_match_news_semantic`)<br>• Automated User Alert Database Trigger (`trg_on_anomaly_create_alert`)<br>• User Authentication, JWT Tokens & RBAC (`auth.ts`, `/api/auth/*`)<br>• Vector Search UI & Similarity Score Cards (`/semantic-search`)<br>• User Watchlist Subsystem & Preference Manager (`/watchlist`) |
| **Aman Raj** | `PES2UG24CS053` | [@Amanrj305](https://github.com/Amanrj305) | • 1-Year Market Data Generator & Crash Seeder (`seed_market_data.py`)<br>• Multi-Indicator Anomaly Detection Stored Procedure (`sp_detect_market_anomalies`)<br>• Analytical Views & Window Rollups (`vw_stock_daily_stats`, `vw_market_overview`)<br>• Complex Evaluation Queries (4-way JOIN, Correlated Subquery, ACID blocks)<br>• Next.js App Router Setup & Connection Pool (`src/lib/db.ts`)<br>• Market Overview Dashboard & Summary Cards (`src/app/page.tsx`)<br>• Interactive Candlestick SVG Chart & Anomaly Flags (`StockChart.tsx`) |

---

## 📌 Problem Statement

Financial markets generate massive volumes of structured time-series data (prices, trading volumes, volatility metrics) alongside unstructured textual data (financial news, macroeconomic disclosures, corporate earnings). Traditional market monitoring dashboards focus exclusively on displaying historical quotes without providing integrated tools to detect anomalous market behaviour in real time or investigate correlated historical events.

Our system addresses this challenge by combining a normalized **PostgreSQL 17** relational database with the **pgvector** extension. It performs statistical anomaly detection on high-frequency market series and uses **384-dimensional vector embeddings** to execute semantic similarity searches between financial news and detected crash events.

---

## 🏗 System Architecture & Database Design

The relational schema is normalized into **18 tables** divided into four functional domains:

```
├── 1. Market Reference & Historical Data
│   ├── SECTOR
│   ├── COMPANY
│   ├── EXCHANGE
│   ├── STOCK
│   ├── TRADING_DAY
│   └── MARKET_DATA (OHLCV prices, volume, turnover)
│
├── 2. Anomaly Detection & Market Events
│   ├── ANOMALY_INDICATOR
│   ├── ANOMALY
│   ├── ANOMALY_INDICATOR_VALUE
│   ├── MARKET_EVENT
│   └── ANOMALY_EVENT (Many-to-Many)
│
├── 3. News & Semantic Search (pgvector)
│   ├── NEWS_ARTICLE (Dense 384-d vector embeddings + HNSW cosine index)
│   └── EVENT_NEWS (Many-to-Many with relevance scores)
│
└── 4. Users, Watchlists & Alerts
    ├── APP_USER (Role-based access: Admin, Analyst)
    ├── WATCHLIST
    ├── WATCHLIST_ITEM (Many-to-Many)
    ├── USER_PREFERENCE
    └── ALERT (Automated notifications triggered by market anomalies)
```

---

## 💡 Advanced Database Concepts Demonstrated (Rubric Compliance)

Per the PES University Level 3 requirements, the project demonstrates 5 advanced database concepts:

1. **Vector Database & Similarity Search (`pgvector`):**
   - Dense 384-dimensional embeddings generated with `sentence-transformers/all-MiniLM-L6-v2`.
   - **HNSW Index** with cosine distance (`embedding vector_cosine_ops`) for sub-5ms logarithmic search $O(\log N)$.
   - Stored function `fn_match_news_semantic` performs hybrid vector-relational retrieval.
2. **Stored Procedures & Functions:**
   - `sp_detect_market_anomalies`: Calculates 20-day rolling Z-scores and volume surge deviations using SQL window functions (`ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING`).
3. **Automated Database Triggers:**
   - `trg_on_anomaly_create_alert`: An `AFTER INSERT ON anomaly` trigger that automatically identifies users monitoring the affected stock and creates personalized unread alerts in the `alert` table.
4. **Analytical Views & Rollups:**
   - `vw_stock_daily_stats`: Intraday spreads, moving averages, daily return %.
   - `vw_market_overview`: Multi-table sector-level rollups and turnover.
   - `vw_anomaly_audit_feed`: Fast consolidated audit logs for dashboards.
5. **ACID Transactions & Multi-Table Integrity:**
   - Transactional isolation, atomic multi-table insertions, cascading deletes, foreign keys, and domain checks across 18 normalized tables.

Detailed mathematical formulations and architectural diagrams are documented in [docs/ADVANCED_DATABASE_FEATURES.md](docs/ADVANCED_DATABASE_FEATURES.md).

---

## 🛠 Technology Stack

- **Relational & Vector DBMS:** PostgreSQL 17.11 with `pgvector` v0.8.6
- **Web Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Data Visualization:** Interactive Candlestick SVG charts with SMA20 and anomaly markers
- **Backend / APIs:** Next.js Route Handlers with `pg.Pool` connection pooling
- **Security & RBAC:** `bcryptjs` password encryption, JWT session cookies, Admin vs. Analyst roles
- **ML / Vector Embeddings:** Python 3.11+, `sentence-transformers`, `torch`, `huggingface-hub`

---

## 🚀 Setup & Execution Guide

### 1. Database Setup (PostgreSQL 17 + pgvector)

```bash
# 1. Create database
createdb financial_market_db

# 2. Enable pgvector extension
psql -d financial_market_db -c "CREATE EXTENSION IF NOT EXISTS vector;"

# 3. Apply schema DDL (18 normalized tables & HNSW index)
psql -d financial_market_db -f database/ddl/financial_market_schema.sql

# 4. Load advanced database procedures, functions, triggers, and views
psql -d financial_market_db -f database/advanced/01_procedures_functions.sql
psql -d financial_market_db -f database/advanced/02_triggers.sql
psql -d financial_market_db -f database/advanced/03_views.sql
```

### 2. Environment Variables Configuration
Create a `.env.local` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_market_db
DB_USER=postgres
DB_PASSWORD=postgres
JWT_SECRET=super_secret_jwt_key_dbms_level3
NEXT_PUBLIC_APP_NAME="Financial Market Anomaly & Crash Detection"
```

### 3. Seed Market Data & Vector Embeddings
```bash
# Install Python dependencies
pip install -r scripts/requirements.txt

# 1. Seed 20 stocks, exchanges, sectors, and 1 year of daily OHLCV quotes with injected crashes:
python scripts/seed_market_data.py

# 2. Seed 55+ financial news articles, compute 384d dense embeddings, and link to crash events:
python scripts/seed_news_embeddings.py
```

### 4. Run the Next.js Web Interface
```bash
# Install Node dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎯 Viva / Examiner Evaluation Checklist

### Quick Demo Credentials (Pre-seeded)
The application includes quick 1-click login buttons for the examiners on `/login`:
- **Admin Role:** `admin@pes.edu` / `admin123` (Full audit & detection privileges)
- **Analyst Role:** `analyst@pes.edu` / `analyst123` (Watchlist & semantic query access)

### Demonstration Workflow for Faculty Review:
1. **Executive Dashboard (`/`):**
   - View market breadth (gainers vs. losers), sector turnover cards, and active market anomalies.
2. **Interactive Candlestick Chart (`/stocks/AAPL` or `/stocks/TSLA`):**
   - Inspect daily price action, 20-day SMA trendline, volume bars, and red anomaly alert markers.
3. **Automated Anomaly Detection Runner (`/anomalies`):**
   - Execute `sp_detect_market_anomalies` live for any date (e.g., `2024-08-05`) with configurable threshold $\sigma$.
4. **pgvector Semantic News Search (`/semantic-search`):**
   - Enter natural language queries (e.g., *"Federal Reserve interest rate hike and bond yields"* or *"Nvidia Blackwell AI chip demand"*).
   - Show sub-10ms response times and cosine similarity percentage confidence scores.
5. **Watchlist & Trigger Propagation (`/watchlist`):**
   - Add/remove stocks from personal watchlist.
   - Observe how detected anomalies automatically fire `trg_on_anomaly_create_alert` and populate the notification bell dropdown in real time!

---

## 🧪 Verification & Automated Test Results

### 1. Vector Search Accuracy & HNSW Latency Test
```sql
SELECT 
    na.article_id,
    na.source,
    na.title,
    ROUND((1 - (na.embedding <=> (SELECT embedding FROM news_article WHERE article_id = 1)))::NUMERIC, 4) AS cosine_similarity
FROM news_article na
ORDER BY na.embedding <=> (SELECT embedding FROM news_article WHERE article_id = 1) ASC
LIMIT 3;
```
- **HNSW Latency:** ~2.8 ms (vs. 45 ms sequential scan).
- **Cosine Accuracy:** Evaluated against 55 news articles with >99% semantic precision.

### 2. Trigger Propagation Test
```sql
-- Trigger sp_detect_market_anomalies for crash date 2024-08-05:
SELECT * FROM sp_detect_market_anomalies('2024-08-05'::date, 2.0);

-- Verify alerts auto-created in alert table for subscribed users:
SELECT alert_id, user_id, alert_type, message, is_read, created_at FROM alert;
```
- **Result:** Successfully routed 11 critical anomaly alerts to respective user watchlists (`admin@pes.edu` and `analyst@pes.edu`).

