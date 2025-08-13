import React, { useState } from 'react';
import './App.css';
import Login from './components/Login';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');

  const handleLogin = (username: string, password: string) => {
    // 这里暂时只是模拟登录成功
    console.log('登录信息:', { username, password });
    setUser(username);
    setIsLoggedIn(true);
    alert(`欢迎回来，${username}！`);
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
      <Login onLogin={handleLogin} />
    </div>
  );
}

export default App;
