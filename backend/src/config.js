import dotenv from "dotenv";

dotenv.config({ path: process.env.ENV_FILE || ".env" });

export const config = {
  env: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL || "",
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me-before-production",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "15m",
  refreshExpiresIn: process.env.REFRESH_EXPIRES_IN || "30d",
  corsOrigin: (process.env.CORS_ORIGIN || "http://localhost:5173").split(","),
  cookieSecure: process.env.COOKIE_SECURE === "true",
  demoOtp: process.env.DEMO_OTP || "123456",
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME || "trustedcars-demo",
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || "rzp_test_trustedcars",
  publicBaseUrl: process.env.PUBLIC_BASE_URL || "http://localhost:4000",
};

export function isProduction() {
  return config.env === "production";
}