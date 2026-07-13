import app from "./app";
import { logger } from "./lib/logger";
import { env, isEncryptionConfigured } from "./lib/env";

// ─── Process-level crash guards ───────────────────────────────────────────────
// These catch failures that escape Express' request-scoped error handler:
//   - uncaughtException: a throw with no catch (e.g. sync bug in a timer)
//   - unhandledRejection: a Promise that rejected with no .catch()
// We log with full context, then exit so the supervisor (systemd / Vercel)
// restarts the process cleanly. Swallowing these silently corrupts state.

function logAndExit(signal: string, err: unknown): void {
  const e = err as { name?: string; message?: string; stack?: string };
  logger.error(
    {
      event: "process_uncaught",
      signal,
      err: { name: e?.name, message: e?.message, stack: e?.stack },
    },
    `Uncaught ${signal} — exiting`,
  );
  // Give the logger a tick to flush (pino writes async), then exit non-zero
  // so the process manager restarts us.
  setTimeout(() => process.exit(1), 50).unref();
}

process.on("uncaughtException", (err) => logAndExit("exception", err));
process.on("unhandledRejection", (reason) =>
  logAndExit("rejection", reason as unknown),
);

// ─── Startup warnings ────────────────────────────────────────────────────────

// Warn if encryption key is not set (don't crash — allows startup for debugging)
if (!isEncryptionConfigured) {
  logger.warn(
    "FAMLY_ENCRYPTION_KEY environment variable is not set. " +
      "Document encryption/decryption will fail. " +
      "Set it to a 64-character hex key or a strong passphrase.",
  );
}

const port = env.PORT;

app.listen(port, (err) => {
  if (err) {
    logger.error({ err }, "Error listening on port");
    process.exit(1);
  }

  logger.info({ port }, "Server listening");
});
