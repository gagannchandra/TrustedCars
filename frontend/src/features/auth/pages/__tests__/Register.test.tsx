import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils';
import Register from '../Register';
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

describe('Register Component', () => {
  const mockRegister = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      register: mockRegister,
    });
    (useNavigate as any).mockReturnValue(mockNavigate);
  });

  describe('4.7: Step 1 validation (email, password)', () => {
    it('should show validation error when full name is too short', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      await user.type(nameInput, 'A');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/full name must be at least 2 characters/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error when email is empty', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email is required/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error when password is too short', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'Short1!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show validation error when passwords do not match', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmPasswordInput, 'DifferentPass123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/passwords don't match/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });
  });

  describe('4.8: Password strength validation', () => {
    it('should show error when password lacks uppercase letter', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'lowercase123!');
      await user.type(confirmPasswordInput, 'lowercase123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 1 uppercase/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when password lacks lowercase letter', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'UPPERCASE123!');
      await user.type(confirmPasswordInput, 'UPPERCASE123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 1 uppercase/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when password lacks number', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'NoNumbers!');
      await user.type(confirmPasswordInput, 'NoNumbers!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 1 uppercase/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should show error when password lacks special character', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'NoSpecial123');
      await user.type(confirmPasswordInput, 'NoSpecial123');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/password must contain at least 1 uppercase/i)).toBeInTheDocument();
      });

      expect(mockRegister).not.toHaveBeenCalled();
    });

    it('should accept valid strong password', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        success: true,
        message: 'OTP sent to email',
      });

      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmPasswordInput, 'ValidPass123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalled();
      });
    });
  });

  describe('4.9: Successful registration shows OTP screen', () => {
    it('should navigate to verify-otp page on successful registration', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        success: true,
        message: 'Account created successfully!',
      });

      render(<Register />);

      // Fill in the form with valid data
      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmPasswordInput, 'ValidPass123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockRegister).toHaveBeenCalledWith({
          full_name: 'Test User',
          email: 'test@example.com',
          password: 'ValidPass123!',
          role: 'user',
        });
        expect(mockNavigate).toHaveBeenCalledWith('/verify-otp', {
          state: { email: 'test@example.com', intent: 'register' },
        });
      });
    });

    it('should display error message on registration failure', async () => {
      const user = userEvent.setup();
      mockRegister.mockResolvedValue({
        success: false,
        message: 'Email already exists',
      });

      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'existing@example.com');
      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmPasswordInput, 'ValidPass123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
      });

      expect(mockNavigate).not.toHaveBeenCalled();
    });
  });

  describe('Additional Register Tests', () => {
    it('should allow selecting user role', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const userRoleButton = screen.getByRole('button', { name: /standard user/i });
      await user.click(userRoleButton);

      // User role should be selected by default, but clicking should keep it selected
      expect(userRoleButton).toHaveClass('border-primary');
    });

    it('should allow selecting dealer role', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const dealerRoleButton = screen.getByRole('button', { name: /enterprise dealer/i });
      await user.click(dealerRoleButton);

      // Dealer role should now be selected
      expect(dealerRoleButton).toHaveClass('border-primary');
    });

    it('should toggle password visibility', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');

      // Find the password toggle button (first one in the list)
      const toggleButtons = screen.getAllByRole('button');
      const passwordToggle = toggleButtons.find(btn => 
        btn.querySelector('svg') && 
        btn.closest('div')?.querySelector('input[placeholder*="Min. 8 characters"]')
      );

      if (passwordToggle) {
        await user.click(passwordToggle);
        expect(passwordInput.type).toBe('text');

        await user.click(passwordToggle);
        expect(passwordInput.type).toBe('password');
      }
    });

    it('should toggle confirm password visibility', async () => {
      const user = userEvent.setup();
      render(<Register />);

      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i) as HTMLInputElement;
      expect(confirmPasswordInput.type).toBe('password');

      // Find the confirm password toggle button
      const toggleButtons = screen.getAllByRole('button');
      const confirmPasswordToggle = toggleButtons.find(btn => 
        btn.querySelector('svg') && 
        btn.closest('div')?.querySelector('input[placeholder*="Confirm your password"]')
      );

      if (confirmPasswordToggle) {
        await user.click(confirmPasswordToggle);
        expect(confirmPasswordInput.type).toBe('text');

        await user.click(confirmPasswordToggle);
        expect(confirmPasswordInput.type).toBe('password');
      }
    });

    it('should disable submit button while submitting', async () => {
      const user = userEvent.setup();
      mockRegister.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)));

      render(<Register />);

      const nameInput = screen.getByPlaceholderText(/gagan chandra/i);
      const emailInput = screen.getByPlaceholderText(/you@example.com/i);
      const passwordInput = screen.getByPlaceholderText(/min. 8 characters/i);
      const confirmPasswordInput = screen.getByPlaceholderText(/confirm your password/i);
      
      await user.type(nameInput, 'Test User');
      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'ValidPass123!');
      await user.type(confirmPasswordInput, 'ValidPass123!');

      const submitButton = screen.getByRole('button', { name: /create account/i });
      await user.click(submitButton);

      // Button should be disabled during submission
      expect(submitButton).toBeDisabled();
      expect(screen.getByText(/creating account/i)).toBeInTheDocument();
    });

    it('should render sign in link', () => {
      render(<Register />);
      const signInLink = screen.getByRole('link', { name: /sign in/i });
      expect(signInLink).toBeInTheDocument();
      expect(signInLink).toHaveAttribute('href', '/login');
    });
  });
});
