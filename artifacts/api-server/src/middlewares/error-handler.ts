import type { Request, Response, NextFunction } from "express";
import { logger } from "../lib/logger";

/**
 * Express 5 error-handling middleware (must use 4 args so Express recognises it
 * as an error handler). Logs the full error once with correlation id and returns a
 * safe, structured 500 — never leaking stack traces or internal detail to the
 * client.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  // next is required by Express' error-handler signature even though unused.
  _next: NextFunction,
): void {
  const requestId = (req as Request & { id?: string }).id;
  const log = (req as Request & { log?: typeof logger }).log ?? logger;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const anyErr = err as any;
  const status = typeof anyErr?.status === "number" ? anyErr.status : 500;
  const isServerError = status >= 500;

  const event = isServerError ? "request_failed" : "request_error";
  log.error(
    {
      event,
      requestId,
      method: req.method,
      url: req.originalUrl?.split("?")[0],
      statusCode: status,
      err: {
        name: anyErr?.name,
        message: anyErr?.message,
        // stack is captured for server logs only; never sent to the client.
        stack: isServerError ? anyErr?.stack : undefined,
      },
    },
    "Unhandled error in request",
  );

  if (res.headersSent) {
    // The response has already started streaming (e.g. an SSE stream); we cannot
    // change the status, just abort.
    res.end();
    return;
  }

  res.status(status).json({
    error: isServerError ? "Internal server error" : anyErr?.message ?? "Error",
    requestId,
  });
}

/**
 * 404 handler — registered LAST, after all routers, so any unmatched path
 * (including /api/* that does not exist) returns a structured JSON 404 instead of
 * falling through to the SPA. Returns both the attempted path and the request id
 * for correlation.
 */
export function notFoundHandler(req: Request, res: Response): void {
  const requestId = (req as Request & { id?: string }).id;
  const log = (req as Request & { log?: typeof logger }).log ?? logger;
  log.warn(
    {
      event: "route_not_found",
      requestId,
      method: req.method,
      url: req.originalUrl?.split("?")[0],
    },
    "No route matched request",
  );
  res.status(404).json({
    error: "Not found",
    path: req.originalUrl?.split("?")[0],
    requestId,
  });
}
