import app from "./app";
import { logger } from "./lib/logger";
import { env, isEncryptionConfigured } from "./lib/env";

// Warn if encryption key is not set (don't crash — allows startup for debugging)
if (!isEncryptionConfigured) {
  logger.warn(
    "FAMLY_ENCRYPTION_KEY environment variable is not set. " +
    "Document encryption/decryption will fail. " +
    "Set it to a 64-character hex key or a strong passphrase."
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
