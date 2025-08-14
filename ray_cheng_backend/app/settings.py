from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
	# Use uppercase names to match common .env conventions
	DATABASE_URL: str = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"
	JWT_SECRET_KEY: str = "dev-secret-change-me"
	JWT_EXPIRE_MINUTES: int = 60

	model_config = SettingsConfigDict(
		env_file=".env",
		env_file_encoding="utf-8",
		case_sensitive=False,
	)


settings = Settings()


