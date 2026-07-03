import React, { useState, useEffect } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { api } from '../services/api';
import { Search, UserPlus, Brain, Eye, RefreshCw, AlertCircle } from 'lucide-react';

interface CustomerWithPrediction {
  id: number;
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  tenure: number;
  contract: string;
  internet_service: string;
  monthly_charges: number;
  total_charges: number;
  latest_prediction?: {
    id: number;
    churn_probability: number;
    is_churn: boolean;
  };
}

export const CustomerList: React.FC = () => {
  const [customers, setCustomers] = useState<CustomerWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [runningPredictions, setRunningPredictions] = useState<Record<number, boolean>>({});

  const fetchCustomers = async (search = '') => {
    try {
      setLoading(true);
      const data = await api.get<CustomerWithPrediction[]>(`/customers${search ? `?search=${search}` : ''}`);
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve customer accounts.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCustomers(searchQuery);
  };

  const handlePredictOnTheFly = async (id: number) => {
    setRunningPredictions(prev => ({ ...prev, [id]: true }));
    try {
      const predResult = await api.post<any>(`/predictions/single/${id}`, {});
      // Refresh this customer record in local state
      setCustomers(prev => 
        prev.map(c => c.id === id ? { ...c, latest_prediction: predResult } : c)
      );
    } catch (err: any) {
      alert(`Prediction failed: ${err.message || 'Server error'}`);
    } finally {
      setRunningPredictions(prev => ({ ...prev, [id]: false }));
    }
  };

  const getRiskBadge = (prob?: number) => {
    if (prob === undefined || prob === null) {
      return <span className="badge badge-secondary" style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>None</span>;
    }
    
    if (prob >= 0.70) {
      return <span className="badge badge-high">High Risk ({(prob*100).toFixed(0)}%)</span>;
    } else if (prob >= 0.30) {
      return <span className="badge badge-medium">Medium Risk ({(prob*100).toFixed(0)}%)</span>;
    } else {
      return <span className="badge badge-low">Safe / Low ({(prob*100).toFixed(0)}%)</span>;
    }
  };

  return (
    <div className="page-body">
      <div style={headerLayout}>
        <div>
          <h1 className="page-title">Customer Portfolio</h1>
          <p style={subtitleStyle}>Manage, inspect, and analyze churn metrics for registered customer accounts.</p>
        </div>
        
        <RouterLink to="/new-customer" className="btn btn-primary">
          <UserPlus size={16} />
          <span>Add Account</span>
        </RouterLink>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} style={searchFormStyle}>
        <div style={searchWrapper}>
          <Search size={18} color="var(--text-secondary)" style={searchIconStyle} />
          <input
            type="text"
            className="form-input"
            style={searchInputStyle}
            placeholder="Search by name, email, or customer code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button type="submit" className="btn btn-secondary">Search</button>
        {searchQuery && (
          <button 
            type="button" 
            className="btn btn-secondary"
            onClick={() => { setSearchQuery(''); fetchCustomers(); }}
          >
            Clear
          </button>
        )}
      </form>

      {/* Main Table grid */}
      {loading ? (
        <div className="loader-container">
          <div className="loader"></div>
        </div>
      ) : error ? (
        <div style={errorBannerStyle}>
          <AlertCircle size={20} color="var(--risk-high)" />
          <span>{error}</span>
        </div>
      ) : customers.length === 0 ? (
        <div className="card glass" style={emptyCardStyle}>
          <p>No customer records found. Add a new customer to run explanations.</p>
        </div>
      ) : (
        <div className="table-container glass">
          <table className="data-table">
            <thead>
              <tr>
                <th>Customer ID</th>
                <th>Name</th>
                <th>Tenure</th>
                <th>Contract</th>
                <th>Internet</th>
                <th>Charges (Mo/Tot)</th>
                <th>Churn Risk Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--secondary)' }}>
                    {c.customer_id}
                  </td>
                  <td>
                    <div style={nameColStyle}>
                      <span style={nameTextStyle}>{c.name}</span>
                      <span style={emailTextStyle}>{c.email}</span>
                    </div>
                  </td>
                  <td>{c.tenure} mo</td>
                  <td>{c.contract}</td>
                  <td>{c.internet_service}</td>
                  <td style={{ fontSize: '13px' }}>
                    <b>${c.monthly_charges.toFixed(2)}</b>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '4px' }}>/ ${c.total_charges.toFixed(0)}</span>
                  </td>
                  <td>{getRiskBadge(c.latest_prediction?.churn_probability)}</td>
                  <td>
                    <div style={actionsGroupStyle}>
                      {c.latest_prediction ? (
                        <RouterLink 
                          to={`/predictions/${c.id}`} 
                          className="btn btn-secondary" 
                          style={actionBtnStyle}
                          title="Inspect AI Explanation (SHAP)"
                        >
                          <Eye size={14} />
                          <span>Explain</span>
                        </RouterLink>
                      ) : (
                        <button
                          onClick={() => handlePredictOnTheFly(c.id)}
                          className="btn btn-accent"
                          style={actionBtnStyle}
                          disabled={runningPredictions[c.id]}
                          title="Run churn forecasting"
                        >
                          {runningPredictions[c.id] ? (
                            <RefreshCw size={14} className="spin-animation" />
                          ) : (
                            <Brain size={14} />
                          )}
                          <span>Forecast</span>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// Styling definitions
const headerLayout: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '32px',
  flexWrap: 'wrap',
  gap: '16px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  marginTop: '4px',
};

const searchFormStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
  marginBottom: '24px',
};

const searchWrapper: React.CSSProperties = {
  position: 'relative',
  flex: 1,
  display: 'flex',
  alignItems: 'center',
};

const searchIconStyle: React.CSSProperties = {
  position: 'absolute',
  left: '14px',
};

const searchInputStyle: React.CSSProperties = {
  paddingLeft: '40px',
};

const emptyCardStyle: React.CSSProperties = {
  textAlign: 'center',
  padding: '48px',
  color: 'var(--text-secondary)',
};

const errorBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  padding: '16px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: 'var(--risk-high)',
  marginBottom: '20px',
};

const nameColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
};

const nameTextStyle: React.CSSProperties = {
  fontWeight: 500,
  color: 'var(--text-primary)',
};

const emailTextStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  marginTop: '2px',
};

const actionsGroupStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
};

const actionBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '12px',
};
