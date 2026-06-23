# Frontend Testing Guide

This directory contains the testing infrastructure and utilities for the TrustedCars frontend application.

## Overview

The frontend testing setup uses:
- **Vitest** - Fast Vite-native test framework
- **React Testing Library** - Component testing utilities
- **MSW (Mock Service Worker)** - API mocking
- **jsdom** - Browser environment simulation

## Directory Structure

```
src/test/
├── mocks/
│   ├── handlers.ts      # MSW API route handlers
│   └── server.ts        # MSW server setup
├── factories.ts         # Test data factories
├── setup.ts            # Global test setup
├── utils.tsx           # Custom render utilities
└── README.md           # This file
```

## Running Tests

### Basic Commands

```bash
# Run tests in watch mode (development)
npm run test

# Run tests once (CI)
npm run test:run

# Run tests with UI (visual test runner)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Coverage

Coverage reports are generated in the `coverage/` directory:
- **HTML Report**: `coverage/index.html` (open in browser)
- **Text Summary**: Displayed in terminal
- **LCOV**: `coverage/lcov.info` (for CI tools)

Target coverage thresholds:
- Overall: 60%+
- Stores: 80%+
- Critical components: 70%+

## Writing Tests

### Basic Test Structure

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render successfully', () => {
    render(<MyComponent />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });
});
```

### Using Test Utilities

#### Custom Render with Providers

```typescript
import { render } from '@/test/utils';

// Automatically wraps with QueryClient and Router
render(<MyComponent />);
```

#### Using Factories

```typescript
import { createMockCar, createMockUser } from '@/test/factories';

const mockCar = createMockCar({ year: 2021, price: 30000 });
const mockUser = createMockUser({ role: 'dealer' });
```

#### MSW API Mocking

All API endpoints are mocked by default. To override a specific handler:

```typescript
import { server } from '@/test/mocks/server';
import { http, HttpResponse } from 'msw';

it('should handle API error', async () => {
  server.use(
    http.get('http://localhost:8000/api/v1/cars', () => {
      return HttpResponse.json({ detail: 'Server error' }, { status: 500 });
    })
  );
  
  // Your test code...
});
```

### Testing User Interactions

```typescript
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';

it('should handle button click', async () => {
  const user = userEvent.setup();
  render(<MyButton />);
  
  await user.click(screen.getByRole('button', { name: /submit/i }));
  expect(screen.getByText('Submitted')).toBeInTheDocument();
});
```

### Testing Forms

```typescript
import { render, screen, waitFor } from '@/test/utils';
import userEvent from '@testing-library/user-event';

it('should validate form fields', async () => {
  const user = userEvent.setup();
  render(<LoginForm />);
  
  const emailInput = screen.getByLabelText(/email/i);
  await user.type(emailInput, 'invalid-email');
  
  const submitButton = screen.getByRole('button', { name: /login/i });
  await user.click(submitButton);
  
  await waitFor(() => {
    expect(screen.getByText(/invalid email/i)).toBeInTheDocument();
  });
});
```

### Testing Async Operations

```typescript
import { render, screen, waitFor } from '@/test/utils';

it('should load data asynchronously', async () => {
  render(<CarList />);
  
  // Wait for loading to finish
  await waitFor(() => {
    expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
  });
  
  // Assert data is displayed
  expect(screen.getByText('Toyota Camry')).toBeInTheDocument();
});
```

### Testing Zustand Stores

```typescript
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '@/store/authStore';

it('should update auth state on login', async () => {
  const { result } = renderHook(() => useAuthStore());
  
  await act(async () => {
    await result.current.login('test@example.com', 'password');
  });
  
  expect(result.current.isAuthenticated).toBe(false); // Still false until OTP verified
});
```

## Best Practices

### 1. Test User Behavior, Not Implementation

❌ Bad:
```typescript
expect(wrapper.state().isOpen).toBe(true);
```

✅ Good:
```typescript
expect(screen.getByRole('dialog')).toBeVisible();
```

### 2. Use Accessible Queries

Prefer queries in this order:
1. `getByRole` - Most accessible
2. `getByLabelText` - For form fields
3. `getByPlaceholderText` - For inputs without labels
4. `getByText` - For non-interactive elements
5. `getByTestId` - Last resort

### 3. Write Isolated Tests

Each test should:
- Be independent (can run in any order)
- Clean up after itself (done automatically)
- Not rely on other tests
- Use fresh data (via factories)

### 4. Avoid Testing Implementation Details

Focus on:
- What the user sees
- What the user can interact with
- The behavior from the user's perspective

Don't test:
- Component state directly
- Internal function calls
- CSS classes or styling

### 5. Keep Tests Simple

- One concept per test
- Clear arrange-act-assert structure
- Descriptive test names
- Minimal mocking

## Troubleshooting

### Tests are slow

- Use `vitest run` instead of watch mode in CI
- Check for unnecessary `waitFor` with long timeouts
- Ensure MSW handlers respond quickly

### Tests are flaky

- Use `waitFor` for async operations
- Avoid hardcoded timeouts (`setTimeout`)
- Check for shared state between tests
- Ensure proper cleanup in `afterEach`

### MSW not intercepting requests

- Verify the request URL matches exactly
- Check the HTTP method (GET, POST, etc.)
- Ensure MSW server is started in `setup.ts`
- Look for typos in API endpoint paths

### Coverage not accurate

- Run `npm run test:coverage` to generate fresh report
- Check `vitest.config.ts` for excluded files
- Ensure test files use `.test.ts` or `.test.tsx` extension

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Documentation](https://mswjs.io/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new tests:
1. Place test files next to the code they test (co-location)
2. Use descriptive test names: `it('should <expected behavior> when <condition>')`
3. Update factories when adding new data types
4. Add MSW handlers for new API endpoints
5. Run tests locally before committing
6. Maintain or improve coverage

## Support

For questions or issues with tests:
1. Check this README
2. Review existing test files for examples
3. Check Vitest documentation
4. Ask the team in #testing channel
