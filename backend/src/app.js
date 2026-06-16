import express from "express";
import cors from "cors";
import helmet from "helmet";
import { requestLogger } from "./middleware/requestLogger.js";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import { config } from "./config.js";
import { errorHandler, routeNotFound } from "./errors.js";
import { healthCheck } from "./db.js";
import apiRoutes from "./routes/index.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
  app.use(cors({ origin: config.corsOrigin, credentials: true }));
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ extended: true, limit: "2mb" }));
  app.use(requestLogger);
  app.use(rateLimit({ windowMs: 60 * 1000, limit: 240, standardHeaders: true, legacyHeaders: false }));

  app.get("/health", async (_req, res, next) => {
    try {
      res.json({ success: true, data: await healthCheck() });
    } catch (error) {
      next(error);
    }
  });

  app.use("/api/v1", apiRoutes);
  app.use(routeNotFound);
  app.use(errorHandler);

  return app;
}