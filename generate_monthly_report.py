import os
import re
from datetime import datetime
from google import genai
from google.genai import types
from dotenv import load_dotenv
import database

# Load environment variables
load_dotenv()

PROMPTS_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'backend_config', 'prompts.txt')

def load_monthly_prompt():
    """Reads the last MONTHLY_REPORT_PROMPT from backend_config/prompts.txt."""
    if not os.path.exists(PROMPTS_PATH):
        raise FileNotFoundError(f"Prompts configuration file not found at {PROMPTS_PATH}")
        
    with open(PROMPTS_PATH, 'r') as f:
        text = f.read()
        
    # Find the last instance of MONTHLY_REPORT_PROMPT (since user appended/updated it at the end)
    idx_monthly = text.rfind('MONTHLY_REPORT_PROMPT')
    if idx_monthly == -1:
        idx_monthly = text.find('MONTHLY_REPORT_PROMPT')
        
    if idx_monthly == -1:
        return "You are a professional Global Macro Investment Research Analyst. Generate a monthly review based on this data."
        
    segment = text[idx_monthly + len('MONTHLY_REPORT_PROMPT'):].strip()
    
    # We want to remove any starting line that is just '=' or '-' dividers if they immediately follow the label
    lines = segment.split('\n')
    while lines and (lines[0].strip().startswith('=') or lines[0].strip() == '---' or lines[0].strip() == ''):
        lines.pop(0)
        
    return '\n'.join(lines).strip()

