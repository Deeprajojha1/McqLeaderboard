import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
});

// Global response interceptor to handle authentication failures
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // If the backend returns 401 Unauthorized, notify the AuthContext
    if (error.response && error.response.status === 401) {
      console.warn('Session expired or unauthorized. Dispatching logout event...');
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export default api;
