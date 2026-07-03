import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend 
} from 'recharts';
import { 
  Users, TrendingUp, DollarSign, Calendar, 
  AlertTriangle, FileText, Download, UserCheck 
} from 'lucide-react';

interface DashboardStats {
  total_customers: number;
  active_customers: number;
  churned_customers: number;
  churn_rate: number;
  avg_tenure: number;
  avg_monthly_charges: number;
  high_risk_count: number;
  medium_risk_count: number;
  low_risk_count: number;
  monthly_revenue: number;
  churn_by_contract: Record<string, { total: number; churn: number; active: number }>;
  churn_by_payment_method: Record<string, { total: number; churn: number; active: number }>;
}

interface CustomerWithPrediction {
  id: number;
  customer_id: string;
  name: string;
  email: string;
  tenure: number;
  monthly_charges: number;
  contract: string;
  latest_prediction?: {
    churn_probability: number;
    is_churn: boolean;
  };
}

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [highRiskCustomers, setHighRiskCustomers] = useState<CustomerWithPrediction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, customersData] = await Promise.all([
          api.get<DashboardStats>('/dashboard/stats'),
          api.get<CustomerWithPrediction[]>('/customers?limit=100')
        ]);
        
        setStats(statsData);
        
        // Filter and sort for the top 5 highest risk customers
        const sortedRisk = customersData
          .filter(c => c.latest_prediction !== null && c.latest_prediction !== undefined)
          .sort((a, b) => {
            const probA = a.latest_prediction?.churn_probability || 0;
            const probB = b.latest_prediction?.churn_probability || 0;
            return probB - probA;
          })
          .slice(0, 5);
          
        setHighRiskCustomers(sortedRisk);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch dashboard data.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleDownloadReport = async (format: 'pdf' | 'csv') => {
    try {
      setDownloading(format);
      const url = api.getDownloadUrl(`/predictions/report?format=${format}`);
      
      // Trigger browser download directly via dynamic link insertion
      const a = document.createElement('a');
      a.href = url;
      a.download = `churn_report_${new Date().toISOString().slice(0,10)}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch (err) {
      alert('Failed to download report.');
    } finally {
      setDownloading(null);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="page-body">
        <div style={errorCardStyle}>
          <AlertTriangle size={36} color="var(--risk-high)" />
          <h3>System Alert</h3>
          <p>{error || 'An error occurred loading the dashboard.'}</p>
        </div>
      </div>
    );
  }

  // Formatting chart data
  const riskDistributionData = [
    { name: 'High Risk (≥70%)', value: stats.high_risk_count, color: '#ef4444' },
    { name: 'Medium Risk (30-69%)', value: stats.medium_risk_count, color: '#f59e0b' },
    { name: 'Low Risk (<30%)', value: stats.low_risk_count, color: '#10b981' }
  ].filter(d => d.value > 0);

  const contractData = Object.entries(stats.churn_by_contract).map(([key, value]) => ({
    name: key,
    Active: value.active,
    ChurnRisk: value.churn
  }));

  const paymentData = Object.entries(stats.churn_by_payment_method).map(([key, value]) => ({
    name: key,
    Active: value.active,
    ChurnRisk: value.churn
  }));

  return (
    <div className="page-body">
      {/* Top Banner with Download Actions */}
      <div style={topBannerStyle}>
        <div>
          <h1 className="page-title">Executive Churn Insights</h1>
          <p style={subTitleStyle}>Predictive intelligence dashboard and analytical metrics.</p>
        </div>
        
        <div style={actionsContainerStyle}>
          <button 
            onClick={() => handleDownloadReport('pdf')} 
            className="btn btn-primary"
            disabled={downloading !== null}
          >
            <FileText size={16} />
            <span>{downloading === 'pdf' ? 'Generating...' : 'Export PDF'}</span>
          </button>
          
          <button 
            onClick={() => handleDownloadReport('csv')} 
            className="btn btn-secondary"
            disabled={downloading !== null}
          >
            <Download size={16} />
            <span>{downloading === 'csv' ? 'Exporting...' : 'Export CSV'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="dashboard-grid">
        <div className="card glass stat-card">
          <div className="stat-title">Total Portfolio</div>
          <div className="stat-value">{stats.total_customers}</div>
          <div className="stat-sub">
            <span style={{ color: 'var(--risk-low)' }}>{stats.active_customers} Active</span> | <span style={{ color: 'var(--risk-high)' }}>{stats.churned_customers} High Risk</span>
          </div>
        </div>

        <div className="card glass stat-card">
          <div className="stat-title">Avg Portfolio Churn Risk</div>
          <div className="stat-value" style={{ color: stats.churn_rate > 30 ? 'var(--risk-high)' : 'var(--primary)' }}>
            {stats.churn_rate.toFixed(1)}%
          </div>
          <div className="stat-sub">Aggregate forecast prediction rate</div>
        </div>

        <div className="card glass stat-card">
          <div className="stat-title">Monthly Revenue (MRR)</div>
          <div className="stat-value">${stats.monthly_revenue.toLocaleString(undefined, {maximumFractionDigits: 0})}</div>
          <div className="stat-sub">Monthly recurring portfolio value</div>
        </div>

        <div className="card glass stat-card">
          <div className="stat-title">Average Retention</div>
          <div className="stat-value" style={{ color: 'var(--secondary)' }}>
            {stats.avg_tenure.toFixed(1)} mo
          </div>
          <div className="stat-sub">Average tenure duration per account</div>
        </div>
      </div>

      {/* Charts Layout */}
      <div className="chart-grid">
        {/* Risk Distribution Pie */}
        <div className="card glass" style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Risk Segmentation</h3>
          <p style={chartSubtitleStyle}>Proportion of active portfolio grouped by forecasted risk intensity</p>
          <div style={chartContainerStyle}>
            {riskDistributionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={riskDistributionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {riskDistributionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: '#fff' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div style={noDataStyle}>No analytical records available.</div>
            )}
          </div>
        </div>

        {/* Contract Type Bar Chart */}
        <div className="card glass" style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Risk by Contract Type</h3>
          <p style={chartSubtitleStyle}>Comparative analysis of churn predictions grouped by billing contracts</p>
          <div style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={contractData}>
                <XAxis dataKey="name" stroke="var(--text-secondary)" tick={{fontSize: 11}} />
                <YAxis stroke="var(--text-secondary)" tick={{fontSize: 11}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="Active" name="Active / Safe" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ChurnRisk" name="Churn Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Second Row: Payment Breakdown & Focus List */}
      <div className="chart-grid">
        {/* Payment Methods Chart */}
        <div className="card glass" style={chartCardStyle}>
          <h3 style={chartTitleStyle}>Risk by Payment Method</h3>
          <p style={chartSubtitleStyle}>Aggregated account risk segment distributions across payment vectors</p>
          <div style={chartContainerStyle}>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={paymentData} layout="vertical">
                <XAxis type="number" stroke="var(--text-secondary)" tick={{fontSize: 10}} />
                <YAxis type="category" dataKey="name" stroke="var(--text-secondary)" width={110} tick={{fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-secondary)', borderColor: 'var(--border)', color: '#fff' }}
                />
                <Legend verticalAlign="bottom" height={36} />
                <Bar dataKey="Active" name="Active / Safe" fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="ChurnRisk" name="Churn Risk" fill="#ef4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* High Risk Focus List */}
        <div className="card glass" style={chartCardStyle}>
          <div style={focusHeaderStyle}>
            <div>
              <h3 style={chartTitleStyle}>Priority Retention Queue</h3>
              <p style={chartSubtitleStyle}>Highest risk active accounts requiring customer success outreach</p>
            </div>
            <Link to="/customers" style={viewAllLinkStyle}>View Database</Link>
          </div>
          
          <div style={focusListContainerStyle}>
            {highRiskCustomers.length > 0 ? (
              highRiskCustomers.map(customer => {
                const prob = customer.latest_prediction?.churn_probability || 0;
                return (
                  <div key={customer.id} style={focusRowStyle}>
                    <div style={focusRowDetailsStyle}>
                      <span style={focusNameStyle}>{customer.name}</span>
                      <span style={focusSubStyle}>{customer.customer_id} • {customer.contract}</span>
                    </div>
                    
                    <div style={focusActionContainerStyle}>
                      <div style={focusRiskMeterStyle}>
                        <span style={focusMeterLabelStyle}>Risk Score</span>
                        <span 
                          style={{
                            fontSize: '15px',
                            fontWeight: 700,
                            color: prob >= 0.70 ? 'var(--risk-high)' : 'var(--risk-medium)'
                          }}
                        >
                          {(prob * 100).toFixed(0)}%
                        </span>
                      </div>
                      
                      <Link 
                        to={`/predictions/${customer.id}`} 
                        className="btn btn-secondary" 
                        style={miniBtnStyle}
                      >
                        Explain
                      </Link>
                    </div>
                  </div>
                );
              })
            ) : (
              <div style={noDataStyle}>No high-risk segments found.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Styling Objects
const topBannerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginBottom: '32px',
  flexWrap: 'wrap',
  gap: '16px',
};

const subTitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  marginTop: '4px',
};

const actionsContainerStyle: React.CSSProperties = {
  display: 'flex',
  gap: '12px',
};

const errorCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px',
  borderRadius: 'var(--radius-md)',
  backgroundColor: 'rgba(239, 68, 68, 0.05)',
  border: '1px solid rgba(239, 68, 68, 0.2)',
  textAlign: 'center',
  gap: '12px',
};

const chartCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  height: '380px',
};

const chartTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'var(--text-primary)',
  marginBottom: '2px',
};

const chartSubtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginBottom: '16px',
};

const chartContainerStyle: React.CSSProperties = {
  flex: 1,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: 0,
};

const focusHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
};

const viewAllLinkStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--primary)',
  textDecoration: 'none',
  fontWeight: 600,
};

const focusListContainerStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  marginTop: '16px',
  overflowY: 'auto',
  flex: 1,
};

const focusRowStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '12px 16px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.01)',
  transition: 'border-color 0.2s ease',
};

const focusRowDetailsStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  minWidth: 0,
};

const focusNameStyle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 600,
  color: 'var(--text-primary)',
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
};

const focusSubStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
};

const focusActionContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
};

const focusRiskMeterStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-end',
  gap: '2px',
};

const focusMeterLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
  color: 'var(--text-muted)',
};

const miniBtnStyle: React.CSSProperties = {
  padding: '6px 12px',
  fontSize: '11px',
  height: 'fit-content',
};

const noDataStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
};
