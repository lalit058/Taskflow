import React, { useState, useEffect } from 'react';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

// API Service 
const API_URL = 'http://localhost:5000/api';

const api = {
  async register(data) {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },

  async login(data) {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  }
};

const AuthForm = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user'
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      let result;
      if (isLogin) {
        result = await api.login({ email: formData.email, password: formData.password });
      } else {

        if (!isLogin && formData.password !== formData.confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        result = await api.register({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role
        });
      }

      if (result && result.token) {
        sessionStorage.setItem('token', result.token);
        sessionStorage.setItem('user', JSON.stringify(result.user));
        onLogin(result.token, result.user);
      } else {
        setError(result.error || result.message || "Authentication failed");
      }
    } catch (err) {
      setError("Server error. Check backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LoginForm
      isLogin={isLogin}
      setIsLogin={setIsLogin}
      formData={formData}
      setFormData={setFormData}
      handleSubmit={handleSubmit}
      error={error}
      setError={setError}
      loading={loading}
    />
  );
};

export default function App() {
  const [token, setToken] = useState(sessionStorage.getItem('token'));
  const [user, setUser] = useState(JSON.parse(sessionStorage.getItem('user') || 'null'));

  const handleLogin = (newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  if (!token) {
    return <AuthForm onLogin={handleLogin} />;
  }

  return (
    <Dashboard
      user={user}
      token={token}
      onLogout={handleLogout}
    />
  );
}