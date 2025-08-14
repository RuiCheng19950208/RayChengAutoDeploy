from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .routers import auth
from .database import Base, engine


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

	# Routers
	app.include_router(auth.router, prefix="/api", tags=["auth"])

	@app.get("/health")
	def healthcheck():
		return {"status": "ok"}

	return app


app = create_app()


