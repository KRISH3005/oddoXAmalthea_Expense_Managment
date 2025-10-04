import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

const LoginForm = ({ onSwitchToSignup }) => {
  const { login, error, loading } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(formData.email, formData.password);
    } catch (error) {
      // Error handled by context
    }
  };

  return (
    <form onSubmit={handleSubmit} className="auth-form">
      <h2>Sign In</h2>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
          placeholder="Enter your email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          value={formData.password}
          onChange={handleChange}
          required
          placeholder="Enter your password"
        />
      </div>

      <button type="submit" className="auth-button" disabled={loading}>
        {loading ? 'Signing In...' : 'Sign In'}
      </button>

      <p className="auth-switch">
        Don't have an account?{' '}
        <button type="button" onClick={onSwitchToSignup} className="link-button">
          Sign up here
        </button>
      </p>
    </form>
  );
};

export default LoginForm;
