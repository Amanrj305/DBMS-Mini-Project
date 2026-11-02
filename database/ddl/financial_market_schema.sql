-- Financial Market Anomaly & Crash Detection System
-- Database DDL
-- PostgreSQL 17 + pgvector

-- ============================================================
-- 1. MARKET & REFERENCE DATA
-- ============================================================

-- ------------------------------------------------------------
-- SECTOR
-- ------------------------------------------------------------
CREATE TABLE sector (
    sector_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- ------------------------------------------------------------
-- COMPANY
-- ------------------------------------------------------------
CREATE TABLE company (
    company_id SERIAL PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    sector_id INT NOT NULL,
    industry VARCHAR(100),
    country VARCHAR(100),
    website VARCHAR(255),

    CONSTRAINT fk_company_sector
        FOREIGN KEY (sector_id)
        REFERENCES sector(sector_id)
);

-- ------------------------------------------------------------
-- EXCHANGE
-- ------------------------------------------------------------
CREATE TABLE exchange (
    exchange_id SERIAL PRIMARY KEY,
    code VARCHAR(20) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    country VARCHAR(100),
    timezone VARCHAR(50)
);

-- ------------------------------------------------------------
-- STOCK
-- ------------------------------------------------------------
CREATE TABLE stock (
    stock_id SERIAL PRIMARY KEY,
    exchange_id INT NOT NULL,
    company_id INT NOT NULL,
    ticker VARCHAR(20) NOT NULL,
    isin VARCHAR(20) UNIQUE,
    instrument_type VARCHAR(50),
    currency VARCHAR(10),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_stock_exchange
        FOREIGN KEY (exchange_id)
        REFERENCES exchange(exchange_id),

    CONSTRAINT fk_stock_company
        FOREIGN KEY (company_id)
        REFERENCES company(company_id),

    CONSTRAINT uq_stock_exchange_ticker
        UNIQUE (exchange_id, ticker)
);

-- ------------------------------------------------------------
-- TRADING_DAY
-- ------------------------------------------------------------
CREATE TABLE trading_day (
    exchange_id INT NOT NULL,
    trade_date DATE NOT NULL,
    is_holiday BOOLEAN NOT NULL DEFAULT FALSE,
    description TEXT,

    CONSTRAINT pk_trading_day
        PRIMARY KEY (exchange_id, trade_date),

    CONSTRAINT fk_trading_day_exchange
        FOREIGN KEY (exchange_id)
        REFERENCES exchange(exchange_id)
);

-- ------------------------------------------------------------
-- MARKET_DATA
-- ------------------------------------------------------------
CREATE TABLE market_data (
    market_data_id BIGSERIAL PRIMARY KEY,

    stock_id INT NOT NULL,
    exchange_id INT NOT NULL,
    trade_date DATE NOT NULL,

    open_price NUMERIC(18,6),
    high_price NUMERIC(18,6),
    low_price NUMERIC(18,6),
    close_price NUMERIC(18,6),
    adjusted_close NUMERIC(18,6),

    volume BIGINT,
    turnover NUMERIC(20,4),

    CONSTRAINT fk_market_data_stock
        FOREIGN KEY (stock_id)
        REFERENCES stock(stock_id),

    CONSTRAINT fk_market_data_trading_day
        FOREIGN KEY (exchange_id, trade_date)
        REFERENCES trading_day(exchange_id, trade_date),

    CONSTRAINT uq_market_data_stock_date
        UNIQUE (stock_id, trade_date),

    CONSTRAINT chk_market_data_prices
        CHECK (
            open_price IS NULL OR open_price >= 0
        ),

    CONSTRAINT chk_market_data_high
        CHECK (
            high_price IS NULL OR high_price >= 0
        ),

    CONSTRAINT chk_market_data_low
        CHECK (
            low_price IS NULL OR low_price >= 0
        ),

    CONSTRAINT chk_market_data_close
        CHECK (
            close_price IS NULL OR close_price >= 0
        ),

    CONSTRAINT chk_market_data_adjusted_close
        CHECK (
            adjusted_close IS NULL OR adjusted_close >= 0
        ),

    CONSTRAINT chk_market_data_volume
        CHECK (
            volume IS NULL OR volume >= 0
        ),

    CONSTRAINT chk_market_data_turnover
        CHECK (
            turnover IS NULL OR turnover >= 0
        ),

    CONSTRAINT chk_market_data_high_low
        CHECK (
            high_price IS NULL
            OR low_price IS NULL
            OR high_price >= low_price
        )
);

-- ============================================================
-- 2. ANOMALY, EVENT & NEWS DATA
-- ============================================================

-- ------------------------------------------------------------
-- ANOMALY_INDICATOR
-- ------------------------------------------------------------
CREATE TABLE anomaly_indicator (
    indicator_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    unit VARCHAR(50)
);

-- ------------------------------------------------------------
-- ANOMALY
-- ------------------------------------------------------------
CREATE TABLE anomaly (
    anomaly_id BIGSERIAL PRIMARY KEY,

    market_data_id BIGINT NOT NULL,
    anomaly_type VARCHAR(100) NOT NULL,
    severity_level VARCHAR(20) NOT NULL,
    score NUMERIC(10,4),
    description TEXT,
    detected_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_anomaly_market_data
        FOREIGN KEY (market_data_id)
        REFERENCES market_data(market_data_id),

    CONSTRAINT chk_anomaly_score
        CHECK (
            score IS NULL OR score >= 0
        ),

    CONSTRAINT chk_anomaly_severity
        CHECK (
            severity_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
        )
);

-- ------------------------------------------------------------
-- ANOMALY_INDICATOR_VALUE
-- ------------------------------------------------------------
CREATE TABLE anomaly_indicator_value (
    anomaly_id BIGINT NOT NULL,
    indicator_id INT NOT NULL,

    actual_value NUMERIC(20,8),
    threshold_value NUMERIC(20,8),
    deviation NUMERIC(20,8),

    CONSTRAINT pk_anomaly_indicator_value
        PRIMARY KEY (anomaly_id, indicator_id),

    CONSTRAINT fk_aiv_anomaly
        FOREIGN KEY (anomaly_id)
        REFERENCES anomaly(anomaly_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_aiv_indicator
        FOREIGN KEY (indicator_id)
        REFERENCES anomaly_indicator(indicator_id)
);

-- ------------------------------------------------------------
-- MARKET_EVENT
-- ------------------------------------------------------------
CREATE TABLE market_event (
    event_id BIGSERIAL PRIMARY KEY,

    start_date DATE NOT NULL,
    end_date DATE,
    event_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    impact_level VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_market_event_dates
        CHECK (
            end_date IS NULL OR end_date >= start_date
        ),

    CONSTRAINT chk_market_event_impact
        CHECK (
            impact_level IS NULL
            OR impact_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')
        )
);

-- ------------------------------------------------------------
-- ANOMALY_EVENT
-- Many-to-many relationship:
-- ANOMALY <-> MARKET_EVENT
-- ------------------------------------------------------------
CREATE TABLE anomaly_event (
    anomaly_id BIGINT NOT NULL,
    event_id BIGINT NOT NULL,

    CONSTRAINT pk_anomaly_event
        PRIMARY KEY (anomaly_id, event_id),

    CONSTRAINT fk_anomaly_event_anomaly
        FOREIGN KEY (anomaly_id)
        REFERENCES anomaly(anomaly_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_anomaly_event_event
        FOREIGN KEY (event_id)
        REFERENCES market_event(event_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- NEWS_ARTICLE
-- ------------------------------------------------------------
CREATE TABLE news_article (
    article_id BIGSERIAL PRIMARY KEY,

    source VARCHAR(150) NOT NULL,
    title VARCHAR(500) NOT NULL,
    article_url VARCHAR(1000) UNIQUE,
    published_at TIMESTAMP,
    content TEXT,

    -- 384-dimensional embedding for semantic search
    embedding VECTOR(384)
);

-- ------------------------------------------------------------
-- EVENT_NEWS
-- Many-to-many relationship:
-- MARKET_EVENT <-> NEWS_ARTICLE
-- ------------------------------------------------------------
CREATE TABLE event_news (
    event_id BIGINT NOT NULL,
    article_id BIGINT NOT NULL,

    relevance_score NUMERIC(6,4),

    CONSTRAINT pk_event_news
        PRIMARY KEY (event_id, article_id),

    CONSTRAINT fk_event_news_event
        FOREIGN KEY (event_id)
        REFERENCES market_event(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_event_news_article
        FOREIGN KEY (article_id)
        REFERENCES news_article(article_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_event_news_relevance
        CHECK (
            relevance_score IS NULL
            OR (relevance_score >= 0 AND relevance_score <= 1)
        )
);

-- ============================================================
-- 3. USERS, WATCHLISTS & ALERTS
-- ============================================================

-- ------------------------------------------------------------
-- APP_USER
-- ------------------------------------------------------------
CREATE TABLE app_user (
    user_id BIGSERIAL PRIMARY KEY,

    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(30) NOT NULL,

    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- ------------------------------------------------------------
-- WATCHLIST
-- ------------------------------------------------------------
CREATE TABLE watchlist (
    watchlist_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_watchlist_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON DELETE CASCADE,

    CONSTRAINT uq_watchlist_user_name
        UNIQUE (user_id, name)
);

-- ------------------------------------------------------------
-- WATCHLIST_ITEM
-- Many-to-many relationship:
-- WATCHLIST <-> STOCK
-- ------------------------------------------------------------
CREATE TABLE watchlist_item (
    watchlist_id BIGINT NOT NULL,
    stock_id INT NOT NULL,

    added_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT pk_watchlist_item
        PRIMARY KEY (watchlist_id, stock_id),

    CONSTRAINT fk_watchlist_item_watchlist
        FOREIGN KEY (watchlist_id)
        REFERENCES watchlist(watchlist_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_watchlist_item_stock
        FOREIGN KEY (stock_id)
        REFERENCES stock(stock_id)
        ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- USER_PREFERENCE
-- ------------------------------------------------------------
CREATE TABLE user_preference (
    preference_id BIGSERIAL PRIMARY KEY,

    user_id BIGINT NOT NULL,
    watchlist_id BIGINT,

    alert_type VARCHAR(50),
    notification_method VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,

    CONSTRAINT fk_user_preference_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_user_preference_watchlist
        FOREIGN KEY (watchlist_id)
        REFERENCES watchlist(watchlist_id)
        ON DELETE SET NULL
);

-- ------------------------------------------------------------
-- ALERT
-- ------------------------------------------------------------
CREATE TABLE alert (
    alert_id BIGSERIAL PRIMARY KEY,

    anomaly_id BIGINT NOT NULL,
    user_id BIGINT NOT NULL,

    alert_type VARCHAR(50),
    message TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_alert_anomaly
        FOREIGN KEY (anomaly_id)
        REFERENCES anomaly(anomaly_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_alert_user
        FOREIGN KEY (user_id)
        REFERENCES app_user(user_id)
        ON DELETE CASCADE
);

-- ============================================================
-- 4. INDEXES
-- ============================================================

-- Company / stock lookups
CREATE INDEX idx_company_sector
    ON company(sector_id);

CREATE INDEX idx_stock_company
    ON stock(company_id);

CREATE INDEX idx_stock_exchange
    ON stock(exchange_id);

-- Trading / market data
CREATE INDEX idx_trading_day_date
    ON trading_day(trade_date);

CREATE INDEX idx_market_data_stock_date
    ON market_data(stock_id, trade_date);

CREATE INDEX idx_market_data_trade_date
    ON market_data(trade_date);

-- Anomaly queries
CREATE INDEX idx_anomaly_market_data
    ON anomaly(market_data_id);

CREATE INDEX idx_anomaly_type
    ON anomaly(anomaly_type);

CREATE INDEX idx_anomaly_severity
    ON anomaly(severity_level);

CREATE INDEX idx_anomaly_detected_at
    ON anomaly(detected_at);

-- Events
CREATE INDEX idx_market_event_dates
    ON market_event(start_date, end_date);

CREATE INDEX idx_market_event_type
    ON market_event(event_type);

-- News
CREATE INDEX idx_news_published_at
    ON news_article(published_at);

CREATE INDEX idx_news_source
    ON news_article(source);

-- Users / alerts
CREATE INDEX idx_watchlist_user
    ON watchlist(user_id);

CREATE INDEX idx_watchlist_item_stock
    ON watchlist_item(stock_id);

CREATE INDEX idx_alert_user
    ON alert(user_id);

CREATE INDEX idx_alert_anomaly
    ON alert(anomaly_id);

-- ============================================================
-- 5. VECTOR SIMILARITY INDEX
-- ============================================================

CREATE INDEX idx_news_embedding
    ON news_article
    USING hnsw (embedding vector_cosine_ops);

-- ============================================================
-- END OF DDL
-- ============================================================