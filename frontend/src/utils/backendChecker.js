// Simple backend status checker
export const checkBackendStatus = async () => {
  const isDev = !import.meta.env.PROD;
  const backendUrl = isDev ? 'http://localhost:5000' : 'https://cybersakhi-backend.vercel.app';
  
  console.log(`🔍 Checking backend status: ${backendUrl}`);
  
  try {
    // Try a simple fetch with short timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(`${backendUrl}/ping`, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ Backend is running:', data);
      return { 
        status: 'online', 
        url: backendUrl, 
        data,
        message: 'Backend is running normally'
      };
    } else {
      console.log('⚠️ Backend responded with error:', response.status);
      return { 
        status: 'error', 
        url: backendUrl, 
        error: `HTTP ${response.status}`,
        message: `Backend returned ${response.status} error`
      };
    }
  } catch (error) {
    console.log('❌ Backend check failed:', error.message);
    
    let message = 'Backend is not responding';
    if (error.name === 'AbortError') {
      message = 'Backend timeout - server might be slow or down';
    } else if (error.message.includes('fetch')) {
      message = isDev ? 
        'Local backend not running - try "npm start" in backend folder' :
        'Production backend is down - check Vercel deployment';
    }
    
    return { 
      status: 'offline', 
      url: backendUrl, 
      error: error.message,
      message
    };
  }
};

// Quick backend health check
export const quickHealthCheck = async () => {
  try {
    const result = await checkBackendStatus();
    return result.status === 'online';
  } catch (error) {
    return false;
  }
};