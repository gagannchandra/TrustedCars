import axios from 'axios';
import toast from 'react-hot-toast';

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && originalRequest.url !== '/auth/login') {
      if (!originalRequest._retry) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then(() => axiosInstance(originalRequest))
            .catch(err => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          await axios.post(`${axiosInstance.defaults.baseURL}/auth/refresh`, {}, { withCredentials: true });
          isRefreshing = false;
          processQueue(null);
          return axiosInstance(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          processQueue(refreshError);
          window.dispatchEvent(new CustomEvent('auth:unauthorized'));
          return Promise.reject(refreshError);
        }
      }
    }
    
    // Global error toasts
    if (error.response) {
      const status = error.response.status;
      if (status === 403) toast.error('You do not have permission to perform this action.');
      else if (status === 404) toast.error('Resource not found.');
      else if (status === 422) toast.error('Validation error. Please check your inputs.');
      else if (status >= 500) toast.error('Internal server error. Please try again later.');
    }
    
    return Promise.reject(error);
  }
);
