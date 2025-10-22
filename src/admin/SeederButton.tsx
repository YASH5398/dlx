import React, { useState } from 'react';
import { initServices } from '../utils/initServices';

type SeederButtonProps = {
  style?: React.CSSProperties;
  className?: string;
};

const SeederButton: React.FC<SeederButtonProps> = ({ style, className }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    try {
      await initServices();
      setSuccess(true);
      alert('✅ All default services added successfully!');
    } catch (err) {
      setError('Failed to add services');
      console.error('❌ Failed to add services:', err);
      alert('❌ Failed to add services');
    } finally {
      setLoading(false);
    }
  };

  const useDefaultColors = !className; // Use inline colors only when no className provided

  const baseStyle: React.CSSProperties = {
    padding: '10px 20px',
    fontSize: '16px',
    ...(useDefaultColors ? { backgroundColor: loading ? '#cccccc' : '#007bff', color: 'white' } : {}),
    border: 'none',
    borderRadius: '8px',
    cursor: loading ? 'not-allowed' : 'pointer',
    transition: 'background-color 0.3s ease',
    ...(style || {}),
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label="Add Default Services"
      className={className}
      style={baseStyle}
      onMouseEnter={(e) => {
        if (useDefaultColors && !loading) {
          e.currentTarget.style.backgroundColor = '#0056b3';
        }
      }}
      onMouseLeave={(e) => {
        if (useDefaultColors && !loading) {
          e.currentTarget.style.backgroundColor = '#007bff';
        }
      }}
    >
      {loading ? 'Adding Services...' : 'Add Default Services'}
    </button>
  );
};

export default SeederButton;