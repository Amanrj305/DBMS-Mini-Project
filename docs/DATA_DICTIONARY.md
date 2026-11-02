# Data Dictionary: Financial Market Anomaly & Crash Detection System

**Course:** DBMS Experiential Learning — Level 3 Project  
**Author:** Aman Raj (PES2UG24CS053)  
**Database Paradigm:** Relational (PostgreSQL 17) + Vector (pgvector v0.8.6)  

---

## Module 1: Market Reference & Historical Data

### 1. `sector`
Stores broad macroeconomic sectors for cross-asset grouping and sector-level performance rollups.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `sector_id` | `SERIAL` | `PRIMARY KEY` | Unique synthetic identifier for the sector. |
| `name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Standard sector name (e.g., Technology, Financials). |
| `description` | `TEXT` | `NULL` | Industry coverage and economic definition. |

### 2. `company`
Information regarding publicly listed corporate entities.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `company_id` | `SERIAL` | `PRIMARY KEY` | Unique synthetic identifier for the company. |
| `name` | `VARCHAR(150)` | `NOT NULL` | Registered corporate name. |
| `sector_id` | `INT` | `NOT NULL, FK -> sector(sector_id)` | Primary macroeconomic classification. |
| `industry` | `VARCHAR(100)` | `NULL` | Granular sub-industry classification. |
| `country` | `VARCHAR(100)` | `NULL` | Country of corporate headquarters. |
| `website` | `VARCHAR(255)` | `NULL` | Official corporate web domain. |

### 3. `exchange`
Market exchange venues where instruments are listed and traded.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `exchange_id` | `SERIAL` | `PRIMARY KEY` | Unique synthetic identifier for the exchange. |
| `code` | `VARCHAR(20)` | `NOT NULL UNIQUE` | Official exchange acronym (e.g., NASDAQ, NYSE, NSE). |
| `name` | `VARCHAR(100)` | `NOT NULL` | Formal full exchange title. |
| `country` | `VARCHAR(100)` | `NULL` | Jurisdiction country. |
| `timezone` | `VARCHAR(50)` | `NULL` | Timezone offset string (e.g., America/New_York). |

### 4. `stock`
Tradeable equity instruments linked to a company and exchange.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `stock_id` | `SERIAL` | `PRIMARY KEY` | Primary instrument key. |
| `exchange_id` | `INT` | `NOT NULL, FK -> exchange(exchange_id)` | Listing venue foreign key. |
| `company_id` | `INT` | `NOT NULL, FK -> company(company_id)` | Issuer company foreign key. |
| `ticker` | `VARCHAR(20)` | `NOT NULL` | Market ticker symbol (e.g., AAPL, NVDA). |
| `isin` | `VARCHAR(20)` | `UNIQUE` | 12-character International Securities ID Number. |
| `instrument_type` | `VARCHAR(50)` | `NULL` | Asset class (Common Stock, Preferred, ADR). |
| `currency` | `VARCHAR(10)` | `NULL` | Denominated currency (USD, INR). |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Active trading flag. |
*Composite Constraint:* `UNIQUE (exchange_id, ticker)` ensures uniqueness per exchange.

### 5. `trading_day`
Calendar of official trading sessions and holiday closures.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `exchange_id` | `INT` | `NOT NULL, FK -> exchange(exchange_id)` | Target exchange venue. |
| `trade_date` | `DATE` | `NOT NULL` | Calendar trading date. |
| `is_holiday` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | Session closure indicator. |
| `description` | `TEXT` | `NULL` | Holiday explanation or market event note. |
*Composite Primary Key:* `PRIMARY KEY (exchange_id, trade_date)`

### 6. `market_data`
High-frequency daily Open-High-Low-Close-Volume (OHLCV) price time series.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `market_data_id` | `BIGSERIAL` | `PRIMARY KEY` | Unique tick identifier. |
| `stock_id` | `INT` | `NOT NULL, FK -> stock(stock_id)` | Quoted instrument. |
| `exchange_id` | `INT` | `NOT NULL` | Target exchange. |
| `trade_date` | `DATE` | `NOT NULL` | Session date. |
| `open_price` | `NUMERIC(18,6)` | `CHECK (open_price >= 0)` | Session opening auction price. |
| `high_price` | `NUMERIC(18,6)` | `CHECK (high_price >= 0)` | Intraday peak trade price. |
| `low_price` | `NUMERIC(18,6)` | `CHECK (low_price >= 0)` | Intraday trough trade price. |
| `close_price` | `NUMERIC(18,6)` | `CHECK (close_price >= 0)` | Official session closing quote. |
| `adjusted_close` | `NUMERIC(18,6)` | `CHECK (adjusted_close >= 0)` | Dividend and split-adjusted close. |
| `volume` | `BIGINT` | `CHECK (volume >= 0)` | Total contracts/shares traded. |
| `turnover` | `NUMERIC(20,4)` | `CHECK (turnover >= 0)` | Total monetary trade value. |
*Integrity Constraints:* `UNIQUE (stock_id, trade_date)`, `CHECK (high_price >= low_price)`.

---

## Module 2: Anomaly Detection & Market Events

### 7. `anomaly_indicator`
Catalog of statistical metrics used to compute volatility and volume outliers.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `indicator_id` | `SERIAL` | `PRIMARY KEY` | Indicator identifier. |
| `name` | `VARCHAR(100)` | `NOT NULL UNIQUE` | Technical identifier (e.g., `PRICE_ZSCORE_20D`). |
| `description` | `TEXT` | `NULL` | Mathematical definition. |
| `unit` | `VARCHAR(50)` | `NULL` | Measurement scale (`std_dev`, `multiplier`, `pct`). |

### 8. `anomaly`
Detected market irregularities, flash crashes, or speculative breakouts.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `anomaly_id` | `BIGSERIAL` | `PRIMARY KEY` | Event identifier. |
| `market_data_id` | `BIGINT` | `NOT NULL, FK -> market_data` | Associated market tick. |
| `anomaly_type` | `VARCHAR(100)` | `NOT NULL` | Classification (e.g. `FLASH_CRASH_COLLAPSE`). |
| `severity_level` | `VARCHAR(20)` | `CHECK ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')` | Severity category. |
| `score` | `NUMERIC(10,4)` | `CHECK (score >= 0)` | Quantitative composite deviation score. |
| `description` | `TEXT` | `NULL` | Human-readable explanation. |
| `detected_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Pipeline execution timestamp. |

### 9. `anomaly_indicator_value`
Granular decomposition of individual indicator deviations contributing to an anomaly.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `anomaly_id` | `BIGINT` | `NOT NULL, FK -> anomaly ON DELETE CASCADE` | Parent anomaly incident. |
| `indicator_id` | `INT` | `NOT NULL, FK -> anomaly_indicator` | Evaluated metric. |
| `actual_value` | `NUMERIC(20,8)` | `NULL` | Computed metric value. |
| `threshold_value` | `NUMERIC(20,8)` | `NULL` | Trigger threshold cutoff. |
| `deviation` | `NUMERIC(20,8)` | `NULL` | Numerical excess over threshold. |
*Composite Primary Key:* `PRIMARY KEY (anomaly_id, indicator_id)`.

### 10. `market_event`
Historical macro events, systemic crashes, or liquidity shocks.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `event_id` | `BIGSERIAL` | `PRIMARY KEY` | Event identifier. |
| `start_date` | `DATE` | `NOT NULL` | Event commencement date. |
| `end_date` | `DATE` | `CHECK (end_date >= start_date)` | Event conclusion date. |
| `event_type` | `VARCHAR(100)` | `NOT NULL` | Typology (e.g., `LIQUIDITY_UNWIND`). |
| `title` | `VARCHAR(255)` | `NOT NULL` | Event headline. |
| `description` | `TEXT` | `NULL` | Macro impact analysis. |
| `impact_level` | `VARCHAR(20)` | `CHECK ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')` | Market-wide impact rating. |

