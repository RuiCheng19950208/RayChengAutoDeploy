from datetime import datetime
from typing import Optional

from pydantic import BaseModel, EmailStr, Field, constr


UsernameStr = constr(strip_whitespace=True, min_length=3, max_length=150)
PasswordStr = constr(min_length=6, max_length=128)


class UserBase(BaseModel):
	username: UsernameStr
	email: Optional[EmailStr] = None


class UserCreate(UserBase):
	password: PasswordStr
	password_confirm: PasswordStr = Field(alias="passwordConfirm")

	class Config:
		populate_by_name = True


class UserLogin(BaseModel):
	username: UsernameStr
	password: PasswordStr


class UserOut(UserBase):
	id: int
	created_at: datetime

	class Config:
		from_attributes = True


class Token(BaseModel):
	access_token: str
	token_type: str = "bearer"


