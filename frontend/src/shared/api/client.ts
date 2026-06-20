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

  getFeaturedCars: async (): Promise<Car[]> => {
    const res = await axiosInstance.get('/cars?limit=50&sort=newest');
    return res.data.items.filter((c: Car) => c.is_featured).slice(0, 6);
  },

  getSimilarCars: async (car: Car, limit = 4): Promise<Car[]> => {
    const res = await axiosInstance.get(`/cars?make=${car.make}&limit=10`);
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

  uploadCarImages: async (carId: string, payload: { car_id: string; image_url: string; storage_key: string; sort_order: number; is_primary: boolean }): Promise<any> => {
    // The API expects individual image metadata uploads via POST /cars/{id}/images
    const res = await axiosInstance.post(`/cars/${carId}/images`, payload);
    return res.data;
  },

  generatePresignedUrl: async (carId: string, payload: { file_extension: string; content_type: string }): Promise<{upload_url: string; storage_key: string; public_url: string}> => {
    const res = await axiosInstance.post(`/cars/${carId}/images/upload-url`, payload);
    return res.data;
  }
};

export const usersApi = {
  getAllUsers: async (): Promise<User[]> => {
    const res = await axiosInstance.get('/admin/users');
    return res.data;
  }
};

export const inquiriesApi = {
  getAllInquiries: async (): Promise<Inquiry[]> => {
    const res = await axiosInstance.get('/inquiries');
    return res.data;
  },
  createInquiry: async (payload: { car_id: string; message: string }): Promise<Inquiry> => {
    const res = await axiosInstance.post('/inquiries', payload);
    return res.data;
  }
};

export const reviewsApi = {
  getAllReviews: async (): Promise<Review[]> => {
    const res = await axiosInstance.get('/admin/reviews');
    return res.data;
  }
};
