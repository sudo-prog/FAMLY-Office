/**
 * Rate Limiting Middleware
 *
 * Simple in-memory rate limiter. For production with multiple instances,
 * consider using Redis-backed rate limiting.
 *
 * Since we can't install express-rate-limit without updating the workspace,
 * we implement a minimal token-bucket rate limiter.
 */

import type { Request, Response, NextFunction } from "express";

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const store = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window per IP */
  max: number;
  /** Optional message for 429 responses */
  message?: string;
}

const DEFAULT_OPTIONS: RateLimitOptions = {
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: "Too many requests, please try again later.",
};

/**
 * Rate limiting middleware using a sliding window algorithm.
 */
export function rateLimit(options: Partial<RateLimitOptions> = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return (req: Request, res: Response, next: NextFunction): void => {
    // Use X-Forwarded-For if behind a proxy, otherwise connection remote address
    const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim()
      || req.ip
      || req.socket.remoteAddress
      || "unknown";

    const now = Date.now();

    let entry = store.get(ip);

    if (!entry || now > entry.resetTime) {
      entry = { count: 1, resetTime: now + opts.windowMs };
      store.set(ip, entry);
    } else {
      entry.count++;
    }

    const remaining = Math.max(0, opts.max - entry.count);
    const resetTimeSeconds = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader("X-RateLimit-Limit", String(opts.max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));
    res.setHeader("X-RateLimit-Reset", String(resetTimeSeconds));

    if (entry.count > opts.max) {
      res.setHeader("Retry-After", String(resetTimeSeconds));
      res.status(429).json({ error: opts.message });
      return;
    }

    next();
  };
}
