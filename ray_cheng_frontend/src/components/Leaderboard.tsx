import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface LeaderboardEntry {
  username: string;
  record: number;
  rank: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/leaderboard`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setLeaderboard(data);
    } catch (err) {
      console.error('Failed to fetch leaderboard:', err);
      setError('Failed to load leaderboard. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getRankDisplay = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1:
        return {
          background: 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)',
          borderColor: '#f1c40f',
          color: '#8b5a2b'
        };
      case 2:
        return {
          background: 'linear-gradient(135deg, #c0c0c0 0%, #e8e8e8 100%)',
          borderColor: '#bdc3c7',
          color: '#5d6d7e'
        };
      case 3:
        return {
          background: 'linear-gradient(135deg, #cd7f32 0%, #deb887 100%)',
          borderColor: '#d68910',
          color: '#6c4e37'
        };
      default:
        return {
          background: '#fff',
          borderColor: '#e9ecef',
          color: '#333'
        };
    }
  };

  const containerStyle: React.CSSProperties = {
    maxWidth: '600px',
    margin: '20px auto',
    padding: '20px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
    border: '1px solid #e1e5e9'
  };

  const headerStyle: React.CSSProperties = {
    textAlign: 'center',
    marginBottom: '20px',
    color: '#2c3e50',
    fontSize: '1.8rem'
  };

  const loadingStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#666',
    fontSize: '1.1rem'
  };

  const errorStyle: React.CSSProperties = {
    textAlign: 'center',
    padding: '40px 20px',
    color: '#e74c3c',
    fontSize: '1.1rem'
  };

  const tableHeaderStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 100px',
    gap: '15px',
    padding: '12px 15px',
    alignItems: 'center',
    background: '#f8f9fa',
    borderRadius: '8px',
    fontWeight: 'bold',
    color: '#495057',
    marginBottom: '8px',
    border: '1px solid #dee2e6'
  };

  const tableRowStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: '80px 1fr 100px',
    gap: '15px',
    padding: '12px 15px',
    alignItems: 'center',
    borderRadius: '8px',
    marginBottom: '4px',
    transition: 'all 0.2s ease',
    border: '1px solid #e9ecef'
  };

  const retryButtonStyle: React.CSSProperties = {
    marginLeft: '10px',
    padding: '8px 16px',
    background: '#3498db',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '0.9rem'
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>🏆 Leaderboard</h2>
        <div style={loadingStyle}>Loading leaderboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <h2 style={headerStyle}>🏆 Leaderboard</h2>
        <div style={errorStyle}>
          {error}
          <button 
            onClick={fetchLeaderboard} 
            style={retryButtonStyle}
            onMouseEnter={(e) => e.currentTarget.style.background = '#2980b9'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#3498db'}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <h2 style={headerStyle}>🏆 Leaderboard</h2>
      
      {leaderboard.length === 0 ? (
        <div style={loadingStyle}>No players yet. Be the first to set a record!</div>
      ) : (
        <div style={{ width: '100%' }}>
          <div style={tableHeaderStyle}>
            <div style={{ textAlign: 'center' }}>Rank</div>
            <div style={{ textAlign: 'left' }}>Player</div>
            <div style={{ textAlign: 'right' }}>Record</div>
          </div>
          
          {leaderboard.map((entry, index) => {
            const rankStyle = getRankStyle(entry.rank);
            const rowStyle = { ...tableRowStyle, ...rankStyle };
            
            return (
              <div 
                key={index} 
                style={rowStyle}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                <div style={{ textAlign: 'center' }}>
                  <span style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                    {getRankDisplay(entry.rank)}
                  </span>
                </div>
                <div style={{ textAlign: 'left' }}>
                  <span style={{ fontWeight: 600, color: '#2c3e50' }}>
                    {entry.username}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: '#27ae60', 
                    fontFamily: 'Courier New, monospace' 
                  }}>
                    {entry.record.toLocaleString()}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div style={{
        textAlign: 'center',
        marginTop: '20px',
        paddingTop: '15px',
        borderTop: '1px solid #e9ecef'
      }}>
        <button 
          onClick={fetchLeaderboard}
          style={{
            padding: '10px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            transition: 'background 0.2s ease'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = '#218838'}
          onMouseLeave={(e) => e.currentTarget.style.background = '#28a745'}
        >
          🔄 Refresh
        </button>
      </div>
    </div>
  );
};

export default Leaderboard;