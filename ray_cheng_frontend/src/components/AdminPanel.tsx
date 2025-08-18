import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../config';

interface User {
  id: number;
  username: string;
  email: string | null;
  record: number;
  role: string;
  created_at: string;
}

interface AdminStats {
  total_users: number;
  admin_users: number;
  regular_users: number;
  top_scorer: {
    username: string | null;
    record: number;
  };
}

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchUsers(), fetchStats()]);
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/users`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const userData = await response.json();
        setUsers(userData);
      } else if (response.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to fetch users');
      }
    } catch (err) {
      setError('Error fetching users');
      console.error(err);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const statsData = await response.json();
        setStats(statsData);
      }
    } catch (err) {
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: number, username: string) => {
    if (!window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      const response = await fetch(`${API_BASE_URL}/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        // Remove user from local state
        setUsers(users.filter(user => user.id !== userId));
        // Refresh stats
        await fetchStats();
        alert(`User "${username}" deleted successfully`);
      } else {
        const errorData = await response.json();
        alert(`Failed to delete user: ${errorData.detail}`);
      }
    } catch (err) {
      alert('Error deleting user');
      console.error(err);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button onClick={onBack} style={backButtonStyle}>← Back to Dashboard</button>
          <h1>Admin Panel</h1>
        </div>
        <div style={loadingStyle}>Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={containerStyle}>
        <div style={headerStyle}>
          <button onClick={onBack} style={backButtonStyle}>← Back to Dashboard</button>
          <h1>Admin Panel</h1>
        </div>
        <div style={errorStyle}>{error}</div>
      </div>
    );
  }

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <button onClick={onBack} style={backButtonStyle}>← Back to Dashboard</button>
        <h1>🛠️ Admin Panel</h1>
      </div>

      {/* Stats Section */}
      {stats && (
        <div style={statsContainerStyle}>
          <h2>📊 Statistics</h2>
          <div style={statsGridStyle}>
            <div style={statCardStyle}>
              <h3>Total Users</h3>
              <p style={statNumberStyle}>{stats.total_users}</p>
            </div>
            <div style={statCardStyle}>
              <h3>Admin Users</h3>
              <p style={statNumberStyle}>{stats.admin_users}</p>
            </div>
            <div style={statCardStyle}>
              <h3>Regular Users</h3>
              <p style={statNumberStyle}>{stats.regular_users}</p>
            </div>
            <div style={statCardStyle}>
              <h3>Top Scorer</h3>
              <p style={statNumberStyle}>
                {stats.top_scorer.username || 'None'}<br/>
                <small>{stats.top_scorer.record.toFixed(2)}</small>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Users Section */}
      <div style={usersContainerStyle}>
        <h2>👥 User Management ({users.length} users)</h2>
        
        {users.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div style={tableContainerStyle}>
            <table style={tableStyle}>
              <thead>
                <tr style={tableHeaderStyle}>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>Username</th>
                  <th style={thStyle}>Email</th>
                  <th style={thStyle}>Role</th>
                  <th style={thStyle}>Record</th>
                  <th style={thStyle}>Created</th>
                  <th style={thStyle}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={tableRowStyle}>
                    <td style={tdStyle}>{user.id}</td>
                    <td style={tdStyle}>
                      <strong>{user.username}</strong>
                    </td>
                    <td style={tdStyle}>{user.email || 'N/A'}</td>
                    <td style={tdStyle}>
                      <span style={{
                        ...roleTagStyle,
                        backgroundColor: user.role === 'admin' ? '#ff6b6b' : '#4ecdc4'
                      }}>
                        {user.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={tdStyle}>{user.record.toFixed(2)}</td>
                    <td style={tdStyle}>{formatDate(user.created_at)}</td>
                    <td style={tdStyle}>
                      <button
                        onClick={() => deleteUser(user.id, user.username)}
                        style={deleteButtonStyle}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#c0392b'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#e74c3c'}
                      >
                        🗑️ Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// Styles
const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: '20px',
  fontFamily: 'Arial, sans-serif'
};

const headerStyle: React.CSSProperties = {
  borderBottom: '2px solid #eee',
  paddingBottom: '20px',
  marginBottom: '30px',
  position: 'relative'
};

const backButtonStyle: React.CSSProperties = {
  position: 'absolute',
  left: '0',
  top: '0',
  padding: '10px 20px',
  backgroundColor: '#6c757d',
  color: 'white',
  border: 'none',
  borderRadius: '5px',
  cursor: 'pointer',
  fontSize: '14px'
};

const loadingStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '50px',
  fontSize: '18px',
  color: '#666'
};

const errorStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '50px',
  fontSize: '18px',
  color: '#e74c3c',
  backgroundColor: '#fdf2f2',
  borderRadius: '8px',
  border: '1px solid #e74c3c'
};

const statsContainerStyle: React.CSSProperties = {
  marginBottom: '40px'
};

const statsGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
  gap: '20px'
};

const statCardStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa',
  padding: '20px',
  borderRadius: '8px',
  textAlign: 'center',
  border: '1px solid #dee2e6'
};

const statNumberStyle: React.CSSProperties = {
  fontSize: '24px',
  fontWeight: 'bold',
  color: '#2c3e50',
  margin: '10px 0'
};

const usersContainerStyle: React.CSSProperties = {
  backgroundColor: 'white',
  borderRadius: '8px',
  padding: '20px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
};

const tableContainerStyle: React.CSSProperties = {
  overflowX: 'auto'
};

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginTop: '20px'
};

const tableHeaderStyle: React.CSSProperties = {
  backgroundColor: '#f8f9fa'
};

const thStyle: React.CSSProperties = {
  padding: '12px',
  textAlign: 'left',
  borderBottom: '2px solid #dee2e6',
  fontWeight: 'bold'
};

const tableRowStyle: React.CSSProperties = {
  borderBottom: '1px solid #dee2e6'
};

const tdStyle: React.CSSProperties = {
  padding: '12px',
  verticalAlign: 'middle'
};

const roleTagStyle: React.CSSProperties = {
  padding: '4px 8px',
  borderRadius: '4px',
  color: 'white',
  fontSize: '12px',
  fontWeight: 'bold'
};

const deleteButtonStyle: React.CSSProperties = {
  padding: '6px 12px',
  backgroundColor: '#e74c3c',
  color: 'white',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  fontSize: '12px',
  transition: 'background-color 0.2s'
};

export default AdminPanel;
