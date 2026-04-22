import axios from "axios";

// Use VITE_API_URL from environment variables, default to localhost:5001
const BASE_URL = import.meta.env.VITE_API_URL 
  ? `${import.meta.env.VITE_API_URL}/api`
  : "http://localhost:5001/api";

export const axiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

// Request interceptor for adding auth token if needed
axiosInstance.interceptors.request.use(
  (config) => {
    // Add any request headers here if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for handling errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', error.message);
      error.message = 'Unable to connect to the server. Please check your connection.';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
