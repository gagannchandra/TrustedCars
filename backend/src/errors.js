export class AppError extends Error {
  constructor(message, statusCode = 500, code = "APP_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

export function notFound(message = "Resource not found") {
  return new AppError(message, 404, "NOT_FOUND");
}

export function unauthorized(message = "Authentication required") {
  return new AppError(message, 401, "UNAUTHORIZED");
}

export function forbidden(message = "You do not have permission to perform this action") {
  return new AppError(message, 403, "FORBIDDEN");
}

export function badRequest(message = "Invalid request") {
  return new AppError(message, 400, "BAD_REQUEST");
}

export function errorHandler(err, _req, res, _next) {
  const statusCode = err.statusCode || 500;
  const payload = {
    success: false,
    error: {
      code: err.code || "INTERNAL_SERVER_ERROR",
      message: statusCode === 500 ? "Something went wrong" : err.message,
    },
  };

  if (process.env.NODE_ENV !== "production") {
    payload.error.debug = err.message;
    payload.error.stack = err.stack;
  }

  res.status(statusCode).json(payload);
}

export function routeNotFound(req, _res, next) {
  next(notFound(`Route ${req.method} ${req.originalUrl} not found`));
}