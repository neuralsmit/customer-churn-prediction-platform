import time
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, declarative_base
from app.core.config import settings

# Configure database engine based on dialect (Postgres vs SQLite)
is_sqlite = settings.DATABASE_URL.startswith("sqlite")

if is_sqlite:
    engine = create_engine(settings.DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(settings.DATABASE_URL)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def wait_for_db():
    if is_sqlite:
        print("Using local SQLite database file.")
        return True
        
    print("Checking database connection...")
    retries = 10
    while retries > 0:
        try:
            # Try to connect and execute a simple query
            with engine.connect() as connection:
                connection.execute(text("SELECT 1"))
            print("Database is ready!")
            return True
        except Exception as e:
            print(f"Database not ready yet ({e}). Waiting 3 seconds... ({retries} retries left)")
            time.sleep(3)
            retries -= 1
            
    print("Could not connect to database. Exiting.")
    return False
