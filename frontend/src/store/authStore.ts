import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { axiosInstance } from '../shared/api/axiosInstance';

interface AuthState {
  isAuthenticated: boolean;
  setAuthenticated: (status: boolean) => void;
  logout: () => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; full_name: string; role: 'user' | 'dealer' }) => Promise<boolean>;
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
            return true;
          }
          return false;
        } catch (error) {
          return false;
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
          return false;
        } catch (error) {
          return false;
        }
      },

      logout: () => {
        set({ isAuthenticated: false });
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
