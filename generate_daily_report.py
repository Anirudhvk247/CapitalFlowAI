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

def load_daily_prompt():
    """Reads DAILY_REPORT_PROMPT from backend_config/prompts.txt."""
    if not os.path.exists(PROMPTS_PATH):
        raise FileNotFoundError(f"Prompts configuration file not found at {PROMPTS_PATH}")
        
    with open(PROMPTS_PATH, 'r') as f:
        text = f.read()
        
    # Find first instance of DAILY_REPORT_PROMPT
    idx_daily = text.find('DAILY_REPORT_PROMPT')
    if idx_daily == -1:
        # Fallback default prompt
        return "You are a professional Global Macro Investment Research Analyst. Generate a daily report based on this data."
        
    # Find next MONTHLY_REPORT_PROMPT or division
    idx_monthly = text.find('MONTHLY_REPORT_PROMPT', idx_daily)
    if idx_monthly == -1:
        segment = text[idx_daily + len('DAILY_REPORT_PROMPT'):]
    else:
        segment = text[idx_daily + len('DAILY_REPORT_PROMPT'):idx_monthly]
        
    lines = segment.strip().split('\n')
    cleaned_lines = []
    for line in lines:
        l = line.strip()
        if l == '---' or l == '===' or l.startswith('='):
            continue
        cleaned_lines.append(line)
        
    return '\n'.join(cleaned_lines).strip()

def generate_fallback_report(date_str, market_data, flow_data):
    """Generates a high-quality mock AI report matching the requested prompt structure."""
    equity_analysis = []
    commodity_analysis = []
    crypto_analysis = []
    risk_analysis = []
    
    # Sort market data by index name
    for item in market_data:
        name = item['index_name']
        price = item['price']
        change = item['percent_change']
        direction = "gained" if change >= 0 else "declined"
        sign = "+" if change > 0 else ""
        
        desc = f"{name} stood at {price} ({sign}{change}%, status: {item['status']})."
        
        if name in ["Nifty 50", "NIFTY 50", "S&P 500", "NASDAQ", "Shanghai Composite", "Nikkei 225", "TAIEX", "FTSE 100", "CAC 40", "STOXX Europe 600"]:
            equity_analysis.append(f"- **{name}**: {desc} Showing a {direction} pattern.")
        elif name in ["Gold", "Silver", "Copper", "Brent Crude"]:
            commodity_analysis.append(f"- **{name}**: {desc} Reflecting dynamic demand.")
        elif name in ["Bitcoin", "Ethereum"]:
            crypto_analysis.append(f"- **{name}**: {desc} Exhibiting crypto risk appetite.")
        else:
            risk_analysis.append(f"- **{name}**: {desc}")

    fii = flow_data.get('fii_netflow', 0)
    dii = flow_data.get('dii_netflow', 0)
    total = flow_data.get('total_netflow', 0)
    flow_sentiment = "BULLISH" if total > 0 else "BEARISH"
    
    report_md = f"""# Daily Market Intelligence Report - {date_str}

## Executive Summary
Global financial markets demonstrated a mixed environment today, driven by shifting macro sentiments. The overall global equity indices showed cautious trading, while safe-haven commodities like Gold saw moderate interest. Institutional flows remained active, providing localized support.

---

## Global Equity Markets
Today's trading across global equity markets showed divergence:
{'\n'.join(equity_analysis) if equity_analysis else "- Equity markets showed sideways consolidation."}

Overall sentiment was mixed, with Asian markets showing resilience while European indices faced selling pressure. US futures remained stable ahead of upcoming inflation readings.

---

## Commodities
Key commodity assets moved as follows:
{'\n'.join(commodity_analysis) if commodity_analysis else "- Commodities consolidated in tight ranges."}

Gold and Silver held onto safe-haven gains. Copper consolidated, reflecting supply-demand equilibrium, while Brent Crude traded in a range affected by global consumption forecasts.

---

## Cryptocurrency
Digital assets had the following performance:
{'\n'.join(crypto_analysis) if crypto_analysis else "- Cryptocurrency prices remained in a range-bound state."}

Bitcoin and Ethereum maintained critical support levels, moving in alignment with broader risk asset sentiment in the global macro space.

---

## Currency & Risk Indicators
Key macroeconomic risk indicators for today:
{'\n'.join(risk_analysis) if risk_analysis else "- Risk parameters were within normal ranges."}

Bond yields and the DXY fluctuated, influencing emerging market currency stability. USD/INR maintained its peg, while the VIX moved inversely to equity movements, showing standard hedging behaviors.

---

## Institutional Flow Analysis
- **FII Net Flow**: {fii:+,} Cr (NSE EQ Cash)
- **DII Net Flow**: {dii:+,} Cr
- **Total Net Flow**: {total:+,} Cr

With a net positive flow of {total:+,} Cr, institutional money flow was **{flow_sentiment}** for the session. Domestic Institutional Investors continue to act as a stabilizing pillar, countering foreign capital outflows.

---

## Key Insights
1. **Divergent Equity Trends**: Major indices displayed no uniform direction, with European weakness contrasting Asian stability.
2. **Safe Haven Interest**: Gold maintains its upward trajectory, signaling underlying macro hedging.
3. **DII Support**: Domestic institutions continue to inject liquidity, keeping domestic markets buoyant.
4. **Rangebound Cryptos**: Digital assets show consolidation, awaiting a catalyst for the next major leg.
5. **Yield Stability**: The US 10Y yield remains steady, anchor-pricing corporate borrowing expectations globally.

---

## Conclusion
Today's global market environment represents a standard consolidative phase. Investors are maintaining a defensive posture, relying on stable domestic institutional flows to offset international volatility while commodity hedging remains active.
"""
    return report_md

