import React, { useState } from 'react';
import LoginForm from '../components/auth/LoginForm';
import SignupForm from '../components/auth/SignupForm';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);

  return (
    <div className="auth-page">
      <div className="auth-container">
        <div className="auth-header">
          <h1>ExpenseTracker Pro</h1>
          <p>Corporate Expense Management System</p>
        </div>

        <div className="auth-content">
          {isLogin ? (
            <LoginForm onSwitchToSignup={() => setIsLogin(false)} />
          ) : (
            <SignupForm onSwitchToLogin={() => setIsLogin(true)} />
          )}
        </div>

        <div className="auth-features">
          <div className="feature">
            <div className="feature-icon">💰</div>
            <h4>Multi-Currency Support</h4>
            <p>Submit expenses in any currency with automatic conversion</p>
          </div>
          <div className="feature">
            <div className="feature-icon">✅</div>
            <h4>Smart Approvals</h4>
            <p>Configurable approval workflows with multiple levels</p>
          </div>
          <div className="feature">
            <div className="feature-icon">📊</div>
            <h4>Real-time Analytics</h4>
            <p>Track expense patterns and generate detailed reports</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
