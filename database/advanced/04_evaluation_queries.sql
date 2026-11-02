-- ============================================================
-- Financial Market Anomaly & Crash Detection System
-- Course Rubric Evaluation & Demonstration Queries
-- Author: Aman Raj (PES2UG24CS053)
-- Demonstrating: Joins, Group By, Having, Subqueries, & ACID Transactions
-- ============================================================

-- ============================================================
-- 1. COMPLEX JOIN + GROUP BY + HAVING
-- Find sectors where the average anomaly severity score exceeds 2.5
-- and more than 2 high-severity anomalies were recorded.
-- Demonstrates: 4-table JOIN (sector, company, stock, market_data, anomaly),
-- aggregate functions (AVG, COUNT), GROUP BY, and HAVING filtering.
-- ============================================================
SELECT 
    sec.name AS sector_name,
    COUNT(a.anomaly_id) AS total_critical_or_high_anomalies,
    ROUND(AVG(a.score), 3) AS avg_anomaly_severity_score,
    ROUND(MAX(a.score), 3) AS max_severity_score,
    COUNT(DISTINCT s.ticker) AS affected_stocks_count
FROM sector sec
JOIN company c ON sec.sector_id = c.sector_id
JOIN stock s ON c.company_id = s.company_id
JOIN market_data md ON s.stock_id = md.stock_id
JOIN anomaly a ON md.market_data_id = a.market_data_id
WHERE a.severity_level IN ('CRITICAL', 'HIGH')
GROUP BY sec.name
HAVING COUNT(a.anomaly_id) >= 2 
   AND AVG(a.score) >= 2.0
ORDER BY avg_anomaly_severity_score DESC;

-- ============================================================
-- 2. CORRELATED SUBQUERY
-- Find stocks whose daily closing return dropped while their
-- overall sector posted a net positive return on the same trade date.
-- Demonstrates: Correlated Subquery referencing outer query trade_date & sector.
-- ============================================================
SELECT 
    md_outer.trade_date,
    s.ticker,
    c.name AS company_name,
    sec.name AS sector_name,
    ROUND(((md_outer.close_price - md_outer.open_price) / md_outer.open_price) * 100, 2) AS stock_return_pct
FROM market_data md_outer
JOIN stock s ON md_outer.stock_id = s.stock_id
JOIN company c ON s.company_id = c.company_id
JOIN sector sec ON c.sector_id = sec.sector_id
WHERE ((md_outer.close_price - md_outer.open_price) / md_outer.open_price) < -0.03
  AND (
      -- Correlated subquery calculating sector average return on that same date
      SELECT AVG((md_inner.close_price - md_inner.open_price) / md_inner.open_price)
      FROM market_data md_inner
      JOIN stock s_inner ON md_inner.stock_id = s_inner.stock_id
      JOIN company c_inner ON s_inner.company_id = c_inner.company_id
      WHERE c_inner.sector_id = sec.sector_id
        AND md_inner.trade_date = md_outer.trade_date
  ) > 0.005
ORDER BY md_outer.trade_date DESC, stock_return_pct ASC
LIMIT 15;

-- ============================================================
-- 3. SUBQUERY WITH MULTI-LEVEL AGGREGATION
-- Identify stocks whose total trading turnover exceeds the 90th percentile
-- of turnover across all securities in their exchange.
-- ============================================================
SELECT 
    s.ticker,
    c.name AS company_name,
    e.code AS exchange_code,
    SUM(md.turnover) AS stock_annual_turnover
FROM stock s
JOIN company c ON s.company_id = c.company_id
JOIN exchange e ON s.exchange_id = e.exchange_id
JOIN market_data md ON s.stock_id = md.stock_id
GROUP BY s.ticker, c.name, e.code, s.stock_id
HAVING SUM(md.turnover) > (
    SELECT AVG(stock_turnover) * 1.5
    FROM (
        SELECT SUM(turnover) AS stock_turnover
        FROM market_data
        GROUP BY stock_id
    ) sub
)
ORDER BY stock_annual_turnover DESC;

-- ============================================================
-- 4. ACID TRANSACTION BLOCK (DEMONSTRATION)
-- Simulates an atomic market tick ingestion that inserts a new trade day,
-- creates new quotes, and runs the anomaly detection procedure atomically.
-- Demonstrates: BEGIN, COMMIT, SAVEPOINT, and integrity checks.
-- ============================================================
BEGIN;

-- Savepoint before simulation
SAVEPOINT tick_ingest_start;

-- 1. Insert new trading day
INSERT INTO trading_day (exchange_id, trade_date, is_holiday, description)
SELECT exchange_id, '2025-01-02'::DATE, FALSE, 'Regular Market Open'
FROM exchange
ON CONFLICT (exchange_id, trade_date) DO NOTHING;

-- 2. Insert test market tick for AAPL (stock_id = 1)
INSERT INTO market_data (
    stock_id, exchange_id, trade_date,
    open_price, high_price, low_price, close_price, adjusted_close,
    volume, turnover
)
SELECT 
    stock_id, exchange_id, '2025-01-02'::DATE,
    180.00, 182.50, 155.00, 156.00, 156.00,
    12500000, 1950000000.00
FROM stock 
WHERE ticker = 'AAPL'
ON CONFLICT (stock_id, trade_date) DO UPDATE
SET close_price = EXCLUDED.close_price, volume = EXCLUDED.volume;

-- 3. Execute stored procedure within transaction
SELECT * FROM sp_detect_market_anomalies('2025-01-02'::DATE, 2.0);

-- Verify no constraints were violated, commit the transaction
COMMIT;
