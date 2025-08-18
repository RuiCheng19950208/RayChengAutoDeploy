# Ray Cheng Super Hexagon - Backend API

FastAPI backend server with PostgreSQL database for the Super Hexagon game platform.

## 🚀 Quick Start

### Environment Setup (Windows PowerShell)

```powershell
$env:DATABASE_URL = "postgresql+psycopg://postgres:postgres@localhost:5432/postgres"
$env:JWT_SECRET_KEY = "your-secret-key-here"
$env:JWT_EXPIRE_MINUTES = "120"
```

### Installation & Run

```powershell
cd ray_cheng_backend
python -m venv .venv
. .venv/Scripts/Activate.ps1
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

## 📡 API Endpoints

### Authentication
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/me` - Get current user info

### Game Features
- `GET /api/leaderboard` - Get score rankings
- `POST /api/submit-score` - Submit game score

### Admin (Admin only)
- `GET /api/admin/users` - List all users
- `DELETE /api/admin/users/{id}` - Delete user
- `GET /api/admin/stats` - Get platform statistics

## 🗄️ Database

- Automatic table creation on startup
- User migration for existing databases
- Role-based access control (admin/user)
- Float precision score tracking

## 🛠️ Features

- JWT-based authentication
- Role-based authorization
- Automatic database migrations
- Score submission with validation
- Admin panel functionality
- CORS configuration for development

## 📖 Documentation

Interactive API docs available at: `http://localhost:8000/docs`

