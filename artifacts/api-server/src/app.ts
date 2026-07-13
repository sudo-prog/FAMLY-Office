import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import mcpRouter from "./routes/mcp";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/auth";
import { rateLimit } from "./middlewares/rate-limit";
import { sanitizeInput } from "./middlewares/validate";
import { requestId } from "./middlewares/request-id";
import { errorHandler, notFoundHandler } from "./middlewares/error-handler";
import { corsOrigins } from "./lib/env";

const app: Express = express();

// ─── Security Middleware ─────────────────────────────────────────────────────

// Request-ID correlation — MUST be first: every downstream logger and the
// error/404 handlers read req.id / req.log.
app.use(requestId);

// CORS: Restrict to known origins in production
app.use(
  cors({
    origin: corsOrigins,
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-API-Key"],
    maxAge: 86400, // Preflight cache for 24h
  })
);

// Rate limiting: 100 requests per 15 minutes per IP by default
// Stricter limits for auth-adjacent endpoints can be applied per-route
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));

// Request logging
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  })
);

// Body parsing
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Input sanitization (strip script tags, event handlers, javascript: URLs)
app.use(sanitizeInput);

// Authentication (API key or JWT)
app.use(authMiddleware);

// ─── Routes ──────────────────────────────────────────────────────────────────

app.use("/api", router);

// ─── 404 + Error handlers (MUST be registered LAST) ──────────────────────
// A 404 here means no router above matched — returns structured JSON, never the
// SPA fallback. The 4-arg signature is what Express 5 uses to detect an
// error handler.
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Security Headers ───────────────────────────────────────────────────────

app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "0"); // Modern approach: disable browser XSS filter
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");
  res.removeHeader("X-Powered-By");
  next();
});

export default app;
