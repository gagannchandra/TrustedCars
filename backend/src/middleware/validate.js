import { badRequest } from "../errors.js";

export function validate(schema) {
  return (req, _res, next) => {
    const result = schema.safeParse({ body: req.body, query: req.query, params: req.params });
    if (!result.success) {
      const message = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
      return next(badRequest(message));
    }
    req.validated = result.data;
    next();
  };
}