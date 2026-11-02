# Financial Market Anomaly & Crash Detection System

[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17.11-336791?logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![pgvector](https://img.shields.io/badge/pgvector-v0.8.6-blue)](https://github.com/pgvector/pgvector)
[![Next.js](https://img.shields.io/badge/Next.js-App%20Router-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?logo=python&logoColor=white)](https://www.python.org/)

**PES University • Department of Computer Science and Engineering**  
**Course:** DBMS Experiential Learning — Level 3 Project  
**Faculty Guide:** Dr. Nagasundari S  
**Section:** A  

---

## 👥 Team Members

| Name | SRN | GitHub | Core Responsibilities |
| :--- | :--- | :--- | :--- |
| **Amrit Raj Anmol** | `PES2UG24CS056` | [@Ar7-cyber](https://github.com/Ar7-cyber) | Schema DDL, Vector Semantic Search (pgvector HNSW), Watchlists & User Preference Subsystem, Automated Alert Triggers, Role-based Auth |
| **Aman Raj** | `PES2UG24CS053` | [@Amanrj305](https://github.com/Amanrj305) | Market Data Pipeline & Crash Simulator, Statistical Anomaly Detection Stored Procedure, Analytical Rollup Views, Next.js Dashboard & Charts UI |

---

## 📌 Problem Statement

Financial markets generate massive volumes of structured time-series data (prices, trading volumes, volatility metrics) alongside unstructured textual data (financial news, macroeconomic disclosures, corporate earnings). Traditional market monitoring dashboards focus exclusively on displaying historical quotes without providing integrated tools to detect anomalous market behaviour in real time or investigate correlated historical events.

Our system addresses this challenge by combining a normalized **PostgreSQL 17** relational database with the **pgvector** extension. It performs statistical anomaly detection on high-frequency market series and uses **384-dimensional vector embeddings** to execute semantic similarity searches between financial news and detected crash events.

---

## 🏛️ System Architecture & Database Design

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

## ⚡ Advanced Database Concepts Demonstrated

Per the PES University Level 3 requirements, the project demonstrates at least 4 advanced concepts:

1. **Vector Database & Similarity Search (`pgvector`):**
   - Stores dense 384-dimensional sentence embeddings generated via `sentence-transformers/all-MiniLM-L6-v2`.
   - Uses an **HNSW index** with cosine distance (`embedding vector_cosine_ops`) for sub-millisecond similarity search.
2. **Stored Procedures & Functions:**
   - `sp_detect_market_anomalies`: Calculates 20-day rolling Z-scores and volume surge deviations using SQL window functions.
   - `fn_match_news_semantic`: Executes cosine distance queries (`<=>`) against news embeddings.
3. **Automated Database Triggers:**
   - `trg_on_anomaly_create_alert`: An `AFTER INSERT ON anomaly` trigger that automatically identifies users monitoring the affected stock and creates unread alerts.
4. **Analytical Views:**
   - `vw_stock_daily_stats`: Real-time daily return percentages, moving averages, and volatility measures.
   - `vw_market_overview`: Sector-level aggregated turnover, gains/losses, and active anomaly counts.
5. **ACID Transactions:**
   - Atomic multi-table batch ingestion routines with explicit rollback safety on integrity violations.

---

## 🛠️ Technology Stack

- **Relational & Vector DBMS:** PostgreSQL 17.11 with `pgvector` v0.8.6
- **Web Frontend:** Next.js (App Router), TypeScript, Tailwind CSS
- **Data Visualization:** Recharts (Interactive candlestick and price-volume charts)
- **Backend / APIs:** Next.js Route Handlers with `pg` connection pooling
- **Security:** `bcryptjs` password hashing, JWT session authorization
- **ML / Vector Embeddings:** Python, `sentence-transformers`, `numpy`, `pandas`

---

## 🚀 Setup & Execution Guide

### 1. Database Setup (PostgreSQL 17 + pgvector)
Ensure PostgreSQL 17 and pgvector are installed, then create the database and apply the DDL:

```bash
# Create database
createdb financial_market_db

# Enable pgvector and load schema
psql -d financial_market_db -c "CREATE EXTENSION IF NOT EXISTS vector;"
psql -d financial_market_db -f database/ddl/financial_market_schema.sql
```

### 2. Environment Variables Configuration
Create a `.env.local` file in the root directory:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=financial_market_db
DB_USER=postgres
DB_PASSWORD=your_password_here
JWT_SECRET=super_secret_jwt_key
```

### 3. Seed Market Data & Vector Embeddings
```bash
# Install python requirements
cd scripts
pip install -r requirements.txt

# Run seeders
python seed_market_data.py
python seed_news_embeddings.py
```

### 4. Run the Next.js Web Interface
```bash
# Install Node dependencies
npm install

# Start local development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📄 Project Documentation & Roadmap

- Detailed equal work division, file listings, and git commit plan: [Work Division & Roadmap PDF](docs/DBMS_Level_3_Project_Work_Division_and_Roadmap.pdf)
