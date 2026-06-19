import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '../types';
import { axiosInstance } from '../shared/api/axiosInstance';
import toast from 'react-hot-toast';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  wishlist: string[];
  
  setUser: (user: User) => void;
  setAuthenticated: (status: boolean) => void;
  logout: () => void;
  
  fetchProfile: () => Promise<void>;
  toggleWishlist: (carId: string) => void;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { email: string; password: string; full_name: string; role: 'user' | 'dealer' }) => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      wishlist: [],

      setUser: (user) => set({ user }),
      setAuthenticated: (status) => set({ isAuthenticated: status }),

      login: async (email, password) => {
        try {
          const res = await axiosInstance.post('/auth/login', { email, password });
          if (res.status === 200) {
            set({ isAuthenticated: true });
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
        set({ user: null, isAuthenticated: false, wishlist: [] });
        axiosInstance.post('/auth/logout').catch(() => {});
      },

      fetchProfile: async () => {
        try {
          const [userRes, wishlistRes] = await Promise.all([
            axiosInstance.get('/users/me'),
            axiosInstance.get('/wishlist').catch(() => ({ data: { items: [] } }))
          ]);
          set({ 
            user: userRes.data, 
            isAuthenticated: true,
            wishlist: wishlistRes.data?.items?.map((item: any) => item.car_id) || []
          });
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
