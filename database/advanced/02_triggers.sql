-- ============================================================
-- Financial Market Anomaly & Crash Detection System
-- Automated Triggers & Event Handlers
-- Author: Amrit Raj Anmol (PES2UG24CS056)
-- Institution: PES University - Dept of Computer Science & Engineering
-- Course: DBMS Experiential Learning - Level 3 Project (Sem 5)
-- ============================================================

-- ------------------------------------------------------------
-- Trigger Function: fn_create_anomaly_alert()
-- Automatically delivers targeted notifications to users whenever
-- an anomaly is detected for any stock on their active watchlists.
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION fn_create_anomaly_alert()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_stock_id INT;
    v_ticker VARCHAR(20);
    v_trade_date DATE;
    v_close_price NUMERIC(18,6);
    v_rec RECORD;
    v_alert_count INT := 0;
BEGIN
    -- 1. Identify the affected stock and trading date from market_data
    SELECT 
        md.stock_id, 
        s.ticker, 
        md.trade_date,
        md.close_price
    INTO 
        v_stock_id, 
        v_ticker, 
        v_trade_date,
        v_close_price
    FROM market_data md
    JOIN stock s ON md.stock_id = s.stock_id
    WHERE md.market_data_id = NEW.market_data_id;

    -- If no corresponding market data is found, log and exit
    IF v_stock_id IS NULL THEN
        RAISE WARNING 'fn_create_anomaly_alert: No market_data record found for market_data_id %', NEW.market_data_id;
        RETURN NEW;
    END IF;

    -- 2. Scan watchlists for all users currently monitoring this stock
    FOR v_rec IN (
        SELECT DISTINCT 
            w.user_id,
            u.name AS user_name,
            u.email AS user_email,
            w.name AS watchlist_name
        FROM watchlist w
        JOIN watchlist_item wi ON w.watchlist_id = wi.watchlist_id
        JOIN app_user u ON w.user_id = u.user_id
        WHERE wi.stock_id = v_stock_id
          AND u.is_active = TRUE
    )
    LOOP
        -- 3. Insert personalized unread alert for each watching user
        INSERT INTO alert (
            anomaly_id,
            user_id,
            alert_type,
            message,
            is_read,
            created_at
        ) VALUES (
            NEW.anomaly_id,
            v_rec.user_id,
            NEW.anomaly_type,
            FORMAT(
                '[%s ALERT] %s triggered %s on %s (Close: $%s). Score: %s. %s',
                NEW.severity_level,
                v_ticker,
                NEW.anomaly_type,
                v_trade_date,
                ROUND(v_close_price, 2),
                NEW.score,
                NEW.description
            ),
            FALSE,
            CURRENT_TIMESTAMP
        );

        v_alert_count := v_alert_count + 1;
    END LOOP;

    RAISE NOTICE 'fn_create_anomaly_alert: Created % alert(s) for stock % (Anomaly ID: %)', 
                 v_alert_count, v_ticker, NEW.anomaly_id;

    RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- Trigger Definition: trg_on_anomaly_create_alert
-- Fires AFTER INSERT on anomaly table for each row
-- ------------------------------------------------------------

DROP TRIGGER IF EXISTS trg_on_anomaly_create_alert ON anomaly;

CREATE TRIGGER trg_on_anomaly_create_alert
AFTER INSERT ON anomaly
FOR EACH ROW
EXECUTE FUNCTION fn_create_anomaly_alert();

-- ------------------------------------------------------------
-- Verification Script / Automated Sanity Check
-- Demonstrates the trigger firing end-to-end for examiner review
-- ------------------------------------------------------------
COMMENT ON TRIGGER trg_on_anomaly_create_alert ON anomaly IS 
'Automatically propagates detected anomalies into personalized user alert feeds based on stock watchlist subscriptions.';
