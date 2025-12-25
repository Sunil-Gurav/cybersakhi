// src/api/apiclient.js
import axios from "axios";

// Production and development API URLs
const getBaseURL = () => {
  // Check if we're in production (deployed frontend)
  if (import.meta.env.PROD) {
    return "https://cybersakhi-backend.vercel.app";
  }
  
  // Check for custom environment variable
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE;
  }
  
  // Default to local development
  return "http://localhost:5000";
};

const api = axios.create({
  baseURL: getBaseURL(),
  headers: {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "x-ai-api-key": import.meta.env.VITE_AI_API_KEY || "",
  },
  timeout: 30000, // 30 second timeout for production
  withCredentials: false, // Set to false for CORS issues
});

// Log the API base URL for debugging
console.log("🌐 API Base URL:", getBaseURL());

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🔍 API Request to:", config.baseURL + config.url);
    console.log("🔍 Token attached:", token.substring(0, 20) + "...");
  } else {
    console.log("⚠️ API Request - No token found in localStorage");
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => {
    console.log("✅ API Response:", response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error("❌ API Error:", error.response?.status, error.config?.url);
    console.error("❌ Error details:", error.response?.data);
    
    if (error.response?.status === 401) {
      console.log("🚨 401 Unauthorized - Token might be expired");
      console.log("🔍 Current token:", localStorage.getItem("token")?.substring(0, 20) + "...");
      
      // Optionally redirect to login or show a message
      // window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;
