-- ============================================================
-- Financial Market Anomaly & Crash Detection System
-- Advanced Stored Procedures & Functions
-- Author: Aman Raj (PES2UG24CS053) & Amrit Raj Anmol (PES2UG24CS056)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Statistical Anomaly Detection Stored Procedure
-- Implemented by: Aman Raj (PES2UG24CS053)
-- Demonstrates: SQL Window Functions, Multi-Indicator Deviation,
-- Dynamic Severity Grading, Transactional Multi-Table Inserts
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION sp_detect_market_anomalies(
    p_trade_date DATE,
    p_std_dev_threshold NUMERIC DEFAULT 2.0
)
RETURNS TABLE (
    detected_anomalies_count INT,
    critical_count INT,
    high_count INT,
    medium_count INT
) 
LANGUAGE plpgsql
AS $$
DECLARE
    v_total_detected INT := 0;
    v_critical INT := 0;
    v_high INT := 0;
    v_medium INT := 0;
    v_ind_zscore_id INT;
    v_ind_volume_id INT;
    v_rec RECORD;
    v_anomaly_id BIGINT;
    v_anomaly_type VARCHAR(100);
    v_severity VARCHAR(20);
    v_score NUMERIC(10,4);
    v_desc TEXT;
BEGIN
    -- Resolve Indicator IDs
    SELECT indicator_id INTO v_ind_zscore_id 
    FROM anomaly_indicator 
    WHERE name = 'PRICE_ZSCORE_20D' LIMIT 1;
    
    SELECT indicator_id INTO v_ind_volume_id 
    FROM anomaly_indicator 
    WHERE name = 'VOLUME_SURGE_RATIO' LIMIT 1;

    -- If indicators don't exist, create defaults
    IF v_ind_zscore_id IS NULL THEN
        INSERT INTO anomaly_indicator (name, description, unit)
        VALUES ('PRICE_ZSCORE_20D', '20-day price return standard deviation Z-score', 'std_dev')
        RETURNING indicator_id INTO v_ind_zscore_id;
    END IF;

    IF v_ind_volume_id IS NULL THEN
        INSERT INTO anomaly_indicator (name, description, unit)
        VALUES ('VOLUME_SURGE_RATIO', 'Trading volume compared to 20-day moving average', 'multiplier')
        RETURNING indicator_id INTO v_ind_volume_id;
    END IF;

    -- Temporary table to calculate rolling statistics over 20 preceding days
    FOR v_rec IN (
        WITH rolling_stats AS (
            SELECT 
                md.market_data_id,
                md.stock_id,
                s.ticker,
                md.trade_date,
                md.close_price,
                md.volume,
                AVG(md.close_price) OVER (
                    PARTITION BY md.stock_id 
                    ORDER BY md.trade_date 
                    ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
                ) AS sma_20,
                STDDEV_SAMP(md.close_price) OVER (
                    PARTITION BY md.stock_id 
                    ORDER BY md.trade_date 
                    ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
                ) AS std_20,
                AVG(md.volume) OVER (
                    PARTITION BY md.stock_id 
                    ORDER BY md.trade_date 
                    ROWS BETWEEN 20 PRECEDING AND 1 PRECEDING
                ) AS avg_vol_20
            FROM market_data md
            JOIN stock s ON md.stock_id = s.stock_id
            WHERE md.trade_date <= p_trade_date
        ),
        current_metrics AS (
            SELECT 
                rs.market_data_id,
                rs.stock_id,
                rs.ticker,
                rs.trade_date,
                rs.close_price,
                rs.volume,
                rs.sma_20,
                rs.std_20,
                rs.avg_vol_20,
                CASE 
                    WHEN rs.std_20 IS NOT NULL AND rs.std_20 > 0 
                    THEN (rs.close_price - rs.sma_20) / rs.std_20 
                    ELSE 0.0 
                END AS price_zscore,
                CASE 
                    WHEN rs.avg_vol_20 IS NOT NULL AND rs.avg_vol_20 > 0 
                    THEN rs.volume::NUMERIC / rs.avg_vol_20::NUMERIC 
                    ELSE 1.0 
                END AS volume_ratio
            FROM rolling_stats rs
            WHERE rs.trade_date = p_trade_date
        )
        SELECT * FROM current_metrics
        WHERE ABS(price_zscore) >= p_std_dev_threshold 
           OR volume_ratio >= 2.5
    ) 
    LOOP
        -- Determine anomaly classification & severity level
        IF v_rec.price_zscore <= -3.0 AND v_rec.volume_ratio >= 3.0 THEN
            v_anomaly_type := 'FLASH_CRASH_COLLAPSE';
            v_severity := 'CRITICAL';
            v_score := ROUND((ABS(v_rec.price_zscore) * 1.5 + v_rec.volume_ratio), 4);
            v_desc := FORMAT('Critical flash crash on %s: price collapsed %s std deviations on %s x average volume.',
                             v_rec.ticker, ROUND(v_rec.price_zscore, 2), ROUND(v_rec.volume_ratio, 2));
            v_critical := v_critical + 1;
        ELSIF v_rec.price_zscore <= -2.0 THEN
            v_anomaly_type := 'ABNORMAL_PRICE_DROP';
            v_severity := 'HIGH';
            v_score := ROUND((ABS(v_rec.price_zscore) + v_rec.volume_ratio * 0.5), 4);
            v_desc := FORMAT('High price drop on %s: dropped %s standard deviations below 20-day SMA.',
                             v_rec.ticker, ROUND(v_rec.price_zscore, 2));
            v_high := v_high + 1;
        ELSIF v_rec.price_zscore >= 3.0 THEN
            v_anomaly_type := 'SPECULATIVE_SURGE';
            v_severity := 'HIGH';
            v_score := ROUND((v_rec.price_zscore + v_rec.volume_ratio * 0.4), 4);
            v_desc := FORMAT('Speculative breakout on %s: jumped %s std deviations above 20-day SMA.',
                             v_rec.ticker, ROUND(v_rec.price_zscore, 2));
            v_high := v_high + 1;
        ELSIF v_rec.volume_ratio >= 2.5 THEN
            v_anomaly_type := 'UNUSUAL_VOLUME_OUTLIER';
            v_severity := 'MEDIUM';
            v_score := ROUND((v_rec.volume_ratio + ABS(v_rec.price_zscore) * 0.3), 4);
            v_desc := FORMAT('Volume anomaly on %s: traded volume was %s x 20-day moving average.',
                             v_rec.ticker, ROUND(v_rec.volume_ratio, 2));
            v_medium := v_medium + 1;
        ELSE
            v_anomaly_type := 'VOLATILITY_OUTLIER';
            v_severity := 'LOW';
            v_score := 1.0;
            v_desc := FORMAT('Mild volatility outlier observed on %s.', v_rec.ticker);
        END IF;

        -- Prevent duplicate anomaly rows for the same market_data record
        IF NOT EXISTS (SELECT 1 FROM anomaly WHERE market_data_id = v_rec.market_data_id) THEN
            INSERT INTO anomaly (
                market_data_id, anomaly_type, severity_level, score, description, detected_at
            ) VALUES (
                v_rec.market_data_id, v_anomaly_type, v_severity, v_score, v_desc, CURRENT_TIMESTAMP
            ) RETURNING anomaly_id INTO v_anomaly_id;

            -- Record Price Z-Score Indicator Breakdown
            INSERT INTO anomaly_indicator_value (
                anomaly_id, indicator_id, actual_value, threshold_value, deviation
            ) VALUES (
                v_anomaly_id, v_ind_zscore_id, v_rec.price_zscore, p_std_dev_threshold, 
                ROUND(ABS(v_rec.price_zscore) - p_std_dev_threshold, 4)
            );

            -- Record Volume Ratio Indicator Breakdown
            INSERT INTO anomaly_indicator_value (
                anomaly_id, indicator_id, actual_value, threshold_value, deviation
            ) VALUES (
                v_anomaly_id, v_ind_volume_id, v_rec.volume_ratio, 2.5, 
                ROUND(v_rec.volume_ratio - 2.5, 4)
            );

            v_total_detected := v_total_detected + 1;
        END IF;
    END LOOP;

    RETURN QUERY SELECT v_total_detected, v_critical, v_high, v_medium;
END;
$$;
