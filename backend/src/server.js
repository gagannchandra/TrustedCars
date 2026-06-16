import { createApp } from "./app.js";
import { config } from "./config.js";
import { logger } from "./logger.js";
import { pool } from "./db.js";

const app = createApp();

const server = app.listen(config.port, () => {
  logger.info(`TrustedCars API listening`, {
    port: config.port,
    env: config.env,
    mode: config.databaseUrl ? "postgres" : "memory",
  });
});

async function shutdown(signal) {
  logger.info(`${signal} received — shutting down gracefully`);
  const forceExit = setTimeout(() => {
    logger.error("Forcing exit after shutdown timeout");
    process.exit(1);
  }, 10_000);
  forceExit.unref();

  server.close((err) => {
    if (err) logger.error("Error closing HTTP server", { error: err.message });
    else logger.info("HTTP server closed");
  });

  if (pool) {
    try {
      await pool.end();
      logger.info("Database pool closed");
    } catch (error) {
      logger.error("Database pool close failed", { error: error.message });
    }
  }

  process.exit(0);
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", { reason: String(reason) });
});
process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { error: error.message, stack: error.stack });
  process.exit(1);
});

export { server };
