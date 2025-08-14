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
			alert('Please fill in all required fields');
			return;
		}
		if (password !== passwordConfirm) {
			alert('Passwords do not match');
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
					<h1>Ray Cheng Task Management System</h1>
					<p>Create a new account</p>
				</div>

				<form onSubmit={handleSubmit} className="login-form">
					<div className="form-group">
						<label htmlFor="username">Username</label>
						<input
							type="text"
							id="username"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							placeholder="Enter username"
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="email">Email (Optional)</label>
						<input
							type="email"
							id="email"
							value={email}
							onChange={(e) => setEmail(e.target.value)}
							placeholder="Enter email"
						/>
					</div>

					<div className="form-group">
						<label htmlFor="password">Password</label>
						<input
							type="password"
							id="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							placeholder="Enter password"
							required
						/>
					</div>

					<div className="form-group">
						<label htmlFor="passwordConfirm">Confirm Password</label>
						<input
							type="password"
							id="passwordConfirm"
							value={passwordConfirm}
							onChange={(e) => setPasswordConfirm(e.target.value)}
							placeholder="Confirm password"
							required
						/>
					</div>

					<button 
						type="submit" 
						className="login-button"
						disabled={isLoading}
					>
						{isLoading ? 'Registering...' : 'Register'}
					</button>
				</form>

				<div className="login-footer">
					<p>Already have an account? <button type="button" onClick={onSwitchToLogin} className="link-button">Go to Login</button></p>
				</div>
			</div>
		</div>
	);
};

export default Register;


