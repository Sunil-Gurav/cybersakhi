import React, { useState, useEffect } from 'react';
import api from '../api/apiclient';

const ConnectionTest = () => {
  const [status, setStatus] = useState('testing');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    try {
      setStatus('testing');
      setError(null);
      
      console.log('🔍 Testing connection to backend...');
      const result = await api.get('/');
      
      setResponse(result.data);
      setStatus('success');
      console.log('✅ Backend connection successful:', result.data);
    } catch (err) {
      setError(err.message);
      setStatus('error');
      console.error('❌ Backend connection failed:', err);
    }
  };

  return (
    <div style={{ 
      position: 'fixed', 
      top: '10px', 
      right: '10px', 
      background: 'white', 
      padding: '10px', 
      border: '1px solid #ccc',
      borderRadius: '5px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px'
    }}>
      <h4>🌐 Backend Connection</h4>
      
      <div>
        <strong>Status:</strong> 
        <span style={{ 
          color: status === 'success' ? 'green' : status === 'error' ? 'red' : 'orange',
          marginLeft: '5px'
        }}>
          {status === 'testing' && '🔄 Testing...'}
          {status === 'success' && '✅ Connected'}
          {status === 'error' && '❌ Failed'}
        </span>
      </div>

      <div style={{ marginTop: '5px' }}>
        <strong>API URL:</strong> 
        <div style={{ fontSize: '10px', wordBreak: 'break-all' }}>
          {import.meta.env.PROD ? 'https://cybersakhi-backend.vercel.app' : 'http://localhost:5000'}
        </div>
      </div>

      {response && (
        <div style={{ marginTop: '5px' }}>
          <strong>Response:</strong>
          <div style={{ fontSize: '10px', color: 'green' }}>
            {response.message}
          </div>
        </div>
      )}

      {error && (
        <div style={{ marginTop: '5px' }}>
          <strong>Error:</strong>
          <div style={{ fontSize: '10px', color: 'red' }}>
            {error}
          </div>
        </div>
      )}

      <button 
        onClick={testConnection}
        style={{ 
          marginTop: '5px', 
          padding: '2px 8px', 
          fontSize: '10px',
          cursor: 'pointer'
        }}
      >
        🔄 Test Again
      </button>
    </div>
  );
};

export default ConnectionTest;