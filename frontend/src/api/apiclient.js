// src/api/apiclient.js
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
    "x-ai-api-key": import.meta.env.VITE_AI_API_KEY || "",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("🔍 API Request - Token attached:", token.substring(0, 20) + "...");
  } else {
    console.log("⚠️ API Request - No token found in localStorage");
  }
  return config;
});

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
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
