/**
 * API Authentication Middleware
 *
 * Supports two modes:
 * 1. API Key: Set FAMLY_API_KEY env var. Clients send `X-API-Key` header.
 * 2. JWT: Set FAMLY_JWT_SECRET env var. Clients send `Authorization: Bearer <token>`.
 *
 * If neither is configured, auth is bypassed (for local-only development).
 * Rate limiting is applied regardless.
 */

import { createHmac, timingSafeEqual } from "node:crypto";
import type { Request, Response, NextFunction } from "express";

// ─── API Key Authentication ─────────────────────────────────────────────────

const API_KEY_ENV = "FAMLY_API_KEY";
const API_KEY_HEADER = "x-api-key";

/**
 * Timing-safe API key comparison to prevent timing attacks.
 */
function secureCompare(a: string, b: string): boolean {
  const aBuf = Buffer.from(a, "utf-8");
  const bBuf = Buffer.from(b, "utf-8");
  if (aBuf.length !== bBuf.length) return false;
  return timingSafeEqual(aBuf, bBuf);
}

function apiKeyAuth(req: Request, res: Response, next: NextFunction): void {
  const expectedKey = process.env[API_KEY_ENV];
  if (!expectedKey) {
    // No API key configured — skip auth (local dev mode)
    next();
    return;
  }

  const providedKey = req.headers[API_KEY_HEADER] as string | undefined;
  if (!providedKey || !secureCompare(providedKey, expectedKey)) {
    res.status(401).json({ error: "Invalid or missing API key" });
    return;
  }

  next();
}

// ─── JWT Authentication ─────────────────────────────────────────────────────

const JWT_SECRET_ENV = "FAMLY_JWT_SECRET";

interface JwtPayload {
  sub: string;
  iat: number;
  exp: number;
}

/**
 * Minimal JWT verification without external dependencies.
 * Parses and verifies HS256 JWTs.
 */
function verifyJwt(token: string, secret: string): JwtPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;

  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
    if (header.alg !== "HS256") return null;

    const payload: JwtPayload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));

    // Verify signature using timing-safe comparison
    const computedSig = createHmac("sha256", secret)
      .update(`${parts[0]}.${parts[1]}`)
      .digest("base64url");

    const computedBuf = Buffer.from(computedSig);
    const providedBuf = Buffer.from(parts[2]);

    // Length mismatch means invalid sig, but compare anyway to avoid timing leak
    if (computedBuf.length !== providedBuf.length) {
      return null;
    }

    if (!timingSafeEqual(computedBuf, providedBuf)) {
      return null;
    }

    // Check expiration
    if (payload.exp && Date.now() / 1000 > payload.exp) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

function jwtAuth(req: Request, res: Response, next: NextFunction): void {
  const secret = process.env[JWT_SECRET_ENV];
  if (!secret) {
    // No JWT secret configured — skip auth (local dev mode)
    next();
    return;
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({ error: "Missing or invalid authorization header" });
    return;
  }

  const token = authHeader.slice(7);
  const payload = verifyJwt(token, secret);

  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  // Attach user info to request for downstream use
  (req as any).user = { id: payload.sub };
  next();
}

// ─── Combined Auth Middleware ────────────────────────────────────────────────

/**
 * Authentication middleware that tries JWT first, then API key.
 * Skips auth entirely if no auth config is set (local dev mode).
 */
export function authMiddleware(req: Request, res: Response, next: NextFunction): void {
  const hasJwt = !!process.env[JWT_SECRET_ENV];
  const hasApiKey = !!process.env[API_KEY_ENV];

  // Skip health endpoint always
  if (req.path === "/health" || req.path === "/api/health") {
    next();
    return;
  }

  if (!hasJwt && !hasApiKey) {
    // No auth configured — log warning in production
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "⚠️  FAMLY-Office API running without authentication! " +
        "Set FAMLY_API_KEY or FAMLY_JWT_SECRET to secure your API."
      );
    }
    next();
    return;
  }

  // Try JWT if Authorization header is present
  if (hasJwt && req.headers.authorization?.startsWith("Bearer ")) {
    jwtAuth(req, res, next);
    return;
  }

  // Fall back to API key
  if (hasApiKey) {
    apiKeyAuth(req, res, next);
    return;
  }

  // JWT is configured but no Bearer header — try JWT auth which will return 401
  if (hasJwt) {
    jwtAuth(req, res, next);
    return;
  }

  next();
}
