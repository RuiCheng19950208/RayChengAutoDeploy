import React from 'react';
import UnityGame from './UnityGame';

interface DashboardProps {
  username: string;
  onLogout: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ username, onLogout }) => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Ray Cheng Game Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {username}!</span>
          <button onClick={onLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="game-section">
          <h2>🎮 Super Hexagon Game</h2>
          <p>Enjoy Ray Cheng's amazing Super Hexagon game! Click to play and challenge yourself.</p>
          
          <div className="game-container" style={{ margin: '20px 0' }}>
            <UnityGame />
          </div>
          
          <div className="game-instructions">
            <h3>How to Play:</h3>
            <ul>
              <li>Use <strong>Left Arrow</strong> or <strong>A</strong> to rotate counter-clockwise</li>
              <li>Use <strong>Right Arrow</strong> or <strong>D</strong> to rotate clockwise</li>
              <li>Avoid the incoming walls and survive as long as possible!</li>
              <li>Try to beat your high score!</li>
            </ul>
          </div>
        </div>
        
        <div className="features-section">
          <h3>🎯 Features</h3>
          <ul>
            <li>Full Unity WebGL integration</li>
            <li>Responsive game display</li>
            <li>Automatic game loading</li>
            <li>User authentication system</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
