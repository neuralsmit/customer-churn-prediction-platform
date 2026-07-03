import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, User as UserIcon } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();
  
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, password);
      }
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={containerStyle}>
      <div className="glass" style={cardStyle}>
        {/* Header Icon & Brand */}
        <div style={headerStyle}>
          <div style={iconBoxStyle}>
            <ShieldAlert size={36} color="#8b5cf6" />
          </div>
          <h1 style={titleStyle}>ChurnShield</h1>
          <p style={subtitleStyle}>AI Churn Analytics & Explanations</p>
        </div>

        {/* Toggle tabs */}
        <div style={tabContainerStyle}>
          <button 
            style={isLogin ? activeTabStyle : tabStyle}
            onClick={() => { setIsLogin(true); setError(''); }}
          >
            Login
          </button>
          <button 
            style={!isLogin ? activeTabStyle : tabStyle}
            onClick={() => { setIsLogin(false); setError(''); }}
          >
            Register
          </button>
        </div>

        {/* Error notification */}
        {error && <div style={errorStyle}>{error}</div>}

        {/* Form */}
        <form onSubmit={handleSubmit} style={formStyle}>
          <div className="form-group">
            <label className="form-label" htmlFor="username">Username</label>
            <div style={inputWrapperStyle}>
              <UserIcon size={16} color="var(--text-secondary)" style={inputIconStyle} />
              <input
                id="username"
                type="text"
                className="form-input"
                style={inputStyle}
                placeholder="Enter username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">Password</label>
            <div style={inputWrapperStyle}>
              <Lock size={16} color="var(--text-secondary)" style={inputIconStyle} />
              <input
                id="password"
                type="password"
                className="form-input"
                style={inputStyle}
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={submitBtnStyle}
            disabled={loading}
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* Demo Credential Note */}
        {isLogin && (
          <div style={noteStyle}>
            <p>Demo Analyst Login:</p>
            <code>Username: <b>analyst</b> / Password: <b>password123</b></code>
          </div>
        )}
      </div>
    </div>
  );
};

// UI styles
const containerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  width: '100vw',
  background: 'radial-gradient(circle at center, #110e28 0%, #06050b 100%)',
};

const cardStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: '420px',
  padding: '40px 32px',
  borderRadius: 'var(--radius-lg)',
  boxShadow: '0 20px 50px rgba(0,0,0,0.5), 0 0 30px rgba(139, 92, 246, 0.1)',
  border: '1px solid rgba(139, 92, 246, 0.15)',
};

const headerStyle: React.CSSProperties = {
  textAlign: 'center',
  marginBottom: '32px',
};

const iconBoxStyle: React.CSSProperties = {
  width: '64px',
  height: '64px',
  borderRadius: '16px',
  background: 'rgba(139, 92, 246, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '0 auto 16px auto',
  border: '1px solid rgba(139, 92, 246, 0.25)',
  boxShadow: '0 0 15px rgba(139, 92, 246, 0.2)',
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '28px',
  fontWeight: 800,
  color: 'var(--text-primary)',
  background: 'linear-gradient(135deg, #fff 0%, var(--primary) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  marginBottom: '4px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
};

const tabContainerStyle: React.CSSProperties = {
  display: 'flex',
  background: 'var(--bg-primary)',
  padding: '4px',
  borderRadius: 'var(--radius-sm)',
  marginBottom: '24px',
  border: '1px solid var(--border)',
};

const tabStyle: React.CSSProperties = {
  flex: 1,
  padding: '8px 12px',
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-secondary)',
  background: 'transparent',
  border: 'none',
  borderRadius: '4px',
  cursor: 'pointer',
  transition: 'all 0.2s ease',
};

const activeTabStyle: React.CSSProperties = {
  ...tabStyle,
  color: 'var(--text-primary)',
  background: 'var(--bg-tertiary)',
  boxShadow: 'var(--shadow-sm)',
};

const errorStyle: React.CSSProperties = {
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: 'var(--risk-high)',
  fontSize: '13px',
  fontWeight: 500,
  marginBottom: '20px',
  textAlign: 'center',
};

const formStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const inputWrapperStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
};

const inputIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '14px',
};

const inputStyle: React.CSSProperties = {
  paddingLeft: '40px',
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  marginTop: '8px',
  padding: '12px',
  fontWeight: 600,
};

const noteStyle: React.CSSProperties = {
  marginTop: '24px',
  padding: '12px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(255, 255, 255, 0.02)',
  border: '1px solid var(--border)',
  fontSize: '11px',
  color: 'var(--text-secondary)',
  textAlign: 'center',
  lineHeight: '1.6',
};
