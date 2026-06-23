import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:8000/api/v1";

export const handlers = [
  // Auth endpoints
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.email === "test@example.com" && body.password === "password") {
      return HttpResponse.json({ message: "OTP sent to email" }, { status: 200 });
    }
    return HttpResponse.json(
      { detail: "Invalid credentials" },
      { status: 401 }
    );
  }),

  http.post(`${API_BASE}/auth/verify-login`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.code === "123456") {
      return HttpResponse.json({ message: "Login successful" }, { status: 200 });
    }
    return HttpResponse.json(
      { detail: "Invalid verification code" },
      { status: 400 }
    );
  }),

  http.post(`${API_BASE}/auth/register/user`, async () => {
    return HttpResponse.json({ message: "OTP sent to email" }, { status: 201 });
  }),

  http.post(`${API_BASE}/auth/register/dealer`, async () => {
    return HttpResponse.json({ message: "OTP sent to email" }, { status: 201 });
  }),

  http.post(`${API_BASE}/auth/verify-registration`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.code === "123456") {
      return HttpResponse.json({ message: "Registration verified" }, { status: 200 });
    }
    return HttpResponse.json(
      { detail: "Invalid verification code" },
      { status: 400 }
    );
  }),

  http.post(`${API_BASE}/auth/logout`, () => {
    return HttpResponse.json({ message: "Logged out" }, { status: 200 });
  }),

  http.post(`${API_BASE}/auth/refresh`, () => {
    return HttpResponse.json({ message: "Token refreshed" }, { status: 200 });
  }),

  http.post(`${API_BASE}/auth/forgot-password`, () => {
    return HttpResponse.json({ message: "Reset OTP sent" }, { status: 200 });
  }),

  http.post(`${API_BASE}/auth/verify-reset-password`, async ({ request }) => {
    const body = await request.json() as any;
    if (body.code === "123456") {
      return HttpResponse.json(
        { reset_token: "mock-reset-token-123" },
        { status: 200 }
      );
    }
    return HttpResponse.json(
      { detail: "Invalid reset code" },
      { status: 400 }
    );
  }),

  http.post(`${API_BASE}/auth/reset-password`, () => {
    return HttpResponse.json({ message: "Password reset successful" }, { status: 200 });
  }),

  // Cars endpoints
  http.get(`${API_BASE}/cars`, ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "12");
    const skip = parseInt(url.searchParams.get("skip") || "0");

    const mockCars = Array.from({ length: 3 }, (_, i) => ({
      id: `car-${i + 1}`,
      make: "Toyota",
      model: "Camry",
      year: 2020 + i,
      asking_price: 25000 + i * 1000,
      odometer_km: 30000 - i * 5000,
      fuel_type: "petrol",
      transmission: "automatic",
      body_type: "sedan",
      city: "Mumbai",
      state: "Maharashtra",
      status: "active",
      seller_id: "dealer-123",
      description: `Test car ${i + 1}`,
      ownership_count: 1,
      price_negotiable: true,
      is_featured: false,
      view_count: 0,
      wishlist_count: 0,
      created_at: new Date().toISOString(),
    }));

    return HttpResponse.json({
      items: mockCars.slice(skip, skip + limit),
      total: mockCars.length,
    });
  }),

  http.get(`${API_BASE}/cars/:id`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
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
      seller_id: "dealer-123",
      description: "Test car",
      ownership_count: 1,
      price_negotiable: true,
      is_featured: false,
      view_count: 0,
      wishlist_count: 0,
      created_at: new Date().toISOString(),
    });
  }),

  http.get(`${API_BASE}/cars/mine`, () => {
    return HttpResponse.json({ items: [] });
  }),

  http.post(`${API_BASE}/cars`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: "new-car-123",
      ...body,
      status: "pending",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.put(`${API_BASE}/cars/:id`, async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: params.id,
      ...body,
      updated_at: new Date().toISOString(),
    });
  }),

  http.delete(`${API_BASE}/cars/:id`, () => {
    return HttpResponse.json({ message: "Car deleted" }, { status: 204 });
  }),

  // Inquiries endpoints
  http.get(`${API_BASE}/inquiries/me`, () => {
    return HttpResponse.json([
      {
        id: "inq-1",
        car_id: "car-1",
        message: "Is this car still available?",
        status: "open",
        created_at: new Date().toISOString(),
      },
    ]);
  }),

  http.post(`${API_BASE}/inquiries`, async ({ request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: "new-inquiry-123",
      ...body,
      status: "open",
      created_at: new Date().toISOString(),
    }, { status: 201 });
  }),

  http.post(`${API_BASE}/inquiries/:id/messages`, async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: `msg-${Date.now()}`,
      inquiry_id: params.id,
      message: body.message,
      created_at: new Date().toISOString(),
    });
  }),

  http.patch(`${API_BASE}/inquiries/:id/close`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: "closed",
    });
  }),

  // Admin endpoints
  http.get(`${API_BASE}/admin/cars`, () => {
    return HttpResponse.json({
      items: [
        {
          id: "car-pending-1",
          make: "Honda",
          model: "Civic",
          year: 2021,
          price: 22000,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ],
    });
  }),

  http.post(`${API_BASE}/admin/cars/:id/approve`, ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      status: "approved",
    });
  }),

  http.post(`${API_BASE}/admin/cars/:id/reject`, async ({ params, request }) => {
    const body = await request.json() as any;
    return HttpResponse.json({
      id: params.id,
      status: "rejected",
      rejection_reason: body.reason,
    });
  }),

  http.get(`${API_BASE}/admin/users`, () => {
    return HttpResponse.json([
      {
        id: "user-1",
        email: "user@example.com",
        role: "user",
        status: "active",
      },
    ]);
  }),

  http.get(`${API_BASE}/admin/dashboard/statistics`, () => {
    return HttpResponse.json({
      total_users: 100,
      total_dealers: 20,
      total_cars: 150,
      pending_cars: 10,
      approved_cars: 120,
      rejected_cars: 20,
    });
  }),
];
