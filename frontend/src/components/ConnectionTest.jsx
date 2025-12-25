import React, { useState, useEffect } from 'react';
import api from '../api/apiclient';

const ConnectionTest = () => {
  const [status, setStatus] = useState('ready'); // Start with 'ready' instead of 'testing'
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  const [backendUrl, setBackendUrl] = useState('');

  useEffect(() => {
    // Determine backend URL
    const url = import.meta.env.PROD ? 'https://cybersakhi-backend.vercel.app' : 'http://localhost:5000';
    setBackendUrl(url);
    
    // Don't auto-test to avoid errors - let user manually test
    setStatus('ready');
  }, []);

  const testDatabase = async () => {
    try {
      setStatus('testing');
      setError(null);
      
      console.log('🔍 Testing database connection...');
      
      const result = await api.get('/db-test', {
        timeout: 45000 // 45 second timeout for DB operations
      });
      
      setResponse(result.data);
      setStatus('success');
      console.log('✅ Database connection successful:', result.data);
    } catch (err) {
      console.error('❌ Database connection failed:', err);
      
      let errorMessage = 'Database connection failed';
      
      if (err.response?.data?.error) {
        errorMessage = err.response.data.error;
      } else if (err.response) {
        errorMessage = `HTTP ${err.response.status}: ${err.response.statusText}`;
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setStatus('error');
    }
  };

  const testConnection = async () => {
    try {
      setStatus('testing');
      setError(null);
      
      console.log('🔍 Testing connection to backend...');
      console.log('🔍 API Base URL:', api.defaults.baseURL);
      
      // First try a quick ping with very short timeout
      try {
        console.log('🏓 Trying quick ping...');
        const pingResult = await api.get('/ping', {
          timeout: 5000 // 5 second timeout for ping
        });
        console.log('✅ Ping successful:', pingResult.data);
      } catch (pingError) {
        console.log('⚠️ Ping failed, trying main endpoint...');
      }
      
      // Test with main endpoint
      const result = await api.get('/', {
        timeout: 30000, // 30 second timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Try to get environment info
      let environmentData = null;
      try {
        const testResult = await api.get('/test', {
          timeout: 15000 // 15 second timeout for test endpoint
        });
        environmentData = testResult.data.environment;
      } catch (testError) {
        console.log('⚠️ Environment test failed:', testError.message);
      }
      
      setResponse({
        ...result.data,
        environment: environmentData
      });
      setStatus('success');
      console.log('✅ Backend connection successful:', result.data);
    } catch (err) {
      console.error('❌ Backend connection failed:', err);
      
      let errorMessage = 'Connection failed';
      
      if (err.code === 'ECONNABORTED') {
        errorMessage = `Timeout (${err.config?.timeout || 'unknown'}ms) - Backend unavailable or slow`;
      } else if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
        errorMessage = 'Network Error - Backend server unreachable';
      } else if (err.response) {
        errorMessage = `HTTP ${err.response.status}: ${err.response.statusText}`;
        if (err.response.data?.error) {
          errorMessage += ` - ${err.response.data.error}`;
        }
      } else if (err.request) {
        errorMessage = 'No response - Check backend server status';
      } else {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setStatus('error');
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
      maxWidth: '320px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <h4 style={{ margin: '0 0 8px 0' }}>🌐 Backend Connection</h4>
      
      <div style={{ marginBottom: '5px' }}>
        <strong>Status:</strong> 
        <span style={{ 
          color: status === 'success' ? 'green' : status === 'error' ? 'red' : status === 'testing' ? 'orange' : 'blue',
          marginLeft: '5px'
        }}>
          {status === 'testing' && '🔄 Testing...'}
          {status === 'success' && '✅ Connected'}
          {status === 'error' && '❌ Failed'}
          {status === 'ready' && '⚪ Ready to test'}
        </span>
      </div>

      <div style={{ marginBottom: '5px' }}>
        <strong>Backend:</strong> 
        <div style={{ fontSize: '10px', wordBreak: 'break-all', color: '#666' }}>
          {backendUrl}
        </div>
        <div style={{ fontSize: '10px', color: 'gray' }}>
          Mode: {import.meta.env.PROD ? 'Production' : 'Development'}
        </div>
      </div>

      {response && (
        <div style={{ marginBottom: '5px' }}>
          <strong>Response:</strong>
          <div style={{ fontSize: '10px', color: 'green' }}>
            {response.message}
          </div>
          {response.environment && (
            <div style={{ fontSize: '10px', marginTop: '3px' }}>
              <strong>Env:</strong> MongoDB: {response.environment.mongoUri}, 
              JWT: {response.environment.jwtSecret}, 
              Email: {response.environment.emailUser}
            </div>
          )}
        </div>
      )}

      {error && (
        <div style={{ marginBottom: '5px' }}>
          <strong>Error:</strong>
          <div style={{ fontSize: '10px', color: 'red' }}>
            {error}
          </div>
          {status === 'error' && (
            <div style={{ fontSize: '9px', color: '#666', marginTop: '2px' }}>
              💡 Try: {import.meta.env.PROD ? 'Check Vercel deployment' : 'Run "npm start" in backend folder'}
            </div>
          )}
        </div>
      )}

      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
        <button 
          onClick={testConnection}
          style={{ 
            padding: '3px 8px', 
            fontSize: '10px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '3px',
            background: '#f5f5f5'
          }}
        >
          🔄 Test API
        </button>
        
        <button 
          onClick={testDatabase}
          style={{ 
            padding: '3px 8px', 
            fontSize: '10px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '3px',
            background: '#f5f5f5'
          }}
        >
          🗄️ Test DB
        </button>
        
        <button 
          onClick={() => window.open(backendUrl, '_blank')}
          style={{ 
            padding: '3px 8px', 
            fontSize: '10px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '3px',
            background: '#f5f5f5'
          }}
        >
          🔗 Open Backend
        </button>
      </div>
    </div>
  );
};

export default ConnectionTest;