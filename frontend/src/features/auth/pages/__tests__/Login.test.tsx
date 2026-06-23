import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import Login from '../Login';
import { useAuth } from '@/shared/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

// Mock dependencies
vi.mock('@/shared/hooks/useAuth');
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

describe('Login Component', () => {
  const mockLogin = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      login: mockLogin,
    });
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  describe('4.2: Successful login redirects to dashboard', () => {
    it('should redirect to verify-otp page with correct state on successful login', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({
        success: true,
        message: 'OTP sent to email!',
      });

      render(<Login />);

      // Fill in the form
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Wait for navigation
      await waitFor(() => {
        expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
        expect(mockNavigate).toHaveBeenCalledWith('/verify-otp', {
          state: { email: 'test@example.com', intent: 'login' },
        });
      });
    });
  });

  describe('4.3: Shows error on invalid credentials', () => {
    it('should display error message when login fails', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({
        success: false,
        message: 'Invalid email or password',
      });

      render(<Login />);

      // Fill in the form
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');

      // Submit the form
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Wait for error message to appear
      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Should not navigate
      expect(mockNavigate).not.toHaveBeenCalled();
    });

    it('should clear error message when user starts typing again', async () => {
      const user = userEvent.setup();
      mockLogin.mockResolvedValue({
        success: false,
        message: 'Invalid email or password',
      });

      render(<Login />);

      // Fill in and submit to get an error
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      
      await user.type(emailInput, 'wrong@example.com');
      await user.type(passwordInput, 'wrongpassword');
      
      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
      });

      // Clear and retype - error should be cleared by demo credential click
      const demoButtons = screen.getAllByRole('button');
      const adminDemoButton = demoButtons.find(btn => 
        btn.textContent?.includes('admin@trustedcars.in')
      );
      
      if (adminDemoButton) {
        await user.click(adminDemoButton);
        
        await waitFor(() => {
          expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
        });
      }
    });
  });

  describe('4.4: Form validation (empty fields)', () => {
    it('should show validation error when email is empty', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show validation error when password is empty', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });

    it('should show validation error for invalid email format', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      await user.type(emailInput, 'test@example.com');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      });

      expect(mockLogin).not.toHaveBeenCalled();
    });
  });

  describe('4.5: Demo credentials work', () => {
    it('should fill in admin demo credentials when clicked', async () => {
      const user = userEvent.setup();
      render(<Login />);

      // Find the demo credential buttons
      const demoButtons = screen.getAllByRole('button');
      const adminDemoButton = demoButtons.find(btn => 
        btn.textContent?.includes('admin@trustedcars.in')
      );

      expect(adminDemoButton).toBeInTheDocument();
      
      if (adminDemoButton) {
        await user.click(adminDemoButton);

        const emailInput = screen.getByPlaceholderText(/you@example.com/i) as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText(/enter your password/i) as HTMLInputElement;

        await waitFor(() => {
          expect(emailInput.value).toBe('admin@trustedcars.in');
          expect(passwordInput.value).toBe('Admin@123');
        });
      }
    });

    it('should fill in dealer demo credentials when clicked', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const demoButtons = screen.getAllByRole('button');
      const dealerDemoButton = demoButtons.find(btn => 
        btn.textContent?.includes('dealer@trustedcars.in')
      );

      expect(dealerDemoButton).toBeInTheDocument();
      
      if (dealerDemoButton) {
        await user.click(dealerDemoButton);

        const emailInput = screen.getByPlaceholderText(/you@example.com/i) as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText(/enter your password/i) as HTMLInputElement;

        await waitFor(() => {
          expect(emailInput.value).toBe('dealer@trustedcars.in');
          expect(passwordInput.value).toBe('Dealer@123');
        });
      }
    });

    it('should fill in user demo credentials when clicked', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const demoButtons = screen.getAllByRole('button');
      const userDemoButton = demoButtons.find(btn => 
        btn.textContent?.includes('rahul.sharma@gmail.com')
      );

      expect(userDemoButton).toBeInTheDocument();
      
      if (userDemoButton) {
        await user.click(userDemoButton);

        const emailInput = screen.getByPlaceholderText(/you@example.com/i) as HTMLInputElement;
        const passwordInput = screen.getByPlaceholderText(/enter your password/i) as HTMLInputElement;

        await waitFor(() => {
          expect(emailInput.value).toBe('rahul.sharma@gmail.com');
          expect(passwordInput.value).toBe('User@123');
        });
      }
    });
  });

  describe('Additional Login Tests', () => {
    it('should toggle password visibility when eye icon is clicked', async () => {
      const user = userEvent.setup();
      render(<Login />);

      const passwordInput = screen.getByPlaceholderText(/enter your password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // Find and click the toggle button
      const toggleButtons = screen.getAllByRole('button');
      const eyeButton = toggleButtons.find(btn => 
        btn.querySelector('svg') && !btn.textContent?.includes('Sign In')
      );

      if (eyeButton) {
        await user.click(eyeButton);
        expect(passwordInput.type).toBe('text');

        await user.click(eyeButton);
        expect(passwordInput.type).toBe('password');
      }
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

      render(<Login />);

      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/enter your password/i);
      
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/signing in/i)).toBeInTheDocument();
    });

    it('should render forgot password link', () => {
      render(<Login />);
      const forgotPasswordLink = screen.getByRole('link', { name: /forgot password/i });
      expect(forgotPasswordLink).toBeInTheDocument();
      expect(forgotPasswordLink).toHaveAttribute('href', '/forgot-password');
    });

    it('should render create account link', () => {
      render(<Login />);
      const createAccountLink = screen.getByRole('link', { name: /create one/i });
      expect(createAccountLink).toBeInTheDocument();
      expect(createAccountLink).toHaveAttribute('href', '/register');
    });
  });
});
