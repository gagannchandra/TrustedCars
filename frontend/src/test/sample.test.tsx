import { describe, it, expect } from "vitest";
import { render, screen } from "./utils";
import { createMockCar, createMockUser } from "./factories";

/**
 * Sample test to verify testing infrastructure is working correctly
 * This tests the basic setup: Vitest, React Testing Library, MSW
 */

describe("Testing Infrastructure", () => {
  it("should run basic test", () => {
    expect(true).toBe(true);
  });

  it("should use test factories", () => {
    const mockCar = createMockCar({ make: "Honda", year: 2021 });
    expect(mockCar.make).toBe("Honda");
    expect(mockCar.year).toBe(2021);
  });

  it("should render a simple component", () => {
    const TestComponent = () => <div>Hello Testing!</div>;
    render(<TestComponent />);
    expect(screen.getByText("Hello Testing!")).toBeInTheDocument();
  });

  it("should create mock data with factories", () => {
    const mockUser = createMockUser({ email: "custom@test.com" });
    expect(mockUser.email).toBe("custom@test.com");
    expect(mockUser.role).toBe("user");
  });

  it("should verify jsdom environment", () => {
    expect(typeof window).toBe("object");
    expect(typeof document).toBe("object");
  });
});

/**
 * Component-level test example
 */
function SimpleButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} type="button">
      Click Me
    </button>
  );
}

describe("SimpleButton Component", () => {
  it("should render button", () => {
    const handleClick = () => {};
    render(<SimpleButton onClick={handleClick} />);
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });

  it("should handle click events", async () => {
    let clicked = false;
    const handleClick = () => {
      clicked = true;
    };
    render(<SimpleButton onClick={handleClick} />);
    
    const button = screen.getByRole("button", { name: /click me/i });
    button.click();
    
    expect(clicked).toBe(true);
  });
});
