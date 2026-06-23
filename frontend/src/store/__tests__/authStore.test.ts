import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { useAuthStore } from "../authStore";
import { server } from "../../test/mocks/server";
import { http, HttpResponse } from "msw";

const API_BASE = "http://localhost:8000/api/v1";

describe("authStore", () => {
  beforeEach(() => {
    // Clear store before each test
    useAuthStore.setState({ isAuthenticated: false });
    
    // Clear localStorage
    localStorage.clear();
    
    // Reset any MSW handlers
    server.resetHandlers();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe("Initial State", () => {
    it("should have correct initial state", () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);
      expect(typeof result.current.login).toBe("function");
      expect(typeof result.current.logout).toBe("function");
      expect(typeof result.current.register).toBe("function");
      expect(typeof result.current.verifyLogin).toBe("function");
      expect(typeof result.current.verifyRegistration).toBe("function");
      expect(typeof result.current.forgotPassword).toBe("function");
      expect(typeof result.current.verifyResetPassword).toBe("function");
      expect(typeof result.current.resetPassword).toBe("function");
    });
  });

  describe("Login Flow", () => {
    it("should handle successful login", async () => {
      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.login("test@example.com", "password");
      });

      expect(response).toEqual({
        success: true,
        message: "OTP sent to email",
      });
      // User is not authenticated yet until OTP is verified
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle login with invalid credentials", async () => {
      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.login("wrong@example.com", "wrong");
      });

      expect(response).toEqual({
        success: false,
        message: "Invalid credentials",
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle network error during login", async () => {
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.login("test@example.com", "password");
      });

      expect(response?.success).toBe(false);
      expect(response?.message).toContain("Login failed");
    });
  });

  describe("Verify Login", () => {
    it("should verify login successfully and set authenticated state", async () => {
      const { result } = renderHook(() => useAuthStore());

      // First login
      await act(async () => {
        await result.current.login("test@example.com", "password");
      });

      // Then verify
      let verifyResponse;
      await act(async () => {
        verifyResponse = await result.current.verifyLogin(
          "test@example.com",
          "123456"
        );
      });

      expect(verifyResponse).toEqual({ success: true });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should handle invalid OTP during verification", async () => {
      const { result } = renderHook(() => useAuthStore());

      let verifyResponse;
      await act(async () => {
        verifyResponse = await result.current.verifyLogin(
          "test@example.com",
          "000000"
        );
      });

      expect(verifyResponse?.success).toBe(false);
      expect(verifyResponse?.message).toContain("Invalid verification code");
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Registration Flow", () => {
    it("should handle successful user registration", async () => {
      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.register({
          email: "newuser@example.com",
          password: "SecurePass123!",
          full_name: "New User",
          role: "user",
        });
      });

      expect(response).toEqual({
        success: true,
        message: "OTP sent to email",
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle successful dealer registration", async () => {
      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.register({
          email: "newdealer@example.com",
          password: "SecurePass123!",
          full_name: "New Dealer",
          role: "dealer",
        });
      });

      expect(response).toEqual({
        success: true,
        message: "OTP sent to email",
      });
      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle registration error", async () => {
      server.use(
        http.post(`${API_BASE}/auth/register/user`, () => {
          return HttpResponse.json(
            { detail: "Email already registered" },
            { status: 400 }
          );
        })
      );

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.register({
          email: "existing@example.com",
          password: "SecurePass123!",
          full_name: "Existing User",
          role: "user",
        });
      });

      expect(response?.success).toBe(false);
      expect(response?.message).toContain("Email already registered");
    });
  });

  describe("Verify Registration", () => {
    it("should verify registration successfully and authenticate user", async () => {
      const { result } = renderHook(() => useAuthStore());

      // First register
      await act(async () => {
        await result.current.register({
          email: "newuser@example.com",
          password: "SecurePass123!",
          full_name: "New User",
          role: "user",
        });
      });

      // Then verify
      let verifyResponse;
      await act(async () => {
        verifyResponse = await result.current.verifyRegistration(
          "newuser@example.com",
          "123456"
        );
      });

      expect(verifyResponse).toEqual({ success: true });
      expect(result.current.isAuthenticated).toBe(true);
    });

    it("should handle invalid OTP during registration verification", async () => {
      const { result } = renderHook(() => useAuthStore());

      let verifyResponse;
      await act(async () => {
        verifyResponse = await result.current.verifyRegistration(
          "newuser@example.com",
          "000000"
        );
      });

      expect(verifyResponse?.success).toBe(false);
      expect(verifyResponse?.message).toContain("Invalid verification code");
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("Logout", () => {
    it("should clear authentication state on logout", async () => {
      const { result } = renderHook(() => useAuthStore());

      // First authenticate
      await act(async () => {
        await result.current.login("test@example.com", "password");
        await result.current.verifyLogin("test@example.com", "123456");
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Then logout
      await act(async () => {
        result.current.logout();
      });

      // Wait a bit for async operations
      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it("should call logout API endpoint", async () => {
      const logoutSpy = vi.fn();

      server.use(
        http.post(`${API_BASE}/auth/logout`, () => {
          logoutSpy();
          return HttpResponse.json({ message: "Logged out" }, { status: 200 });
        })
      );

      const { result } = renderHook(() => useAuthStore());

      // Authenticate first
      await act(async () => {
        await result.current.login("test@example.com", "password");
        await result.current.verifyLogin("test@example.com", "123456");
      });

      // Logout
      await act(async () => {
        result.current.logout();
      });

      // Give it time to make the API call
      await waitFor(
        () => {
          expect(logoutSpy).toHaveBeenCalled();
        },
        { timeout: 1000 }
      );
    });
  });

  describe("Password Reset Flow", () => {
    it("should handle forgot password successfully", async () => {
      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.forgotPassword("test@example.com");
      });

      expect(response).toEqual({
        success: true,
        message: "Reset OTP sent",
      });
    });

    it("should verify reset password code and return reset token", async () => {
      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.verifyResetPassword(
          "test@example.com",
          "123456"
        );
      });

      expect(response?.success).toBe(true);
      expect(response?.resetToken).toBe("mock-reset-token-123");
    });

    it("should handle invalid reset code", async () => {
      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.verifyResetPassword(
          "test@example.com",
          "000000"
        );
      });

      expect(response?.success).toBe(false);
      expect(response?.message).toContain("Invalid reset code");
    });

    it("should reset password successfully", async () => {
      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.resetPassword(
          "mock-reset-token-123",
          "NewSecurePassword123!"
        );
      });

      expect(response).toEqual({
        success: true,
        message: "Password reset successful",
      });
    });
  });

  describe("Token Refresh", () => {
    it("should refresh token successfully", async () => {
      // Mock the refresh endpoint
      const refreshSpy = vi.fn();

      server.use(
        http.post(`${API_BASE}/auth/refresh`, () => {
          refreshSpy();
          return HttpResponse.json(
            { message: "Token refreshed" },
            { status: 200 }
          );
        })
      );

      // Note: The authStore doesn't expose a refresh method directly
      // This test verifies the endpoint is available in MSW
      const response = await fetch(`${API_BASE}/auth/refresh`, {
        method: "POST",
      });
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe("Token refreshed");
      expect(refreshSpy).toHaveBeenCalled();
    });
  });

  describe("LocalStorage Persistence", () => {
    it("should persist authentication state to localStorage", async () => {
      const { result } = renderHook(() => useAuthStore());

      // Authenticate
      await act(async () => {
        await result.current.login("test@example.com", "password");
        await result.current.verifyLogin("test@example.com", "123456");
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Check localStorage
      const storedData = localStorage.getItem("trustedcars-auth");
      expect(storedData).toBeTruthy();

      const parsedData = JSON.parse(storedData!);
      expect(parsedData.state.isAuthenticated).toBe(true);
    });

    it("should clear localStorage on logout", async () => {
      const { result } = renderHook(() => useAuthStore());

      // Authenticate
      await act(async () => {
        await result.current.login("test@example.com", "password");
        await result.current.verifyLogin("test@example.com", "123456");
      });

      // Verify storage has data
      let storedData = localStorage.getItem("trustedcars-auth");
      expect(storedData).toBeTruthy();

      // Logout
      await act(async () => {
        result.current.logout();
      });

      // Check localStorage is updated
      await waitFor(() => {
        storedData = localStorage.getItem("trustedcars-auth");
        if (storedData) {
          const parsedData = JSON.parse(storedData);
          expect(parsedData.state.isAuthenticated).toBe(false);
        }
      });
    });
  });

  describe("State Hydration", () => {
    it("should hydrate state from localStorage on initialization", async () => {
      // Set up localStorage with authenticated state
      const mockState = {
        state: {
          isAuthenticated: true,
        },
        version: 0,
      };
      localStorage.setItem("trustedcars-auth", JSON.stringify(mockState));

      // Manually trigger rehydration by directly calling the store
      // This simulates what happens when the store initializes from localStorage
      useAuthStore.persist.rehydrate();

      // Wait for hydration to complete
      await waitFor(
        () => {
          const { isAuthenticated } = useAuthStore.getState();
          expect(isAuthenticated).toBe(true);
        },
        { timeout: 2000 }
      );
    });

    it("should handle missing localStorage data gracefully", async () => {
      // Ensure localStorage is clear
      localStorage.clear();

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);
    });

    it("should handle corrupted localStorage data gracefully", async () => {
      // Set invalid JSON in localStorage
      localStorage.setItem("trustedcars-auth", "invalid-json{{{");

      const { result } = renderHook(() => useAuthStore());

      // Should fall back to default state
      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("setAuthenticated", () => {
    it("should manually set authentication state", async () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);

      await act(async () => {
        result.current.setAuthenticated(true);
      });

      expect(result.current.isAuthenticated).toBe(true);

      await act(async () => {
        result.current.setAuthenticated(false);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe("User Data Updates", () => {
    it("should maintain authentication state across multiple operations", async () => {
      const { result } = renderHook(() => useAuthStore());

      // Login and verify
      await act(async () => {
        await result.current.login("test@example.com", "password");
        await result.current.verifyLogin("test@example.com", "123456");
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Perform another action (forgot password) - should not affect auth state
      await act(async () => {
        await result.current.forgotPassword("test@example.com");
      });

      expect(result.current.isAuthenticated).toBe(true);

      // Logout should clear it
      await act(async () => {
        result.current.logout();
      });

      await waitFor(() => {
        expect(result.current.isAuthenticated).toBe(false);
      });
    });

    it("should handle rapid state changes", async () => {
      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        result.current.setAuthenticated(true);
        result.current.setAuthenticated(false);
        result.current.setAuthenticated(true);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle API errors gracefully in login", async () => {
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.json(
            { detail: "Service temporarily unavailable" },
            { status: 503 }
          );
        })
      );

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.login("test@example.com", "password");
      });

      expect(response?.success).toBe(false);
      expect(response?.message).toBeTruthy();
    });

    it("should handle API errors gracefully in registration", async () => {
      server.use(
        http.post(`${API_BASE}/auth/register/user`, () => {
          return HttpResponse.json(
            { detail: "Server error" },
            { status: 500 }
          );
        })
      );

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.register({
          email: "test@example.com",
          password: "password",
          full_name: "Test User",
          role: "user",
        });
      });

      expect(response?.success).toBe(false);
      expect(response?.message).toBeTruthy();
    });

    it("should handle network failures gracefully", async () => {
      server.use(
        http.post(`${API_BASE}/auth/login`, () => {
          return HttpResponse.error();
        })
      );

      const { result } = renderHook(() => useAuthStore());

      let response;
      await act(async () => {
        response = await result.current.login("test@example.com", "password");
      });

      expect(response?.success).toBe(false);
      expect(response?.message).toBeTruthy();
    });
  });
});