### 11. `anomaly_event`
Associative bridge connecting micro-anomalies to macro market events.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `anomaly_id` | `BIGINT` | `NOT NULL, FK -> anomaly ON DELETE CASCADE` | Associated anomaly. |
| `event_id` | `BIGINT` | `NOT NULL, FK -> market_event ON DELETE CASCADE` | Associated macro event. |
*Composite Primary Key:* `PRIMARY KEY (anomaly_id, event_id)`.

---

## Module 3: News & Semantic Search (pgvector)

### 12. `news_article`
Financial news corpus storing dense vector embeddings for semantic retrieval.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `article_id` | `BIGSERIAL` | `PRIMARY KEY` | Article identifier. |
| `source` | `VARCHAR(150)` | `NOT NULL` | Publication source (e.g., Reuters, Bloomberg). |
| `title` | `VARCHAR(500)` | `NOT NULL` | Article headline. |
| `article_url` | `VARCHAR(1000)`| `UNIQUE` | Source web URL. |
| `published_at` | `TIMESTAMP` | `NULL` | Publication timestamp. |
| `content` | `TEXT` | `NULL` | Full article body text. |
| `embedding` | `VECTOR(384)` | `HNSW Index (vector_cosine_ops)` | 384-dimensional dense semantic embedding. |

