"""
Financial Market Anomaly & Crash Detection System
Market Data & Synthetic Crash Seeder
Author: Aman Raj (PES2UG24CS053)
"""

import os
import sys
import math
import random
import datetime
from datetime import timedelta
import psycopg2
from psycopg2.extras import execute_batch, execute_values

# Database connection configuration
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = int(os.getenv("DB_PORT", "5432"))
DB_NAME = os.getenv("DB_NAME", "financial_market_db")
DB_USER = os.getenv("DB_USER", "postgres")
DB_PASSWORD = os.getenv("DB_PASSWORD", "postgres")

def get_connection():
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            dbname=DB_NAME,
            user=DB_USER,
            password=DB_PASSWORD
        )
        conn.autocommit = False
        return conn
    except Exception as e:
        print(f"[!] Database connection failed: {e}")
        print("    Ensure PostgreSQL 17 is running with pgvector enabled.")
        sys.exit(1)

def seed_sectors_and_companies(cur):
    print("[*] Seeding Sectors, Exchanges, Companies, and Equities...")

    # 1. Exchanges
    exchanges = [
        ("NASDAQ", "Nasdaq Stock Market", "United States", "America/New_York"),
        ("NYSE", "New York Stock Exchange", "United States", "America/New_York"),
        ("NSE", "National Stock Exchange of India", "India", "Asia/Kolkata")
    ]
    cur.executemany("""
        INSERT INTO exchange (code, name, country, timezone)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (code) DO NOTHING;
    """, exchanges)

    # Fetch exchange IDs
    cur.execute("SELECT code, exchange_id FROM exchange;")
    exchange_map = {row[0]: row[1] for row in cur.fetchall()}

    # 2. Sectors
    sectors = [
        ("Technology", "Semiconductors, software, enterprise cloud, and consumer electronics"),
        ("Financials", "Commercial banking, investment banking, asset management, and payment rails"),
        ("Healthcare", "Pharmaceuticals, biotechnology, clinical therapies, and medical devices"),
        ("Energy", "Oil & gas exploration, refining, green transitions, and midstream transport"),
        ("Consumer Cyclical", "E-commerce, automotive, retail luxury, and entertainment"),
        ("Industrials", "Aerospace, defense, heavy machinery, and freight logistics"),
        ("Communication Services", "Telecommunications, search engines, interactive media, and broadcasting"),
        ("Utilities", "Electric generation, natural gas distribution, and municipal water systems")
    ]
    cur.executemany("""
        INSERT INTO sector (name, description)
        VALUES (%s, %s)
        ON CONFLICT (name) DO NOTHING;
    """, sectors)

    cur.execute("SELECT name, sector_id FROM sector;")
    sector_map = {row[0]: row[1] for row in cur.fetchall()}

    # 3. Companies & Stocks (20 distinct large-cap equities)
    companies_data = [
        # (Company Name, Sector Name, Industry, Country, Website, Exchange Code, Ticker, ISIN, Currency, Base Price)
        ("Apple Inc.", "Technology", "Consumer Electronics", "United States", "https://apple.com", "NASDAQ", "AAPL", "US0378331005", "USD", 185.0),
        ("Microsoft Corp.", "Technology", "Software Infrastructure", "United States", "https://microsoft.com", "NASDAQ", "MSFT", "US5949181045", "USD", 415.0),
        ("Alphabet Inc.", "Communication Services", "Internet Content", "United States", "https://abc.xyz", "NASDAQ", "GOOGL", "US02079K3059", "USD", 165.0),
        ("NVIDIA Corp.", "Technology", "Semiconductors", "United States", "https://nvidia.com", "NASDAQ", "NVDA", "US67066G1040", "USD", 120.0),
        ("Tesla Inc.", "Consumer Cyclical", "Auto Manufacturers", "United States", "https://tesla.com", "NASDAQ", "TSLA", "US88160R1014", "USD", 240.0),
        ("Amazon.com Inc.", "Consumer Cyclical", "Internet Retail", "United States", "https://amazon.com", "NASDAQ", "AMZN", "US0231351067", "USD", 180.0),
        ("Meta Platforms Inc.", "Communication Services", "Internet Content", "United States", "https://meta.com", "NASDAQ", "META", "US30303M1027", "USD", 490.0),
        ("JPMorgan Chase & Co.", "Financials", "Diversified Banking", "United States", "https://jpmorganchase.com", "NYSE", "JPM", "US46625H1005", "USD", 195.0),
        ("Bank of America Corp.", "Financials", "Diversified Banking", "United States", "https://bankofamerica.com", "NYSE", "BAC", "US0605051046", "USD", 38.0),
        ("Exxon Mobil Corp.", "Energy", "Oil & Gas Integrated", "United States", "https://corporate.exxonmobil.com", "NYSE", "XOM", "US30231G1022", "USD", 112.0),
        ("Chevron Corp.", "Energy", "Oil & Gas Integrated", "United States", "https://chevron.com", "NYSE", "CVX", "US1667641005", "USD", 152.0),
        ("Johnson & Johnson", "Healthcare", "Pharmaceuticals", "United States", "https://jnj.com", "NYSE", "JNJ", "US4781601046", "USD", 158.0),
        ("Pfizer Inc.", "Healthcare", "Drug Manufacturers", "United States", "https://pfizer.com", "NYSE", "PFE", "US7170811035", "USD", 28.5),
        ("Walmart Inc.", "Consumer Cyclical", "Discount Stores", "United States", "https://walmart.com", "NYSE", "WMT", "US9311421039", "USD", 68.0),
        ("The Boeing Company", "Industrials", "Aerospace & Defense", "United States", "https://boeing.com", "NYSE", "BA", "US0970231058", "USD", 175.0),
        ("Reliance Industries Ltd", "Energy", "Oil & Gas Refining", "India", "https://ril.com", "NSE", "RELIANCE", "INE002A01018", "INR", 2950.0),
        ("Tata Consultancy Services", "Technology", "IT Services", "India", "https://tcs.com", "NSE", "TCS", "INE467B01029", "INR", 3880.0),
        ("Infosys Limited", "Technology", "IT Services", "India", "https://infosys.com", "NSE", "INFY", "INE009A01021", "INR", 1520.0),
        ("HDFC Bank Limited", "Financials", "Private Banking", "India", "https://hdfcbank.com", "NSE", "HDFCBANK", "INE040A01034", "INR", 1640.0),
        ("ICICI Bank Limited", "Financials", "Private Banking", "India", "https://icicibank.com", "NSE", "ICICIBANK", "INE090A01021", "INR", 1120.0)
    ]

    stocks_meta = []
    for c_name, s_name, ind, country, web, ex_code, ticker, isin, curr, base_p in companies_data:
        sec_id = sector_map[s_name]
        cur.execute("""
            INSERT INTO company (name, sector_id, industry, country, website)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING company_id;
        """, (c_name, sec_id, ind, country, web))
        comp_id = cur.fetchone()[0]

        ex_id = exchange_map[ex_code]
        cur.execute("""
            INSERT INTO stock (exchange_id, company_id, ticker, isin, instrument_type, currency, is_active)
            VALUES (%s, %s, %s, %s, 'Common Stock', %s, TRUE)
            RETURNING stock_id;
        """, (ex_id, comp_id, ticker, isin, curr))
        stk_id = cur.fetchone()[0]

        stocks_meta.append({
            "stock_id": stk_id,
            "exchange_id": ex_id,
            "ticker": ticker,
            "currency": curr,
            "base_price": base_p,
            "sector": s_name
        })

    return exchange_map, stocks_meta

