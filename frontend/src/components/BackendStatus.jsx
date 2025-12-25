import React, { useState, useEffect } from 'react';

const BackendStatus = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [backendRunning, setBackendRunning] = useState(null);
  const [checking, setChecking] = useState(false);

  const isDev = !import.meta.env.PROD;
  const backendUrl = isDev ? 'http://localhost:5000' : 'https://cybersakhi-backend.vercel.app';

  const checkBackend = async () => {
    setChecking(true);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${backendUrl}/ping`, {
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      setBackendRunning(response.ok);
    } catch (error) {
      setBackendRunning(false);
    }
    setChecking(false);
  };

  useEffect(() => {
    if (isDev) {
      checkBackend();
    }
  }, []);

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: backendRunning === false ? '#ffebee' : backendRunning === true ? '#e8f5e8' : '#fff3e0',
      border: `1px solid ${backendRunning === false ? '#f44336' : backendRunning === true ? '#4caf50' : '#ff9800'}`,
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '300px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong>🌐 Backend Status</strong>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '14px',
            padding: '0',
            color: '#666'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '8px' }}>
        <div style={{ fontSize: '10px', color: '#666' }}>
          {backendUrl}
        </div>
      </div>

      {checking && (
        <div style={{ color: '#ff9800' }}>
          🔄 Checking backend...
        </div>
      )}

      {backendRunning === true && (
        <div style={{ color: '#4caf50' }}>
          ✅ Backend is running normally
        </div>
      )}

      {backendRunning === false && (
        <div>
          <div style={{ color: '#f44336', marginBottom: '8px' }}>
            ❌ Backend not responding
          </div>
          
          {isDev ? (
            <div style={{ fontSize: '11px', color: '#666' }}>
              <strong>To fix:</strong>
              <br />1. Open terminal in backend folder
              <br />2. Run: <code style={{ background: '#f5f5f5', padding: '2px 4px' }}>npm start</code>
              <br />3. Wait for "Server running on port 5000"
            </div>
          ) : (
            <div style={{ fontSize: '11px', color: '#666' }}>
              <strong>Production backend issue:</strong>
              <br />Check Vercel deployment status
            </div>
          )}
        </div>
      )}

      <div style={{ marginTop: '8px', display: 'flex', gap: '5px' }}>
        <button 
          onClick={checkBackend}
          disabled={checking}
          style={{ 
            padding: '4px 8px', 
            fontSize: '10px',
            cursor: checking ? 'not-allowed' : 'pointer',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: checking ? '#f5f5f5' : 'white'
          }}
        >
          🔄 Check Again
        </button>
        
        <button 
          onClick={() => window.open(backendUrl, '_blank')}
          style={{ 
            padding: '4px 8px', 
            fontSize: '10px',
            cursor: 'pointer',
            border: '1px solid #ccc',
            borderRadius: '4px',
            background: 'white'
          }}
        >
          🔗 Open Backend
        </button>
      </div>
    </div>
  );
};

export default BackendStatus;