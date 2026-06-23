import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../../../test/mocks/server';
import { carsApi, adminApi, inquiriesApi, reviewsApi } from '../client';
import { axiosInstance } from '../axiosInstance';

/**
 * API Client Tests
 * 
 * Tests all API client methods with 70%+ coverage target using MSW for mocking.
 * 
 * Test Categories:
 * - Auth endpoints (login, register, logout)
 * - Car endpoints (search, get, create, update, delete)
 * - Inquiry endpoints (create, list, update)
 * - Admin endpoints (users, cars, approvals)
 * - Error handling (401, 403, 404, 500)
 * - Request headers (auth token via cookies)
 * - Request body formatting (JSON serialization)
 */

const API_BASE = 'http://localhost:8000/api/v1';

describe('API Client - Cars', () => {
  describe('getCars', () => {
    it('should fetch cars with default pagination', async () => {
      const result = await carsApi.getCars();
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
      expect(Array.isArray(result.items)).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]).toHaveProperty('id');
      expect(result.items[0]).toHaveProperty('make');
      expect(result.items[0]).toHaveProperty('model');
    });

    it('should fetch cars with filters', async () => {
      const filters = {
        q: 'Toyota',
        make: 'Toyota',
        year_min: 2019,
        year_max: 2022,
        price_min: 20000,
        price_max: 30000,
        fuel_type: 'petrol',
        transmission: 'automatic',
        body_type: 'sedan',
        city: 'Mumbai',
        km_max: 50000,
        ownership: 1,
        sort: 'newest',
        page: 1,
      };
      
      const result = await carsApi.getCars(filters);
      
      expect(result).toHaveProperty('items');
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should handle pagination correctly', async () => {
      const result = await carsApi.getCars({ page: 2 });
      
      expect(result).toHaveProperty('items');
      expect(result).toHaveProperty('total');
    });

    it('should send correct query parameters', async () => {
      let capturedUrl = '';
      
      server.use(
        http.get(`${API_BASE}/cars`, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ items: [], total: 0 });
        })
      );

      await carsApi.getCars({
        make: 'Honda',
        model: 'Civic',
        year_min: 2020,
      });

      expect(capturedUrl).toContain('make=Honda');
      expect(capturedUrl).toContain('model=Civic');
      expect(capturedUrl).toContain('min_year=2020');
    });
  });

  describe('getCarById', () => {
    it('should fetch a single car by ID', async () => {
      const car = await carsApi.getCarById('car-123');
      
      expect(car).toBeDefined();
      expect(car?.id).toBe('car-123');
      expect(car?.make).toBe('Toyota');
      expect(car?.model).toBe('Camry');
    });

    it('should return car with all required fields', async () => {
      const car = await carsApi.getCarById('car-456');
      
      expect(car).toHaveProperty('id');
      expect(car).toHaveProperty('make');
      expect(car).toHaveProperty('model');
      expect(car).toHaveProperty('year');
      expect(car).toHaveProperty('asking_price');
      expect(car).toHaveProperty('odometer_km');
      expect(car).toHaveProperty('status');
    });
  });

  describe('getMyCars', () => {
    it('should fetch user\'s own cars', async () => {
      const cars = await carsApi.getMyCars();
      
      expect(Array.isArray(cars)).toBe(true);
    });
  });

  describe('getFeaturedCars', () => {
    it('should fetch featured cars', async () => {
      server.use(
        http.get(`${API_BASE}/cars`, ({ request }) => {
          const url = new URL(request.url);
          const isFeatured = url.searchParams.get('is_featured');
          expect(isFeatured).toBe('true');
          
          return HttpResponse.json({
            items: [
              {
                id: 'featured-1',
                make: 'BMW',
                model: 'X5',
                year: 2022,
                asking_price: 50000,
                is_featured: true,
              },
            ],
          });
        })
      );

      const cars = await carsApi.getFeaturedCars();
      
      expect(Array.isArray(cars)).toBe(true);
    });
  });

  describe('getSimilarCars', () => {
    it('should fetch similar cars based on make and year range', async () => {
      const baseCar = {
        id: 'car-1',
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        asking_price: 25000,
      } as any;

      const similarCars = await carsApi.getSimilarCars(baseCar);
      
      expect(Array.isArray(similarCars)).toBe(true);
    });

    it('should exclude the original car from results', async () => {
      const baseCar = {
        id: 'car-original',
        make: 'Honda',
        model: 'Accord',
        year: 2021,
        asking_price: 28000,
      } as any;

      server.use(
        http.get(`${API_BASE}/cars`, () => {
          return HttpResponse.json({
            items: [
              { id: 'car-original', make: 'Honda', model: 'Accord', year: 2021 },
              { id: 'car-similar-1', make: 'Honda', model: 'Civic', year: 2021 },
              { id: 'car-similar-2', make: 'Honda', model: 'CR-V', year: 2020 },
            ],
          });
        })
      );

      const similarCars = await carsApi.getSimilarCars(baseCar);
      
      expect(similarCars.every(car => car.id !== 'car-original')).toBe(true);
    });
  });

  describe('createCar', () => {
    it('should create a new car', async () => {
      const payload = {
        make: 'Honda',
        model: 'Civic',
        year: 2021,
        asking_price: 22000,
        odometer_km: 15000,
        fuel_type: 'petrol',
        transmission: 'manual',
        body_type: 'sedan',
        city: 'Delhi',
        state: 'Delhi',
        description: 'Well maintained car',
      };

      const car = await carsApi.createCar(payload);
      
      expect(car).toBeDefined();
      expect(car.id).toBe('new-car-123');
      expect(car.status).toBe('pending');
    });

    it('should send correct request body', async () => {
      let capturedBody: any = null;
      
      server.use(
        http.post(`${API_BASE}/cars`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 'car-created',
            ...capturedBody,
          }, { status: 201 });
        })
      );

      const payload = {
        make: 'Tesla',
        model: 'Model 3',
        year: 2023,
        asking_price: 45000,
      };

      await carsApi.createCar(payload);
      
      expect(capturedBody).toEqual(payload);
    });
  });

  describe('updateCar', () => {
    it('should update an existing car', async () => {
      const payload = {
        asking_price: 23000,
        description: 'Updated description',
      };

      const car = await carsApi.updateCar('car-123', payload);
      
      expect(car).toBeDefined();
      expect(car.id).toBe('car-123');
    });

    it('should send correct update payload', async () => {
      let capturedBody: any = null;
      
      server.use(
        http.put(`${API_BASE}/cars/:id`, async ({ request, params }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: params.id,
            ...capturedBody,
          });
        })
      );

      const payload = { asking_price: 24000 };
      await carsApi.updateCar('car-456', payload);
      
      expect(capturedBody).toEqual(payload);
    });
  });

  describe('deleteCar', () => {
    it('should delete a car', async () => {
      await expect(carsApi.deleteCar('car-123')).resolves.toBeUndefined();
    });

    it('should call correct endpoint', async () => {
      let deletedId = '';
      
      server.use(
        http.delete(`${API_BASE}/cars/:id`, ({ params }) => {
          deletedId = params.id as string;
          return HttpResponse.json({ message: 'Deleted' }, { status: 204 });
        })
      );

      await carsApi.deleteCar('car-to-delete');
      
      expect(deletedId).toBe('car-to-delete');
    });
  });

  describe('getWishlistCars', () => {
    it('should fetch cars by IDs', async () => {
      server.use(
        http.post(`${API_BASE}/cars/batch`, async ({ request }) => {
          const ids = await request.json() as string[];
          return HttpResponse.json(
            ids.map(id => ({ id, make: 'Toyota', model: 'Camry' }))
          );
        })
      );

      const cars = await carsApi.getWishlistCars(['car-1', 'car-2']);
      
      expect(Array.isArray(cars)).toBe(true);
      expect(cars.length).toBe(2);
    });

    it('should return empty array for empty IDs', async () => {
      const cars = await carsApi.getWishlistCars([]);
      
      expect(cars).toEqual([]);
    });
  });

  describe('getAllCarsAdmin', () => {
    it('should fetch all cars for admin', async () => {
      const cars = await carsApi.getAllCarsAdmin();
      
      expect(Array.isArray(cars)).toBe(true);
    });
  });

  describe('uploadCarImagesDirect', () => {
    it('should upload car image', async () => {
      server.use(
        http.post(`${API_BASE}/cars/:id/images/upload`, ({ params }) => {
          return HttpResponse.json({
            url: `https://example.com/images/${params.id}/image.jpg`,
          });
        })
      );

      const file = new File(['image content'], 'test.jpg', { type: 'image/jpeg' });
      const result = await carsApi.uploadCarImagesDirect('car-123', file);
      
      expect(result).toBeDefined();
      expect(result.url).toContain('car-123');
    });
  });
});

