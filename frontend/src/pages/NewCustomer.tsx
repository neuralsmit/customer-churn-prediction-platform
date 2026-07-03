import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { ArrowLeft, UserPlus2, RefreshCcw } from 'lucide-react';

export const NewCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form states with realistic default values
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    gender: 'Female',
    partner: 'No',
    dependents: 'No',
    phone_service: 'Yes',
    multiple_lines: 'No',
    internet_service: 'Fiber optic',
    online_security: 'No',
    online_backup: 'No',
    device_protection: 'No',
    tech_support: 'No',
    streaming_tv: 'No',
    streaming_movies: 'No',
    tenure: 12,
    contract: 'Month-to-month',
    paperless_billing: 'Yes',
    payment_method: 'Electronic check',
    monthly_charges: 70.00,
    total_charges: 840.00
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Convert numerical inputs
    let parsedValue: any = value;
    if (name === 'tenure') {
      parsedValue = parseInt(value) || 0;
    } else if (name === 'monthly_charges') {
      parsedValue = parseFloat(value) || 0.0;
    }

    setForm(prev => {
      const updated = { ...prev, [name]: parsedValue };
      // Auto-calculate TotalCharges dynamically if either tenure or monthly charges changes
      if (name === 'tenure' || name === 'monthly_charges') {
        const t = name === 'tenure' ? parsedValue : prev.tenure;
        const m = name === 'monthly_charges' ? parsedValue : prev.monthly_charges;
        updated.total_charges = parseFloat((t * m).toFixed(2));
      }
      return updated;
    });
  };

  const handleTotalChargesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value) || 0.0;
    setForm(prev => ({ ...prev, total_charges: val }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!form.name || !form.email || !form.phone) {
      setError('Please fill in all core contact information fields.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    try {
      // Predict manual input creates both customer & prediction log
      const res = await api.post<any>('/predictions/manual', form);
      // Redirect to Prediction detail page using the database customer ID
      navigate(`/predictions/${res.customer_id}`);
    } catch (err: any) {
      setError(err.message || 'Failed to submit profile. Please verify input formats.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-body">
      {/* Back Header Nav */}
      <div style={headerStyle}>
        <button onClick={() => navigate(-1)} className="btn btn-secondary" style={backBtnStyle}>
          <ArrowLeft size={16} />
          <span>Back</span>
        </button>
        <div>
          <h1 className="page-title">Run Predictive Analytics</h1>
          <p style={subtitleStyle}>Input customer attributes manually to compute churn probability and feature drivers.</p>
        </div>
      </div>

      {/* Form Error Message */}
      {error && <div style={errorStyle}>{error}</div>}

      {/* Form card wrapper */}
      <form onSubmit={handleSubmit} className="card glass" style={formCardStyle}>
        {/* SECTION 1: Contact Details */}
        <div style={formSectionStyle}>
          <h3 style={sectionTitleStyle}>1. Account & Core Contact</h3>
          <div style={formGrid3Style}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">Full Name</label>
              <input
                id="name"
                name="name"
                type="text"
                className="form-input"
                required
                placeholder="e.g. John Doe"
                value={form.name}
                onChange={handleChange}
              />
            </div>
            
            <div className="form-group">
              <label className="form-label" htmlFor="email">Email Address</label>
              <input
                id="email"
                name="email"
                type="email"
                className="form-input"
                required
                placeholder="john.doe@example.com"
                value={form.email}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                name="phone"
                type="text"
                className="form-input"
                required
                placeholder="+1-555-0199"
                value={form.phone}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Billing & Subscriptions */}
        <div style={formSectionStyle}>
          <h3 style={sectionTitleStyle}>2. Billing & Contract Settings</h3>
          <div style={formGrid4Style}>
            <div className="form-group">
              <label className="form-label" htmlFor="tenure">Tenure (Months)</label>
              <input
                id="tenure"
                name="tenure"
                type="number"
                min="0"
                max="120"
                className="form-input"
                required
                value={form.tenure}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="contract">Contract Duration</label>
              <select
                id="contract"
                name="contract"
                className="form-select"
                value={form.contract}
                onChange={handleChange}
              >
                <option value="Month-to-month">Month-to-month</option>
                <option value="One year">One year</option>
                <option value="Two year">Two year</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="payment_method">Payment Method</label>
              <select
                id="payment_method"
                name="payment_method"
                className="form-select"
                value={form.payment_method}
                onChange={handleChange}
              >
                <option value="Electronic check">Electronic check</option>
                <option value="Mailed check">Mailed check</option>
                <option value="Bank transfer">Bank transfer (automatic)</option>
                <option value="Credit card">Credit card (automatic)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="paperless_billing">Paperless Billing</label>
              <select
                id="paperless_billing"
                name="paperless_billing"
                className="form-select"
                value={form.paperless_billing}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="monthly_charges">Monthly Charges ($)</label>
              <input
                id="monthly_charges"
                name="monthly_charges"
                type="number"
                step="0.01"
                min="10"
                className="form-input"
                required
                value={form.monthly_charges}
                onChange={handleChange}
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="total_charges">Total Charges ($)</label>
              <input
                id="total_charges"
                name="total_charges"
                type="number"
                step="0.01"
                className="form-input"
                required
                value={form.total_charges}
                onChange={handleTotalChargesChange}
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Demographics & Services */}
        <div style={formSectionStyle}>
          <h3 style={sectionTitleStyle}>3. Demographics & Subscribed Add-ons</h3>
          <div style={formGrid4Style}>
            <div className="form-group">
              <label className="form-label" htmlFor="gender">Gender</label>
              <select
                id="gender"
                name="gender"
                className="form-select"
                value={form.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="partner">Has Partner</label>
              <select
                id="partner"
                name="partner"
                className="form-select"
                value={form.partner}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="dependents">Has Dependents</label>
              <select
                id="dependents"
                name="dependents"
                className="form-select"
                value={form.dependents}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="phone_service">Phone Line Subscribed</label>
              <select
                id="phone_service"
                name="phone_service"
                className="form-select"
                value={form.phone_service}
                onChange={handleChange}
              >
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="multiple_lines">Multiple Lines</label>
              <select
                id="multiple_lines"
                name="multiple_lines"
                className="form-select"
                value={form.multiple_lines}
                onChange={handleChange}
                disabled={form.phone_service === 'No'}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No phone service">No phone service</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="internet_service">Internet Service Provider</label>
              <select
                id="internet_service"
                name="internet_service"
                className="form-select"
                value={form.internet_service}
                onChange={handleChange}
              >
                <option value="Fiber optic">Fiber optic</option>
                <option value="DSL">DSL</option>
                <option value="No">No (No internet)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="online_security">Online Security Shield</label>
              <select
                id="online_security"
                name="online_security"
                className="form-select"
                value={form.online_security}
                onChange={handleChange}
                disabled={form.internet_service === 'No'}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="online_backup">Cloud Backup</label>
              <select
                id="online_backup"
                name="online_backup"
                className="form-select"
                value={form.online_backup}
                onChange={handleChange}
                disabled={form.internet_service === 'No'}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="device_protection">Device Protection Plan</label>
              <select
                id="device_protection"
                name="device_protection"
                className="form-select"
                value={form.device_protection}
                onChange={handleChange}
                disabled={form.internet_service === 'No'}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="tech_support">Premium Support Support</label>
              <select
                id="tech_support"
                name="tech_support"
                className="form-select"
                value={form.tech_support}
                onChange={handleChange}
                disabled={form.internet_service === 'No'}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="streaming_tv">Streaming TV Services</label>
              <select
                id="streaming_tv"
                name="streaming_tv"
                className="form-select"
                value={form.streaming_tv}
                onChange={handleChange}
                disabled={form.internet_service === 'No'}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="streaming_movies">Streaming Movie Services</label>
              <select
                id="streaming_movies"
                name="streaming_movies"
                className="form-select"
                value={form.streaming_movies}
                onChange={handleChange}
                disabled={form.internet_service === 'No'}
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
                <option value="No internet service">No internet service</option>
              </select>
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div style={footerStyle}>
          <button 
            type="submit" 
            className="btn btn-primary" 
            style={submitBtnStyle}
            disabled={loading}
          >
            {loading ? (
              <>
                <RefreshCcw size={16} className="spin-animation" />
                <span>Computing Churn Score...</span>
              </>
            ) : (
              <>
                <UserPlus2 size={16} />
                <span>Generate Risk Explanation</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

// Internal Page CSS Style Objects
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

const errorStyle: React.CSSProperties = {
  padding: '16px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: 'var(--risk-high)',
  marginBottom: '24px',
};

const formCardStyle: React.CSSProperties = {
  padding: '32px',
};

const formSectionStyle: React.CSSProperties = {
  marginBottom: '32px',
  borderBottom: '1px solid var(--border)',
  paddingBottom: '24px',
};

const sectionTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'var(--primary)',
  marginBottom: '20px',
  textTransform: 'uppercase',
  letterSpacing: '0.05em',
};

const formGrid3Style: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
  gap: '20px',
};

const formGrid4Style: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
  gap: '20px',
};

const footerStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'flex-end',
  marginTop: '20px',
};

const submitBtnStyle: React.CSSProperties = {
  padding: '12px 28px',
  fontSize: '15px',
  fontWeight: 600,
};
