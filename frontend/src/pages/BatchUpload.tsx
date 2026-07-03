import React, { useState } from 'react';
import { api } from '../services/api';
import { 
  Upload, FileText, CheckCircle2, AlertTriangle, 
  Brain, HelpCircle, ArrowRight, Download 
} from 'lucide-react';

interface BatchSummary {
  message: string;
  total_records: number;
  churn_predicted: number;
  non_churn_predicted: number;
  churn_rate: number;
}

export const BatchUpload: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<BatchSummary | null>(null);
  const [error, setError] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setSummary(null);
      setError('');
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSummary(null);

    if (!file) {
      setError('Please select a valid CSV file first.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.uploadFile<BatchSummary>('/predictions/batch', file);
      setSummary(result);
    } catch (err: any) {
      setError(err.message || 'Batch prediction failed. Make sure all required columns are present.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamic CSV template creation in client browser
  const handleDownloadTemplate = () => {
    const csvContent = 
      "name,email,phone,gender,partner,dependents,tenure,phone_service,multiple_lines,internet_service,online_security,online_backup,device_protection,tech_support,streaming_tv,streaming_movies,contract,paperless_billing,payment_method,monthly_charges,total_charges\n" +
      "Leonard Hofstadter,leonard@caltech.edu,+1-555-1022,Male,Yes,No,24,Yes,No,DSL,Yes,No,Yes,Yes,No,No,One year,No,Bank transfer,65.00,1560.00\n" +
      "Penny Teller,penny@cheesecake.com,+1-555-3044,Female,Yes,No,3,Yes,Yes,Fiber optic,No,Yes,No,No,Yes,Yes,Month-to-month,Yes,Electronic check,95.00,285.00\n" +
      "Sheldon Cooper,sheldon@caltech.edu,+1-555-7373,Male,No,No,72,Yes,Yes,Fiber optic,Yes,Yes,Yes,Yes,Yes,Yes,Two year,No,Credit card,115.00,8280.00";
      
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "sample_churn_upload.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="page-body">
      <div>
        <h1 className="page-title">Batch Analytics</h1>
        <p style={subtitleStyle}>Upload CSV customer sheets to execute batch predictions, database registration, and report exports.</p>
      </div>

      <div style={gridStyle}>
        {/* LEFT COLUMN: Upload Container */}
        <div style={leftColStyle}>
          {/* Error Banner */}
          {error && (
            <div style={errorStyle}>
              <AlertTriangle size={18} color="var(--risk-high)" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload card */}
          <form onSubmit={handleUploadSubmit} className="card glass" style={uploadCardStyle}>
            <h3 style={cardTitleStyle}>Upload Customer Sheets</h3>
            <p style={cardSubStyle}>Accepts comma-separated values (.csv) matching standard features.</p>
            
            <div style={dropzoneStyle}>
              <Upload size={36} color="var(--primary)" style={uploadIconStyle} />
              <input 
                type="file" 
                accept=".csv" 
                id="file-upload" 
                style={fileInputStyle} 
                onChange={handleFileChange}
              />
              <label htmlFor="file-upload" style={fileLabelStyle}>
                {file ? (
                  <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{file.name}</span>
                ) : (
                  <span>Click to choose file or drag it here</span>
                )}
              </label>
              {file && (
                <span style={fileSizeStyle}>
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              )}
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              style={submitBtnStyle}
              disabled={loading || !file}
            >
              {loading ? (
                <>
                  <div className="loader" style={miniLoaderStyle}></div>
                  <span>Running Inference Engine...</span>
                </>
              ) : (
                <>
                  <Brain size={16} />
                  <span>Execute Predictions</span>
                </>
              )}
            </button>
          </form>

          {/* Success summary display */}
          {summary && (
            <div className="card glass" style={summaryCardStyle}>
              <div style={summaryHeaderStyle}>
                <CheckCircle2 size={24} color="var(--risk-low)" />
                <h3 style={summaryTitleStyle}>Prediction Completed!</h3>
              </div>

              <div style={summaryGridStyle}>
                <div style={summaryStatStyle}>
                  <span style={statKeyStyle}>Records Processed</span>
                  <span style={statValStyle}>{summary.total_records}</span>
                </div>
                
                <div style={summaryStatStyle}>
                  <span style={statKeyStyle}>High-Risk Churners</span>
                  <span style={{ ...statValStyle, color: 'var(--risk-high)' }}>{summary.churn_predicted}</span>
                </div>

                <div style={summaryStatStyle}>
                  <span style={statKeyStyle}>Active / Safe</span>
                  <span style={{ ...statValStyle, color: 'var(--risk-low)' }}>{summary.non_churn_predicted}</span>
                </div>

                <div style={summaryStatStyle}>
                  <span style={statKeyStyle}>Batch Churn Rate</span>
                  <span style={{ ...statValStyle, color: 'var(--primary)' }}>{summary.churn_rate.toFixed(1)}%</span>
                </div>
              </div>

              <p style={summaryDescStyle}>{summary.message}</p>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Instructions & Sample Template */}
        <div style={rightColStyle}>
          <div className="card glass" style={infoCardStyle}>
            <div style={infoTitleStyle}>
              <HelpCircle size={18} color="var(--secondary)" />
              <h3>CSV Headers Instructions</h3>
            </div>
            
            <p style={infoDescStyle}>
              To perform accurate calculations, verify that your CSV matches standard column headers exactly.
            </p>
            
            <div style={colsListStyle}>
              <div style={colItemStyle}>
                <span style={colBadgeStyle}>Required ID</span>
                <code>customer_id, name, email, phone</code>
              </div>
              <div style={colItemStyle}>
                <span style={colBadgeStyle}>Demographics</span>
                <code>gender, partner, dependents</code>
              </div>
              <div style={colItemStyle}>
                <span style={colBadgeStyle}>Tenure & Rate</span>
                <code>tenure, contract, monthly_charges, total_charges</code>
              </div>
              <div style={colItemStyle}>
                <span style={colBadgeStyle}>Services</span>
                <code>phone_service, multiple_lines, internet_service</code>
              </div>
              <div style={colItemStyle}>
                <span style={colBadgeStyle}>Add-ons</span>
                <code>online_security, online_backup, tech_support</code>
              </div>
            </div>

            <button 
              onClick={handleDownloadTemplate} 
              className="btn btn-secondary" 
              style={downloadBtnStyle}
            >
              <Download size={14} />
              <span>Download CSV Template</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Styling definitions
const subtitleStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  marginTop: '4px',
  marginBottom: '32px',
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 340px',
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
};

const errorStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  padding: '16px',
  borderRadius: 'var(--radius-sm)',
  backgroundColor: 'rgba(239, 68, 68, 0.1)',
  border: '1px solid rgba(239, 68, 68, 0.3)',
  color: 'var(--risk-high)',
};

const uploadCardStyle: React.CSSProperties = {
  padding: '32px',
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'var(--text-primary)',
};

const cardSubStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  marginTop: '2px',
  marginBottom: '20px',
};

const dropzoneStyle: React.CSSProperties = {
  border: '2px dashed var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '40px 20px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: 'rgba(0,0,0,0.1)',
  cursor: 'pointer',
  position: 'relative',
  marginBottom: '24px',
};

const uploadIconStyle: React.CSSProperties = {
  marginBottom: '16px',
};

const fileInputStyle: React.CSSProperties = {
  position: 'absolute',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  opacity: 0,
  cursor: 'pointer',
  width: '100%',
};

const fileLabelStyle: React.CSSProperties = {
  fontSize: '14px',
  color: 'var(--text-secondary)',
  textAlign: 'center',
};

const fileSizeStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-muted)',
  marginTop: '6px',
};

const submitBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '12px',
  fontWeight: 600,
};

