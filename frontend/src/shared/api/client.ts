import { Car, FilterState, Inquiry, Review, User } from '../../types';
import { axiosInstance } from './axiosInstance';

export const carsApi = {
  getCars: async (filters?: FilterState): Promise<{ items: Car[], total: number }> => {
    const params = new URLSearchParams();
    if (filters?.q) params.append('q', filters.q);
    if (filters?.make) params.append('make', filters.make);
    if (filters?.model) params.append('model', filters.model);
    if (filters?.year_min) params.append('min_year', filters.year_min.toString());
    if (filters?.year_max) params.append('max_year', filters.year_max.toString());
    if (filters?.price_min) params.append('min_price', filters.price_min.toString());
    if (filters?.price_max) params.append('max_price', filters.price_max.toString());
    if (filters?.fuel_type) params.append('fuel_type', filters.fuel_type);
    if (filters?.transmission) params.append('transmission', filters.transmission);
    if (filters?.body_type) params.append('body_type', filters.body_type);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.km_max) params.append('max_mileage', filters.km_max.toString());
    if (filters?.ownership) params.append('ownership_count', filters.ownership.toString());
    if (filters?.sort) params.append('sort', filters.sort);
    
    // Pagination
    const limit = 12;
    const page = filters?.page || 1;
    params.append('limit', limit.toString());
    params.append('skip', ((page - 1) * limit).toString());
    
    const res = await axiosInstance.get(`/cars?${params.toString()}`);
    return res.data;
  },
  
  getCarById: async (id: string): Promise<Car | undefined> => {
    const res = await axiosInstance.get(`/cars/${id}`);
    return res.data;
  },

    getWishlistCars: async (ids: string[]): Promise<Car[]> => {
    if (!ids || ids.length === 0) return [];
    const res = await axiosInstance.post('/cars/batch', ids);
    return res.data;
  },

  getMyCars: async (): Promise<Car[]> => {
    const res = await axiosInstance.get('/cars/mine');
    return res.data.items || [];
  },

  getFeaturedCars: async (): Promise<Car[]> => {
    const res = await axiosInstance.get('/cars?limit=6&sort=newest&is_featured=true');
    return res.data.items;
  },

  getSimilarCars: async (car: Car, limit = 4): Promise<Car[]> => {
    const params = new URLSearchParams({
        make: car.make,
        min_year: String(car.year - 2),
        max_year: String(car.year + 2),
        limit: String(limit + 1),
    });
    const res = await axiosInstance.get(`/cars?${params.toString()}`);
    return res.data.items.filter((c: Car) => c.id !== car.id).slice(0, limit);
  },

  getAllCarsAdmin: async (): Promise<Car[]> => {
    const res = await axiosInstance.get('/admin/cars');
    return res.data.items;
  },

  createCar: async (payload: any): Promise<Car> => {
    const res = await axiosInstance.post('/cars', payload);
    return res.data;
  },

  updateCar: async (id: string, payload: any): Promise<Car> => {
    const res = await axiosInstance.put(`/cars/${id}`, payload);
    return res.data;
  },

  deleteCar: async (id: string): Promise<void> => {
    await axiosInstance.delete(`/cars/${id}`);
  },

  uploadCarImagesDirect: async (carId: string, file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await axiosInstance.post(`/cars/${carId}/images/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  }
};

export const adminApi = {
  getAllUsers: async (): Promise<User[]> => {
    const res = await axiosInstance.get('/admin/users');
    return res.data;
  },
  updateSettings: async (payload: { platform_fee: number; auto_approve: boolean }) => {
    const res = await axiosInstance.patch('/admin/settings', payload);
    return res.data;
  }
};

export const inquiriesApi = {
  getAllInquiries: async (): Promise<Inquiry[]> => {
    const res = await axiosInstance.get('/inquiries');
    return res.data;
  },
  getMyInquiries: async (): Promise<Inquiry[]> => {
    const res = await axiosInstance.get('/inquiries/me');
    return res.data;
  },
  createInquiry: async (payload: { car_id: string; message: string }): Promise<Inquiry> => {
    const res = await axiosInstance.post('/inquiries', payload);
    return res.data;
  },
  replyInquiry: async (id: string, message: string): Promise<any> => {
    const res = await axiosInstance.post(`/inquiries/${id}/messages`, { message });
    return res.data;
  },
  closeInquiry: async (id: string): Promise<any> => {
    const res = await axiosInstance.patch(`/inquiries/${id}`, { status: 'closed' });
    return res.data;
  }
};

export const reviewsApi = {
  getAllReviews: async (): Promise<Review[]> => {
    const res = await axiosInstance.get('/admin/reviews');
    return res.data;
  },
  getMyReviews: async (): Promise<Review[]> => {
    const res = await axiosInstance.get('/reviews/me');
    return res.data;
  }
};
