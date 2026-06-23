import { render, RenderOptions } from "@testing-library/react";
import { ReactElement, ReactNode } from "react";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * Custom render function that wraps components with necessary providers
 * Usage: render(<MyComponent />, { wrapper: AllTheProviders })
 */

interface AllProvidersProps {
  children: ReactNode;
}

function AllTheProviders({ children }: AllProvidersProps) {
  // Create a new QueryClient for each test to ensure isolation
  const testQueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries in tests
        gcTime: 0, // Disable caching
      },
    },
  });

  return (
    <QueryClientProvider client={testQueryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
}

/**
 * Custom render function with all providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">
) {
  return render(ui, { wrapper: AllTheProviders, ...options });
}

/**
 * Re-export everything from @testing-library/react
 */
export * from "@testing-library/react";

/**
 * Override the default render with our custom render
 */
export { renderWithProviders as render };
