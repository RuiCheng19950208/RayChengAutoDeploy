from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from .. import schemas
from ..database import get_db
from ..models import User
from ..security import hash_password, verify_password, create_access_token


router = APIRouter()


@router.post("/register", response_model=schemas.UserOut, status_code=status.HTTP_201_CREATED)
def register_user(payload: schemas.UserCreate, db: Session = Depends(get_db)):
	if payload.password != payload.password_confirm:
		raise HTTPException(status_code=400, detail="Passwords do not match")

	# Uniqueness checks
	existing = db.query(User).filter(User.username == payload.username).first()
	if existing:
		raise HTTPException(status_code=409, detail="Username already exists")

	if payload.email:
		existing_email = db.query(User).filter(User.email == payload.email).first()
		if existing_email:
			raise HTTPException(status_code=409, detail="Email already exists")

	user = User(
		username=payload.username,
		email=payload.email,
		password_hash=hash_password(payload.password),
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user


@router.post("/login", response_model=schemas.Token)
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
	user: User | None = db.query(User).filter(User.username == payload.username).first()
	if not user or not verify_password(payload.password, user.password_hash):
		raise HTTPException(status_code=401, detail="Invalid username or password")

	token = create_access_token(subject=str(user.id))
	return {"access_token": token, "token_type": "bearer"}


