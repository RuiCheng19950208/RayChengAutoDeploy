import React, { useState } from 'react';
import './Login.css';

interface RegisterProps {
	onRegister: (payload: { username: string; email?: string; password: string; passwordConfirm: string }) => Promise<void> | void;
	onSwitchToLogin: () => void;
}

const Register: React.FC<RegisterProps> = ({ onRegister, onSwitchToLogin }) => {
	const [username, setUsername] = useState('');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [passwordConfirm, setPasswordConfirm] = useState('');
	const [isLoading, setIsLoading] = useState(false);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!username.trim() || !password.trim() || !passwordConfirm.trim()) {
			alert('请填写必填项');
			return;
		}
		if (password !== passwordConfirm) {
			alert('两次密码输入不一致');
			return;
		}
		try {
			setIsLoading(true);
			await onRegister({ username, email: email || undefined, password, passwordConfirm });
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div className="login-container">
			<div className="login-card">
				<div className="login-header">
					<h1>任务管理系统</h1>
					<p>创建一个新账户</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<div className="form-group">
						<label htmlFor="username">用户名</label>
						<input
							type="text"
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="请输入用户名"
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="email">邮箱（可选）</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="请输入邮箱"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">密码</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="请输入密码"
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="passwordConfirm">确认密码</label>
						<input
							type="password"
							id="passwordConfirm"
							value={passwordConfirm}
							onChange={(e) => setPasswordConfirm(e.target.value)}
							placeholder="请再次输入密码"
							required
						/>
					</div>

					<button 
						type="submit" 
						className="login-button"
						disabled={isLoading}
					>
						{isLoading ? '注册中...' : '注册'}
					</button>
				</form>

				<div className="login-footer">
					<p>已经有账户？ <button type="button" onClick={onSwitchToLogin} className="link-button">去登录</button></p>
				</div>
			</div>
		</div>
	);
};

export default Register;