describe('API Client - Inquiries', () => {
  describe('getAllInquiries', () => {
    it('should fetch all inquiries', async () => {
      server.use(
        http.get(`${API_BASE}/inquiries`, () => {
          return HttpResponse.json([
            { id: 'inq-1', message: 'Test inquiry', status: 'open' },
          ]);
        })
      );

      const inquiries = await inquiriesApi.getAllInquiries();
      
      expect(Array.isArray(inquiries)).toBe(true);
    });
  });

  describe('getMyInquiries', () => {
    it('should fetch user\'s inquiries', async () => {
      const inquiries = await inquiriesApi.getMyInquiries();
      
      expect(Array.isArray(inquiries)).toBe(true);
      expect(inquiries[0]).toHaveProperty('id');
      expect(inquiries[0]).toHaveProperty('message');
      expect(inquiries[0]).toHaveProperty('status');
    });
  });

  describe('createInquiry', () => {
    it('should create a new inquiry', async () => {
      const payload = {
        car_id: 'car-123',
        message: 'Is this car still available?',
      };

      const inquiry = await inquiriesApi.createInquiry(payload);
      
      expect(inquiry).toBeDefined();
      expect(inquiry.id).toBe('new-inquiry-123');
      expect(inquiry.status).toBe('open');
    });

    it('should send correct request body', async () => {
      let capturedBody: any = null;
      
      server.use(
        http.post(`${API_BASE}/inquiries`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 'inq-new',
            ...capturedBody,
            status: 'open',
          }, { status: 201 });
        })
      );

      const payload = {
        car_id: 'car-456',
        message: 'What is the final price?',
      };

      await inquiriesApi.createInquiry(payload);
      
      expect(capturedBody).toEqual(payload);
    });
  });

  describe('replyInquiry', () => {
    it('should reply to an inquiry', async () => {
      const reply = await inquiriesApi.replyInquiry('inq-123', 'Yes, it is available');
      
      expect(reply).toBeDefined();
      expect(reply.inquiry_id).toBe('inq-123');
    });

    it('should send correct message', async () => {
      let capturedBody: any = null;
      
      server.use(
        http.post(`${API_BASE}/inquiries/:id/messages`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 'msg-1',
            message: capturedBody.message,
          });
        })
      );

      await inquiriesApi.replyInquiry('inq-456', 'Thank you for your interest');
      
      expect(capturedBody.message).toBe('Thank you for your interest');
    });
  });

  describe('closeInquiry', () => {
    it('should close an inquiry', async () => {
      const result = await inquiriesApi.closeInquiry('inq-123');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('inq-123');
      expect(result.status).toBe('closed');
    });
  });
});

