import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import { API_BASE_URL } from './config';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');

  const [showRegister, setShowRegister] = useState(false);

  const handleLogin = async (username: string, password: string) => {
    const resp = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });
    if (!resp.ok) {
      const msg = await resp.json().catch(() => ({ detail: 'Login failed' }));
      alert(msg.detail || 'Login failed');
      return;
    }
    const data = await resp.json();
    localStorage.setItem('access_token', data.access_token);
    setUser(username);
    setIsLoggedIn(true);
  };

  const handleRegister = async (payload: { username: string; email?: string; password: string; passwordConfirm: string }) => {
    const resp = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!resp.ok) {
      const msg = await resp.json().catch(() => ({ detail: 'Registration failed' }));
      alert(msg.detail || 'Registration failed');
      return;
    }
    alert('Registration successful, please login');
    setShowRegister(false);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUser('');
  };

  if (isLoggedIn) {
    return (
      <div className="App">
        <div className="dashboard">
          <header className="dashboard-header">
            <h1>Task Management System</h1>
            <div className="user-info">
              <span>Welcome, {user}!</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </div>
          </header>
          <main className="dashboard-content">
            <h2>Dashboard</h2>
            <p>Login successful! This is the main interface of the Task Management System.</p>
            <p>Features under development...</p>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="App">
      {showRegister ? (
        <Register onRegister={handleRegister} onSwitchToLogin={() => setShowRegister(false)} />
      ) : (
        <Login onLogin={handleLogin} onSwitchToRegister={() => setShowRegister(true)} />
      )}
    </div>
  );
}

export default App;
