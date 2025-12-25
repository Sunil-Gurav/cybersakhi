import React, { useState } from 'react';

const SimpleBackendStatus = () => {
  const [isVisible, setIsVisible] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState(null);

  const isDev = !import.meta.env.PROD;
  const backendUrl = isDev ? 'http://localhost:5000' : 'https://cybersakhi-backend.vercel.app';

  const checkBackend = async () => {
    setIsChecking(true);
    setStatus(null);
    
    try {
      // Use a simple fetch with timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const response = await fetch(`${backendUrl}/ping`, {
        method: 'GET',
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        setStatus('online');
      } else {
        setStatus('error');
      }
    } catch (error) {
      setStatus('offline');
    }
    
    setIsChecking(false);
  };

  if (!isVisible) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'white',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      padding: '12px',
      fontSize: '12px',
      zIndex: 9999,
      maxWidth: '320px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <strong style={{ color: '#333' }}>🌐 Backend Status</strong>
        <button 
          onClick={() => setIsVisible(false)}
          style={{ 
            background: 'none', 
            border: 'none', 
            cursor: 'pointer', 
            fontSize: '16px',
            padding: '0',
            color: '#999'
          }}
        >
          ✕
        </button>
      </div>

      <div style={{ marginBottom: '10px', padding: '8px', background: '#f8f9fa', borderRadius: '4px' }}>
        <div style={{ fontSize: '11px', color: '#666', marginBottom: '4px' }}>
          <strong>Backend URL:</strong>
        </div>
        <div style={{ fontSize: '10px', wordBreak: 'break-all', color: '#333' }}>
          {backendUrl}
        </div>
      </div>

      {/* Status Display */}
      {isChecking && (
        <div style={{ color: '#ff9800', marginBottom: '8px', textAlign: 'center' }}>
          🔄 Checking backend...
        </div>
      )}

      {status === 'online' && (
        <div style={{ color: '#4caf50', marginBottom: '8px', textAlign: 'center' }}>
          ✅ Backend is running!
        </div>
      )}

      {status === 'offline' && (
        <div style={{ marginBottom: '8px' }}>
          <div style={{ color: '#f44336', marginBottom: '6px', textAlign: 'center' }}>
            ❌ Backend not responding
          </div>
          
          {isDev && (
            <div style={{ 
              fontSize: '11px', 
              color: '#666', 
              background: '#fff3cd', 
              padding: '8px', 
              borderRadius: '4px',
              border: '1px solid #ffeaa7'
            }}>
              <strong>💡 To start the backend:</strong>
              <br />1. Open terminal in backend folder
              <br />2. Run: <code style={{ background: '#f5f5f5', padding: '1px 3px', borderRadius: '2px' }}>npm start</code>
              <br />3. Wait for "Server running on port 5000"
            </div>
          )}
        </div>
      )}

      {status === 'error' && (
        <div style={{ color: '#f44336', marginBottom: '8px', textAlign: 'center' }}>
          ⚠️ Backend error (check logs)
        </div>
      )}

      {/* Default Instructions */}
      {!status && !isChecking && (
        <div style={{ 
          fontSize: '11px', 
          color: '#666', 
          background: '#e3f2fd', 
          padding: '8px', 
          borderRadius: '4px',
          marginBottom: '8px'
        }}>
          <strong>ℹ️ Quick Start:</strong>
          <br />• Click "Check Backend" to test connection
          <br />• Click "Open Backend" to test in browser
          {isDev && <><br />• Make sure to run <code>npm start</code> in backend folder</>}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
        <button 
          onClick={checkBackend}
          disabled={isChecking}
          style={{ 
            padding: '6px 12px', 
            fontSize: '11px',
            cursor: isChecking ? 'not-allowed' : 'pointer',
            border: '1px solid #2196f3',
            borderRadius: '4px',
            background: isChecking ? '#f5f5f5' : '#2196f3',
            color: isChecking ? '#999' : 'white',
            flex: '1'
          }}
        >
          {isChecking ? '🔄 Checking...' : '🔍 Check Backend'}
        </button>
        
        <button 
          onClick={() => window.open(backendUrl, '_blank')}
          style={{ 
            padding: '6px 12px', 
            fontSize: '11px',
            cursor: 'pointer',
            border: '1px solid #4caf50',
            borderRadius: '4px',
            background: '#4caf50',
            color: 'white',
            flex: '1'
          }}
        >
          🔗 Open Backend
        </button>
      </div>

      {/* Help Text */}
      <div style={{ 
        fontSize: '10px', 
        color: '#999', 
        marginTop: '8px', 
        textAlign: 'center',
        borderTop: '1px solid #eee',
        paddingTop: '6px'
      }}>
        {isDev ? 'Local Development Mode' : 'Production Mode'}
      </div>
    </div>
  );
};

export default SimpleBackendStatus;