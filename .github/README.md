# Ray Cheng Super Hexagon Game Platform

A full-stack web application featuring Ray Cheng's Super Hexagon game with user authentication, leaderboards, and admin management.

## 🎮 Features

- **Unity WebGL Game**: Ray Cheng's custom Super Hexagon game with both single-player and two-player modes
- **User Authentication**: Secure registration and login system with JWT tokens
- **Real-time Leaderboards**: Dynamic ranking system with score submission and display
- **Admin Panel**: User management interface for administrators
- **Responsive Design**: Mobile-friendly interface with touch controls
- **Auto-deployment**: Ready for cloud deployment on platforms like Render

## 🏗️ Tech Stack

### Backend
- **FastAPI**: Modern Python web framework
- **PostgreSQL**: Robust database with user management and score tracking
- **SQLAlchemy**: ORM for database operations
- **JWT Authentication**: Secure token-based authentication
- **Pydantic**: Data validation and serialization

### Frontend
- **React**: Modern frontend framework with TypeScript
- **Unity WebGL**: Game integration with browser compatibility
- **CSS3**: Responsive design with modern styling
- **Local Storage**: Client-side token management

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- Node.js 16+
- PostgreSQL database

### Backend Setup
```bash
cd ray_cheng_backend
pip install -r requirements.txt
uvicorn app.main:app --reload
```

### Frontend Setup
```bash
cd ray_cheng_frontend
npm install
npm start
```

### Environment Variables
Create `.env` files for configuration:
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET_KEY`: Secret key for JWT tokens

## 🎯 Game Features

### Super Hexagon Game
- **Single Player Mode**: Classic hexagon survival gameplay
- **Two Player Mode**: Competitive split-screen experience
- **Touch Controls**: Mobile-optimized touch interface
- **Score Tracking**: Automatic score submission to leaderboards
- **Unity WebGL**: Seamless browser integration

### User System
- **Registration**: Simple account creation with validation
- **Auto-login**: Seamless experience after registration
- **Role Management**: Admin and user role distinction
- **Score History**: Personal best tracking

## 📊 Admin Features

- **User Management**: View and manage all registered users
- **Statistics Dashboard**: User counts and top scorer information
- **User Deletion**: Remove users with safety confirmations
- **Role-based Access**: Secure admin-only functionality

## 🔧 Deployment

The application is designed for easy deployment on cloud platforms:

### Render Deployment
1. Connect your GitHub repository
2. Set environment variables
3. Configure build and start commands
4. Deploy both frontend and backend

### Environment Configuration
- Automatic URL detection for different environments
- CORS configuration for cross-origin requests
- Database migration on startup

## 🎨 API Documentation

Access the interactive API documentation at `/docs` when running the backend server.

### Key Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User authentication
- `GET /api/leaderboard` - Score rankings
- `POST /api/submit-score` - Score submission
- `GET /api/admin/users` - User management (admin only)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is open source and available under the MIT License.

## 👨‍💻 Author

**Ray Cheng** - Game Developer and Full-Stack Engineer

---

*Built with ❤️ for the gaming community*
