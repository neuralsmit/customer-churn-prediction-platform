import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  UploadCloud, 
  LogOut, 
  ShieldAlert 
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/customers', name: 'Customer Database', icon: <Users size={20} /> },
    { path: '/new-customer', name: 'Manual Prediction', icon: <UserPlus size={20} /> },
    { path: '/batch-upload', name: 'Batch Prediction', icon: <UploadCloud size={20} /> },
  ];

  return (
    <aside className="sidebar glass" style={sidebarStyle}>
      {/* Brand logo banner */}
      <div className="brand-logo" style={logoContainerStyle}>
        <ShieldAlert size={28} color="#8b5cf6" />
        <span style={logoTextStyle}>ChurnShield</span>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav" style={navStyle}>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              style={isActive ? activeLinkStyle : linkStyle}
              className={isActive ? 'sidebar-link active-link' : 'sidebar-link'}
            >
              {item.icon}
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Footer User Profile Card */}
      {user && (
        <div className="user-profile-panel" style={profilePanelStyle}>
          <div style={profileInfoStyle}>
            <div style={avatarStyle}>
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div style={profileDetailsStyle}>
              <div style={usernameStyle}>{user.email}</div>
              <div style={roleStyle}>{user.role.toUpperCase()}</div>
            </div>
          </div>
          <button onClick={logout} className="btn btn-secondary" style={logoutBtnStyle}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

// CSS styles within component for robust encapsulation
const sidebarStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  bottom: 0,
  left: 0,
  width: 'var(--sidebar-width)',
  display: 'flex',
  flexDirection: 'column',
  padding: '24px 16px',
  borderRight: '1px solid var(--border)',
  zIndex: 100,
};

const logoContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  marginBottom: '40px',
  paddingLeft: '8px',
};

const logoTextStyle: React.CSSProperties = {
  fontFamily: 'var(--font-display)',
  fontSize: '20px',
  fontWeight: 800,
  letterSpacing: '-0.03em',
  background: 'linear-gradient(135deg, #fff 0%, var(--primary) 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  flex: 1,
};

const linkStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
  color: 'var(--text-secondary)',
  textDecoration: 'none',
  fontSize: '14px',
  fontWeight: 500,
  transition: 'all 0.2s ease',
};

const activeLinkStyle: React.CSSProperties = {
  ...linkStyle,
  color: 'var(--text-primary)',
  background: 'linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.05) 100%)',
  borderLeft: '3px solid var(--primary)',
  boxShadow: 'inset 0 0 10px rgba(139, 92, 246, 0.05)',
  paddingLeft: '13px', // adjusts offset for border-left
};

const profilePanelStyle: React.CSSProperties = {
  marginTop: 'auto',
  paddingTop: '20px',
  borderTop: '1px solid var(--border)',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
};

const profileInfoStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '0 8px',
};

const avatarStyle: React.CSSProperties = {
  width: '38px',
  height: '38px',
  borderRadius: '50%',
  background: 'linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#fff',
  fontWeight: 'bold',
  fontSize: '14px',
  boxShadow: '0 0 10px rgba(139, 92, 246, 0.3)',
};

const profileDetailsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  minWidth: 0,
};

const usernameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const roleStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--primary)',
  letterSpacing: '0.05em',
};

const logoutBtnStyle: React.CSSProperties = {
  width: '100%',
  justifyContent: 'center',
  padding: '8px 12px',
  fontSize: '12px',
};
