import os
import atexit
from datetime import datetime
from flask import Flask, render_template, jsonify, request
import database
import charts
import scheduler
import generate_daily_report
import generate_monthly_report

app = Flask(__name__, template_folder='frontend', static_folder='frontend', static_url_path='')

# Initialize the database and scheduler on startup
database.init_db()
scheduler.start_scheduler()

# Shutdown scheduler on exit
atexit.register(scheduler.shutdown_scheduler)

def parse_educational_content():
    """Parses frontend_content/content.txt into individual educational sections and appends items 1-18."""
    content_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'frontend_content', 'content.txt')
    if not os.path.exists(content_path):
        return {
            "markets_explained": "Markets Explained content not found.",
            "macro_guide": "Macro Events Guide content not found.",
            "hedging_guide": "Hedging & Diversification Guide content not found.",
            "invest_globally": "Global Investing Guide content not found."
        }
        
    with open(content_path, 'r') as f:
        text = f.read()
        
    sections = {}
    
    # Identify heading markers
    macro_marker = "# MACRO EVENTS GUIDE FOR INVESTORS"
    hedging_marker = "# HEDGING & DIVERSIFICATION GUIDE"
    
    macro_idx = text.find(macro_marker)
    hedging_idx = text.find(hedging_marker)
    
    # Generate the complete 1-18 items matching style of 19-21
    complete_markets_heading = """# MARKETS EXPLAINED

To navigate global investing, you must understand the key financial indices, commodities, currencies, and flow indicators. Below is the complete guide explaining all 21 core elements tracked by CapitalFlowAI.

================================================================================

1. 🇮🇳 NIFTY 50 (Indian Equities)
What is it?
Benchmark stock index representing the 50 largest and most liquid Indian companies.
Why is it important?
A key proxy for India's economic growth and corporate health.
Who should follow it?
- Retail investors
- Mutual fund managers
- Swing traders
Easy example:
If Nifty 50 gains, India's largest blue chips like Reliance and HDFC are doing well.

--------------------------------------------------------------------------------

2. 🇺🇸 S&P 500 (US Large Cap Equities)
What is it?
An index tracking 500 of the largest listed companies in the United States.
Why is it important?
The primary barometer of the US stock market and overall global equity sentiment.
Who should follow it?
- Global allocators
- Long-term investors
- Macro analysts
Easy example:
If the S&P 500 rallies, it shows global investors are optimistic about corporate earnings in the US.

--------------------------------------------------------------------------------

3. 🇺🇸 NASDAQ (US Tech Equities)
What is it?
A market capitalization-weighted index of tech and growth firms listed on the Nasdaq.
Why is it important?
Represents global momentum in technology, AI, software, and future growth sectors.
Who should follow it?
- Venture builders
- Growth investors
- Sector specialists
Easy example:
When tech giants like Apple and Nvidia rally, the NASDAQ index climbs significantly.

--------------------------------------------------------------------------------

4. 🇨🇳 Shanghai Composite (Chinese Equities)
What is it?
Benchmark index tracking all shares traded on the Shanghai Stock Exchange.
Why is it important?
Reflects policy movements and macroeconomic state of the second-largest economy.
Who should follow it?
- Trade analysts
- Emerging market funds
- Commodity buyers
Easy example:
If domestic Chinese factories slow down, the Shanghai Composite index typically declines.

--------------------------------------------------------------------------------

5. 🇯🇵 Nikkei 225 (Japanese Equities)
What is it?
The premier price-weighted stock index for the Tokyo Stock Exchange.
Why is it important?
Measures export competitiveness and corporate health of Japan's manufacturing giants.
Who should follow it?
- Currency strategists
- Equity allocators
Easy example:
A depreciation in the Japanese Yen often increases Nikkei 225 index values.

--------------------------------------------------------------------------------

6. 🇹🇼 TAIEX (Taiwan Capitalization Weighted Index)
What is it?
Benchmark index tracking companies listed on the Taiwan Stock Exchange.
Why is it important?
Taiwan is the epicentre of semiconductor manufacturing (TSMC). TAIEX represents chip supply chain cycles.
Who should follow it?
- Tech hardware analysts
- Supply chain monitors
Easy example:
A global demand surge for AI server graphics cards raises TAIEX values.

--------------------------------------------------------------------------------

7. 🇬🇧 FTSE 100 (UK Equities)
What is it?
Index of the 100 largest companies on the London Stock Exchange.
Why is it important?
Heavily comprised of multinational mining, finance, and oil companies.
Who should follow it?
- Dividend-focused funds
- Value investors
Easy example:
Higher commodity or energy prices typically lift FTSE 100 miners and oil drillers.

--------------------------------------------------------------------------------

8. 🇫🇷 CAC 40 (French Equities)
What is it?
Benchmark index of the 40 most significant values on the Paris Bourse.
Why is it important?
Highly sensitive to global consumer luxury spend (LVMH, Kering, Hermes).
Who should follow it?
- Consumer analysts
- European stock traders
Easy example:
Slowing consumption in Asia causes CAC 40 luxury index values to decline.

--------------------------------------------------------------------------------

9. 🇪🇺 STOXX Europe 600 (European Equities)
What is it?
An index representing 600 large, mid, and small companies across 17 European nations.
Why is it important?
Offers a diversified aggregate metric of the European economic environment.
Who should follow it?
- European equity funds
- Global allocators
Easy example:
Elevated borrowing costs from the European Central Bank place downward pressure on STOXX 600 valuations.

--------------------------------------------------------------------------------

10. 🪙 Gold (Safe Haven Asset)
What is it?
The global spot price of precious metal gold (XAU/USD).
Why is it important?
A historical store of value and hedge against paper currency inflation and geopolitical wars.
Who should follow it?
- Portfolio hedgers
- Long-term investors
Easy example:
During heightened geopolitical conflict, investors move funds into Gold, causing prices to rise.

--------------------------------------------------------------------------------

11. 🪙 Silver (Industrial Precious Metal)
What is it?
The spot price of commodity silver (XAG/USD).
Why is it important?
Shares safe-haven properties with gold but has intense industrial usage in green solar panels.
Who should follow it?
- Commodity traders
- Green energy analysts
Easy example:
An expansion in global solar panel installation increases industrial silver pricing.

--------------------------------------------------------------------------------

12. 🏗️ Copper (Industrial Growth Metal)
What is it?
The futures price of commodity copper (HG=F).
Why is it important?
Known as "Dr. Copper" as its demand acts as an early indicator of global construction and infrastructure.
Who should follow it?
- Industrial analysts
- Global builders
Easy example:
A global surge in power grid electrification lifts copper prices.

--------------------------------------------------------------------------------

13. 🛢️ Brent Crude Oil (Energy Benchmark)
What is it?
Global pricing benchmark for crude oil extracted from the North Sea.
Why is it important?
Energy costs feed directly into manufacturing and transportation inflation.
Who should follow it?
- Macro-economists
- Shipping firms
Easy example:
Rising crude oil prices increase fuel surcharges for air cargo and logistics companies.

--------------------------------------------------------------------------------

14. 🪙 Bitcoin (Digital Gold / Crypto)
What is it?
The leading decentralized cryptocurrency (BTC/USD).
Why is it important?
Acts as a speculative liquidity barometer and digital asset hedge.
Who should follow it?
- FinTech allocators
- Risk traders
Easy example:
When central banks expand liquidity, speculative flows into Bitcoin increase.

--------------------------------------------------------------------------------

15. 🪙 Ethereum (Smart Contract Platform / Crypto)
What is it?
The native token of the smart contract Ethereum network (ETH/USD).
Why is it important?
Drives the infrastructure for decentralized finance applications and Web3.
Who should follow it?
- Smart contract developers
- Tech investors
Easy example:
High usage of decentralized applications burns network supply, helping lift Ethereum prices.

--------------------------------------------------------------------------------

16. 📈 US 10Y Bond Yield (Global Risk-Free Rate)
What is it?
The interest yield paid on 10-year US sovereign debt.
Why is it important?
The benchmark pricing standard for global debt. Rising yields pull money out of stocks.
Who should follow it?
- Fixed income allocators
- Equity buyers
Easy example:
When US yields rise, global institutional investors demand cheaper equity multiples.

--------------------------------------------------------------------------------

17. 💵 US Dollar Index - DXY (Reserve Currency Strength)
What is it?
Index tracking the value of the USD relative to a basket of major global currencies.
Why is it important?
A strong dollar drags on foreign emerging markets holding dollar-denominated debt.
Who should follow it?
- Forex analysts
- Trade managers
Easy example:
A strong DXY pulls liquidity away from emerging markets, depressing local indices.

--------------------------------------------------------------------------------

18. 🇮🇳 USD/INR Exchange Rate (Import/Export Cost)
What is it?
The exchange rate of 1 US Dollar in Indian Rupees.
Why is it important?
Directly impacts import costs (like oil) and export earnings (IT services).
"""
    
    # 1. Markets Explained (beginning of file up to MACRO EVENTS GUIDE)
    if macro_idx != -1:
        raw_markets = text[:macro_idx].strip()
    else:
        raw_markets = text.strip()
        
    # Find the portion after USD/INR exchange rate (items 19, 20, 21)
    parts = raw_markets.split('--------------------------------------------------------------------------------')
    remaining_items = ""
    # We want to capture items 19, 20, 21 from the user's content.txt
    # Items 19 is usually in the latter part of the split blocks
    for part in parts:
        if "19. 📉 VIX" in part or "20. 🇮🇳 FII" in part or "21. 🇮🇳 DII" in part:
            remaining_items += "\n--------------------------------------------------------------------------------\n" + part.strip()
            
    # Append user's items 19, 20, 21 and conclusion
    if "Why does CapitalFlowAI track all these?" in raw_markets:
        idx_conclusion = raw_markets.find("Why does CapitalFlowAI track all these?")
        conclusion_text = raw_markets[idx_conclusion:].strip()
        remaining_items += "\n--------------------------------------------------------------------------------\n" + conclusion_text
        
    sections['markets_explained'] = complete_markets_heading.strip() + remaining_items
    
    # 2. Macro Events Guide
    if macro_idx != -1:
        if hedging_idx != -1:
            sections['macro_guide'] = text[macro_idx:hedging_idx].strip()
        else:
            sections['macro_guide'] = text[macro_idx:].strip()
    else:
        sections['macro_guide'] = "# Macro Events Guide\nContent not found."
        
    # 3. Hedging & Diversification Guide
    if hedging_idx != -1:
        sections['hedging_guide'] = text[hedging_idx:].strip()
    else:
        sections['hedging_guide'] = "# Hedging & Diversification Guide\nContent not found."
        
    # 4. How Indians Can Invest Globally (ETFs & INDmoney) - customized page content
    sections['invest_globally'] = """# HOW INDIANS CAN INVEST GLOBALLY (ETFs & INDmoney)

Investing in global markets allows Indian retail investors to diversify geographically, hedge against Indian Rupee (INR) depreciation, and own shares of global giants like Apple, Google, NVIDIA, and Microsoft.

---

## 1. Why Invest Globally?
- **Diversification**: Spreads risk across different economic regions.
- **US Dollar Hedge**: Over the last decade, the USD has historically appreciated against the INR by ~3-5% annually.
- **Access to Innovation**: Direct exposure to companies driving AI, semiconductors, cloud computing, and biotech.

---

## 2. Investment Routes

### Route A: International Mutual Funds & ETFs (In INR)
- **What is it?**: Asset Management Companies (AMCs) in India offer funds that invest in foreign mutual funds or track foreign indices like NASDAQ 100 or S&P 500.
- **Key ETFs**: Motilal Oswal Nasdaq 100 ETF, Nippon India ETF Hang Seng BeES.
- **Pros**: Invest directly in INR; simple tax reporting; no need for foreign brokerage.
- **Cons**: Subject to regulatory industry-wide limits set by the RBI on international investing.

### Route B: Direct US Stocks (In USD via LRS)
- **What is it?**: Opening an account with direct US stock brokers operating in India like **INDmoney** or **Vested**.
- **LRS Scheme**: The Liberalised Remittance Scheme allows individuals to remit up to $250,000 per financial year abroad for investments.
- **Pros**: Direct ownership of shares; buy fractional shares (e.g., buy $5 of Apple stock); no AMC limits.
- **Cons**: Wire transfer fees; foreign exchange conversion charges; TCS (Tax Collected at Source) applies above specific LRS thresholds.

---

## 3. Spotlight on INDmoney
- **Zero Account Fees**: Open a US Stocks account digitally within minutes.
- **Instant Funding**: Seamless partnerships with major Indian banks to reduce wire transfer delays and FX charges.
- **Fractional Investing**: Start investing in US tech stars with as little as $1.
- **Automated Tax Reports**: Generates US tax statement files (including W-8BEN validation) ready for Indian tax filings.

---

## 4. Tax Rules for Indians
- **Dividends**: Taxed at a flat 25% withholding tax in the US, but can be claimed back under DTAA (Double Tax Avoidance Agreement) via Form 67.
- **Capital Gains**:
  - Held > 24 Months: Long-term capital asset, taxed at 20% with indexation.
  - Held < 24 Months: Short-term capital asset, taxed at your marginal slab rate.
"""
    return sections

