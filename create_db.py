import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

DB_CONFIG = {
    "host": "217.216.80.226",
    "user": "apis",
    "password": "q6IomrPZGhzIH8zZ395V2C",
    "port": "5432"
}

def create_database():
    try:
        # Connect to default postgres database to create new one
        conn = psycopg2.connect(**DB_CONFIG, dbname="postgres")
        conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)
        cursor = conn.cursor()
        
        # Check if DB exists
        cursor.execute("SELECT 1 FROM pg_catalog.pg_database WHERE datname = 'gps_new'")
        exists = cursor.fetchone()
        
        if not exists:
            print("Creating database gps_new...")
            cursor.execute('CREATE DATABASE gps_new')
            print("Database 'gps_new' created successfully!")
        else:
            print("Database 'gps_new' already exists.")
            
        cursor.close()
        conn.close()

    except Exception as e:
        print(f"Error creating database: {e}")

if __name__ == "__main__":
    create_database()
