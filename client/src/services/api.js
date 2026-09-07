import axios from 'axios';

const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('crm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Session expired / invalid token — clear it so ProtectedRoute redirects to login.
      localStorage.removeItem('crm_token');
      localStorage.removeItem('crm_user');
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Normalizes an Axios error into a plain, user-friendly message.
export const getErrorMessage = (error) => {
  return (
    error?.response?.data?.message ||
    (error?.response?.data?.errors && error.response.data.errors.join(', ')) ||
    error?.message ||
    'Something went wrong. Please try again.'
  );
};

export default api;
