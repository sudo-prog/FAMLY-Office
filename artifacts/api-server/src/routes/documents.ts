import { Router } from "express";
import { db } from "@workspace/db";
import { documentsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListDocumentsQueryParams,
  CreateDocumentBody,
  GetDocumentParams,
  UpdateDocumentParams,
  UpdateDocumentBody,
  DeleteDocumentParams,
} from "@workspace/api-zod";
import {
  encrypt,
  decrypt,
  serializeEncrypted,
  deserializeEncrypted,
  isEncryptedPayload,
} from "../lib/encryption";

const router = Router();

/**
 * Encrypt a field value if it's non-empty plaintext.
 * Returns the serialized encrypted string, or the original value if
 * already encrypted or empty/null/undefined.
 * Sets `didEncrypt` to true when encryption was performed.
 */
function encryptField(
  value: string | null | undefined,
  didEncrypt: { value: boolean },
): string | null {
  if (!value) return null;
  // Already encrypted — don't double-encrypt
  if (isEncryptedPayload(value)) return value;
  didEncrypt.value = true;
  return serializeEncrypted(encrypt(value));
}

/**
 * Decrypt a field value if it's an encrypted payload.
 * Returns the plaintext string, or the original value if it's
 * plaintext (migration period) or null/undefined.
 * Throws on decryption failure.
 */
function decryptField(value: string | null | undefined): string | null {
  if (!value) return null;
  // Not encrypted — plaintext from before migration
  if (!isEncryptedPayload(value)) return value;
  const payload = deserializeEncrypted(value);
  if (!payload) {
    // Looks like it might be encrypted but can't parse — return as-is
    return value;
  }
  return decrypt(payload);
}

router.get("/documents/recent", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(documentsTable)
      .orderBy(desc(documentsTable.createdAt))
      .limit(8);
    res.json(rows.map(formatDocument));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent documents" });
  }
});

router.get("/documents", async (req, res) => {
  try {
    const query = ListDocumentsQueryParams.parse(req.query);
    let rows = await db.select().from(documentsTable).orderBy(desc(documentsTable.createdAt));
    if (query.tag) rows = rows.filter((d) => d.tags?.includes(query.tag!));
    if (query.entityId != null) rows = rows.filter((d) => d.entityId === query.entityId);
    res.json(rows.map(formatDocument));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch documents" });
  }
});

router.post("/documents", async (req, res) => {
  try {
    const body = CreateDocumentBody.parse(req.body);
    const didEncrypt = { value: false };

    // Encrypt sensitive fields before storing
    const encryptedOcrText = encryptField(body.ocrText ?? null, didEncrypt);
    const encryptedExtractedData = encryptField(body.extractedData ?? null, didEncrypt);

    const insertData: any = {
      ...body,
      ocrText: encryptedOcrText,
      extractedData: encryptedExtractedData,
      encrypted: didEncrypt.value ? true : (body.encrypted ?? false),
    };

    const [doc] = await db.insert(documentsTable).values(insertData).returning();
    res.status(201).json(formatDocument(doc));
  } catch (err: any) {
    if (err?.message?.includes("FAMLY_ENCRYPTION_KEY")) {
      res.status(500).json({ error: "Server configuration error: encryption key not set" });
      return;
    }
    res.status(400).json({ error: "Invalid document data" });
  }
});

router.get("/documents/:id", async (req, res) => {
  try {
    const { id } = GetDocumentParams.parse({ id: Number(req.params.id) });
    const [doc] = await db.select().from(documentsTable).where(eq(documentsTable.id, id));
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(formatDocument(doc));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch document" });
  }
});

router.patch("/documents/:id", async (req, res) => {
  try {
    const { id } = UpdateDocumentParams.parse({ id: Number(req.params.id) });
    const body = UpdateDocumentBody.parse(req.body);
    const didEncrypt = { value: false };

    // Encrypt sensitive fields before storing
    const encryptedOcrText =
      body.ocrText !== undefined ? encryptField(body.ocrText ?? null, didEncrypt) : undefined;
    const encryptedExtractedData =
      body.extractedData !== undefined
        ? encryptField(body.extractedData ?? null, didEncrypt)
        : undefined;

    const updateData: any = {
      ...body,
      updatedAt: new Date(),
    };

    if (encryptedOcrText !== undefined) updateData.ocrText = encryptedOcrText;
    if (encryptedExtractedData !== undefined) updateData.extractedData = encryptedExtractedData;

    // If we encrypted anything, mark the document as encrypted
    if (didEncrypt.value) {
      updateData.encrypted = true;
    }

    const [doc] = await db
      .update(documentsTable)
      .set(updateData)
      .where(eq(documentsTable.id, id))
      .returning();
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(formatDocument(doc));
  } catch (err: any) {
    if (err?.message?.includes("FAMLY_ENCRYPTION_KEY")) {
      res.status(500).json({ error: "Server configuration error: encryption key not set" });
      return;
    }
    res.status(400).json({ error: "Invalid document data" });
  }
});

router.delete("/documents/:id", async (req, res) => {
  try {
    const { id } = DeleteDocumentParams.parse({ id: Number(req.params.id) });
    await db.delete(documentsTable).where(eq(documentsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete document" });
  }
});

/**
 * Format a document row for API response.
 * Decrypts ocrText and extractedData if they are encrypted payloads.
 * Handles migration period where content may still be plaintext.
 */
function formatDocument(d: typeof documentsTable.$inferSelect) {
  let ocrText: string | null = null;
  let extractedData: string | null = null;

  try {
    ocrText = decryptField(d.ocrText ?? null);
  } catch (err: any) {
    // Decryption failure — log and return null rather than crashing
    ocrText = null;
  }

  try {
    extractedData = decryptField(d.extractedData ?? null);
  } catch (err: any) {
    // Decryption failure — log and return null rather than crashing
    extractedData = null;
  }

  return {
    id: d.id,
    title: d.title,
    description: d.description ?? null,
    fileType: d.fileType,
    tags: d.tags ?? null,
    entityId: d.entityId ?? null,
    year: d.year ?? null,
    ocrText,
    extractedData,
    encrypted: d.encrypted,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt?.toISOString() ?? null,
  };
}

export default router;
