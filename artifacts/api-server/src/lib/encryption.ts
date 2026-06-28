/**
 * AES-256-GCM Encryption Module for FAMLY-Office Document Vault
 *
 * Previously the vault only stored an `encrypted: boolean` flag with NO actual
 * encryption. This module implements real encryption/decryption of document
 * content using AES-256-GCM via Node.js crypto module.
 *
 * Key derivation: PBKDF2 with 600,000 iterations (OWASP 2023 recommendation)
 * Cipher: AES-256-GCM (authenticated encryption)
 * Salt: Random 16 bytes per encryption operation
 * IV: Random 12 bytes per encryption operation
 */

import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv } from "node:crypto";

const ENCRYPTION_KEY_ENV = "FAMLY_ENCRYPTION_KEY";
const PBKDF2_ITERATIONS = 600_000;
const KEY_LENGTH = 32; // 256 bits
const SALT_LENGTH = 16;
const IV_LENGTH = 12; // 96 bits for GCM
const AUTH_TAG_LENGTH = 16;

/**
 * Get or derive the encryption key from the environment variable.
 * The key can be either:
 * 1. A 32-byte hex string (64 hex chars) — used directly
 * 2. A passphrase — derived via PBKDF2 with a fixed salt
 */
function getEncryptionKey(): Buffer {
  const keyOrPassphrase = process.env[ENCRYPTION_KEY_ENV];
  if (!keyOrPassphrase) {
    throw new Error(
      `${ENCRYPTION_KEY_ENV} environment variable is required for document encryption. ` +
      `Set it to a 64-character hex key or a strong passphrase.`
    );
  }

  // If it's a 64-char hex string, use directly as AES-256 key
  if (/^[0-9a-f]{64}$/i.test(keyOrPassphrase)) {
    return Buffer.from(keyOrPassphrase, "hex");
  }

  // Derive key from passphrase using PBKDF2
  // Note: In production, the salt should be stored/derived from a stable source
  const derivedSalt = Buffer.from("famly-office-encryption-key-salt-v1", "utf-8");
  return pbkdf2Sync(keyOrPassphrase, derivedSalt, PBKDF2_ITERATIONS, KEY_LENGTH, "sha256");
}

export interface EncryptedPayload {
  /** Base64-encoded ciphertext */
  ciphertext: string;
  /** Base64-encoded authentication tag */
  tag: string;
  /** Base64-encoded initialization vector */
  iv: string;
  /** Base64-encoded salt (for future key rotation) */
  salt: string;
  /** Encryption algorithm version for future migrations */
  version: 1;
}

/**
 * Encrypt plaintext using AES-256-GCM.
 *
 * @param plaintext - The string content to encrypt
 * @returns EncryptedPayload with all components needed for decryption
 */
export function encrypt(plaintext: string): EncryptedPayload {
  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);
  const salt = randomBytes(SALT_LENGTH);

  const cipher = createCipheriv("aes-256-gcm", key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    ciphertext: encrypted.toString("base64"),
    tag: tag.toString("base64"),
    iv: iv.toString("base64"),
    salt: salt.toString("base64"),
    version: 1,
  };
}

/**
 * Decrypt an EncryptedPayload using AES-256-GCM.
 *
 * @param payload - The encrypted payload to decrypt
 * @returns The original plaintext string
 * @throws Error if decryption fails (wrong key, tampered data, etc.)
 */
export function decrypt(payload: EncryptedPayload): string {
  const key = getEncryptionKey();

  const iv = Buffer.from(payload.iv, "base64");
  const tag = Buffer.from(payload.tag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = createDecipheriv("aes-256-gcm", key, iv, {
    authTagLength: AUTH_TAG_LENGTH,
  });

  decipher.setAuthTag(tag);

  try {
    const decrypted = Buffer.concat([
      decipher.update(ciphertext),
      decipher.final(),
    ]);
    return decrypted.toString("utf8");
  } catch (err) {
    throw new Error(
      "Decryption failed — data may have been tampered with or the encryption key is incorrect"
    );
  }
}

/**
 * Serialize an EncryptedPayload to a single string for database storage.
 */
export function serializeEncrypted(payload: EncryptedPayload): string {
  return JSON.stringify(payload);
}

/**
 * Deserialize an encrypted string from database storage.
 */
export function deserializeEncrypted(data: string): EncryptedPayload | null {
  try {
    const parsed = JSON.parse(data);
    if (parsed.version === 1 && parsed.ciphertext && parsed.iv && parsed.tag) {
      return parsed as EncryptedPayload;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Check if a string value is an encrypted payload.
 */
export function isEncryptedPayload(value: string | null | undefined): boolean {
  if (!value) return false;
  try {
    const parsed = JSON.parse(value);
    return !!(parsed.version === 1 && parsed.ciphertext && parsed.iv && parsed.tag);
  } catch {
    return false;
  }
}
