from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

from .settings import settings

# For psycopg 3, the driver name is 'psycopg'
engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db() -> Generator:
	db = SessionLocal()
	try:
		yield db
	except Exception:
		db.rollback()
		raise
	finally:
		db.close()