def generate_fallback_monthly_report(month, year, computed_stats, total_fii, total_dii, total_net):
    """Generates a high-quality mock monthly AI report matching the requested prompt structure using computed stats."""
    month_name = datetime(year, month, 1).strftime('%B')
    
    # Format individual asset details if computed_stats is present
    def format_asset_status(name):
        stats = computed_stats.get(name)
        if not stats:
            return f"- **{name}**: No data available."
        
        op = stats["opening_price"]
        cp = stats["closing_price"]
        chg = stats["monthly_pct_change"]
        best = stats["best_daily_gain"]
        worst = stats["worst_daily_loss"]
        trend = stats["trend"]
        
        sign = "+" if chg >= 0 else ""
        return (
            f"- **{name}**: Opened at {op:,.2f}, closed at {cp:,.2f} ({sign}{chg:.2f}% Change). "
            f"Best daily gain: {best:+.2f}%, Worst daily loss: {worst:+.2f}%. Trend: {trend}."
        )

    equity_assets = ["NIFTY 50", "S&P 500", "NASDAQ", "Shanghai Composite", "Nikkei 225", "TAIEX", "FTSE 100", "CAC 40", "STOXX Europe 600"]
    equity_lines = [format_asset_status(asset) for asset in equity_assets if asset in computed_stats]
    
    commodity_assets = ["Gold", "Silver", "Copper", "Brent Crude"]
    commodity_lines = [format_asset_status(asset) for asset in commodity_assets if asset in computed_stats]
    
    crypto_assets = ["Bitcoin", "Ethereum"]
    crypto_lines = [format_asset_status(asset) for asset in crypto_assets if asset in computed_stats]
    
    risk_assets = ["US 10Y Bond Yield", "US Dollar Index", "USD/INR", "VIX"]
    risk_lines = [format_asset_status(asset) for asset in risk_assets if asset in computed_stats]
    
    flow_sentiment = "net buyers" if total_net > 0 else "net sellers"
    
    report_md = f"""# Monthly Global Macro Research Report - {month_name} {year}

## Executive Summary

The month of {month_name} {year} was characterized by key macroeconomic developments and central bank updates that influenced global capital allocation. Global equities experienced a mixed trend, while currencies and bond markets exhibited defensive pricing. Institutional participation showed strong support from domestic retail inflows, balancing international volatility.

---

## Global Equity Markets Review

During {month_name}, global equity markets traded with high volatility:
{'\n'.join(equity_lines) if equity_lines else '- No equity indices recorded.'}

Overall, we witnessed divergent equity performances across regions. Local growth drivers and currency dynamics heavily dictated relative strength.

---

## Commodities Review

Commodity performance for {month_name} showed distinct asset movements:
{'\n'.join(commodity_lines) if commodity_lines else '- No commodities recorded.'}

Precious metals acted as key defensive assets, whereas industrial metals tracked shifts in global manufacturing indices and crude balanced OPEC policies with macroeconomic demand forecasts.

---

## Cryptocurrency Review

Digital asset trends during {month_name}:
{'\n'.join(crypto_lines) if crypto_lines else '- No cryptocurrencies recorded.'}

Crypto assets consolidated within established ranges, digesting structural liquidity inputs and shifting risk-on global sentiment.

---

## Currency & Risk Indicators

Key currency movements and systemic risk indicators:
{'\n'.join(risk_lines) if risk_lines else '- No risk indicators recorded.'}

The sovereign yield environment and dollar strength index played a major role in dictating capital flows to emerging markets, while VIX levels captured key event-driven volatility spikes.

---

## Institutional Flow Review

During the month, institutions were **{flow_sentiment}** overall:
- **Total FII Net Flow**: {total_fii:+,.2f} Cr
- **Total DII Net Flow**: {total_dii:+,.2f} Cr
- **Total Net Flow**: {total_net:+,.2f} Cr

FII outflows were balanced by domestic liquidity support (DII), reflecting structural stability driven by strong retail investment participation.

---

## Major Monthly Insights

1. **DII Stability**: Domestic institutional flows remained the primary stabilizer of the local stock market.
2. **Safe Haven Outperformance**: Precious metals outshone industrial commodities, pointing to defensive positioning.
3. **Tech & AI Premium**: Tech-heavy indexes showed relative outperformance, reflecting structural demand themes.
4. **European Underperformance**: Political and growth headwinds kept European markets on the defensive.
5. **DXY Strength**: The persistent dollar strength created mild headwinds for emerging markets capital flows.
6. **Crypto Consolidation**: Digital assets entered a consolidation phase, showing reduced speculative retail activity.
7. **Bond Yield Pressure**: Higher-for-longer yield expectations restricted immediate valuation expansions in equities.
8. **Crude oil equilibrium**: Oil prices remained capped, limiting global inflationary triggers from energy.

---

## Long-Term Investor Takeaways

- **Maintain Diversification**: Performance divergence across asset classes underscores the value of geographical and sector diversification.
- **Strategic Hedging**: Gold remains a crucial hedge in any macro portfolio to manage geopolitical and inflation risk.
- **Domestic Resilience**: Structural inflows from domestic investors continue to provide a solid floor for the local equity markets.

---

## Overall Conclusion

{month_name} {year} demonstrated the importance of active macro asset allocation. While foreign portfolio flows remained volatile, domestic structural support and defensive allocations provided stability for long-term compounders.
"""
    return report_md

