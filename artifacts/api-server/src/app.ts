import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import mcpRouter from "./routes/mcp";
import { logger } from "./lib/logger";
import { authMiddleware } from "./middlewares/auth";
import { rateLimit } from "./middlewares/rate-limit";
import { sanitizeInput } from "./middlewares/validate";

const app: Express = express();

// ─── Security Middleware ─────────────────────────────────────────────────────

// CORS: Restrict to known origins in production
const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((o) => o.trim())
  : process.env.NODE_ENV === "production"
    ? [] // No origins in production unless explicitly configured
    : true; // Allow all in development

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
  }),
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
