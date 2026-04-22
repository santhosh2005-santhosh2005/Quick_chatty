import axios from "axios";

// Use VITE_API_URL from environment variables with fallback
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";
const BASE_URL = `${API_URL}/api`;

console.log("API Base URL:", BASE_URL);

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log(`[AXIOS] ${config.method?.toUpperCase()} ${config.url}`, config.params || '');
    return config;
  },
  (error) => {
    console.error('[AXIOS] Request Error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log(`[AXIOS] Response ${response.status} ${response.config.url}`);
    return response.data;
  },
  (error) => {
    const { response } = error;
    let errorMessage = 'Network error. Please check your connection.';
    
    if (response) {
      // Server responded with a status code outside 2xx
      errorMessage = response.data?.message || error.message;
      console.error(`[AXIOS] Error ${response.status}:`, errorMessage);
      
      // Handle specific status codes
      if (response.status === 401) {
        // Handle unauthorized (e.g., redirect to login)
        console.warn('Authentication required');
      } else if (response.status === 403) {
        console.warn('Access forbidden');
      } else if (response.status === 404) {
        console.warn('Resource not found');
      } else if (response.status >= 500) {
        console.error('Server error:', response.data);
      }
    } else if (error.request) {
      // Request was made but no response received
      console.error('No response received:', error.request);
    } else {
      // Something happened in setting up the request
      console.error('Request setup error:', error.message);
    }
    
    // Return a consistent error format
    return Promise.reject({
      message: errorMessage,
      status: response?.status,
      data: response?.data,
      originalError: error
    });
  }
);

export default axiosInstance;
