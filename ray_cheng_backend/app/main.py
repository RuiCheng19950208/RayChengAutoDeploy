from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import text

from .routers import auth, leaderboard, admin
from .database import Base, engine, SessionLocal
from .models import User


def migrate_existing_users():
	"""Migrate existing users to add record and role fields with default values"""
	db = SessionLocal()
	try:
		# Check if the columns exist and their data types
		result = db.execute(text("""
			SELECT column_name, data_type 
			FROM information_schema.columns 
			WHERE table_name = 'users' AND column_name IN ('record', 'role')
		"""))
		existing_columns = {row[0]: row[1] for row in result.fetchall()}
		
		# Handle record column
		if 'record' not in existing_columns:
			# Column doesn't exist, create as FLOAT
			print("Creating new record column as FLOAT")
			db.execute(text("ALTER TABLE users ADD COLUMN record FLOAT DEFAULT 0.0"))
			db.execute(text("UPDATE users SET record = 0.0 WHERE record IS NULL"))
			db.execute(text("ALTER TABLE users ALTER COLUMN record SET NOT NULL"))
		else:
			# Column exists, check if it's INTEGER and convert to FLOAT
			record_type = existing_columns['record'].lower()
			if record_type in ['integer', 'int', 'int4']:
				print(f"Converting existing record column from {record_type} to FLOAT")
				# PostgreSQL: Convert INTEGER to FLOAT (DOUBLE PRECISION)
				db.execute(text("ALTER TABLE users ALTER COLUMN record TYPE FLOAT USING record::FLOAT"))
				# Ensure default value is set
				db.execute(text("ALTER TABLE users ALTER COLUMN record SET DEFAULT 0.0"))
			elif record_type in ['real', 'float', 'double precision', 'numeric']:
				print(f"Record column already numeric type: {record_type}")
			else:
				print(f"Warning: Unexpected record column type: {record_type}")
		
		# Handle role column
		if 'role' not in existing_columns:
			print("Creating new role column")
			db.execute(text("ALTER TABLE users ADD COLUMN role VARCHAR(50) DEFAULT 'user'"))
			db.execute(text("UPDATE users SET role = 'user' WHERE role IS NULL"))
			db.execute(text("ALTER TABLE users ALTER COLUMN role SET NOT NULL"))
		else:
			print("Role column already exists")
		
		# Set Ray Cheng as admin
		db.execute(text("UPDATE users SET role = 'admin' WHERE username = 'Ray Cheng'"))
		
		db.commit()
		print("Database migration completed successfully")
	except Exception as e:
		db.rollback()
		print(f"Migration error: {e}")
		raise e  # Re-raise to see the full error
	finally:
		db.close()


def create_app() -> FastAPI:
	app = FastAPI(title="RayCheng API", version="0.1.0")

	# CORS: allow all during development; restrict in production via env
	origins = ["*"]
	app.add_middleware(
		CORSMiddleware,
		allow_origins=origins,
		allow_credentials=True,
		allow_methods=["*"],
		allow_headers=["*"],
	)

	# Create DB tables if they don't exist (simple bootstrap; replace with Alembic in prod)
	Base.metadata.create_all(bind=engine)
	
	# Migrate existing users to add new fields
	migrate_existing_users()

	# Routers
	app.include_router(auth.router, prefix="/api", tags=["auth"])
	app.include_router(leaderboard.router, prefix="/api", tags=["leaderboard"])
	app.include_router(admin.router, prefix="/api/admin", tags=["admin"])

	@app.get("/health")
	def healthcheck():
		return {"status": "ok"}

	return app


app = create_app()


