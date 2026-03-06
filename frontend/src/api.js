// api.js - Centralized backend URL configuration
// Using Vite environment variables (must start with VITE_)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export default API_URL;
