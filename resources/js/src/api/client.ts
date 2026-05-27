import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  headers: {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  }
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
    }

    if (error.response?.status >= 500) {
      const currentPath = window.location.pathname;
      if (!currentPath.endsWith('/error')) {
        sessionStorage.setItem(
          'app_last_error',
          JSON.stringify({
            status: error.response.status,
            message: error.response.data?.message || 'Something went wrong. Please try again later.'
          })
        );
        window.dispatchEvent(
          new CustomEvent('app:server-error', {
            detail: {
              status: error.response.status,
              message: error.response.data?.message || 'Something went wrong. Please try again later.'
            }
          })
        );
        window.location.assign('/error');
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
