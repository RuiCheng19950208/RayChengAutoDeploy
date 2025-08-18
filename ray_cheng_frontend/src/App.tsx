import React, { useState, useEffect } from 'react';
import './App.css';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import AdminPanel from './components/AdminPanel';
import { API_BASE_URL } from './config';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState('');
  const [userRole, setUserRole] = useState('user');
  const [showAdmin, setShowAdmin] = useState(false);

  const [showRegister, setShowRegister] = useState(false);

  // 设置Unity分数监听
  useEffect(() => {
    // 定义全局函数供Unity调用
    (window as any).handleUnityScore = handleUnityScore;
    
    return () => {
      // 清理全局函数
      delete (window as any).handleUnityScore;
    };
  }, [isLoggedIn]);

  const handleUnityScore = async (score: number) => {
    if (!isLoggedIn) {
      console.warn('[App] Received Unity score but user not logged in');
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      console.warn('[App] No access token found');
      return;
    }

    try {
      console.log(`[App] Submitting Unity score: ${score}`);
      
      const response = await fetch(`${API_BASE_URL}/submit-score`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ score })
      });

      if (response.ok) {
        const result = await response.json();
        console.log('[App] Score submitted successfully:', result);
        
        if (result.is_new_record) {
          // 静默处理新记录，只在控制台记录
          console.log(`🎉 New Record achieved: ${result.new_record.toFixed(2)}!`);
          // 可以在这里触发排行榜刷新或其他静默更新
        }
      } else {
        const error = await response.json().catch(() => ({ detail: 'Score submission failed' }));
        console.error('[App] Score submission failed:', error);
      }
    } catch (error) {
      console.error('[App] Error submitting score:', error);
    }
  };

  const fetchUserInfo = async (token: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userInfo = await response.json();
        setUserRole(userInfo.role);
        console.log(`[App] User role: ${userInfo.role}`);
      } else {
        console.error('[App] Failed to fetch user info');
      }
    } catch (error) {
      console.error('[App] Error fetching user info:', error);
    }
  };

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
    
    // 获取用户信息（包括角色）
    await fetchUserInfo(data.access_token);
    
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
    
    // 注册成功后自动登录
    try {
      await handleLogin(payload.username, payload.password);
      alert('Registration successful! You are now logged in.');
    } catch (error) {
      console.error('Auto-login after registration failed:', error);
      alert('Registration successful, please login manually');
      setShowRegister(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    // 强制刷新页面，自动重置所有状态
    window.location.reload();
  };

  if (isLoggedIn) {
    if (showAdmin && userRole === 'admin') {
      return (
        <div className="App">
          <AdminPanel onBack={() => setShowAdmin(false)} />
        </div>
      );
    }
    
    return (
      <div className="App">
        <Dashboard 
          username={user} 
          userRole={userRole}
          onLogout={handleLogout}
          onShowAdmin={() => setShowAdmin(true)}
        />
      </div>
    );
  }

  return (
    <div className="App">
      {showRegister ? (
        <Register 
          key="register-form"
          onRegister={handleRegister} 
          onSwitchToLogin={() => setShowRegister(false)} 
        />
      ) : (
        <Login 
          key="login-form"
          onLogin={handleLogin} 
          onSwitchToRegister={() => setShowRegister(true)} 
        />
      )}
    </div>
  );
}

export default App;
