from pathlib import Path
from dotenv import load_dotenv
import os

BASE_DIR = Path(__file__).resolve().parent.parent.parent  # points to backend/
ENV_PATH = BASE_DIR / ".env"

load_dotenv(ENV_PATH)


def get_database_url() -> str:
    db_url = os.getenv("DATABASE_URL")
    if not db_url:
        # Default to SQLite if not set
        db_url = "sqlite:///./subtrack.db"
    return db_url

