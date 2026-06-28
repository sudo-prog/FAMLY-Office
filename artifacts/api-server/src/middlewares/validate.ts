/**
 * Input Validation Middleware
 *
 * Uses Zod schemas from @workspace/api-zod to validate request bodies
 * and query parameters.
 */

import type { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod/v4";

/**
 * Middleware factory that validates req.body against a Zod schema.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({ error: "Validation failed", details: errors });
      return;
    }
    // Replace body with parsed/validated data
    req.body = result.data;
    next();
  };
}

/**
 * Middleware factory that validates req.query against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({ error: "Validation failed", details: errors });
      return;
    }
    req.query = result.data as any;
    next();
  };
}

/**
 * Middleware factory that validates req.params against a Zod schema.
 */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const errors = formatZodErrors(result.error);
      res.status(400).json({ error: "Validation failed", details: errors });
      return;
    }
    req.params = result.data as any;
    next();
  };
}

/**
 * Sanitize user input to prevent XSS in string fields.
 * Strips <script> tags and javascript: URLs.
 */
export function sanitizeInput(req: Request, _res: Response, next: NextFunction): void {
  const sanitize = (value: unknown): unknown => {
    if (typeof value === "string") {
      return value
        .replace(/<\s*script[^>]*>[\s\S]*?<\s*\/\s*script>/gi, "")
        .replace(/<\s*script[^>]*\/?>/gi, "")
        .replace(/javascript\s*:/gi, "")
        .replace(/on\w+\s*=\s*["'][^"']*["']/gi, "");
    }
    if (Array.isArray(value)) return value.map(sanitize);
    if (value && typeof value === "object") {
      const sanitized: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(value)) {
        sanitized[k] = sanitize(v);
      }
      return sanitized;
    }
    return value;
  };

  req.body = sanitize(req.body);
  next();
}

function formatZodErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    errors[path || "_root"] = issue.message;
  }
  return errors;
}
