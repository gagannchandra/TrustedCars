import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { axiosInstance } from '../api/axiosInstance';
import { useAuthStore } from '../../store/authStore';
import toast from 'react-hot-toast';

interface RegisterPayload {
  email: string;
  password: string;
  full_name: string;
  role: 'user' | 'dealer';
  dealership_name?: string;
  dealership_address?: string;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { 
    isAuthenticated, 
    login: storeLogin, 
    register: storeRegister, 
    logout: storeLogout,
    verifyLogin: storeVerifyLogin,
    verifyRegistration: storeVerifyRegistration,
    forgotPassword: storeForgotPassword,
    verifyResetPassword: storeVerifyResetPassword,
    resetPassword: storeResetPassword
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
        return res.data?.items?.map((item: any) => item.car) || [];
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
      const previousWishlist = queryClient.getQueryData<any[]>(['wishlist']) || [];
      
      queryClient.setQueryData<any[]>(['wishlist'], (old) => {
        if (!Array.isArray(old)) return [{ id: carId }];
        const isAdded = old.some(c => c.id === carId);
        return isAdded ? old.filter(c => c.id !== carId) : [...old, { id: carId }];
      });

      return { previousWishlist };
    },
    onError: (_, __, context) => {
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
    // Only initiates OTP, does not create session yet
    return await storeLogin(email, password);
  };
  
  const verifyLogin = async (email: string, code: string) => {
    const result = await storeVerifyLogin(email, code);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
    return result;
  };

  const logout = () => {
    storeLogout();
    queryClient.clear();
  };

  const register = async (data: RegisterPayload) => {
    // Only initiates OTP, does not create session yet
    return await storeRegister(data);
  };

  const verifyRegistration = async (email: string, code: string) => {
    const result = await storeVerifyRegistration(email, code);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      queryClient.invalidateQueries({ queryKey: ['wishlist'] });
    }
    return result;
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
    wishlist: (wishlistQuery.data || []).map((c: any) => c.id),
    wishlistCars: wishlistQuery.data || [],
    isAuthenticated,
    login,
    verifyLogin,
    register,
    verifyRegistration,
    forgotPassword: storeForgotPassword,
    verifyResetPassword: storeVerifyResetPassword,
    resetPassword: storeResetPassword,
    logout,
    toggleWishlist,
  };
}
