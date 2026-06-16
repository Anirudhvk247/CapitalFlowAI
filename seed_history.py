import os
import sys
import random
from datetime import datetime, timedelta

# Adjust path to import local modules
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

import database
import fetch_market_data
import generate_daily_report
import generate_monthly_report

def seed_database_history():
    print("=== SEEDING HISTORICAL DATA (365 DAYS) ===")
    database.init_db()
    
    # Starting date: 365 days ago from 2026-06-13
    end_date = datetime(2026, 6, 13)
    start_date = end_date - timedelta(days=365)
    
    current_date = start_date
    
    # baseline dictionary to simulate random walk
    baselines = {k: v["price"] for k, v in fetch_market_data.BASELINE_DATA.items()}
    
    # We will generate data day-by-day
    while current_date <= end_date:
        date_str = current_date.strftime('%Y-%m-%d')
        print(f"Seeding data for {date_str}...")
        
        # 1. Generate market data with random walk
        market_data_list = []
        for name, baseline_price in baselines.items():
            base_meta = fetch_market_data.BASELINE_DATA[name]
            
            # Apply slight drift
            change_pct = random.uniform(-1.8, 2.0)
            price = round(baseline_price * (1 + change_pct / 100.0), 4 if baseline_price < 10 else 2)
            
            # Update baseline for next day (random walk)
            baselines[name] = price
            
            # Market status (weekends are closed)
            is_weekend = current_date.weekday() >= 5
            status = "CLOSED" if is_weekend else base_meta["status"]
            
            # Adjust weekend price changes to be flat
            actual_change = 0.0 if is_weekend else change_pct
            
            market_data_list.append({
                "date": date_str,
                "index_name": base_meta["name"],
                "price": price,
                "percent_change": round(actual_change, 2),
                "status": status
            })
            
            # Insert into database
            database.insert_market_data(
                date=date_str,
                index_name=base_meta["name"],
                price=price,
                percent_change=round(actual_change, 2),
                status=status
            )
            
        # 2. Generate FII/DII Net Flows
        is_wknd = current_date.weekday() >= 5
        fii = 0.0 if is_wknd else round(random.uniform(-2800.0, 800.0), 2)
        dii = 0.0 if is_wknd else round(random.uniform(900.0, 3600.0), 2)
        total = round(fii + dii, 2)
        
        database.insert_fii_dii_flow(
            date=date_str,
            fii_netflow=fii,
            dii_netflow=dii,
            total_netflow=total
        )
        
        # 3. Generate Daily AI Report
        report_content = generate_daily_report.generate_fallback_report(
            date_str, market_data_list, 
            {"fii_netflow": fii, "dii_netflow": dii, "total_netflow": total}
        )
        database.insert_daily_report(date_str, report_content)
        
        current_date += timedelta(days=1)
        
    # 4. Generate Monthly AI Report for May 2026
    print("Seeding monthly report for May 2026...")
    generate_monthly_report.generate_monthly_report(5, 2026)
    
    # 5. Generate Monthly AI Report for June 2026 (for test completeness)
    print("Seeding monthly report for June 2026...")
    generate_monthly_report.generate_monthly_report(6, 2026)
    
    print("\n=== HISTORY SEEDING COMPLETED SUCCESSFULLY ===")

if __name__ == '__main__':
    seed_database_history()
