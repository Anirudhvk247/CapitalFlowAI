import os
import time
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import database
import fetch_market_data
import generate_daily_report
import generate_monthly_report

def run_daily_pipeline(target_date_str=None):
    """
    Executes the entire daily workflow:
    1. Fetch data from Twelve Data & Upstox
    2. Store data into Table 1 (market_data) and Table 4 (fii_dii_flow)
    3. Generate daily report and store in Table 2 (daily_reports)
    4. If it's month-end, generate and store monthly report in Table 3 (monthly_reports)
    """
    database.init_db()
    
    if target_date_str is None:
        target_date_obj = datetime.now()
        target_date_str = target_date_obj.strftime('%Y-%m-%d')
    else:
        try:
            target_date_obj = datetime.strptime(target_date_str, '%Y-%m-%d')
        except ValueError:
            target_date_obj = datetime.now()
            target_date_str = target_date_obj.strftime('%Y-%m-%d')
            
    print(f"[{datetime.now()}] Starting scheduler run for date: {target_date_str}...")
    
    # Step 1: Call fetch_market_data.py
    try:
        market_data_list, fii_dii_flow_data = fetch_market_data.fetch_market_data(target_date_str)
        
        # Step 2: Store data into database
        print(f"Storing {len(market_data_list)} market indices...")
        for row in market_data_list:
            database.insert_market_data(
                date=row['date'],
                index_name=row['index_name'],
                price=row['price'],
                percent_change=row['percent_change'],
                status=row['status']
            )
            
        print("Storing FII/DII Net Flow data...")
        database.insert_fii_dii_flow(
            date=fii_dii_flow_data['date'],
            fii_netflow=fii_dii_flow_data['fii_netflow'],
            dii_netflow=fii_dii_flow_data['dii_netflow'],
            total_netflow=fii_dii_flow_data['total_netflow']
        )
        
    except Exception as e:
        print(f"Error fetching/storing data: {e}")
        return False
        
    # Step 3: Call generate_daily_report.py
    try:
        print("Generating Daily AI Report...")
        generate_daily_report.generate_daily_report(target_date_str)
    except Exception as e:
        print(f"Error generating daily report: {e}")
        
    # Step 4: Monthly report check
    # Trigger monthly report on the 30th of every month (or 28th for February)
    is_monthly_trigger = (target_date_obj.month == 2 and target_date_obj.day == 28) or (target_date_obj.month != 2 and target_date_obj.day == 30)
    
    if is_monthly_trigger:
        try:
            print(f"Monthly report trigger day detected ({target_date_str}). Generating Monthly AI Report...")
            generate_monthly_report.generate_monthly_report(target_date_obj.month, target_date_obj.year)
        except Exception as e:
            print(f"Error generating monthly report: {e}")
    else:
        print(f"Not the monthly report trigger day ({target_date_str}). Skipping monthly report.")
        
    print(f"[{datetime.now()}] Scheduler execution completed.")
    return True

# Active scheduler instance for Flask integration
scheduler = None

def start_scheduler():
    """Starts the background scheduler, running once every day at 06:00 AM."""
    global scheduler
    if scheduler is not None and scheduler.running:
        print("Scheduler is already running.")
        return scheduler
        
    scheduler = BackgroundScheduler()
    # Schedule daily run at 06:00 AM local time
    scheduler.add_job(
        run_daily_pipeline,
        'cron',
        hour=6,
        minute=0,
        id='daily_market_pipeline',
        replace_existing=True
    )
    scheduler.start()
    print("Background scheduler started. Job scheduled daily at 06:00 AM.")
    return scheduler

def shutdown_scheduler():
    global scheduler
    if scheduler and scheduler.running:
        scheduler.shutdown()
        print("Scheduler shut down.")

if __name__ == '__main__':
    # Standalone execution: run once immediately, then start a blocking scheduler loop
    print("Starting scheduler standalone...")
    # Initialize DB and bootstrap today's data immediately so we have data
    run_daily_pipeline()
    
    # Start blocking scheduler
    from apscheduler.schedulers.blocking import BlockingScheduler
    block_sched = BlockingScheduler()
    block_sched.add_job(
        run_daily_pipeline,
        'cron',
        hour=6,
        minute=0
    )
    try:
        print("Running blocking scheduler (Press Ctrl+C to exit)...")
        block_sched.start()
    except (KeyboardInterrupt, SystemExit):
        print("Scheduler stopped.")
