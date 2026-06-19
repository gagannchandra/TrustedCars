import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { axiosInstance } from '../shared/api/axiosInstance';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  wishlist: string[];
  
  setTokens: (access: string, refresh?: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  
  fetchProfile: () => Promise<void>;
  toggleWishlist: (carId: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; full_name: string; role: 'user' | 'admin' }) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      accessToken: null,
      refreshToken: null,
      wishlist: [],

      setTokens: (access, refresh) => {
        set((state) => ({
          accessToken: access,
          refreshToken: refresh !== undefined ? refresh : state.refreshToken,
          isAuthenticated: true,
        }));
      },

      setUser: (user) => set({ user }),

      login: async (email, password) => {
        try {
          const res = await axiosInstance.post('/auth/login', { email, password });
          if (res.data?.access_token) {
            get().setTokens(res.data.access_token, res.data.refresh_token);
            await get().fetchProfile();
            return true;
          }
          return false;
        } catch (error) {
          return false;
        }
      },

      register: async (data) => {
        try {
          // Send to correct endpoint based on role. (Assuming dealer if they provide dealer info, else user)
          const endpoint = data.role === 'user' ? '/auth/register/user' : '/auth/register/dealer';
          const payload = {
            email: data.email,
            password: data.password,
            full_name: data.full_name,
            // If dealer, we might need dealer fields, but for now just pass data.
          };
          const res = await axiosInstance.post(endpoint, payload);
          // Auto login after register
          if (res.data?.id) {
             return await get().login(data.email, data.password);
          }
          return false;
        } catch (error) {
          return false;
        }
      },

      logout: () => {
        set({ user: null, isAuthenticated: false, accessToken: null, refreshToken: null, wishlist: [] });
        // Optionally notify backend about logout
        axiosInstance.post('/auth/logout').catch(() => {});
      },

      fetchProfile: async () => {
        try {
          const res = await axiosInstance.get('/users/me');
          set({ user: res.data });
        } catch (error) {
          get().logout();
        }
      },

      toggleWishlist: async (carId: string) => {
        const { wishlist, isAuthenticated } = get();
        if (!isAuthenticated) {
          toast.error("Please login to manage your wishlist");
          return;
        }

        const isAdded = wishlist.includes(carId);
        
        // Optimistic update
        set({
          wishlist: isAdded
            ? wishlist.filter(id => id !== carId)
            : [...wishlist, carId]
        });

        try {
          if (isAdded) {
            await axiosInstance.delete(`/wishlist/${carId}`);
          } else {
            await axiosInstance.post(`/wishlist/${carId}`);
          }
        } catch (err) {
          // Revert on failure
          toast.error("Failed to update wishlist");
          set({ wishlist });
        }
      },
    }),
    {
      name: 'trustedcars-auth',
    }
  )
);