const miniLoaderStyle: React.CSSProperties = {
  width: '18px',
  height: '18px',
  borderWidth: '2px',
  marginRight: '8px',
};

const summaryCardStyle: React.CSSProperties = {
  padding: '24px',
  borderLeft: '4px solid var(--risk-low)',
};

const summaryHeaderStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '20px',
};

const summaryTitleStyle: React.CSSProperties = {
  fontSize: '16px',
  color: 'var(--text-primary)',
};

const summaryGridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
  gap: '16px',
  marginBottom: '16px',
};

const summaryStatStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const statKeyStyle: React.CSSProperties = {
  fontSize: '11px',
  color: 'var(--text-secondary)',
};

const statValStyle: React.CSSProperties = {
  fontSize: '20px',
  fontWeight: 750,
  fontFamily: 'var(--font-display)',
};

const summaryDescStyle: React.CSSProperties = {
  fontSize: '12px',
  color: 'var(--text-secondary)',
  lineHeight: '1.5',
};

const infoCardStyle: React.CSSProperties = {
  padding: '24px',
};

const infoTitleStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '10px',
  marginBottom: '14px',
};

const infoDescStyle: React.CSSProperties = {
  fontSize: '13px',
  color: 'var(--text-secondary)',
  lineHeight: '1.5',
  marginBottom: '20px',
};

const colsListStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '14px',
  marginBottom: '24px',
};

const colItemStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
};

const colBadgeStyle: React.CSSProperties = {
  fontSize: '10px',
  fontWeight: 700,
  color: 'var(--secondary)',
  textTransform: 'uppercase',
};

const downloadBtnStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px',
  fontSize: '12px',
  justifyContent: 'center',
};
