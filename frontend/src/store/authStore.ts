import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosInstance } from '../shared/api/axiosInstance';
import { queryClient } from '../shared/api/queryClient';

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<{success: boolean; message?: string; otpDisabled?: boolean}>;
  verifyLogin: (email: string, code: string) => Promise<{success: boolean; message?: string}>;
  register: (data: { email: string; password: string; full_name: string; role: 'user' | 'dealer'; dealership_name?: string; dealership_address?: string }) => Promise<{success: boolean; message?: string; otpDisabled?: boolean}>;
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
          // Check if OTP is disabled (backend returns tokens directly)
          if (res.data.access_token) {
            set({ isAuthenticated: true });
            return { success: true, message: 'Login successful', otpDisabled: true };
          }
          // OTP is enabled (backend returns message)
          return { success: true, message: res.data.message || 'OTP sent', otpDisabled: false };
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
          const payload = data.role === 'user' 
            ? {
                email: data.email,
                password: data.password,
                full_name: data.full_name,
              }
            : {
                email: data.email,
                password: data.password,
                full_name: data.full_name,
                dealership_name: data.dealership_name || 'Pending Dealership',
                dealership_address: data.dealership_address || 'Pending Address',
              };
          const res = await axiosInstance.post(endpoint, payload);
          // Check if OTP is disabled (backend returns tokens directly)
          if (res.data.access_token) {
            set({ isAuthenticated: true });
            return { success: true, message: 'Registration successful', otpDisabled: true };
          }
          // OTP is enabled (backend returns message)
          return { success: true, message: res.data.message || 'OTP sent', otpDisabled: false };
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
