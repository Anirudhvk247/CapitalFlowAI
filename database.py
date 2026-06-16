import os
import psycopg2
import psycopg2.extras
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def get_connection():
    """Returns a connection to the PostgreSQL database."""
    db_url = os.getenv('DATABASE_URL')
    if not db_url:
        raise ValueError("DATABASE_URL environment variable is not set.")
    try:
        conn = psycopg2.connect(db_url)
        # Use DictCursor by default so rows act like dictionaries
        conn.cursor_factory = psycopg2.extras.DictCursor
        return conn
    except Exception as e:
        print(f"Error connecting to PostgreSQL database: {e}")
        raise e

def init_db():
    """Initializes the database and creates tables if they do not exist."""
    try:
        conn = get_connection()
        cursor = conn.cursor()
        
        # Table 1: market_data
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS market_data (
                id SERIAL PRIMARY KEY,
                date VARCHAR(20) NOT NULL,
                index_name VARCHAR(100) NOT NULL,
                price DOUBLE PRECISION NOT NULL,
                percent_change DOUBLE PRECISION NOT NULL,
                status VARCHAR(20) NOT NULL,
                CONSTRAINT unique_date_index UNIQUE(date, index_name)
            )
        ''')
        
        # Table 2: daily_reports
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS daily_reports (
                id SERIAL PRIMARY KEY,
                date VARCHAR(20) NOT NULL UNIQUE,
                report TEXT NOT NULL
            )
        ''')
        
        # Table 3: monthly_reports
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS monthly_reports (
                id SERIAL PRIMARY KEY,
                month INTEGER NOT NULL,
                year INTEGER NOT NULL,
                report TEXT NOT NULL,
                CONSTRAINT unique_month_year UNIQUE(month, year)
            )
        ''')
        
        # Table 4: fii_dii_flow
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS fii_dii_flow (
                id SERIAL PRIMARY KEY,
                date VARCHAR(20) NOT NULL UNIQUE,
                fii_netflow DOUBLE PRECISION NOT NULL,
                dii_netflow DOUBLE PRECISION NOT NULL,
                total_netflow DOUBLE PRECISION NOT NULL
            )
        ''')
        
        # Create indexes for performance
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_market_data_date ON market_data(date)')
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_fii_dii_flow_date ON fii_dii_flow(date)')
        
        conn.commit()
        conn.close()
        print("PostgreSQL database initialized successfully.")
    except Exception as e:
        print(f"Failed to initialize PostgreSQL database: {e}")
        raise e

# Insert operations
def insert_market_data(date, index_name, price, percent_change, status):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO market_data (date, index_name, price, percent_change, status)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (date, index_name) DO UPDATE SET
                price = EXCLUDED.price,
                percent_change = EXCLUDED.percent_change,
                status = EXCLUDED.status
        ''', (date, index_name, price, percent_change, status))
        conn.commit()
    finally:
        conn.close()

def insert_fii_dii_flow(date, fii_netflow, dii_netflow, total_netflow):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO fii_dii_flow (date, fii_netflow, dii_netflow, total_netflow)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (date) DO UPDATE SET
                fii_netflow = EXCLUDED.fii_netflow,
                dii_netflow = EXCLUDED.dii_netflow,
                total_netflow = EXCLUDED.total_netflow
        ''', (date, fii_netflow, dii_netflow, total_netflow))
        conn.commit()
    finally:
        conn.close()

def insert_daily_report(date, report):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO daily_reports (date, report)
            VALUES (%s, %s)
            ON CONFLICT (date) DO UPDATE SET
                report = EXCLUDED.report
        ''', (date, report))
        conn.commit()
    finally:
        conn.close()

def insert_monthly_report(month, year, report):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO monthly_reports (month, year, report)
            VALUES (%s, %s, %s)
            ON CONFLICT (month, year) DO UPDATE SET
                report = EXCLUDED.report
        ''', (month, year, report))
        conn.commit()
    finally:
        conn.close()

# Read operations
def get_market_data_by_date(date):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM market_data WHERE date = %s', (date,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def get_fii_dii_flow_by_date(date):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM fii_dii_flow WHERE date = %s', (date,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_daily_report_by_date(date):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM daily_reports WHERE date = %s', (date,))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_monthly_report_by_month_year(month, year):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT * FROM monthly_reports WHERE month = %s AND year = %s', (month, year))
        row = cursor.fetchone()
        return dict(row) if row else None
    finally:
        conn.close()

def get_market_data_for_month(month, year):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        prefix = f"{year:04d}-{month:02d}-%"
        cursor.execute('SELECT * FROM market_data WHERE date LIKE %s ORDER BY date ASC, index_name ASC', (prefix,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def get_fii_dii_flow_for_month(month, year):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        prefix = f"{year:04d}-{month:02d}-%"
        cursor.execute('SELECT * FROM fii_dii_flow WHERE date LIKE %s ORDER BY date ASC', (prefix,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def get_daily_reports_for_month(month, year):
    conn = get_connection()
    try:
        cursor = conn.cursor()
        prefix = f"{year:04d}-{month:02d}-%"
        cursor.execute('SELECT * FROM daily_reports WHERE date LIKE %s ORDER BY date ASC', (prefix,))
        rows = cursor.fetchall()
        return [dict(row) for row in rows]
    finally:
        conn.close()

def get_all_dates_with_data():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT DISTINCT date FROM market_data ORDER BY date DESC')
        rows = cursor.fetchall()
        return [row['date'] for row in rows]
    finally:
        conn.close()

def get_all_months_with_reports():
    conn = get_connection()
    try:
        cursor = conn.cursor()
        cursor.execute('SELECT DISTINCT month, year FROM monthly_reports ORDER BY year DESC, month DESC')
        rows = cursor.fetchall()
        return [{'month': row['month'], 'year': row['year']} for row in rows]
    finally:
        conn.close()