def seed_trading_calendar(cur, exchange_map, start_date, end_date):
    print("[*] Generating Trading Calendar...")
    cur_date = start_date
    trading_days = []
    while cur_date <= end_date:
        is_weekend = cur_date.weekday() >= 5
        if not is_weekend:
            for ex_code, ex_id in exchange_map.items():
                trading_days.append((ex_id, cur_date, False, None))
        cur_date += timedelta(days=1)

    cur.executemany("""
        INSERT INTO trading_day (exchange_id, trade_date, is_holiday, description)
        VALUES (%s, %s, %s, %s)
        ON CONFLICT (exchange_id, trade_date) DO NOTHING;
    """, trading_days)

def seed_indicators_and_events(cur):
    print("[*] Seeding Anomaly Indicators & Macro Market Events...")
    indicators = [
        ("PRICE_ZSCORE_20D", "Rolling 20-day price return standard deviation Z-score", "standard_deviations"),
        ("VOLUME_SURGE_RATIO", "Daily volume compared to 20-day moving average", "multiplier"),
        ("INTRADAY_VOLATILITY", "Difference between high and low price divided by open", "percentage"),
        ("PRICE_DROP_RATE", "Single-day percentage price collapse from previous close", "percentage")
    ]
    cur.executemany("""
        INSERT INTO anomaly_indicator (name, description, unit)
        VALUES (%s, %s, %s)
        ON CONFLICT (name) DO NOTHING;
    """, indicators)

    events = [
        (datetime.date(2024, 4, 15), datetime.date(2024, 4, 19), "MACRO_INFLATION_SURGE",
         "Sticky US Inflation Print & Global Yield Surge", "Yield curve spikes higher as central banks push back rate cut timelines.", "HIGH"),
        (datetime.date(2024, 8, 5), datetime.date(2024, 8, 7), "LIQUIDITY_UNWIND",
         "Global Carry Trade Unwind & Flash Selloff", "Sudden sharp contraction in cross-currency carry trades sparks multi-market equity selloff.", "CRITICAL"),
        (datetime.date(2024, 10, 11), datetime.date(2024, 10, 15), "EARNINGS_VOLATILITY",
         "Tech Infrastructure Capex Guidance Disparity", "Semiconductor and AI cloud hyperscalers guide elevated spending, triggering dispersion.", "MEDIUM")
    ]
    cur.executemany("""
        INSERT INTO market_event (start_date, end_date, event_type, title, description, impact_level)
        VALUES (%s, %s, %s, %s, %s, %s);
    """, events)

