from sqlalchemy import Column, Integer, String, DateTime, func

from .database import Base


class User(Base):
	__tablename__ = "users"

	id = Column(Integer, primary_key=True, index=True)
	username = Column(String(150), nullable=False, unique=True, index=True)
	email = Column(String(255), nullable=True, unique=True, index=True)
	password_hash = Column(String(255), nullable=False)
	created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)


