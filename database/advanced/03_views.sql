-- ============================================================
-- Financial Market Anomaly & Crash Detection System
-- Analytical Views & Reporting Views
-- Author: Aman Raj (PES2UG24CS053)
-- ============================================================

-- ------------------------------------------------------------
-- View 1: Stock Daily Statistics with Moving Averages
-- Calculates daily return %, intraday spread %, 20-day SMA,
-- and 20-day rolling average volume.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vw_stock_daily_stats AS
SELECT 
    md.market_data_id,
    md.stock_id,
    s.ticker,
    c.name AS company_name,
    sec.name AS sector_name,
    e.code AS exchange_code,
    md.trade_date,
    md.open_price,
    md.high_price,
    md.low_price,
    md.close_price,
    md.volume,
    md.turnover,
    ROUND(
        CASE 
            WHEN md.open_price > 0 
            THEN ((md.close_price - md.open_price) / md.open_price) * 100 
            ELSE 0.0 
        END, 2
    ) AS daily_return_pct,
    ROUND(
        CASE 
            WHEN md.low_price > 0 
            THEN ((md.high_price - md.low_price) / md.low_price) * 100 
            ELSE 0.0 
        END, 2
    ) AS intraday_spread_pct,
    ROUND(
        AVG(md.close_price) OVER (
            PARTITION BY md.stock_id 
            ORDER BY md.trade_date 
            ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
        ), 4
    ) AS sma_20_day,
    ROUND(
        AVG(md.volume) OVER (
            PARTITION BY md.stock_id 
            ORDER BY md.trade_date 
            ROWS BETWEEN 19 PRECEDING AND CURRENT ROW
        ), 0
    ) AS avg_volume_20_day
FROM market_data md
JOIN stock s ON md.stock_id = s.stock_id
JOIN company c ON s.company_id = c.company_id
JOIN sector sec ON c.sector_id = sec.sector_id
JOIN exchange e ON md.exchange_id = e.exchange_id;

-- ------------------------------------------------------------
-- View 2: Sector-Level Daily Market Overview Rollup
-- Aggregates turnover, average gains, trading volume,
-- and count of detected anomalies by sector and date.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vw_market_overview AS
SELECT 
    sec.sector_id,
    sec.name AS sector_name,
    md.trade_date,
    COUNT(DISTINCT s.stock_id) AS active_stocks_count,
    ROUND(AVG(
        CASE 
            WHEN md.open_price > 0 
            THEN ((md.close_price - md.open_price) / md.open_price) * 100 
            ELSE 0.0 
        END
    ), 2) AS avg_sector_return_pct,
    SUM(md.volume) AS total_sector_volume,
    SUM(md.turnover) AS total_sector_turnover,
    COUNT(a.anomaly_id) AS sector_anomalies_count
FROM sector sec
JOIN company c ON sec.sector_id = c.sector_id
JOIN stock s ON c.company_id = s.company_id
JOIN market_data md ON s.stock_id = md.stock_id
LEFT JOIN anomaly a ON md.market_data_id = a.market_data_id
GROUP BY sec.sector_id, sec.name, md.trade_date;

-- ------------------------------------------------------------
-- View 3: Live Anomaly Audit & Indicator Drill-Down
-- Denormalized view for UI dashboards to list anomalies with
-- indicator thresholds and percentage deviations.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vw_anomaly_audit_feed AS
SELECT 
    a.anomaly_id,
    a.anomaly_type,
    a.severity_level,
    a.score AS anomaly_score,
    a.description AS anomaly_description,
    a.detected_at,
    md.trade_date,
    s.ticker,
    c.name AS company_name,
    sec.name AS sector_name,
    md.open_price,
    md.close_price,
    md.volume,
    ROUND(
        CASE 
            WHEN md.open_price > 0 
            THEN ((md.close_price - md.open_price) / md.open_price) * 100 
            ELSE 0.0 
        END, 2
    ) AS return_on_anomaly_day
FROM anomaly a
JOIN market_data md ON a.market_data_id = md.market_data_id
JOIN stock s ON md.stock_id = s.stock_id
JOIN company c ON s.company_id = c.company_id
JOIN sector sec ON c.sector_id = sec.sector_id;
