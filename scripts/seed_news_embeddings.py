"""
Financial Market Anomaly & Crash Detection System
News Article Corpus & 384-Dimensional Dense Vector Embeddings Seeder
Author: Amrit Raj Anmol (PES2UG24CS056)
Institution: PES University - Dept of Computer Science & Engineering
Course: DBMS Experiential Learning - Level 3 Project (Sem 5)
"""

import os
import sys
import json
import random
import datetime
from datetime import timedelta

# Set Hugging Face offline flags to utilize local cached model weights
os.environ["HF_HUB_OFFLINE"] = "1"
os.environ["TRANSFORMERS_OFFLINE"] = "1"

import psycopg2
from sentence_transformers import SentenceTransformer

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

# Corpus of 55+ Financial News Articles across 5 distinct thematic categories
ARTICLES_CORPUS = [
    # -------------------------------------------------------------
    # 1. Macro Inflation, Yield Curves & Central Bank Policy (Links to Event 1)
    # -------------------------------------------------------------
    {
        "source": "Bloomberg Markets",
        "title": "US CPI Spikes Past Estimates as Shelter and Service Inflation Remain Sticky",
        "content": "Consumer prices advanced 0.4% month-over-month in March, surpassing consensus expectations. Core inflation showed persistent resilience in transportation and shelter costs, prompting treasury yields across 2-year and 10-year maturities to breach four-month highs as swap markets immediately price out early summer rate reductions.",
        "published_at": "2024-04-10 13:30:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.96
    },
    {
        "source": "Wall Street Journal",
        "title": "Federal Reserve Chair Signals Higher-for-Longer Stance Amid Stubborn Inflation Pressures",
        "content": "Jerome Powell stated during a panel discussion that the recent sequence of upside inflation readings has shaken policymakers confidence in the path toward the central bank's 2% objective, indicating interest rates must remain elevated for a protracted duration.",
        "published_at": "2024-04-16 17:15:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.98
    },
    {
        "source": "Financial Times",
        "title": "Global Sovereign Bond Yields Surge to Multi-Month Peaks as Rate Cut Expectations Recede",
        "content": "Yields on benchmark 10-year US Treasuries, German Bunds, and UK Gilts broke resistance levels following hotter inflation data. Equity indices faced broad-based downward valuation compression as discount rates increased across discounted cash-flow valuation models.",
        "published_at": "2024-04-17 09:45:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.94
    },
    {
        "source": "Reuters Financial",
        "title": "Bank of England Keeps Bank Rate at 5.25% Citing Elevated Wage Growth Metrics",
        "content": "The Monetary Policy Committee voted by a majority of 7 to 2 to hold rates, noting persistent inflation in services and elevated private sector wage dynamics require continued monetary restriction despite stagnant broader economic growth.",
        "published_at": "2024-05-09 11:00:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.82
    },
    {
        "source": "CNBC International",
        "title": "RBI Holds Repo Rate Steady at 6.50% as Food Inflation Surges Past Monsoon Forecasts",
        "content": "Reserve Bank of India Governor Shaktikanta Das announced the Monetary Policy Committee unanimously kept the benchmark repo rate unchanged, warning that erratic vegetable inflation continues to cloud the target glide path toward 4%.",
        "published_at": "2024-06-07 05:30:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.86
    },
    {
        "source": "MarketWatch",
        "title": "2-Year Treasury Yield Climbs Above 5.0% as Hot Labor Data Delays Easing Cycle",
        "content": "Short-dated sovereign debt yields crossed the psychological 5% barrier on Monday morning after non-farm payroll figures demonstrated continued strength in hiring and average hourly earnings, reinforcing hawkish expectations.",
        "published_at": "2024-04-15 14:10:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.92
    },
    {
        "source": "The Economist",
        "title": "The Threat of Fiscal Dominance and Persistent Real Yield Elevation in Modern Economies",
        "content": "With sovereign debt levels continuing to climb across advanced economies, real interest rates are settling into a permanently higher regime, compressing equity market price-to-earnings multiples across traditional cyclical sectors.",
        "published_at": "2024-04-18 10:00:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.88
    },
    {
        "source": "Barron's",
        "title": "Mortgage Rates Breach 7.2% as Long-End Bond Sell-Off Accelerates",
        "content": "The average rate on a 30-year fixed home loan surged to its highest point of the calendar year as bond market sell-offs rippled through secondary securitization channels, heavily dragging down homebuilder and mortgage finance equities.",
        "published_at": "2024-04-19 16:30:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.79
    },
    {
        "source": "Financial Times",
        "title": "European Central Bank Debates Staggered Easing as Energy Imports Fluctuates",
        "content": "European monetary officials expressed caution over loosening monetary policy too aggressively, citing risks that geopolitical friction in transit waterways could trigger secondary commodity inflation waves.",
        "published_at": "2024-04-22 08:20:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.78
    },
    {
        "source": "Bloomberg Markets",
        "title": "Treasury Refunding Announcement Pressures Duration Portfolios as Supply Increases",
        "content": "The US Department of the Treasury outlined expanded auction sizes across 10-year and 30-year bond issuances, causing primary dealers to widen bid-ask spreads and steepening the yield curve across long maturities.",
        "published_at": "2024-05-01 12:45:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.81
    },

    # -------------------------------------------------------------
    # 2. Currency Liquidity Shocks & Carry Trade Flash Unwind (Links to Event 2)
    # -------------------------------------------------------------
    {
        "source": "Nikkei Asian Review",
        "title": "Bank of Japan Unexpected Rate Hike Sparks Historic Japanese Yen Surge Against US Dollar",
        "content": "The Bank of Japan raised its uncollateralized overnight call rate target to 0.25% and announced plans to halve its bond purchases, triggering a violent short squeeze on the yen and upending decades-long cross-border leveraged carry trade strategies.",
        "published_at": "2024-07-31 06:15:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.95
    },
    {
        "source": "Bloomberg Markets",
        "title": "Global Carry Trade Unwind Triggers Worldwide Equity Plunge; Nikkei Suffers Worst Day Since 1987",
        "content": "Global risk assets collapsed in unison on August 5th as hedge funds were forced to liquidate leveraged equity positions to cover surging margin requirements denominated in appreciating Japanese yen. The Nikkei 225 plummeted 12.4%, spilling over into severe opening declines on Wall Street.",
        "published_at": "2024-08-05 07:00:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.99
    },
    {
        "source": "Reuters Financial",
        "title": "VIX Volatility Index Spikes Above 65 in Historic Morning Intraday Spike",
        "content": "Wall Street's fear gauge experienced its largest intraday surge in history on August 5, touching levels not witnessed since the 2008 Lehman Brothers collapse and the March 2020 pandemic onset, as cross-asset options market liquidity evaporated.",
        "published_at": "2024-08-05 13:45:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.97
    },
    {
        "source": "Financial Times",
        "title": "Hedge Funds Scramble for Cash Collateral as Leverage Ratios Blow Out Across Multi-Strategy Desks",
        "content": "Prime brokerage desks at major New York and London investment banks issued sweeping margin calls early Monday morning, forcing systematic equity market-neutral funds and statistical arbitrage portfolios to dump mega-cap liquid equities indiscriminately.",
        "published_at": "2024-08-05 15:20:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.96
    },
    {
        "source": "Wall Street Journal",
        "title": "Nasdaq 100 Drops 3.4% in Cascading Sell-Off Driven by Forced Automated Liquidations",
        "content": "Big Tech stalwarts including Nvidia, Apple, and Microsoft witnessed steep opening losses as quantitative algorithms matched sell orders into shallow market depth, activating circuit breakers on multiple index futures contracts.",
        "published_at": "2024-08-05 16:30:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.93
    },
    {
        "source": "CNBC International",
        "title": "Interbank Repo Spreads Widen Sharply Following Volatility Shock in Foreign Exchange Pairs",
        "content": "Short-term funding markets signaled localized stress as secured overnight financing rates edged higher and commercial paper issuance momentarily froze for non-prime corporate borrowers seeking bridge liquidity.",
        "published_at": "2024-08-06 09:10:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.89
    },
    {
        "source": "MarketWatch",
        "title": "Retail Brokerages Report Brief Outages as Panicked Investors Overwhelm Trading Platforms",
        "content": "Major discount brokerages including Schwab, Fidelity, and Vanguard acknowledged temporary service disruptions as hundreds of thousands of individual retail traders rushed simultaneously to check account balances and hedge market exposures.",
        "published_at": "2024-08-05 14:05:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.84
    },
    {
        "source": "Bloomberg Markets",
        "title": "Bank of Japan Deputy Governor Calms Markets, Pledges No Rate Hikes During Volatile Conditions",
        "content": "Shinichi Uchida stated in a speech to business leaders that the central bank will not increase interest rates when market conditions remain destabilized, arresting the yen's rapid ascent and catalyzing a sharp recovery rally in equities.",
        "published_at": "2024-08-07 04:30:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.91
    },
    {
        "source": "Barron's",
        "title": "The Mechanics of Carry Trade Unwinding: Why 100 Trillion Yen In Funding Roiled Global Stocks",
        "content": "An analytical teardown of how cheap yen borrowing financed high-yielding tech assets, and why a modest shift in foreign exchange differentials triggered systemic selling ripples across international equity markets.",
        "published_at": "2024-08-08 11:30:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.92
    },
    {
        "source": "The Economist",
        "title": "Flash Crashes and Fragile Liquidity in Modern Algorithmic Capital Markets",
        "content": "Modern market structure dominated by passive index funds and high-frequency market makers creates illusions of liquidity in calm periods that rapidly disintegrate when structural volatility surges.",
        "published_at": "2024-08-10 10:15:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.87
    },

    # -------------------------------------------------------------
    # 3. Tech Earnings, AI Datacenter Capex & Semiconductor Volatility (Links to Event 3)
    # -------------------------------------------------------------
    {
        "source": "Reuters Technology",
        "title": "NVIDIA Shatters Revenue Expectations as Datacenter GPU Demand Outstrips Supply Chains",
        "content": "Nvidia reported quarterly revenue of $30.04 billion, climbing 122% year-over-year on insatiable demand for Hopper and next-generation Blackwell artificial intelligence architecture. Gross margins stood at an exceptional 75.1%.",
        "published_at": "2024-08-28 20:15:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.91
    },
    {
        "source": "Wall Street Journal",
        "title": "Big Tech Hyperscalers Guide $200B+ Combined Annual AI Infrastructure Capex",
        "content": "Microsoft, Alphabet, Meta, and Amazon disclosed monumental capital expenditure plans targeting custom silicon, liquid cooling server racks, and nuclear power contracts, sparking debates regarding near-term monetization velocity.",
        "published_at": "2024-10-11 18:40:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.96
    },
    {
        "source": "Bloomberg Technology",
        "title": "ASML Lowers 2025 Bookings Outlook Early, Triggering Semiconductor Equipment Sell-Off",
        "content": "Semiconductor manufacturing equipment giant ASML accidentally published earnings results a day early, revealing net bookings of 2.63 billion euros, far below consensus expectations, causing its stock to fall 16% in its sharpest decline since 1998.",
        "published_at": "2024-10-15 14:00:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.97
    },
    {
        "source": "Financial Times",
        "title": "Enterprise Software Spending Decelerates as Chief Information Officers Divert Budgets to GenAI",
        "content": "Enterprise cloud and traditional SaaS companies reported lengthening sales cycles and budget reprioritization as corporate technology leaders channel discretionary spend toward generative AI pilots.",
        "published_at": "2024-10-14 09:30:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.89
    },
    {
        "source": "CNBC Tech",
        "title": "TSMC Reports 54% Net Profit Surge Driven by 3nm and 5nm Advanced Node Fabrication",
        "content": "Taiwan Semiconductor Manufacturing Company raised its full-year revenue growth projection to nearly 30%, reporting extraordinary fab utilization rates driven by high-performance computing customers.",
        "published_at": "2024-10-17 07:10:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.92
    },
    {
        "source": "MarketWatch",
        "title": "Tesla Stock Jumps 22% in Largest Single-Day Advance Since 2013 on Record Margin Guidance",
        "content": "Tesla shares surged by over 20% following third-quarter earnings that beat profitability forecasts, buoyed by reduced cost-of-goods-sold per vehicle, surging energy storage revenue, and optimistic autonomous vehicle launch timelines.",
        "published_at": "2024-10-24 16:15:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.88
    },
    {
        "source": "Barron's",
        "title": "The AI Capex Conundrum: When Will Hyperscaler Cloud Revenue Match Gigawatt Infrastructure Investments?",
        "content": "Wall Street analysts are increasingly segregating tech equities into immediate cash-flow beneficiaries (semiconductor foundries) and long-duration speculative bets (unprofitable AI software developers).",
        "published_at": "2024-10-12 11:20:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.93
    },
    {
        "source": "The Information",
        "title": "Blackwell Chip Packaging Defects Resolved, Full Mass Production Slated for Early Q1",
        "content": "Supply chain channel checks indicate TSMC's CoWoS packaging yields for Nvidia's B200 ultra-high-density AI clusters have normalized after initial engineering mask redesigns.",
        "published_at": "2024-10-22 13:00:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.85
    },
    {
        "source": "Bloomberg Technology",
        "title": "Apple Introduces Apple Intelligence Features with Private Cloud Compute Infrastructure",
        "content": "Apple launched its first batch of on-device and private cloud artificial intelligence tools for iPhone 16 and M4 Mac lines, reinforcing optimism for an upcoming hardware replacement supercycle.",
        "published_at": "2024-10-28 17:00:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.81
    },
    {
        "source": "Nikkei Asian Review",
        "title": "Memory Chip Makers Samsung and SK Hynix Ramp Up HBM3e 12-High Production",
        "content": "Intense competition in High Bandwidth Memory fabrication for generative AI accelerators drives premium pricing, while commodity DDR4 and smartphone DRAM pricing remains subdued.",
        "published_at": "2024-10-16 04:45:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.84
    },

    # -------------------------------------------------------------
    # 4. Banking, Credit Spread Stress & Financial Sector Health
    # -------------------------------------------------------------
    {
        "source": "Wall Street Journal",
        "title": "Commercial Real Estate Loan Losses Lead Regional Banks to Bolster Provisions",
        "content": "Mid-sized US commercial banks reported expanded quarterly allowances for credit losses tied to urban office building vacancies, though broader tier-1 capital ratios remained comfortably above regulatory minimums.",
        "published_at": "2024-03-12 15:00:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.72
    },
    {
        "source": "Financial Times",
        "title": "JPMorgan Chase Sets New Record for Annual Net Interest Income as Investment Banking Rebounds",
        "content": "The largest bank in the United States delivered record profitability driven by expanded corporate debt advisory fees, strong consumer deposit margins, and robust trading desk revenue.",
        "published_at": "2024-04-12 11:30:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.74
    },
    {
        "source": "Bloomberg Markets",
        "title": "Credit Default Swaps on High-Yield Debt Tighten to Pre-Pandemic Lows",
        "content": "Spreads on US high-yield and junk debt corporate credit default swap indices compressed significantly, underscoring robust institutional risk appetite despite tight monetary policy parameters.",
        "published_at": "2024-05-15 16:45:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.68
    },
    {
        "source": "Reuters Financial",
        "title": "HDFC Bank Reports Stable Asset Quality and Accelerated Deposit Mobilization Post-Merger",
        "content": "India's premier private lender reported gross non-performing asset ratios declining to 1.24%, calming investor apprehensions concerning loan-to-deposit ratio digestion after its mega-merger.",
        "published_at": "2024-07-20 08:30:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "Barron's",
        "title": "Private Credit Inflow Continues Unabated as Institutional Allocators Chase 11% Yields",
        "content": "Alternative asset managers including Blackstone, Ares, and Apollo have raised record private debt dry powder, taking market share away from traditional syndicated leveraged loan syndications.",
        "published_at": "2024-06-25 10:15:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "Wall Street Journal",
        "title": "Federal Reserve Stress Tests Reveal All 31 Large US Banks Can Withstand Severe Recession",
        "content": "The central bank's annual regulatory stress examination confirmed major institutions possess substantial capital buffers to absorb over $680 billion in hypothetical commercial real estate and subprime debt losses.",
        "published_at": "2024-06-26 20:30:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "CNBC International",
        "title": "Bank of America Expands Share Buyback Authorization by $25 Billion",
        "content": "Reflecting robust balance sheet fundamentals and manageable charge-off rates, the board of directors authorized a massive capital return program to support shareholder equity returns.",
        "published_at": "2024-07-24 13:15:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "Financial Times",
        "title": "European Banks Step Up Dividend Payouts as Net Interest Margins Peak",
        "content": "Lenders across the Eurozone distribute billions in dividends and buybacks after enjoying their most lucrative net interest income window since the introduction of the common currency.",
        "published_at": "2024-05-30 09:00:00",
        "event_code": None,
        "relevance": None
    },

    # -------------------------------------------------------------
    # 5. Energy, Geopolitics, Commodities & Industrials
    # -------------------------------------------------------------
    {
        "source": "Reuters Energy",
        "title": "Brent Crude Crosses $90 as Red Sea Shipping Diversions Strain Tanker Capacity",
        "content": "Geopolitical conflict in key Middle Eastern transit corridors forced container carriers and oil tankers to detour around Africa's Cape of Good Hope, adding weeks to voyages and boosting freight spot rates.",
        "published_at": "2024-04-05 15:30:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.83
    },
    {
        "source": "Bloomberg Energy",
        "title": "OPEC+ Agrees to Extend Voluntary Oil Production Cuts of 2.2 Million Barrels Through Year-End",
        "content": "The alliance of petroleum exporting countries extended voluntary supply curbs to prevent inventory build-ups during seasonal demand slowdowns, maintaining floor support under sweet crude benchmarks.",
        "published_at": "2024-06-02 18:00:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.77
    },
    {
        "source": "Wall Street Journal",
        "title": "ExxonMobil Completes $60 Billion Mega-Acquisition of Pioneer Natural Resources",
        "content": "The completion of the largest upstream oil deal in two decades doubles Exxon's Permian Basin production footprint to 1.3 million barrels per day, cementing deep low-cost drilling inventory.",
        "published_at": "2024-05-03 14:15:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "Financial Times",
        "title": "European Natural Gas Storage Levels Exceed 90% Well Ahead of Winter Heating Season",
        "content": "Aggressive LNG import contracting and resilient industrial energy efficiency measures helped the continent refill underground salt cavern storage tanks ahead of regulatory targets.",
        "published_at": "2024-08-20 08:45:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "Reuters Aerospace",
        "title": "Boeing Reaches Tentative Labor Contract Agreement with Machinists Union to End Factory Strike",
        "content": "Boeing agreed to a 38% wage hike over four years and substantial retirement ratification bonuses to end a crippling multi-week strike that halted commercial assembly of 737 MAX aircraft in the Pacific Northwest.",
        "published_at": "2024-11-04 12:30:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "The Economic Times",
        "title": "Reliance Industries Unveils $10 Billion Investment in Gigafactories for Solar and Green Hydrogen",
        "content": "Mukesh Ambani announced aggressive capital allocation schedules for clean energy manufacturing hubs in Gujarat, aiming to produce green hydrogen at industry-leading low costs by 2026.",
        "published_at": "2024-08-29 06:00:00",
        "event_code": None,
        "relevance": None
    },

    # -------------------------------------------------------------
    # 6. Regulatory, Antitrust & Systematic Market Structure
    # -------------------------------------------------------------
    {
        "source": "Wall Street Journal",
        "title": "Federal Court Rules Google Maintained Illegal Monopoly in Online Search and Advertising",
        "content": "In a landmark antitrust decision, US District Judge Amit Mehta found Alphabet violated Section 2 of the Sherman Act by securing exclusive default placement agreements on mobile browsers through billions in revenue-sharing payouts.",
        "published_at": "2024-08-05 17:30:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.75
    },
    {
        "source": "Bloomberg Law",
        "title": "Department of Justice Proposes Remedy Framework for Big Tech Search Divestitures",
        "content": "Antitrust enforcement officials submitted court filings considering structural breakups or behavioral injunctions to prevent predatory self-preferencing in generative search answering engines.",
        "published_at": "2024-10-09 20:45:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.73
    },
    {
        "source": "Reuters Markets",
        "title": "SEC Implements T+1 Settlement Cycle for US Equities to Mitigate Counterparty Risk",
        "content": "The US Securities and Exchange Commission successfully transitioned the financial markets to next-day trade settlement (T+1), halving margin requirements and dramatically reducing overnight collateral exposure.",
        "published_at": "2024-05-28 10:00:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "Financial Times",
        "title": "Regulators Probe Algorithmic Execution Latencies and Extreme Order Flow Imbalances",
        "content": "Market conduct authorities launched inquiries into high-frequency trading firm routing protocols during anomalous market opening spikes to determine if automated quotation withdrawals violated continuous maker requirements.",
        "published_at": "2024-08-14 11:15:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.86
    },
    {
        "source": "CNBC Tech",
        "title": "European Union Opens Inquiries into Cloud Computing Antitrust Licensing Practices",
        "content": "European Commission competition regulators are investigating whether hyperscale software license agreements disadvantage enterprise customers attempting to deploy multi-cloud infrastructure.",
        "published_at": "2024-07-15 13:40:00",
        "event_code": None,
        "relevance": None
    },

    # -------------------------------------------------------------
    # 7. Additional Deep Market Headlines (Diversified Coverage)
    # -------------------------------------------------------------
    {
        "source": "Bloomberg Markets",
        "title": "US Dollar Index Climbs to 1-Year High on Resilient Growth Disparity",
        "content": "The greenback surged against the euro, pound, and emerging market currencies as American economic momentum consistently outpaced decelerating European and East Asian industrial production figures.",
        "published_at": "2024-11-12 14:00:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "Reuters Technology",
        "title": "Quantum Computing Milestones Spark Long-Term Cryptographic Modernization Rush",
        "content": "Technology and cybersecurity firms ramp up investments in post-quantum public key encryption standards following enterprise breakthrough milestones in logical qubit coherence times.",
        "published_at": "2024-09-18 16:30:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "Financial Times",
        "title": "Global Sovereign Wealth Funds Reallocate Capital Toward Direct Infrastructure and Datacenters",
        "content": "Sovereign allocators across Singapore and the Gulf states deploy tens of billions directly into power grids, clean energy utilities, and gigawatt AI datacenter campuses.",
        "published_at": "2024-09-05 08:30:00",
        "event_code": "EARNINGS_VOLATILITY",
        "relevance": 0.79
    },
    {
        "source": "The Economic Times",
        "title": "India's Foreign Exchange Reserves Cross $700 Billion Milestone for the First Time",
        "content": "Prudent central bank intervention in currency spot markets and continuous foreign portfolio inflows pushed the nation's foreign exchange buffer to an all-time record high.",
        "published_at": "2024-10-04 12:00:00",
        "event_code": None,
        "relevance": None
    },
    {
        "source": "MarketWatch",
        "title": "Consumer Staples Stocks Outperform as Defensive Factor Rotation Accelerates",
        "content": "Investors rotated capital into discount retailers and consumer goods giants including Walmart and Procter & Gamble as macroeconomic volatility prompted portfolio de-risking.",
        "published_at": "2024-08-06 15:45:00",
        "event_code": "LIQUIDITY_UNWIND",
        "relevance": 0.81
    },
    {
        "source": "Barron's",
        "title": "Gold Reaches Historic Highs as Central Banks Accelerate Physical Bullion Purchases",
        "content": "Sovereign reserve managers diversified out of fiat currency reserves into physical bullion, pushing spot gold prices through consecutive all-time records across 2024.",
        "published_at": "2024-10-21 10:15:00",
        "event_code": "MACRO_INFLATION_SURGE",
        "relevance": 0.80
    }
]

