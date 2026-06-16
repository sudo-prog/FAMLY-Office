import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import {
  ListAssetsQueryParams,
  CreateAssetBody,
  GetAssetParams,
  UpdateAssetParams,
  UpdateAssetBody,
  DeleteAssetParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/assets/by-category", async (_req, res) => {
  try {
    const rows = await db
      .select({
        category: assetsTable.category,
        total: sql<number>`sum(${assetsTable.value}::numeric)`,
        count: sql<number>`count(*)`,
      })
      .from(assetsTable)
      .groupBy(assetsTable.category);
    res.json(rows.map((r) => ({ category: r.category, total: Number(r.total) || 0, count: Number(r.count) || 0 })));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch asset categories" });
  }
});

router.get("/assets", async (req, res) => {
  try {
    const query = ListAssetsQueryParams.parse(req.query);
    let assets = await db.select().from(assetsTable);
    if (query.category) assets = assets.filter((a) => a.category === query.category);
    if (query.entityId != null) assets = assets.filter((a) => a.entityId === query.entityId);
    res.json(assets.map(formatAsset));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch assets" });
  }
});

router.post("/assets", async (req, res) => {
  try {
    const body = CreateAssetBody.parse(req.body);
    const [asset] = await db.insert(assetsTable).values(body as any).returning();
    res.status(201).json(formatAsset(asset));
  } catch (err) {
    res.status(400).json({ error: "Invalid asset data" });
  }
});

router.get("/assets/:id", async (req, res) => {
  try {
    const { id } = GetAssetParams.parse({ id: Number(req.params.id) });
    const [asset] = await db.select().from(assetsTable).where(eq(assetsTable.id, id));
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    res.json(formatAsset(asset));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch asset" });
  }
});

router.patch("/assets/:id", async (req, res) => {
  try {
    const { id } = UpdateAssetParams.parse({ id: Number(req.params.id) });
    const body = UpdateAssetBody.parse(req.body);
    const [asset] = await db.update(assetsTable).set(body as any).where(eq(assetsTable.id, id)).returning();
    if (!asset) return res.status(404).json({ error: "Asset not found" });
    res.json(formatAsset(asset));
  } catch (err) {
    res.status(400).json({ error: "Invalid asset data" });
  }
});

router.delete("/assets/:id", async (req, res) => {
  try {
    const { id } = DeleteAssetParams.parse({ id: Number(req.params.id) });
    await db.delete(assetsTable).where(eq(assetsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete asset" });
  }
});

function formatAsset(a: typeof assetsTable.$inferSelect) {
  return {
    id: a.id,
    name: a.name,
    category: a.category,
    subcategory: a.subcategory ?? null,
    value: Number(a.value),
    currency: a.currency,
    notes: a.notes ?? null,
    entityId: a.entityId ?? null,
    institution: a.institution ?? null,
    lastUpdated: a.lastUpdated ?? null,
    createdAt: a.createdAt.toISOString(),
  };
}

export default router;
