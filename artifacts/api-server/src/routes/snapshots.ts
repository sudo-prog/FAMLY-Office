import { Router } from "express";
import { db } from "@workspace/db";
import { snapshotsTable, assetsTable } from "@workspace/db";
import { sql, eq, asc } from "drizzle-orm";

const router = Router();

router.get("/snapshots", async (_req, res) => {
  const rows = await db
    .select()
    .from(snapshotsTable)
    .orderBy(asc(snapshotsTable.snapshotDate))
    .limit(365);
  res.json(rows.map((r) => ({
    month: r.snapshotDate,
    value: Number(r.value),
    assetCount: r.assetCount ?? 0,
  })));
});

router.post("/snapshots/record", async (_req, res) => {
  const today = new Date().toISOString().slice(0, 10);

  const existing = await db
    .select()
    .from(snapshotsTable)
    .where(eq(snapshotsTable.snapshotDate, today))
    .limit(1);

  if (existing.length > 0) {
    return res.json({ recorded: false, snapshot: existing[0] });
  }

  const [result] = await db
    .select({
      total: sql<string>`coalesce(sum(value::numeric), 0)`,
      count: sql<number>`count(*)`,
    })
    .from(assetsTable);

  const [snapshot] = await db
    .insert(snapshotsTable)
    .values({
      value: result.total || "0",
      assetCount: Number(result.count) || 0,
      snapshotDate: today,
    })
    .returning();

  res.json({ recorded: true, snapshot });
});

export default router;
