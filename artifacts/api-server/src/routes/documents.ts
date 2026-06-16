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

const router = Router();

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
    const [doc] = await db.insert(documentsTable).values(body as any).returning();
    res.status(201).json(formatDocument(doc));
  } catch (err) {
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
    const [doc] = await db
      .update(documentsTable)
      .set({ ...(body as any), updatedAt: new Date() })
      .where(eq(documentsTable.id, id))
      .returning();
    if (!doc) return res.status(404).json({ error: "Document not found" });
    res.json(formatDocument(doc));
  } catch (err) {
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

function formatDocument(d: typeof documentsTable.$inferSelect) {
  return {
    id: d.id,
    title: d.title,
    description: d.description ?? null,
    fileType: d.fileType,
    tags: d.tags ?? null,
    entityId: d.entityId ?? null,
    year: d.year ?? null,
    ocrText: d.ocrText ?? null,
    encrypted: d.encrypted,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt?.toISOString() ?? null,
  };
}

export default router;
