import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosInstance } from '../shared/api/axiosInstance';
import { queryClient } from '../shared/api/queryClient';

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<{success: boolean; message?: string}>;
  register: (data: { email: string; password: string; full_name: string; role: 'user' | 'dealer' }) => Promise<{success: boolean; message?: string}>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,

      setAuthenticated: (status) => set({ isAuthenticated: status }),

      login: async (email, password) => {
        try {
          const res = await axiosInstance.post('/auth/login', { email, password });
          if (res.status === 200) {
            set({ isAuthenticated: true });
            return { success: true };
          }
          return { success: false, message: 'Login failed.' };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Login failed. Please try again.';
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
          };
          const res = await axiosInstance.post(endpoint, payload);
          if (res.data?.id) {
             return await get().login(data.email, data.password);
          }
          return { success: false, message: 'Registration failed.' };
        } catch (error: any) {
          const msg = error.response?.data?.detail || 'Registration failed. Please try again.';
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
