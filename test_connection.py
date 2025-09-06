# test_connection.py
import os
from dotenv import load_dotenv
from sqlalchemy import create_engine, text

load_dotenv()

database_url = os.getenv('DATABASE_URL')
if not database_url:
    raise ValueError("DATABASE_URL environment variable is not set")
engine = create_engine(database_url)
try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 'Connection successful'"))
        print("✅ " + str(result.scalar()))
except Exception as e:
    print(f"❌ Connection failed: {e}")