def generate_ohlcv_and_anomalies(cur, stocks_meta, start_date, end_date):
    print("[*] Generating 1-Year Daily OHLCV Price Data with Injected Anomaly Scenarios...")

    # Pre-select specific anomaly shock dates
    shock_dates = {
        datetime.date(2024, 4, 16): {"type": "MACRO_SHOCK", "sectors": ["Technology", "Consumer Cyclical"], "drop": 0.085, "vol_mult": 3.8},
        datetime.date(2024, 8, 5):  {"type": "FLASH_CRASH", "sectors": ["Technology", "Financials", "Industrials"], "drop": 0.125, "vol_mult": 4.6},
        datetime.date(2024, 10, 14): {"type": "SECTOR_SELLOFF", "sectors": ["Technology"], "drop": 0.095, "vol_mult": 3.4}
    }

    # Fetch indicator IDs
    cur.execute("SELECT name, indicator_id FROM anomaly_indicator;")
    ind_map = {row[0]: row[1] for row in cur.fetchall()}

    market_records = []
    anomaly_records = []

    for stock in stocks_meta:
        s_id = stock["stock_id"]
        ex_id = stock["exchange_id"]
        ticker = stock["ticker"]
        current_price = stock["base_price"]
        sector = stock["sector"]

        cur_date = start_date
        while cur_date <= end_date:
            if cur_date.weekday() < 5:  # Business days
                is_shock = cur_date in shock_dates and sector in shock_dates[cur_date]["sectors"]

                # Base daily return using drift + normal noise
                drift = 0.0004
                volatility = 0.016
                shock_info = shock_dates.get(cur_date)

                if is_shock:
                    # Injected crash anomaly
                    daily_return = -abs(shock_info["drop"] + random.uniform(0.01, 0.04))
                    vol_surge = shock_info["vol_mult"] * random.uniform(0.9, 1.25)
                elif ticker == "TSLA" and cur_date == datetime.date(2024, 11, 6):
                    # Injected positive speculative breakout
                    daily_return = 0.148
                    vol_surge = 4.2
                    is_shock = True
                    shock_info = {"type": "SPECULATIVE_BREAKOUT"}
                else:
                    daily_return = random.gauss(drift, volatility)
                    vol_surge = random.uniform(0.7, 1.4)

                open_price = round(current_price * (1 + random.uniform(-0.003, 0.003)), 4)
                close_price = round(open_price * (1 + daily_return), 4)

                intraday_noise = abs(daily_return) * 0.4 + 0.008
                high_price = round(max(open_price, close_price) * (1 + random.uniform(0.001, intraday_noise)), 4)
                low_price = round(min(open_price, close_price) * (1 - random.uniform(0.001, intraday_noise)), 4)

                base_volume = int(1_500_000 * (100 / max(10, current_price)))
                volume = int(base_volume * vol_surge)
                turnover = round(close_price * volume, 2)

                market_records.append((
                    s_id, ex_id, cur_date,
                    open_price, high_price, low_price, close_price, close_price,
                    volume, turnover
                ))

                current_price = max(1.0, close_price)

            cur_date += timedelta(days=1)

    print(f"[*] Bulk inserting {len(market_records)} market_data rows...")
    cur.executemany("""
        INSERT INTO market_data (
            stock_id, exchange_id, trade_date,
            open_price, high_price, low_price, close_price, adjusted_close,
            volume, turnover
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        ON CONFLICT (stock_id, trade_date) DO NOTHING;
    """, market_records)

def main():
    print("================================================================")
    print(" Financial Market Anomaly System: Market Data Seeder")
    print(" Designed by Aman Raj (PES2UG24CS053)")
    print("================================================================")
    conn = get_connection()
    try:
        cur = conn.cursor()
        exchange_map, stocks_meta = seed_sectors_and_companies(cur)
        start_date = datetime.date(2024, 1, 2)
        end_date = datetime.date(2024, 12, 31)

        seed_trading_calendar(cur, exchange_map, start_date, end_date)
        seed_indicators_and_events(cur)
        generate_ohlcv_and_anomalies(cur, stocks_meta, start_date, end_date)

        conn.commit()
        print("[✓] Market Data successfully generated and committed to PostgreSQL!")
    except Exception as e:
        conn.rollback()
        print(f"[!] Seeding failed: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    main()
