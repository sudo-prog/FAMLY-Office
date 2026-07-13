import type { Request, Response, NextFunction } from "express";
import crypto from "node:crypto";
import { logger } from "../lib/logger";

/**
 * Request-ID correlation middleware.
 *
 * Generates (or accepts) a correlation ID at the system boundary and attaches it
 * to every log line, the response header, and the downstream child logger. Without
 * this, a single request's lifecycle cannot be reconstructed from interleaved logs.
 *
 * - Incoming `x-request-id` is reused (so upstream proxies / the Vercel
 *   serverless runtime can correlate spans).
 * - Otherwise we mint a UUID v4.
 * - `req.log` is a pino child logger that already carries `requestId`, so every
 *   subsequent `req.log.info(...)` call is correlated automatically.
 */
export function requestId(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming =
    (typeof req.headers["x-request-id"] === "string" &&
      req.headers["x-request-id"].trim()) ||
    undefined;
  const id = incoming ?? crypto.randomUUID();

  // Make the id available to pino-http (its serializers read req.id) and to the
  // rest of the app.
  (req as Request & { id: string }).id = id;

  // Child logger scoped to this request.
  (req as Request & { log: typeof logger }).log = logger.child({ requestId: id });

  // Echo the id back so clients / proxies can correlate.
  res.setHeader("x-request-id", id);

  next();
}
