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
      const msg = await resp.json().catch(() => ({ detail: '登录失败' }));
      alert(msg.detail || '登录失败');
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
      const msg = await resp.json().catch(() => ({ detail: '注册失败' }));
      alert(msg.detail || '注册失败');
      return;
    }
    alert('注册成功，请登录');
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
            <h1>任务管理系统</h1>
            <div className="user-info">
              <span>欢迎，{user}！</span>
              <button onClick={handleLogout} className="logout-button">
                退出登录
              </button>
            </div>
          </header>
          <main className="dashboard-content">
            <h2>仪表板</h2>
            <p>登录成功！这里是任务管理系统的主界面。</p>
            <p>功能开发中...</p>
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
