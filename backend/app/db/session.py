from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from app.db.config import get_database_url

DATABASE_URL = get_database_url()

# SQLite-specific connect_args (only for SQLite, not for Postgres)
connect_args = {}
if DATABASE_URL.startswith("sqlite:///"):
    connect_args = {"check_same_thread": False}

engine = create_engine(
    DATABASE_URL,
    connect_args=connect_args,
    # For Postgres, use connection pooling
    pool_pre_ping=True if not DATABASE_URL.startswith("sqlite:///") else False,
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

