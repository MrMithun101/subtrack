from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # points to backend/
ENV_PATH = BASE_DIR / ".env"

load_dotenv(ENV_PATH)


def get_database_url() -> str:
    """
    Get database URL from environment variable.
    Normalizes Railway-style URLs to use postgresql+psycopg2 driver.
    Falls back to SQLite for local development if DATABASE_URL is not set.
    """
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Default to SQLite if not set (local development)
        db_url = "sqlite:///./subtrack.db"
    else:
        # Normalize Postgres URLs for SQLAlchemy
        # Railway uses postgres:// but SQLAlchemy needs postgresql:// or postgresql+psycopg2://
        if db_url.startswith("postgres://"):
            # Convert to postgresql+psycopg2:// for explicit driver support
            db_url = db_url.replace("postgres://", "postgresql+psycopg2://", 1)
        elif db_url.startswith("postgresql://") and "+" not in db_url:
            # If already postgresql:// but no driver specified, add psycopg2
            db_url = db_url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return db_url

