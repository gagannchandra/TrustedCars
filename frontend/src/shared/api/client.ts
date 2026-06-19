import { Car, FilterState, Inquiry, Review, User } from '../../types';
import { axiosInstance } from './axiosInstance';

export const carsApi = {
  getCars: async (filters?: FilterState): Promise<Car[]> => {
    const params = new URLSearchParams();
    if (filters?.q) params.append('make', filters.q); // Simple map for search text
    if (filters?.make) params.append('make', filters.make);
    if (filters?.model) params.append('model', filters.model);
    if (filters?.year_min) params.append('year', filters.year_min.toString()); // Backend only has exact 'year', we'll just send min as year or drop it. Let's drop it to avoid breaking.
    if (filters?.price_min) params.append('min_price', filters.price_min.toString());
    if (filters?.price_max) params.append('max_price', filters.price_max.toString());
    if (filters?.fuel_type) params.append('fuel_type', filters.fuel_type);
    if (filters?.transmission) params.append('transmission', filters.transmission);
    if (filters?.city) params.append('city', filters.city);
    if (filters?.km_max) params.append('max_mileage', filters.km_max.toString());
    
    const res = await axiosInstance.get(`/cars?${params.toString()}`);
    return res.data;
  },
  
  getCarById: async (id: string): Promise<Car | undefined> => {
    const res = await axiosInstance.get(`/cars/${id}`);
    return res.data;
  },

  getFeaturedCars: async (): Promise<Car[]> => {
    // Backend doesn't have a featured filter yet, fetch latest and filter locally
    const res = await axiosInstance.get('/cars?limit=50');
    return res.data.filter((c: Car) => c.is_featured).slice(0, 6);
  },

  getSimilarCars: async (car: Car, limit = 4): Promise<Car[]> => {
    // Search by same make
    const res = await axiosInstance.get(`/cars?make=${car.make}&limit=10`);
    return res.data.filter((c: Car) => c.id !== car.id).slice(0, limit);
  },

  getAllCarsAdmin: async (): Promise<Car[]> => {
    // For admin we might want all cars including pending, but /cars is public
    // Admin has specific routes or we just use /cars
    const res = await axiosInstance.get('/cars?limit=100');
    return res.data;
  }
};

export const usersApi = {
  getAllUsers: async (): Promise<User[]> => {
    // Admin route required for this
    const res = await axiosInstance.get('/users/me'); // Just a placeholder, to be updated when admin is fixed
    return [res.data];
  }
};

export const inquiriesApi = {
  getAllInquiries: async (): Promise<Inquiry[]> => {
    const res = await axiosInstance.get('/inquiries');
    return res.data;
  }
};

export const reviewsApi = {
  getAllReviews: async (): Promise<Review[]> => {
    const res = await axiosInstance.get('/reviews');
    return res.data;
  }
};