# --- Page Routes ---

@app.route('/')
def route_home():
    return render_template('index.html')

@app.route('/daily')
def route_daily():
    return render_template('daily.html')

@app.route('/monthly')
def route_monthly():
    return render_template('monthly.html')

@app.route('/archive/daily')
def route_archive_daily():
    return render_template('archive_daily.html')

@app.route('/archive/monthly')
def route_archive_monthly():
    return render_template('archive_monthly.html')

@app.route('/education')
def route_education():
    return render_template('education.html')

@app.route('/education/markets-explained')
def edu_markets():
    return render_template('education_markets.html')

@app.route('/education/invest-globally')
def edu_globally():
    return render_template('education_globally.html')

@app.route('/education/macro-events')
def edu_macro():
    return render_template('education_macro.html')

@app.route('/education/hedging-diversification')
def edu_hedging():
    return render_template('education_hedging.html')

# --- API Endpoints ---

@app.route('/api/data/today')
def get_today_data():
    today_str = datetime.now().strftime('%Y-%m-%d')
    
    # Check if today's report already exists in the database
    report_data = database.get_daily_report_by_date(today_str)
    
    # If today's report does not exist, trigger the lazy-generation fallback
    if not report_data:
        print(f"[{datetime.now()}] Today's daily report ({today_str}) not found. Triggering lazy generation...")
        scheduler.run_daily_pipeline(today_str)
        report_data = database.get_daily_report_by_date(today_str)
        
    # Get all dates with data to determine latest available data
    dates = database.get_all_dates_with_data()
    if not dates:
        return jsonify({
            "status": "error",
            "message": "No market data found in the database. Please trigger a sync."
        }), 404
        
    # If lazy generation succeeded (or was already present), latest_date will be today_str.
    # Otherwise, it falls back to the most recent date in the database.
    latest_date = dates[0]
    
    market_data = database.get_market_data_by_date(latest_date)
    flow_data = database.get_fii_dii_flow_by_date(latest_date)
    report_data = database.get_daily_report_by_date(latest_date)
    chart_configs = charts.get_daily_charts(latest_date)
    
    days = request.args.get('days', 30, type=int)
    history_timeline = charts.get_all_assets_history(latest_date, days)
    
    return jsonify({
        "status": "success",
        "date": latest_date,
        "market_data": market_data,
        "fii_dii_flow": flow_data,
        "daily_report": report_data['report'] if report_data else "No AI report generated for today yet.",
        "charts": chart_configs,
        "history_timeline": history_timeline,
        "all_dates": dates
    })