### 13. `event_news`
Many-to-many relationship connecting news articles to market events with relevance weights.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `event_id` | `BIGINT` | `NOT NULL, FK -> market_event ON DELETE CASCADE` | Linked event. |
| `article_id` | `BIGINT` | `NOT NULL, FK -> news_article ON DELETE CASCADE` | Linked article. |
| `relevance_score` | `NUMERIC(6,4)` | `CHECK (relevance_score BETWEEN 0 AND 1)` | Semantic cosine confidence score. |
*Composite Primary Key:* `PRIMARY KEY (event_id, article_id)`.

---

## Module 4: Users, Watchlists & Alerts

### 14. `app_user`
User accounts with role-based access control.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `user_id` | `BIGSERIAL` | `PRIMARY KEY` | User identifier. |
| `name` | `VARCHAR(100)` | `NOT NULL` | User full name. |
| `email` | `VARCHAR(255)` | `NOT NULL UNIQUE` | Login email address. |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | Salted bcrypt password hash. |
| `role` | `VARCHAR(30)` | `NOT NULL` | Role (`Admin`, `Analyst`, `Retail`). |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Account creation timestamp. |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Active account status. |

### 15. `watchlist`
Personalized equity monitoring portfolios created by users.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `watchlist_id` | `BIGSERIAL` | `PRIMARY KEY` | Watchlist identifier. |
| `user_id` | `BIGINT` | `NOT NULL, FK -> app_user ON DELETE CASCADE` | Owner user. |
| `name` | `VARCHAR(100)` | `NOT NULL` | Portfolio label (e.g., "Tech High Beta"). |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Creation date. |
*Composite Constraint:* `UNIQUE (user_id, name)`.

### 16. `watchlist_item`
Many-to-many association linking watchlists to tracked stocks.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `watchlist_id` | `BIGINT` | `NOT NULL, FK -> watchlist ON DELETE CASCADE` | Target watchlist. |
| `stock_id` | `INT` | `NOT NULL, FK -> stock ON DELETE CASCADE` | Tracked stock. |
| `added_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Timestamp added. |
*Composite Primary Key:* `PRIMARY KEY (watchlist_id, stock_id)`.

### 17. `user_preference`
User notification thresholds and alerting preferences.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `preference_id` | `BIGSERIAL` | `PRIMARY KEY` | Preference identifier. |
| `user_id` | `BIGINT` | `NOT NULL, FK -> app_user ON DELETE CASCADE` | Associated user. |
| `watchlist_id` | `BIGINT` | `FK -> watchlist ON DELETE SET NULL` | Target watchlist filter. |
| `alert_type` | `VARCHAR(50)` | `NULL` | Subscribed anomaly category. |
| `notification_method` | `VARCHAR(50)` | `NULL` | In-app, Email, Webhook. |
| `is_active` | `BOOLEAN` | `NOT NULL DEFAULT TRUE` | Subscription status. |

### 18. `alert`
Automated anomaly notification feed generated by database triggers.
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `alert_id` | `BIGSERIAL` | `PRIMARY KEY` | Alert notification ID. |
| `anomaly_id` | `BIGINT` | `NOT NULL, FK -> anomaly ON DELETE CASCADE` | Triggering anomaly. |
| `user_id` | `BIGINT` | `NOT NULL, FK -> app_user ON DELETE CASCADE` | Recipient user. |
| `alert_type` | `VARCHAR(50)` | `NULL` | Severity/Category tag. |
| `message` | `TEXT` | `NULL` | Generated alert notification body. |
| `is_read` | `BOOLEAN` | `NOT NULL DEFAULT FALSE` | User read flag. |
| `created_at` | `TIMESTAMP` | `NOT NULL DEFAULT CURRENT_TIMESTAMP` | Alert dispatch timestamp. |
