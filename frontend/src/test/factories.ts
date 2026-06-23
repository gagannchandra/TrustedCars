import { Car, Inquiry, Review, User } from "../types";

/**
 * Test data factories for creating mock objects
 * These factories provide default values that can be overridden
 */

export const createMockUser = (overrides?: Partial<User>): User => ({
  id: "user-123",
  email: "test@example.com",
  full_name: "Test User",
  role: "user",
  is_verified: true,
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockCar = (overrides?: Partial<Car>): Car => ({
  id: "car-123",
  make: "Toyota",
  model: "Camry",
  year: 2020,
  asking_price: 25000,
  odometer_km: 30000,
  fuel_type: "petrol",
  transmission: "automatic",
  body_type: "sedan",
  city: "Mumbai",
  state: "Maharashtra",
  status: "active",
  description: "Well-maintained car in excellent condition",
  ownership_count: 1,
  price_negotiable: true,
  is_featured: false,
  view_count: 0,
  wishlist_count: 0,
  created_at: new Date().toISOString(),
  seller_id: "dealer-123",
  ...overrides,
});

export const createMockInquiry = (overrides?: Partial<Inquiry>): Inquiry => ({
  id: "inquiry-123",
  car_id: "car-123",
  buyer_id: "user-123",
  seller_id: "dealer-123",
  initial_message: "Is this car still available?",
  status: "open",
  created_at: new Date().toISOString(),
  ...overrides,
});

export const createMockReview = (overrides?: Partial<Review>): Review => ({
  id: "review-123",
  reviewer_id: "user-123",
  seller_id: "dealer-123",
  car_id: "car-123",
  rating: 5,
  comment: "Great car, highly recommended!",
  created_at: new Date().toISOString(),
  ...overrides,
});

/**
 * Factory to create multiple cars
 */
export const createMockCars = (count: number): Car[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockCar({
      id: `car-${i + 1}`,
      make: ["Toyota", "Honda", "Ford", "BMW"][i % 4],
      model: ["Camry", "Civic", "Focus", "3 Series"][i % 4],
      year: 2018 + i,
      asking_price: 20000 + i * 2000,
      odometer_km: 50000 - i * 5000,
    })
  );
};

/**
 * Factory to create multiple inquiries
 */
export const createMockInquiries = (count: number): Inquiry[] => {
  return Array.from({ length: count }, (_, i) =>
    createMockInquiry({
      id: `inquiry-${i + 1}`,
      car_id: `car-${i + 1}`,
      initial_message: `Inquiry message ${i + 1}`,
    })
  );
};

/**
 * Helper to wait for async operations in tests
 */
export const waitFor = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