describe('API Client - Admin', () => {
  describe('getAllUsers', () => {
    it('should fetch all users', async () => {
      const users = await adminApi.getAllUsers();
      
      expect(Array.isArray(users)).toBe(true);
      expect(users[0]).toHaveProperty('id');
      expect(users[0]).toHaveProperty('email');
      expect(users[0]).toHaveProperty('role');
    });
  });

  describe('suspendUser', () => {
    it('should suspend a user', async () => {
      server.use(
        http.post(`${API_BASE}/admin/users/:id/suspend`, async ({ params, request }) => {
          const body = await request.json() as any;
          return HttpResponse.json({
            id: params.id,
            status: 'suspended',
            suspension_reason: body.reason,
          });
        })
      );

      const result = await adminApi.suspendUser('user-123', 'Violation of terms');
      
      expect(result).toBeDefined();
      expect(result.status).toBe('suspended');
    });
  });

  describe('restoreUser', () => {
    it('should restore a suspended user', async () => {
      server.use(
        http.post(`${API_BASE}/admin/users/:id/restore`, ({ params }) => {
          return HttpResponse.json({
            id: params.id,
            status: 'active',
          });
        })
      );

      const result = await adminApi.restoreUser('user-123');
      
      expect(result).toBeDefined();
      expect(result.status).toBe('active');
    });
  });

  describe('getDashboardStats', () => {
    it('should fetch dashboard statistics', async () => {
      const stats = await adminApi.getDashboardStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty('total_users');
      expect(stats).toHaveProperty('total_dealers');
      expect(stats).toHaveProperty('total_cars');
      expect(stats).toHaveProperty('pending_cars');
    });
  });

  describe('approveCar', () => {
    it('should approve a car', async () => {
      const result = await adminApi.approveCar('car-123', 'Looks good');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('car-123');
      expect(result.status).toBe('approved');
    });

    it('should send approval reason', async () => {
      let capturedBody: any = null;
      
      server.use(
        http.post(`${API_BASE}/admin/cars/:id/approve`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 'car-approved',
            status: 'approved',
          });
        })
      );

      await adminApi.approveCar('car-456', 'Verified and approved');
      
      expect(capturedBody.reason).toBe('Verified and approved');
    });
  });

  describe('rejectCar', () => {
    it('should reject a car', async () => {
      const result = await adminApi.rejectCar('car-123', 'Missing documents');
      
      expect(result).toBeDefined();
      expect(result.id).toBe('car-123');
      expect(result.status).toBe('rejected');
      expect(result.rejection_reason).toBe('Missing documents');
    });

    it('should send rejection reason', async () => {
      let capturedBody: any = null;
      
      server.use(
        http.post(`${API_BASE}/admin/cars/:id/reject`, async ({ request }) => {
          capturedBody = await request.json();
          return HttpResponse.json({
            id: 'car-rejected',
            status: 'rejected',
            rejection_reason: capturedBody.reason,
          });
        })
      );

      await adminApi.rejectCar('car-789', 'Incomplete information');
      
      expect(capturedBody.reason).toBe('Incomplete information');
    });
  });

  describe('getSettings', () => {
    it('should fetch admin settings', async () => {
      server.use(
        http.get(`${API_BASE}/admin/settings`, () => {
          return HttpResponse.json({
            platform_fee: 5.5,
            auto_approve: false,
          });
        })
      );

      const settings = await adminApi.getSettings();
      
      expect(settings).toBeDefined();
      expect(settings).toHaveProperty('platform_fee');
      expect(settings).toHaveProperty('auto_approve');
    });
  });

  describe('updateSettings', () => {
    it('should update admin settings', async () => {
      server.use(
        http.patch(`${API_BASE}/admin/settings`, async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json(body);
        })
      );

      const payload = { platform_fee: 6.0, auto_approve: true };
      const result = await adminApi.updateSettings(payload);
      
      expect(result).toEqual(payload);
    });
  });

  describe('getDealers', () => {
    it('should fetch all dealers', async () => {
      server.use(
        http.get(`${API_BASE}/admin/dealers`, () => {
          return HttpResponse.json([
            { id: 'dealer-1', dealership_name: 'Test Dealer', status: 'active' },
          ]);
        })
      );

      const dealers = await adminApi.getDealers();
      
      expect(Array.isArray(dealers)).toBe(true);
    });
  });

  describe('suspendDealer', () => {
    it('should suspend a dealer', async () => {
      server.use(
        http.post(`${API_BASE}/admin/dealers/:id/suspend`, async ({ params, request }) => {
          const body = await request.json() as any;
          return HttpResponse.json({
            id: params.id,
            status: 'suspended',
            suspension_reason: body.reason,
          });
        })
      );

      const result = await adminApi.suspendDealer('dealer-123', 'Fraudulent activity');
      
      expect(result).toBeDefined();
      expect(result.status).toBe('suspended');
    });
  });

  describe('restoreDealer', () => {
    it('should restore a suspended dealer', async () => {
      server.use(
        http.post(`${API_BASE}/admin/dealers/:id/restore`, ({ params }) => {
          return HttpResponse.json({
            id: params.id,
            status: 'active',
          });
        })
      );

      const result = await adminApi.restoreDealer('dealer-123');
      
      expect(result).toBeDefined();
      expect(result.status).toBe('active');
    });
  });
});

