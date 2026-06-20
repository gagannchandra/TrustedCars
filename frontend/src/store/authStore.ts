import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosInstance } from '../shared/api/axiosInstance';
import { queryClient } from '../shared/api/queryClient';

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<{success: boolean; message?: string}>;
  verifyLogin: (email: string, code: string) => Promise<{success: boolean; message?: string}>;
  register: (data: { email: string; password: string; full_name: string; role: 'user' | 'dealer' }) => Promise<{success: boolean; message?: string}>;
  verifyRegistration: (email: string, code: string) => Promise<{success: boolean; message?: string}>;
  forgotPassword: (email: string) => Promise<{success: boolean; message?: string}>;
  verifyResetPassword: (email: string, code: string) => Promise<{success: boolean; message?: string; resetToken?: string}>;
  resetPassword: (resetToken: string, newPassword: string) => Promise<{success: boolean; message?: string}>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,

      setAuthenticated: (status) => set({ isAuthenticated: status }),

      login: async (email, password) => {
        try {
          const res = await axiosInstance.post('/auth/login', { email, password });
          return { success: true, message: res.data.message || 'OTP sent' };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Login failed. Please try again.';
          return { success: false, message: msg };
        }
      },

      verifyLogin: async (email, code) => {
        try {
          const res = await axiosInstance.post('/auth/verify-login', { email, code });
          if (res.status === 200) {
            set({ isAuthenticated: true });
            return { success: true };
          }
          return { success: false, message: 'Verification failed.' };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Invalid verification code.';
          return { success: false, message: msg };
        }
      },

      register: async (data) => {
        try {
          const endpoint = data.role === 'user' ? '/auth/register/user' : '/auth/register/dealer';
          const payload = {
            email: data.email,
            password: data.password,
            full_name: data.full_name,
            ...(data.role === 'dealer' && {
              dealership_name: (data as any).dealership_name || 'Pending Dealership',
              dealership_address: (data as any).dealership_address || 'Pending Address',
            })
          };
          const res = await axiosInstance.post(endpoint, payload);
          return { success: true, message: res.data.message || 'OTP sent' };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Registration failed. Please try again.';
          return { success: false, message: msg };
        }
      },

      verifyRegistration: async (email, code) => {
        try {
          const res = await axiosInstance.post('/auth/verify-registration', { email, code });
          if (res.status === 200) {
            set({ isAuthenticated: true });
            return { success: true };
          }
          return { success: false, message: 'Verification failed.' };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Invalid verification code.';
          return { success: false, message: msg };
        }
      },

      forgotPassword: async (email) => {
        try {
          const res = await axiosInstance.post('/auth/forgot-password', { email });
          return { success: true, message: res.data.message };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Failed to request password reset.';
          return { success: false, message: msg };
        }
      },

      verifyResetPassword: async (email, code) => {
        try {
          const res = await axiosInstance.post('/auth/verify-reset-password', { email, code });
          return { success: true, resetToken: res.data.reset_token };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Invalid reset code.';
          return { success: false, message: msg };
        }
      },

      resetPassword: async (resetToken, newPassword) => {
        try {
          const res = await axiosInstance.post('/auth/reset-password', { 
            reset_token: resetToken, 
            new_password: newPassword 
          });
          return { success: true, message: res.data.message };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Failed to reset password.';
          return { success: false, message: msg };
        }
      },

      logout: () => {
        set({ isAuthenticated: false });
        queryClient.clear();
        axiosInstance.post('/auth/logout').catch(() => {});
      },
    }),
    {
      name: 'trustedcars-auth',
    }
  )
);

if (typeof window !== 'undefined') {
  window.addEventListener('auth:unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
