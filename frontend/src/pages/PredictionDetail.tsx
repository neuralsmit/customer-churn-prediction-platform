import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api } from '../services/api';
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, 
  ReferenceLine, Cell 
} from 'recharts';
import { ArrowLeft, User, CreditCard, ShieldAlert, Sparkles, RefreshCw } from 'lucide-react';

interface SHAPFeatureImpact {
  feature: string;
  display_name: string;
  value: string;
  shap_value: number;
}

interface CustomerDetails {
  id: number;
  customer_id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  partner: string;
  dependents: string;
  phone_service: string;
  multiple_lines: string;
  internet_service: string;
  online_security: string;
  online_backup: string;
  device_protection: string;
  tech_support: string;
  streaming_tv: string;
  streaming_movies: string;
  tenure: number;
  contract: string;
  paperless_billing: string;
  payment_method: string;
  monthly_charges: number;
  total_charges: number;
  latest_prediction?: {
    id: number;
    churn_probability: number;
    is_churn: boolean;
    shap_values: SHAPFeatureImpact[];
    predicted_at: string;
  };
}

export const PredictionDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<CustomerDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [recomputing, setRecomputing] = useState(false);
  const [error, setError] = useState('');

  const fetchCustomerData = async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await api.get<CustomerDetails>(`/customers/${id}`);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve prediction files.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  const handleRecompute = async () => {
    if (!customer) return;
    try {
      setRecomputing(true);
      const predResult = await api.post<any>(`/predictions/single/${customer.id}`, {});
      setCustomer(prev => prev ? { ...prev, latest_prediction: predResult } : null);
    } catch (err: any) {
      alert(`Recalculation failed: ${err.message}`);
    } finally {
      setRecomputing(false);
    }
  };

  if (loading) {
    return (
      <div className="loader-container">
        <div className="loader"></div>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="page-body">
        <div className="card glass" style={errorCardStyle}>
          <ShieldAlert size={40} color="var(--risk-high)" />
          <h3>Retrieval Error</h3>
          <p>{error || 'Customer profile not found.'}</p>
          <Link to="/customers" className="btn btn-secondary">Back to Database</Link>
        </div>
      </div>
    );
  }

  const prediction = customer.latest_prediction;
  const prob = prediction ? prediction.churn_probability : 0.0;
  
  // Custom Gauge Ring variables
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (prob * circumference);

  const getRiskColor = (p: number) => {
    if (p >= 0.70) return 'var(--risk-high)';
    if (p >= 0.30) return 'var(--risk-medium)';
    return 'var(--risk-low)';
  };

  const getRiskStatusText = (p: number) => {
    if (p >= 0.70) return 'CRITICAL CHURN RISK';
    if (p >= 0.30) return 'MODERATE WARNING';
    return 'STABLE PORTFOLIO';
  };

  // Convert SHAP data for chart plotting
  const shapData = prediction?.shap_values || [];

  // SHAP Explanation tooltips
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: SHAPFeatureImpact = payload[0].payload;
      const isPositive = data.shap_value > 0;
      return (
        <div style={tooltipStyle}>
          <p style={tooltipTitleStyle}><b>{data.display_name}</b></p>
          <p style={tooltipValueStyle}>Active Value: <b>{data.value}</b></p>
          <p style={{ ...tooltipImpactStyle, color: isPositive ? 'var(--risk-high)' : 'var(--risk-low)' }}>
            Impact: <b>{isPositive ? '+' : ''}{(data.shap_value * 100).toFixed(1)}%</b> Churn Probability
          </p>
          <p style={tooltipDescStyle}>
            {isPositive 
              ? 'This attribute increases the customer’s propensity to churn.' 
              : 'This attribute acts as a retention factor, encouraging customer loyalty.'}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="page-body">
      {/* Page navigation header */}
      <div style={headerStyle}>
        <button onClick={() => navigate('/customers')} className="btn btn-secondary" style={backBtnStyle}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div>
          <h1 className="page-title">{customer.name} Analytics</h1>
          <p style={subtitleStyle}>Customer Churn Prediction Dashboard & SHAP Explanation details.</p>
        </div>
      </div>

      {/* Grid panels */}
      <div style={detailGridStyle}>
        {/* LEFT COLUMN: Radial gauge details */}
        <div style={leftColStyle}>
          {/* Gauge Widget */}
          <div className="card glass" style={gaugeCardStyle}>
            <h3 style={cardTitleStyle}>Churn Risk Forecast</h3>
            
            <div style={gaugeContainerStyle}>
              <svg width={160} height={160}>
                {/* Background Ring */}
                <circle
                  cx={80}
                  cy={80}
                  r={radius}
                  fill="transparent"
                  stroke="var(--border)"
                  strokeWidth={strokeWidth}
                />
                {/* Active Ring */}
                <circle
                  cx={80}
                  cy={80}
                  r={radius}
                  fill="transparent"
                  stroke={getRiskColor(prob)}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  transform="rotate(-90 80 80)"
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
              </svg>
              {/* Inner Text overlay */}
              <div style={gaugeTextContainerStyle}>
                <span style={gaugePercentageStyle}>{(prob * 100).toFixed(0)}%</span>
                <span style={gaugeLabelStyle}>PROBABILITY</span>
              </div>
            </div>

            <div style={statusBannerContainerStyle}>
              <span 
                style={{
                  ...statusBannerStyle,
                  color: getRiskColor(prob),
                  backgroundColor: `${getRiskColor(prob)}12`,
                  borderColor: `${getRiskColor(prob)}33`
                }}
              >
                {getRiskStatusText(prob)}
              </span>
            </div>

            {/* Recalculate prediction button */}
            <button 
              onClick={handleRecompute} 
              className="btn btn-secondary" 
              style={recomputeBtnStyle}
              disabled={recomputing}
            >
              {recomputing ? (
                <>
                  <RefreshCw size={14} className="spin-animation" />
                  <span>Computing...</span>
                </>
              ) : (
                <>
                  <RefreshCw size={14} />
                  <span>Refresh Forecast</span>
                </>
              )}
            </button>
          </div>

          {/* Demographic details list */}
          <div className="card glass" style={demographicsCardStyle}>
            <div style={sectionTitleContainerStyle}>
              <User size={16} color="var(--primary)" />
              <h3 style={sectionTitleStyle}>Customer Demographics</h3>
            </div>
            
            <div style={detailsListStyle}>
              <div style={detailsRowStyle}>
                <span style={detailsKeyStyle}>Customer ID</span>
                <span style={detailsValStyle}>{customer.customer_id}</span>
              </div>
              <div style={detailsRowStyle}>
                <span style={detailsKeyStyle}>Email</span>
                <span style={detailsValStyle}>{customer.email}</span>
              </div>
              <div style={detailsRowStyle}>
                <span style={detailsKeyStyle}>Phone</span>
                <span style={detailsValStyle}>{customer.phone}</span>
              </div>
              <div style={detailsRowStyle}>
                <span style={detailsKeyStyle}>Gender</span>
                <span style={detailsValStyle}>{customer.gender}</span>
              </div>
              <div style={detailsRowStyle}>
                <span style={detailsKeyStyle}>Partner / Dependents</span>
                <span style={detailsValStyle}>
                  {customer.partner === 'Yes' ? 'Partnered' : 'Single'} • {customer.dependents === 'Yes' ? 'Dependents' : 'No Dependents'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: SHAP Explanation + Services */}
        <div style={rightColStyle}>
          {/* SHAP Chart panel */}
          <div className="card glass" style={shapCardStyle}>
            <div style={sectionTitleContainerStyle}>
              <Sparkles size={18} color="var(--primary)" />
              <div>
                <h3 style={cardTitleStyle}>AI Explanations: SHAP Value Contributions</h3>
                <p style={chartSubtitleStyle}>Impact breakdown showing feature drivers pushing towards (Red) or away from (Green) Churn</p>
              </div>
            </div>

            <div style={chartAreaStyle}>
              {shapData.length > 0 ? (
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart 
                    data={shapData}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 10 }}
                  >
                    <XAxis type="number" stroke="var(--text-secondary)" tick={{fontSize: 10}} />
                    <YAxis 
                      type="category" 
                      dataKey="display_name" 
                      stroke="var(--text-secondary)" 
                      width={160} 
                      tick={{fontSize: 10}}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine x={0} stroke="var(--border)" />
                    <Bar dataKey="shap_value">
                      {shapData.map((entry, index) => {
                        const isPositive = entry.shap_value > 0;
                        return (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={isPositive ? 'var(--risk-high)' : 'var(--risk-low)'} 
                          />
                        );
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div style={noShapDataStyle}>
                  No SHAP explainability matrices computed. Click "Refresh Forecast" to generate.
                </div>
              )}
            </div>
          </div>

          {/* Account Subscriptions & billing */}
          <div className="card glass" style={servicesCardStyle}>
            <div style={sectionTitleContainerStyle}>
              <CreditCard size={16} color="var(--secondary)" />
              <h3 style={sectionTitleStyle}>Billing & Services Matrix</h3>
            </div>
            
            <div style={servicesGridStyle}>
              <div style={serviceItemStyle}>
                <span style={serviceKeyStyle}>Contract Term</span>
                <span style={serviceValStyle}>{customer.contract}</span>
              </div>
              <div style={serviceItemStyle}>
                <span style={serviceKeyStyle}>Internet service</span>
                <span style={serviceValStyle}>{customer.internet_service}</span>
              </div>
              <div style={serviceItemStyle}>
                <span style={serviceKeyStyle}>Payment Method</span>
                <span style={serviceValStyle}>{customer.payment_method}</span>
              </div>
              <div style={serviceItemStyle}>
                <span style={serviceKeyStyle}>Online Security</span>
                <span style={serviceValStyle}>{customer.online_security}</span>
              </div>
              <div style={serviceItemStyle}>
                <span style={serviceKeyStyle}>Tech Support</span>
                <span style={serviceValStyle}>{customer.tech_support}</span>
              </div>
              <div style={serviceItemStyle}>
                <span style={serviceKeyStyle}>Tenure Duration</span>
                <span style={serviceValStyle}>{customer.tenure} months</span>
              </div>
              <div style={serviceItemStyle}>
                <span style={serviceKeyStyle}>Monthly charges</span>
                <span style={serviceValStyle}>${customer.monthly_charges.toFixed(2)}</span>
              </div>
              <div style={serviceItemStyle}>
                <span style={serviceKeyStyle}>Total charges</span>
                <span style={serviceValStyle}>${customer.total_charges.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Internal Page styles
const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '24px',
  marginBottom: '32px',
};

const backBtnStyle: React.CSSProperties = {
  padding: '8px 16px',
};

const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  marginTop: '4px',
};

const errorCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '48px',
  textAlign: 'center',
  gap: '16px',
  maxWidth: '460px',
  margin: '40px auto 0 auto',
};

const detailGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '320px 1fr',
  gap: '24px',
};

const leftColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const rightColStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
};

const gaugeCardStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '24px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text-primary)',
  marginBottom: '4px',
};

const chartSubtitleStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginTop: '2px',
};

const gaugeContainerStyle: React.CSSProperties = {
  position: 'relative',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  margin: '24px 0',
};

const gaugeTextContainerStyle: React.CSSProperties = {
  position: 'absolute',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
};

const gaugePercentageStyle: React.CSSProperties = {
  fontSize: '36px',
  fontFamily: 'var(--font-display)',
  fontWeight: 800,
  color: 'var(--text-primary)',
};

const gaugeLabelStyle: React.CSSProperties = {
  fontSize: '9px',
  fontWeight: 600,
  color: 'var(--text-muted)',
  letterSpacing: '0.05em',
};

const statusBannerContainerStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  justifyContent: 'center',
  marginBottom: '20px',
};

const statusBannerStyle: React.CSSProperties = {
  display: 'inline-block',
  padding: '6px 12px',
  fontSize: '11px',
  fontWeight: 700,
  borderRadius: '4px',
  border: '1px solid',
  textAlign: 'center',
};

const recomputeBtnStyle: React.CSSProperties = {
  width: '100%',
  justifyContent: 'center',
  padding: '10px',
  fontSize: '13px',
};

