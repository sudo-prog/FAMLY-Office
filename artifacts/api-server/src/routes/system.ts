import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable, transactionsTable, documentsTable, entitiesTable } from "@workspace/db";

const router = Router();

router.delete("/system/purge", async (_req, res) => {
  try {
    await db.delete(transactionsTable);
    await db.delete(documentsTable);
    await db.delete(assetsTable);
    await db.delete(entitiesTable);
    res.json({ ok: true, message: "All records deleted." });
  } catch (err) {
    console.error("Purge error:", err);
    res.status(500).json({ error: "Purge failed" });
  }
});

export default router;