@app.route('/api/data/archive/daily')
def get_archive_daily_data():
    date_str = request.args.get('date')
    if not date_str:
        return jsonify({"status": "error", "message": "Missing date parameter"}), 400
        
    # Apply lazy fallback if the requested date is today's date
    today_str = datetime.now().strftime('%Y-%m-%d')
    if date_str == today_str:
        report_data = database.get_daily_report_by_date(today_str)
        if not report_data:
            print(f"[{datetime.now()}] Today's daily report ({today_str}) requested via archive and not found. Triggering lazy generation...")
            scheduler.run_daily_pipeline(today_str)
            
    market_data = database.get_market_data_by_date(date_str)
    if not market_data:
        return jsonify({"status": "error", "message": f"No data found for date {date_str}."}), 404
        
    flow_data = database.get_fii_dii_flow_by_date(date_str)
    report_data = database.get_daily_report_by_date(date_str)
    chart_configs = charts.get_daily_charts(date_str)
    
    days = request.args.get('days', 30, type=int)
    history_timeline = charts.get_all_assets_history(date_str, days)
    
    return jsonify({
        "status": "success",
        "date": date_str,
        "market_data": market_data,
        "fii_dii_flow": flow_data,
        "daily_report": report_data['report'] if report_data else "No AI report was saved for this date.",
        "charts": chart_configs,
        "history_timeline": history_timeline
    })

