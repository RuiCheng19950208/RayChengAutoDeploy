# Ray Cheng Super Hexagon - Frontend

React + TypeScript web application for the Super Hexagon game platform with user management and leaderboards.

## 🎮 Features

- **Unity WebGL Game**: Embedded Super Hexagon game with touch controls
- **User Authentication**: Login/Register system with JWT tokens
- **Leaderboards**: Real-time score rankings and submission
- **Admin Panel**: User management interface for administrators
- **Responsive Design**: Mobile-friendly interface
- **Auto-login**: Seamless registration-to-login flow

## 🛠️ Tech Stack

- **React 18** - UI framework with hooks
- **TypeScript** - Type-safe JavaScript
- **Unity WebGL** - Game integration
- **CSS3** - Modern styling and animations
- **Fetch API** - Backend communication

## 📁 Project Structure

```
src/
├── components/
│   ├── Login.tsx           # Login form
│   ├── Register.tsx        # Registration form
│   ├── Dashboard.tsx       # Main user dashboard
│   ├── Leaderboard.tsx     # Score rankings
│   ├── AdminPanel.tsx      # Admin user management
│   ├── UnityGame.tsx       # Unity game wrapper
│   └── Login.css           # Component styling
├── App.tsx                 # Main application logic
├── config.ts               # API configuration
└── index.tsx               # Application entry point
```

## 🚀 Quick Start

### Install Dependencies
```bash
cd ray_cheng_frontend
npm install
```

### Start Development Server
```bash
npm start
```

Application runs at [http://localhost:3000](http://localhost:3000)

### Build for Production
```bash
npm run build
```

## 🎯 Key Components

### Dashboard
- Unity game integration
- User profile display
- Leaderboard access
- Admin panel button (admin users only)

### Unity Integration
- WebGL game embedding
- Score submission to backend
- Touch control support
- Automatic score tracking

### Admin Panel
- User list with management controls
- Platform statistics
- User deletion with confirmations
- Role-based access control

## 🔧 Configuration

### API Settings
The app automatically detects the backend URL:
- Development: `http://localhost:8000`
- Production: Same domain as frontend

### Unity Game
- Embedded WebGL build
- Automatic score submission
- No user authentication required in Unity
- Frontend handles all backend communication

## 📱 Responsive Design

- Desktop and mobile support
- Touch-friendly game controls
- Adaptive layout system
- Modern UI/UX patterns

## 🚀 Deployment

Ready for deployment on:
- Vercel
- Netlify  
- Render
- Any static hosting platform

Environment configuration handled automatically for different deployment platforms.
