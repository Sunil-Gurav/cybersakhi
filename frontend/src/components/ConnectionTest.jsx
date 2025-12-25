import React, { useState, useEffect } from 'react';
import api from '../api/apiclient';

const ConnectionTest = () => {
  const [status, setStatus] = useState('testing');
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    testConnection();
  }, []);

  const testDatabase = async () => {
    try {
      setStatus('testing');
      setError(null);
      
      console.log('🔍 Testing database connection...');
      
      const result = await api.get('/db-test', {
        timeout: 15000 // 15 second timeout for DB operations
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
      
      // Test with a simple GET request first
      const result = await api.get('/', {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        }
      });
      
      // Also test the environment endpoint
      const testResult = await api.get('/test', {
        timeout: 5000
      });
      
      setResponse({
        ...result.data,
        environment: testResult.data.environment
      });
      setStatus('success');
      console.log('✅ Backend connection successful:', result.data);
      console.log('✅ Environment test:', testResult.data);
    } catch (err) {
      console.error('❌ Backend connection failed:', err);
      
      let errorMessage = 'Unknown error';
      
      if (err.code === 'NETWORK_ERROR' || err.message === 'Network Error') {
        errorMessage = 'Network Error - Check CORS or backend availability';
      } else if (err.code === 'ECONNABORTED') {
        errorMessage = 'Request timeout - Backend might be slow';
      } else if (err.response) {
        errorMessage = `HTTP ${err.response.status}: ${err.response.statusText}`;
        if (err.response.data?.error) {
          errorMessage += ` - ${err.response.data.error}`;
        }
      } else if (err.request) {
        errorMessage = 'No response from server - Check network connection';
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
        <div style={{ marginTop: '5px' }}>
          <strong>Error:</strong>
          <div style={{ fontSize: '10px', color: 'red' }}>
            {error}
          </div>
        </div>
      )}

      <div style={{ marginTop: '5px', display: 'flex', gap: '5px' }}>
        <button 
          onClick={testConnection}
          style={{ 
            padding: '2px 8px', 
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          🔄 Test API
        </button>
        
        <button 
          onClick={testDatabase}
          style={{ 
            padding: '2px 8px', 
            fontSize: '10px',
            cursor: 'pointer'
          }}
        >
          🗄️ Test DB
        </button>
      </div>
    </div>
  );
};

export default ConnectionTest;