@app.route('/api/data/archive/monthly')
def get_archive_monthly_data():
    try:
        month = int(request.args.get('month'))
        year = int(request.args.get('year'))
    except (TypeError, ValueError):
        return jsonify({"status": "error", "message": "Invalid month or year parameters"}), 400
        
    # Check if report exists
    report_data = database.get_monthly_report_by_month_year(month, year)
    
    # If the report does not exist, check if we need to fetch today's data first
    if not report_data:
        now = datetime.now()
        # If it's the current month and year, ensure we have today's data/report first
        if month == now.month and year == now.year:
            today_str = now.strftime('%Y-%m-%d')
            today_report = database.get_daily_report_by_date(today_str)
            if not today_report:
                print(f"[{datetime.now()}] Today's daily report ({today_str}) not found during current month report generation. Fetching today's data first...")
                scheduler.run_daily_pipeline(today_str)
        
        # Check if we have market data for the month
        market_data = database.get_market_data_for_month(month, year)
        if market_data:
            print(f"[{datetime.now()}] Generating monthly report on-the-fly for {month}/{year}...")
            generate_monthly_report.generate_monthly_report(month, year)
            report_data = database.get_monthly_report_by_month_year(month, year)
            
    if not report_data:
        return jsonify({"status": "error", "message": f"No data or monthly report found for {month}/{year}."}), 404
        
    chart_configs = charts.get_monthly_charts(month, year)
    
    return jsonify({
        "status": "success",
        "month": month,
        "year": year,
        "monthly_report": report_data['report'],
        "charts": chart_configs
    })

@app.route('/api/sync', methods=['POST'])
def trigger_sync():
    """Manually triggers the daily scheduler pipeline to pull data and generate daily report."""
    target_date = request.json.get('date') if request.is_json else None
    
    if target_date:
        # Validate format
        try:
            datetime.strptime(target_date, '%Y-%m-%d')
        except ValueError:
            return jsonify({"status": "error", "message": "Invalid date format. Use YYYY-MM-DD."}), 400
    else:
        target_date = datetime.now().strftime('%Y-%m-%d')
        
    success = scheduler.run_daily_pipeline(target_date)
    if success:
        return jsonify({
            "status": "success",
            "message": f"Daily pipeline executed successfully for {target_date}."
        })
    else:
        return jsonify({
            "status": "error",
            "message": "Daily pipeline execution failed. See logs for details."
        }), 500

@app.route('/api/education')
def get_education_content():
    sections = parse_educational_content()
    return jsonify({
        "status": "success",
        "content": sections
    })

@app.route('/api/meta/dates')
def get_all_dates():
    dates = database.get_all_dates_with_data()
    months = database.get_all_months_with_reports()
    return jsonify({
        "status": "success",
        "dates": dates,
        "months": months
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
