from datetime import datetime, timedelta, timezone
from typing import Optional

from jose import jwt
from passlib.context import CryptContext
from .settings import settings


JWT_SECRET_KEY = settings.JWT_SECRET_KEY
JWT_ALGORITHM = "HS256"
JWT_EXPIRE_MINUTES = settings.JWT_EXPIRE_MINUTES

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
	return pwd_context.hash(plain_password)


def verify_password(plain_password: str, password_hash: str) -> bool:
	return pwd_context.verify(plain_password, password_hash)


def create_access_token(subject: str, expires_delta: Optional[timedelta] = None) -> str:
	if expires_delta is None:
		expires_delta = timedelta(minutes=JWT_EXPIRE_MINUTES)
	expire_at = datetime.now(timezone.utc) + expires_delta
	to_encode = {"sub": subject, "exp": expire_at}
	return jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


