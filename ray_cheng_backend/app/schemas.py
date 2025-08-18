from datetime import datetime
from typing import Optional, Annotated

from pydantic import BaseModel, EmailStr, Field, StringConstraints


class UserBase(BaseModel):
	username: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)]
	email: Optional[EmailStr] = None
	record: float = 0.0
	role: str = "user"


class UserCreate(UserBase):
	password: Annotated[str, StringConstraints(min_length=6, max_length=128)]
	password_confirm: Annotated[str, StringConstraints(min_length=6, max_length=128)] = Field(alias="passwordConfirm")

	class Config:
		populate_by_name = True


class UserLogin(BaseModel):
	username: Annotated[str, StringConstraints(strip_whitespace=True, min_length=3, max_length=150)]
	password: Annotated[str, StringConstraints(min_length=6, max_length=128)]


class UserOut(UserBase):
	id: int
	created_at: datetime

	class Config:
		from_attributes = True


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"


class LeaderboardEntry(BaseModel):
	username: str
	record: float
	rank: int

	class Config:
		from_attributes = True


class ScoreUpdate(BaseModel):
	score: float


