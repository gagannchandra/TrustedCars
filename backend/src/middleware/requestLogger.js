import { randomUUID } from "crypto";
import { createLogger } from "../logger.js";

const log = createLogger("http");

/**
 * Assigns a request id (from header or freshly minted), echoes it on the
 * response, and emits a single structured log line per request on completion.
 */
export function requestLogger(req, res, next) {
  req.id = req.headers["x-request-id"] || randomUUID();
  res.setHeader("x-request-id", req.id);

  const start = process.hrtime.bigint();
  res.on("finish", () => {
    const durationMs = Math.round(Number(process.hrtime.bigint() - start) / 1e6);
    const status = res.statusCode;
    const level = status >= 500 ? "error" : status >= 400 ? "warn" : "info";
    log[level](`${req.method} ${req.originalUrl}`, {
      request_id: req.id,
      status,
      duration_ms: durationMs,
      ip: req.ip,
    });
  });

  next();
}
