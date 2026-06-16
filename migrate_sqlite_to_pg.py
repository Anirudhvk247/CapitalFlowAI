import os
import sqlite3
import psycopg2
from dotenv import load_dotenv

# Load env variables from .env file
load_dotenv()

SQLITE_DB_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database', 'capitalflow.db')
DATABASE_URL = os.getenv('DATABASE_URL')

def migrate_data():
    print("=== STARTING SQLITE TO POSTGRESQL DATA MIGRATION ===")
    
    if not os.path.exists(SQLITE_DB_PATH):
        print(f"Source SQLite database not found at {SQLITE_DB_PATH}")
        return False
        
    if not DATABASE_URL:
        print("DATABASE_URL environment variable is not set. Migration aborted.")
        return False
        
    # Import database module to initialize the schema
    import database
    try:
        print("Initializing PostgreSQL database schema...")
        database.init_db()
    except Exception as e:
        print(f"Failed to initialize PostgreSQL schema: {e}")
        return False

    # Connect to databases
    try:
        sqlite_conn = sqlite3.connect(SQLITE_DB_PATH)
        sqlite_conn.row_factory = sqlite3.Row
        sqlite_cursor = sqlite_conn.cursor()
        print("Connected to source SQLite database.")
    except Exception as e:
        print(f"Failed to connect to SQLite: {e}")
        return False
        
    try:
        pg_conn = psycopg2.connect(DATABASE_URL)
        pg_cursor = pg_conn.cursor()
        print("Connected to target PostgreSQL database.")
    except Exception as e:
        print(f"Failed to connect to PostgreSQL: {e}")
        sqlite_conn.close()
        return False

    try:
        # 1. Migrate market_data
        print("\nMigrating market_data...")
        sqlite_cursor.execute("SELECT date, index_name, price, percent_change, status FROM market_data")
        rows = sqlite_cursor.fetchall()
        migrated_count = 0
        for row in rows:
            pg_cursor.execute('''
                INSERT INTO market_data (date, index_name, price, percent_change, status)
                VALUES (%s, %s, %s, %s, %s)
                ON CONFLICT (date, index_name) DO UPDATE SET
                    price = EXCLUDED.price,
                    percent_change = EXCLUDED.percent_change,
                    status = EXCLUDED.status
            ''', (row['date'], row['index_name'], row['price'], row['percent_change'], row['status']))
            migrated_count += 1
        print(f"Successfully migrated {migrated_count} records to market_data table.")

        # 2. Migrate daily_reports
        print("\nMigrating daily_reports...")
        sqlite_cursor.execute("SELECT date, report FROM daily_reports")
        rows = sqlite_cursor.fetchall()
        migrated_count = 0
        for row in rows:
            pg_cursor.execute('''
                INSERT INTO daily_reports (date, report)
                VALUES (%s, %s)
                ON CONFLICT (date) DO UPDATE SET
                    report = EXCLUDED.report
            ''', (row['date'], row['report']))
            migrated_count += 1
        print(f"Successfully migrated {migrated_count} records to daily_reports table.")

        # 3. Migrate monthly_reports
        print("\nMigrating monthly_reports...")
        sqlite_cursor.execute("SELECT month, year, report FROM monthly_reports")
        rows = sqlite_cursor.fetchall()
        migrated_count = 0
        for row in rows:
            pg_cursor.execute('''
                INSERT INTO monthly_reports (month, year, report)
                VALUES (%s, %s, %s)
                ON CONFLICT (month, year) DO UPDATE SET
                    report = EXCLUDED.report
            ''', (row['month'], row['year'], row['report']))
            migrated_count += 1
        print(f"Successfully migrated {migrated_count} records to monthly_reports table.")

        # 4. Migrate fii_dii_flow
        print("\nMigrating fii_dii_flow...")
        sqlite_cursor.execute("SELECT date, fii_netflow, dii_netflow, total_netflow FROM fii_dii_flow")
        rows = sqlite_cursor.fetchall()
        migrated_count = 0
        for row in rows:
            pg_cursor.execute('''
                INSERT INTO fii_dii_flow (date, fii_netflow, dii_netflow, total_netflow)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (date) DO UPDATE SET
                    fii_netflow = EXCLUDED.fii_netflow,
                    dii_netflow = EXCLUDED.dii_netflow,
                    total_netflow = EXCLUDED.total_netflow
            ''', (row['date'], row['fii_netflow'], row['dii_netflow'], row['total_netflow']))
            migrated_count += 1
        print(f"Successfully migrated {migrated_count} records to fii_dii_flow table.")

        pg_conn.commit()
        print("\n=== MIGRATION COMPLETED SUCCESSFULLY ===")
        return True
        
    except Exception as e:
        pg_conn.rollback()
        print(f"\nMigration failed with error: {e}")
        return False
        
    finally:
        sqlite_conn.close()
        pg_conn.close()
        print("Database connections closed.")

if __name__ == '__main__':
    migrate_data()