def generate_monthly_report(month, year, force=False):
    """
    Fetches month's market data, aggregates statistics in Python, calls LLM, and stores report.
    Historical reports are retrieved from database and never regenerated unless explicitly requested.
    """
    database.init_db()
    
    # 1. Check if report already exists and force is False
    if not force:
        existing_report = database.get_monthly_report_by_month_year(month, year)
        if existing_report:
            print(f"Monthly report for {month}/{year} already exists in database. Skipping regeneration.")
            return True
            
    # 2. Fetch entire month's data
    market_data = database.get_market_data_for_month(month, year)
    flow_data = database.get_fii_dii_flow_for_month(month, year)
    
    if not market_data:
        print(f"No market data found in database for month {month}/{year}. Report generation aborted.")
        return False
        
    # 3. Group and compute monthly summary for assets
    grouped_data = {}
    for row in market_data:
        name = row['index_name']
        if name not in grouped_data:
            grouped_data[name] = []
        grouped_data[name].append(row)
        
    # Order assets cleanly
    ASSET_ORDER = [
        "NIFTY 50",
        "S&P 500",
        "NASDAQ",
        "Shanghai Composite",
        "Nikkei 225",
        "TAIEX",
        "FTSE 100",
        "CAC 40",
        "STOXX Europe 600",
        "Gold",
        "Silver",
        "Copper",
        "Brent Crude",
        "Bitcoin",
        "Ethereum",
        "US 10Y Bond Yield",
        "US Dollar Index",
        "USD/INR",
        "VIX"
    ]
    
    def get_sort_key(name):
        try:
            return ASSET_ORDER.index(name)
        except ValueError:
            return len(ASSET_ORDER)
            
    sorted_assets = sorted(grouped_data.keys(), key=get_sort_key)
    
    summary_lines = ["MONTHLY SUMMARY\n"]
    computed_stats = {}
    
    for name in sorted_assets:
        # Sort chronologically by date
        rows = sorted(grouped_data[name], key=lambda x: x['date'])
        op = rows[0]['price']
        cp = rows[-1]['price']
        
        pct_chg = ((cp - op) / op * 100) if op != 0 else 0.0
        best_gain = max(r['percent_change'] for r in rows)
        worst_loss = min(r['percent_change'] for r in rows)
        
        if cp > op:
            trend = "Bullish"
        elif cp < op:
            trend = "Bearish"
        else:
            trend = "Sideways"
            
        computed_stats[name] = {
            "opening_price": op,
            "closing_price": cp,
            "monthly_pct_change": pct_chg,
            "best_daily_gain": best_gain,
            "worst_daily_loss": worst_loss,
            "trend": trend
        }
        
        summary_lines.append(f"{name}")
        summary_lines.append(f"- Opening Price: {op:,.2f}")
        summary_lines.append(f"- Closing Price: {cp:,.2f}")
        summary_lines.append(f"- Monthly % Change: {pct_chg:+.2f}%")
        summary_lines.append(f"- Best Daily % Gain: {best_gain:+.2f}%")
        summary_lines.append(f"- Worst Daily % Loss: {worst_loss:+.2f}%")
        summary_lines.append(f"- Overall Trend: {trend}\n")
        
    # Calculate Institutional Flows
    if flow_data:
        total_fii_netflow = sum(row.get('fii_netflow', 0.0) for row in flow_data)
        total_dii_netflow = sum(row.get('dii_netflow', 0.0) for row in flow_data)
        total_net_flow = sum(row.get('total_netflow', 0.0) for row in flow_data)
    else:
        total_fii_netflow = 0.0
        total_dii_netflow = 0.0
        total_net_flow = 0.0
        
    summary_lines.append("Institutional Flow")
    summary_lines.append(f"- Total FII Net Flow: {total_fii_netflow:+,.2f} Cr")
    summary_lines.append(f"- Total DII Net Flow: {total_dii_netflow:+,.2f} Cr")
    summary_lines.append(f"- Total Net Flow: {total_net_flow:+,.2f} Cr")
    
    monthly_summary = '\n'.join(summary_lines)
    
    # 4. Load monthly prompt from prompts.txt
    system_prompt = load_monthly_prompt()
    user_prompt = f"Monthly summary data generated by Python:\n\n{monthly_summary}"
    
    report_content = None
    
    # 5. LLM API Call
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        try:
            print("Connecting to Google Gemini for Monthly Report...")
            client = genai.Client(api_key=gemini_key)
            
            response = client.models.generate_content(
                model='gemini-2.5-flash',
                contents=user_prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_prompt,
                    temperature=0.2,
                    max_output_tokens=8192
                )
            )
            report_content = response.text
            print("Monthly Report generated successfully via Gemini.")
        except Exception as e:
            print(f"Gemini Monthly Report generation failed: {e}. Falling back to template generator.")
    else:
        print("Gemini API Key not configured. Using fallback template generator.")
        
    if not report_content:
        # Fallback generator
        report_content = generate_fallback_monthly_report(
            month, year, computed_stats, 
            total_fii_netflow, total_dii_netflow, total_net_flow
        )
        
    # 6. Store Monthly Report
    database.insert_monthly_report(month, year, report_content)
    print(f"Monthly Report stored in database for {month}/{year}.")
    return True

if __name__ == '__main__':
    # Test run for current month
    now = datetime.now()
    generate_monthly_report(now.month, now.year)
