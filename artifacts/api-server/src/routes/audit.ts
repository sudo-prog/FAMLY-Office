import { Router } from "express";
import { db } from "@workspace/db";
import { auditLogsTable } from "@workspace/db";
import { desc, eq, and, type SQL } from "drizzle-orm";

const router = Router();

// List audit logs with optional filters
router.get("/audit-logs", async (req, res) => {
  try {
    const { action, entityType, entityId, limit = "100", offset = "0" } = req.query;
    const conditions: SQL[] = [];

    if (action) conditions.push(eq(auditLogsTable.action, String(action)));
    if (entityType) conditions.push(eq(auditLogsTable.entityType, String(entityType)));
    if (entityId) conditions.push(eq(auditLogsTable.entityId, Number(entityId)));

    const rows = await db
      .select()
      .from(auditLogsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogsTable.timestamp))
      .limit(Number(limit))
      .offset(Number(offset));

    res.json(rows.map(formatAuditLog));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch audit logs" });
  }
});

// Create an audit log entry (used by middleware or manually)
router.post("/audit-logs", async (req, res) => {
  try {
    const { userId, action, entityType, entityId, oldValues, newValues } = req.body;
    const [entry] = await db
      .insert(auditLogsTable)
      .values({ userId, action, entityType, entityId, oldValues, newValues })
      .returning();
    res.status(201).json(formatAuditLog(entry));
  } catch (err) {
    res.status(400).json({ error: "Invalid audit log data" });
  }
});

function formatAuditLog(a: typeof auditLogsTable.$inferSelect) {
  return {
    id: a.id,
    userId: a.userId ?? null,
    action: a.action,
    entityType: a.entityType,
    entityId: a.entityId ?? null,
    oldValues: a.oldValues ?? null,
    newValues: a.newValues ?? null,
    timestamp: a.timestamp.toISOString(),
  };
}

export default router;
