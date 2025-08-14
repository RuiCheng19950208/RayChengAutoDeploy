Backend (FastAPI + PostgreSQL)

Quickstart (Windows PowerShell)

1) Set environment variables

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"
$env:JWT_SECRET_KEY = "change-me"
$env:JWT_EXPIRE_MINUTES = "120"
```

2) Create venv, install, run

```powershell
cd backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API
- POST /api/register → body: { username, email?, password, passwordConfirm }
- POST /api/login → body: { username, password } → returns { access_token, token_type }

Notes
- Tables auto-create on startup; prefer Alembic for production.
- CORS is open for development.