const demographicsCardStyle: React.CSSProperties = {
  padding: '24px',
};

const sectionTitleContainerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '16px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '15px',
  color: 'var(--text-primary)',
};

const detailsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
};

const detailsRowStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const detailsKeyStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

const detailsValStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 500,
  color: 'var(--text-primary)',
};

const shapCardStyle: React.CSSProperties = {
  padding: '24px',
  flex: 1,
  display: 'flex',
  flexDirection: 'column',
};

const chartAreaStyle: React.CSSProperties = {
  marginTop: '20px',
  flex: 1,
  minHeight: 0,
};

const noShapDataStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
  textAlign: 'center',
  padding: '40px',
};

const servicesCardStyle: React.CSSProperties = {
  padding: '24px',
};

const servicesGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
  gap: '16px',
};

const serviceItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  padding: '12px',
  borderRadius: 'var(--radius-sm)',
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.01)',
};

const serviceKeyStyle: React.CSSProperties = {
  fontSize: '10px',
  color: 'var(--text-secondary)',
  textTransform: 'uppercase',
  letterSpacing: '0.02em',
};

const serviceValStyle: React.CSSProperties = {
  fontSize: '13px',
  fontWeight: 600,
  color: 'var(--text-primary)',
};

// SHAP Tooltip custom styling
const tooltipStyle: React.CSSProperties = {
  backgroundColor: 'var(--bg-secondary)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '14px',
  boxShadow: 'var(--shadow-lg)',
  maxWidth: '280px',
};

const tooltipTitleStyle: React.CSSProperties = {
  fontSize: '13px',
  color: '#fff',
  marginBottom: '6px',
};

const tooltipValueStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginBottom: '4px',
};

const tooltipImpactStyle: React.CSSProperties = {
  fontSize: '12px',
  marginBottom: '8px',
};

const tooltipDescStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
  lineHeight: '1.4',
};
