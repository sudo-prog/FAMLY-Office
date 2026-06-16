import { Router } from "express";
import { db } from "@workspace/db";
import { entitiesTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  CreateEntityBody,
  GetEntityParams,
  UpdateEntityParams,
  UpdateEntityBody,
  DeleteEntityParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/entities", async (_req, res) => {
  try {
    const rows = await db.select().from(entitiesTable);
    res.json(rows.map(formatEntity));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entities" });
  }
});

router.post("/entities", async (req, res) => {
  try {
    const body = CreateEntityBody.parse(req.body);
    const [entity] = await db.insert(entitiesTable).values(body as any).returning();
    res.status(201).json(formatEntity(entity));
  } catch (err) {
    res.status(400).json({ error: "Invalid entity data" });
  }
});

router.get("/entities/:id", async (req, res) => {
  try {
    const { id } = GetEntityParams.parse({ id: Number(req.params.id) });
    const [entity] = await db.select().from(entitiesTable).where(eq(entitiesTable.id, id));
    if (!entity) return res.status(404).json({ error: "Entity not found" });
    res.json(formatEntity(entity));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch entity" });
  }
});

router.patch("/entities/:id", async (req, res) => {
  try {
    const { id } = UpdateEntityParams.parse({ id: Number(req.params.id) });
    const body = UpdateEntityBody.parse(req.body);
    const [entity] = await db.update(entitiesTable).set(body as any).where(eq(entitiesTable.id, id)).returning();
    if (!entity) return res.status(404).json({ error: "Entity not found" });
    res.json(formatEntity(entity));
  } catch (err) {
    res.status(400).json({ error: "Invalid entity data" });
  }
});

router.delete("/entities/:id", async (req, res) => {
  try {
    const { id } = DeleteEntityParams.parse({ id: Number(req.params.id) });
    await db.delete(entitiesTable).where(eq(entitiesTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete entity" });
  }
});

function formatEntity(e: typeof entitiesTable.$inferSelect) {
  return {
    id: e.id,
    name: e.name,
    type: e.type,
    abn: e.abn ?? null,
    acn: e.acn ?? null,
    tfn: e.tfn ?? null,
    jurisdiction: e.jurisdiction ?? null,
    notes: e.notes ?? null,
    createdAt: e.createdAt.toISOString(),
  };
}

export default router;