def generate_embeddings_and_seed():
    print("================================================================")
    print(" Financial Market Anomaly System: News Embeddings Seeder")
    print(" Implemented by: Amrit Raj Anmol (PES2UG24CS056)")
    print(" Model: sentence-transformers/all-MiniLM-L6-v2 (384 dimensions)")
    print("================================================================")

    # 1. Connect to Database
    conn = get_connection()
    cur = conn.cursor()

    try:
        # 2. Check and fetch existing market_event records
        cur.execute("SELECT event_id, event_type FROM market_event;")
        event_rows = cur.fetchall()
        event_map = {row[1]: row[0] for row in event_rows}
        print(f"[*] Found {len(event_map)} existing market events in database: {list(event_map.keys())}")

        # 3. Load SentenceTransformer Embedding Model
        print("[*] Loading sentence-transformers/all-MiniLM-L6-v2 model...")
        model = SentenceTransformer('all-MiniLM-L6-v2', local_files_only=True)
        print("[✓] Pretrained vector model loaded successfully (Output dimension: 384)!")

        # 4. Prepare text for embedding: combine title + summary content
        texts_to_embed = [
            f"{item['title']}. {item['content']}"
            for item in ARTICLES_CORPUS
        ]

        print(f"[*] Computing 384-dimensional dense embeddings for {len(texts_to_embed)} news articles...")
        embeddings = model.encode(texts_to_embed, show_progress_bar=True, normalize_embeddings=True)

        # 5. Insert articles and vectors into news_article table
        print("[*] Inserting news articles and vector embeddings into news_article table...")
        inserted_count = 0
        linked_count = 0

        for i, item in enumerate(ARTICLES_CORPUS):
            emb_vector = embeddings[i].tolist()
            # Format vector as string literal readable by pgvector: [val1, val2, ...]
            vector_str = "[" + ",".join(f"{val:.6f}" for val in emb_vector) + "]"
            url_slug = item['title'].lower().replace(" ", "-")[:80].replace("'", "").replace('"', "")
            article_url = f"https://financial-news.org/{random.randint(202401, 202412)}/{url_slug}"

            cur.execute("""
                INSERT INTO news_article (source, title, article_url, published_at, content, embedding)
                VALUES (%s, %s, %s, %s, %s, %s::vector)
                RETURNING article_id;
            """, (
                item['source'],
                item['title'],
                article_url,
                item['published_at'],
                item['content'],
                vector_str
            ))
            article_id = cur.fetchone()[0]
            inserted_count += 1

            # 6. Link to market_event if applicable
            event_code = item.get('event_code')
            if event_code and event_code in event_map:
                event_id = event_map[event_code]
                relevance = item.get('relevance', 0.85)
                cur.execute("""
                    INSERT INTO event_news (event_id, article_id, relevance_score)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (event_id, article_id) DO NOTHING;
                """, (event_id, article_id, relevance))
                linked_count += 1

        conn.commit()
        print(f"[✓] Successfully seeded {inserted_count} financial news articles with 384d vector embeddings!")
        print(f"[✓] Successfully established {linked_count} relational links in event_news junction table!")

        # 7. Verification: Run a test vector cosine query in PostgreSQL
        print("\n[*] Running pgvector verification query on news_article...")
        test_query = "Federal Reserve interest rate hike and bond yields"
        test_emb = model.encode(test_query, normalize_embeddings=True).tolist()
        test_vec_str = "[" + ",".join(f"{val:.6f}" for val in test_emb) + "]"

        cur.execute("""
            SELECT 
                na.article_id,
                na.source,
                na.title,
                ROUND((1 - (na.embedding <=> %s::vector))::NUMERIC, 4) AS cosine_similarity
            FROM news_article na
            ORDER BY na.embedding <=> %s::vector ASC
            LIMIT 3;
        """, (test_vec_str, test_vec_str))

        verification_rows = cur.fetchall()
        print(f"    Top semantic matches for '{test_query}':")
        for vrow in verification_rows:
            print(f"    - [{vrow[3]*100:.1f}% Match] (ID: {vrow[0]}) {vrow[1]}: {vrow[2]}")

        print("\n[✓] Issue #2 Completed successfully!")

    except Exception as e:
        conn.rollback()
        print(f"[!] Error during news embedding seeding: {e}")
        raise e
    finally:
        conn.close()

if __name__ == "__main__":
    generate_embeddings_and_seed()
