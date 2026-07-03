import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { CustomerList } from './pages/CustomerList';
import { NewCustomer } from './pages/NewCustomer';
import { PredictionDetail } from './pages/PredictionDetail';
import { BatchUpload } from './pages/BatchUpload';
import './styles/app.css';

// Guard component for authenticated routes
const PrivateRoute: React.FC = () => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="loader-container" style={{ height: '100vh', width: '100vw' }}>
        <div className="loader"></div>
      </div>
    );
  }

  return user ? <Outlet /> : <Navigate to="/login" replace />;
};

// Layout wrapping sidebar navigation and active page view
const Layout: React.FC = () => {
  return (
    <div className="app-container">
      <Sidebar />
      <main className="main-content">
        <Outlet />
      </main>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<Login />} />

          {/* Secure Workspace Router */}
          <Route element={<PrivateRoute />}>
            <Route element={<Layout />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/new-customer" element={<NewCustomer />} />
              <Route path="/predictions/:id" element={<PredictionDetail />} />
              <Route path="/batch-upload" element={<BatchUpload />} />
            </Route>
          </Route>

          {/* Redirect fallbacks */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
