import React, { useState } from 'react';
import './Auth.css';

function Auth({ onLogin }) {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: code, 3: new password
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [resetCode, setResetCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      // Check if response is JSON
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        throw new Error('Cannot connect to server. Make sure backend is running on port 5000.');
      }

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      localStorage.setItem('token', data.token);
      localStorage.setItem('userEmail', data.email);
      onLogin(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (resetStep === 1) {
        // Request reset code
        const res = await fetch('/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Cannot connect to server. Make sure backend is running.');
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Failed to send reset code');
        }

        // Check if email was sent or if we got a fallback code
        if (data.resetToken) {
          // Fallback mode (email service unavailable)
          setGeneratedCode(data.resetToken);
          setSuccess(`⚠️ Email service unavailable. Your reset code is: ${data.resetToken}`);
        } else {
          // Email sent successfully
          setSuccess(`✅ Reset code sent to ${email}! Check your inbox.`);
        }
        setResetStep(2);
      } else if (resetStep === 2) {
        const res = await fetch('/api/auth/verify-reset-token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resetToken: resetCode }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Cannot connect to server.');
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Invalid reset code');
        }

        setSuccess('Code verified! Enter your new password.');
        setResetStep(3);
      } else if (resetStep === 3) {
        const res = await fetch('/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, resetToken: resetCode, newPassword }),
        });

        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          throw new Error('Cannot connect to server.');
        }

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || 'Password reset failed');
        }

        setSuccess('Password reset successful! You can now login.');
        setTimeout(() => {
          setIsForgotPassword(false);
          setResetStep(1);
          setEmail('');
          setResetCode('');
          setNewPassword('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const resetForgotPasswordFlow = () => {
    setIsForgotPassword(false);
    setResetStep(1);
    setEmail('');
    setResetCode('');
    setNewPassword('');
    setError('');
    setSuccess('');
  };

  if (isForgotPassword) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>💰 Monthly Budget Tracker</h2>
          <h3>Reset Password</h3>
          
          {error && <div className="auth-error">{error}</div>}
          {success && <div className="auth-success">{success}</div>}
          
          <form onSubmit={handleForgotPassword}>
            {resetStep === 1 && (
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}

            {resetStep === 2 && (
              <>
                <p className="reset-info">Enter the 6-digit code sent to {email}</p>
                <input
                  type="text"
                  placeholder="Enter 6-digit code"
                  value={resetCode}
                  onChange={(e) => setResetCode(e.target.value)}
                  required
                  maxLength="6"
                />
              </>
            )}

            {resetStep === 3 && (
              <input
                type="password"
                placeholder="Enter new password (min 6 characters)"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength="6"
              />
            )}

            <button type="submit" disabled={loading}>
              {loading ? 'Please wait...' : 
                resetStep === 1 ? 'Send Reset Code' :
                resetStep === 2 ? 'Verify Code' :
                'Reset Password'}
            </button>
          </form>

          <p className="auth-toggle">
            <button type="button" onClick={resetForgotPasswordFlow}>
              Back to Login
            </button>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h2>💰 Monthly Budget Tracker</h2>
        <h3>{isLogin ? 'Login' : 'Register'}</h3>
        
        {error && <div className="auth-error">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength="6"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Please wait...' : (isLogin ? 'Login' : 'Register')}
          </button>
        </form>

        {isLogin && (
          <p className="forgot-password">
            <button type="button" onClick={() => setIsForgotPassword(true)}>
              Forgot Password?
            </button>
          </p>
        )}

        <p className="auth-toggle">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button type="button" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Register' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
}


export default Auth;