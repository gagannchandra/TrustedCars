/**
 * Centralised runtime configuration.
 * Values are sourced from Vite env vars (prefixed with VITE_) and fall back to
 * safe defaults so the SPA works standalone in demo mode.
 */
function env(key: string, fallback: string): string {
  // import.meta.env is statically replaced by Vite at build time.
  const value = (import.meta.env as Record<string, string | undefined>)[key];
  return value && value.length > 0 ? value : fallback;
}

export const config = {
  appName: "TrustedCars",
  apiUrl: env("VITE_API_URL", "/api/v1"),
  /** When true the app uses its bundled demo data and skips live API calls. */
  demoMode: env("VITE_DEMO_MODE", "true") === "true",
  supportPhone: "+918000123456",
  supportEmail: "help@trustedcars.in",
  tokenReservationPaise: 500000,
  currency: "INR",
  locale: "en-IN",
} as const;

export type AppConfig = typeof config;
