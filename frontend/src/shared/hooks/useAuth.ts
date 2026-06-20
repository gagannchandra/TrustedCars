import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../api/axiosInstance';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

export function useAuth() {
  const queryClient = useQueryClient();
  const { 
    isAuthenticated, 
    setAuthenticated, 
    login: storeLogin, 
    register: storeRegister, 
    logout: storeLogout 
  } = useAuthStore();

  const profileQuery = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const res = await axiosInstance.get('/users/me');
      return res.data;
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const wishlistQuery = useQuery({
    queryKey: ['wishlist'],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get('/wishlist');
        return res.data?.items?.map((item: any) => item.car_id) || [];
      } catch (e) {
        return [];
      }
    },
    enabled: isAuthenticated,
    retry: false,
  });

  const toggleWishlistMutation = useMutation({
    mutationFn: async (carId: string) => {
      const wishlist = wishlistQuery.data || [];
      const isAdded = wishlist.includes(carId);
      if (isAdded) {
        await axiosInstance.delete(`/wishlist/${carId}`);
      } else {
        await axiosInstance.post(`/wishlist/${carId}`);
      }
      return carId;
    },
    onMutate: async (carId) => {
      await queryClient.cancelQueries({ queryKey: ['wishlist'] });
      const previousWishlist = queryClient.getQueryData<string[]>(['wishlist']) || [];
      
      queryClient.setQueryData<string[]>(['wishlist'], (old) => {
        if (!Array.isArray(old)) return [carId];
        return old.includes(carId) ? old.filter(id => id !== carId) : [...old, carId];
      });

      return { previousWishlist };
    },
    onError: (err, carId, context) => {
      toast.error("Failed to update wishlist");
      if (context?.previousWishlist) {
        queryClient.setQueryData(['wishlist'], context.previousWishlist);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
  });

  const login = async (email: string, password: string) => {
    const success = await storeLogin(email, password);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
    return success;
  };

  const logout = () => {
    storeLogout();
    queryClient.clear();
  };

  const register = async (data: any) => {
    const success = await storeRegister(data);
    if (success) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
    return success;
  };

  const toggleWishlist = (carId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to manage your wishlist");
      return;
    }
    toggleWishlistMutation.mutate(carId);
  };

  return {
    user: profileQuery.data || null,
    isLoading: profileQuery.isLoading,
    wishlist: wishlistQuery.data || [],
    isAuthenticated,
    login,
    register,
    logout,
    toggleWishlist,
  };
}
