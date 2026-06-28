/**
 * Environment variable validation for FAMLY-Office API Server
 *
 * Uses Zod to validate all required environment variables at import time.
 * Fails fast with clear error messages if required variables are missing.
 *
 * Use this module everywhere instead of accessing process.env directly.
 *
 * import { env } from "./lib/env";
 * const port = env.PORT;
 */

import { z } from "zod/v4";

const envSchema = z.object({
  // ─── Server ──────────────────────────────────────────────────────
  PORT: z.coerce.number().int().positive().default(3001),
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),

  // ─── CORS ────────────────────────────────────────────────────────
  CORS_ORIGINS: z.string().optional(),

  // ─── Authentication ──────────────────────────────────────────────
  FAMLY_API_KEY: z.string().min(16).optional(),
  FAMLY_JWT_SECRET: z.string().min(32).optional(),

  // ─── Encryption ──────────────────────────────────────────────────
  FAMLY_ENCRYPTION_KEY: z.string().optional(),

  // ─── Logging ─────────────────────────────────────────────────────
  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  // ─── Brave Search ────────────────────────────────────────────────
  BRAVE_SEARCH_KEY: z.string().min(1).optional(),

  // ─── Cloud AI ────────────────────────────────────────────────────
  CLOUD_AI_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  CLOUD_AI_URL: z.string().url().optional(),
  CLOUD_AI_MODEL: z.string().min(1).default("gpt-4o-mini"),

  // ─── Local LLM ──────────────────────────────────────────────────
  LOCAL_LLM_URL: z.string().url().default("http://localhost:11434/v1"),
  LOCAL_LLM_MODEL: z.string().min(1).default("llama3.2"),

  // ─── GitHub ──────────────────────────────────────────────────────
  GITHUB_TOKEN: z.string().min(1).optional(),
});

// Validate and parse
const result = envSchema.safeParse(process.env);

if (!result.success) {
  const issues = result.error.issues
    .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
    .join("\n");
  throw new Error(
    `Invalid environment variables:\n${issues}\n\n` +
    `Please check your .env file. See .env.example for required variables.`
  );
}

/** Validated and typed environment variables */
export const env = result.data;

// ─── Derived convenience getters ────────────────────────────────────────────────

/** True if in production mode */
export const isProduction: boolean = env.NODE_ENV === "production";

/** True if any auth mechanism is configured */
export const isAuthConfigured: boolean = !!(env.FAMLY_API_KEY || env.FAMLY_JWT_SECRET);

/** True if cloud AI is available */
export const isCloudAIConfigured: boolean = !!(env.CLOUD_AI_KEY || env.OPENAI_API_KEY);

/** True if document vault encryption is configured */
export const isEncryptionConfigured: boolean = !!env.FAMLY_ENCRYPTION_KEY;

/** Cloud AI base URL (custom endpoint or default OpenAI) */
export const cloudAIBaseUrl: string = env.CLOUD_AI_URL || "https://api.openai.com/v1";

/** Cloud AI API key (CLOUD_AI_KEY or OPENAI_API_KEY) */
export const cloudAIKey: string | undefined = env.CLOUD_AI_KEY || env.OPENAI_API_KEY;

/** CORS origins as an array (empty array in production if not set) */
export const corsOrigins: string[] | true = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(",").map((o: string) => o.trim()).filter(Boolean)
  : env.NODE_ENV === "production"
    ? []
    : true;