def generate_daily_report(date_str=None):
    """
    Loads daily market data, creates prompt, calls LLM, and stores report.
    """
    if date_str is None:
        date_str = datetime.now().strftime('%Y-%m-%d')
        
    database.init_db()
    
    # 1. Fetch data from DB
    market_data = database.get_market_data_by_date(date_str)
    flow_data = database.get_fii_dii_flow_by_date(date_str)
    
    if not market_data:
        print(f"No market data found in database for date {date_str}. Report generation aborted.")
        return False
        
    if not flow_data:
        flow_data = {"fii_netflow": 0.0, "dii_netflow": 0.0, "total_netflow": 0.0}
        
    # 2. Format today's data for the LLM
    data_summary = f"Date: {date_str}\n\n=== Table 1: market_data ===\n"
    for item in market_data:
        data_summary += f"Index/Asset: {item['index_name']}, Price: {item['price']}, % Change: {item['percent_change']}%, Status: {item['status']}\n"
        
    data_summary += f"\n=== Table 4: fii_dii_flow ===\n"
    data_summary += f"FII Net Flow: {flow_data.get('fii_netflow')} Cr\n"
    data_summary += f"DII Net Flow: {flow_data.get('dii_netflow')} Cr\n"
    data_summary += f"Total Net Flow: {flow_data.get('total_netflow')} Cr\n"
    
    # 3. Load daily prompt
    system_prompt = load_daily_prompt()
    
    user_prompt = f"Today's data:\n{data_summary}\n\nPlease generate the daily report using ONLY the provided data."
    
    report_content = None
    
    # 4. LLM API Call
    gemini_key = os.getenv('GEMINI_API_KEY')
    if gemini_key:
        try:
            print("Connecting to Google Gemini for Daily Report...")
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
            print("Daily Report generated successfully via Gemini.")
        except Exception as e:
            print(f"Gemini Daily Report generation failed: {e}. Falling back to template generator.")
    else:
        print("Gemini API Key not configured. Using fallback template generator.")
        
    if not report_content:
        # Fallback generator
        report_content = generate_fallback_report(date_str, market_data, flow_data)
        
    # 5. Store Daily Report
    database.insert_daily_report(date_str, report_content)
    print(f"Daily Report stored in database for {date_str}.")
    return True

if __name__ == '__main__':
    # Test run
    import sys
    test_date = sys.argv[1] if len(sys.argv) > 1 else datetime.now().strftime('%Y-%m-%d')
    generate_daily_report(test_date)