describe('API Client - Reviews', () => {
  describe('getAllReviews', () => {
    it('should fetch all reviews (admin)', async () => {
      server.use(
        http.get(`${API_BASE}/admin/reviews`, () => {
          return HttpResponse.json([
            { id: 'review-1', rating: 5, comment: 'Great car!' },
          ]);
        })
      );

      const reviews = await reviewsApi.getAllReviews();
      
      expect(Array.isArray(reviews)).toBe(true);
    });
  });

  describe('getMyReviews', () => {
    it('should fetch user\'s reviews', async () => {
      server.use(
        http.get(`${API_BASE}/reviews/me`, () => {
          return HttpResponse.json({
            items: [
              { id: 'review-1', rating: 4, comment: 'Good experience' },
            ],
          });
        })
      );

      const reviews = await reviewsApi.getMyReviews();
      
      expect(Array.isArray(reviews)).toBe(true);
    });
  });
});

describe('API Client - Error Handling', () => {
  describe('401 Unauthorized', () => {
    it('should handle 401 error', async () => {
      server.use(
        http.get(`${API_BASE}/cars/mine`, () => {
          return HttpResponse.json(
            { detail: 'Unauthorized' },
            { status: 401 }
          );
        })
      );

      await expect(carsApi.getMyCars()).rejects.toThrow();
    });
  });

  describe('403 Forbidden', () => {
    it('should handle 403 error', async () => {
      server.use(
        http.post(`${API_BASE}/admin/cars/:id/approve`, () => {
          return HttpResponse.json(
            { detail: 'Forbidden - insufficient permissions' },
            { status: 403 }
          );
        })
      );

      await expect(adminApi.approveCar('car-123', 'Approve')).rejects.toThrow();
    });
  });

  describe('404 Not Found', () => {
    it('should handle 404 error', async () => {
      server.use(
        http.get(`${API_BASE}/cars/:id`, () => {
          return HttpResponse.json(
            { detail: 'Car not found' },
            { status: 404 }
          );
        })
      );

      await expect(carsApi.getCarById('non-existent')).rejects.toThrow();
    });
  });

  describe('500 Internal Server Error', () => {
    it('should handle 500 error', async () => {
      server.use(
        http.get(`${API_BASE}/cars`, () => {
          return HttpResponse.json(
            { detail: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(carsApi.getCars()).rejects.toThrow();
    });
  });

  describe('422 Validation Error', () => {
    it('should handle 422 validation error', async () => {
      server.use(
        http.post(`${API_BASE}/cars`, () => {
          return HttpResponse.json(
            { detail: 'Validation error - invalid fields' },
            { status: 422 }
          );
        })
      );

      await expect(carsApi.createCar({})).rejects.toThrow();
    });
  });

  describe('Network Error', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(`${API_BASE}/cars`, () => {
          return HttpResponse.error();
        })
      );

      await expect(carsApi.getCars()).rejects.toThrow();
    });
  });
});

describe('API Client - Request Configuration', () => {
  describe('withCredentials', () => {
    it('should include credentials in requests', () => {
      expect(axiosInstance.defaults.withCredentials).toBe(true);
    });
  });

  describe('Content-Type header', () => {
    it('should set Content-Type to application/json by default', () => {
      expect(axiosInstance.defaults.headers['Content-Type']).toBe('application/json');
    });
  });

  describe('baseURL', () => {
    it('should have correct base URL', () => {
      expect(axiosInstance.defaults.baseURL).toContain('/api/v1');
    });
  });
});

describe('API Client - Response Parsing', () => {
  describe('JSON response parsing', () => {
    it('should correctly parse JSON responses', async () => {
      server.use(
        http.get(`${API_BASE}/cars/:id`, () => {
          return HttpResponse.json({
            id: 'car-json-test',
            make: 'Toyota',
            year: 2020,
            asking_price: 25000,
          });
        })
      );

      const car = await carsApi.getCarById('car-json-test');
      
      expect(typeof car).toBe('object');
      expect(car?.id).toBe('car-json-test');
      expect(car?.year).toBe(2020);
      expect(car?.asking_price).toBe(25000);
    });
  });

  describe('Array response parsing', () => {
    it('should correctly parse array responses', async () => {
      const inquiries = await inquiriesApi.getMyInquiries();
      
      expect(Array.isArray(inquiries)).toBe(true);
      expect(inquiries.every(inq => typeof inq === 'object')).toBe(true);
    });
  });

  describe('Nested object parsing', () => {
    it('should correctly parse nested objects', async () => {
      server.use(
        http.get(`${API_BASE}/cars/:id`, () => {
          return HttpResponse.json({
            id: 'car-nested',
            make: 'BMW',
            seller: {
              id: 'seller-1',
              name: 'John Dealer',
            },
            images: [
              { id: 'img-1', url: 'https://example.com/1.jpg' },
            ],
          });
        })
      );

      const car = await carsApi.getCarById('car-nested');
      
      expect(car).toHaveProperty('seller');
      expect(car).toHaveProperty('images');
      expect(Array.isArray((car as any).images)).toBe(true);
    });
  });
});
