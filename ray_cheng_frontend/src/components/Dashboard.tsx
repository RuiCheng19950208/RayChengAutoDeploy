import React from 'react';
import UnityGame from './UnityGame';
import Leaderboard from './Leaderboard';

interface DashboardProps {
  username: string;
  userRole: string;
  onLogout: () => void;
  onShowAdmin: () => void;
}

const Dashboard: React.FC<DashboardProps> = ({ username, userRole, onLogout, onShowAdmin }) => {
  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <h1>Ray Cheng Game Dashboard</h1>
        <div className="user-info">
          <span>Welcome, {username}! ({userRole})</span>
          <div className="button-group">
            {userRole === 'admin' && (
              <button onClick={onShowAdmin} className="admin-button">
                🛠️ Admin Panel
              </button>
            )}
            <button onClick={onLogout} className="logout-button">
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="dashboard-content">
        <div className="leaderboard-section">
          <Leaderboard />
        </div>
        
        <div className="game-section">
          <h2>🎮 Super Hexagon Game</h2>
          <p>Enjoy Ray Cheng's amazing Super Hexagon game! Click to play and challenge yourself.</p>
          
          <div className="game-container" style={{ margin: '20px 0' }}>
            <UnityGame />
          </div>
          
          <div className="game-instructions">
            <h3>How to Play:</h3>
            
            {/* Desktop Controls */}
            <div style={{ marginBottom: '20px' }}>
              <h4>🖥️ Desktop Controls:</h4>
              <ul>
                <li>Use <strong>Left Arrow</strong> or <strong>A</strong> to rotate counter-clockwise</li>
                <li>Use <strong>Right Arrow</strong> or <strong>D</strong> to rotate clockwise</li>
                <li>Avoid the incoming walls and survive as long as possible!</li>
                <li>Try to beat your high score!</li>
              </ul>
            </div>

            {/* Touch Screen Controls */}
            <div style={{ 
              background: '#f8f9fa', 
              padding: '15px', 
              borderRadius: '8px', 
              border: '1px solid #dee2e6',
              marginBottom: '20px'
            }}>
              <h4>📱 Touch Screen Controls:</h4>
              <ul style={{ margin: '10px 0' }}>
                <li><strong>Player 1:</strong> Swipe/touch the <span style={{color: '#007bff', fontWeight: 'bold'}}>lower half</span> of the screen</li>
                <li><strong>Player 2:</strong> Swipe/touch the <span style={{color: '#dc3545', fontWeight: 'bold'}}>upper half</span> of the screen</li>
                <li>Swipe <strong>left</strong> to rotate counter-clockwise</li>
                <li>Swipe <strong>right</strong> to rotate clockwise</li>
                <li>For best experience, use landscape mode with fullscreen</li>
              </ul>
              
              {/* Visual guide */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                marginTop: '15px'
              }}>
                <div style={{
                  width: '200px',
                  height: '120px',
                  border: '2px solid #333',
                  borderRadius: '8px',
                  position: 'relative',
                  background: 'linear-gradient(to bottom, #ffebee 0%, #ffebee 50%, #e3f2fd 50%, #e3f2fd 100%)'
                }}>
                  <div style={{
                    position: 'absolute',
                    top: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#dc3545'
                  }}>
                    Player 2 Area
                  </div>
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '0',
                    right: '0',
                    height: '1px',
                    background: '#333',
                    opacity: 0.5
                  }}></div>
                  <div style={{
                    position: 'absolute',
                    bottom: '20%',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    color: '#007bff'
                  }}>
                    Player 1 Area
                  </div>
                </div>
              </div>
            </div>

            {/* General Tips */}
            <div>
              <h4>💡 Tips:</h4>
              <ul>
                <li>Click the fullscreen button (⛶) for immersive gameplay</li>
                <li>Mobile users: Rotate to landscape for better controls</li>
                <li>Both keyboard and touch controls can be used simultaneously</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="features-section">
          <h3>🎯 Features</h3>
          <ul>
            <li>Full Unity WebGL integration</li>
            <li>Responsive game display</li>
            <li>Automatic game loading</li>
            <li>User authentication system</li>
            <li>Real-time leaderboard</li>
          </ul>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
