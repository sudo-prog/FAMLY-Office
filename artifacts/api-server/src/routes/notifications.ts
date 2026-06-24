import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db";
import { desc, eq, and, type SQL } from "drizzle-orm";

const router = Router();

// List notifications
router.get("/notifications", async (req, res) => {
  try {
    const { unreadOnly, limit = "50" } = req.query;
    const conditions: SQL[] = [];
    if (unreadOnly === "true") conditions.push(eq(notificationsTable.read, false));

    const rows = await db
      .select()
      .from(notificationsTable)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(notificationsTable.createdAt))
      .limit(Number(limit));

    res.json(rows.map(formatNotification));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
});

// Get unread count
router.get("/notifications/unread-count", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(notificationsTable)
      .where(eq(notificationsTable.read, false));
    res.json({ count: rows.length });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
});

// Create notification
router.post("/notifications", async (req, res) => {
  try {
    const { type, title, message, userId } = req.body;
    const [entry] = await db
      .insert(notificationsTable)
      .values({ type, title, message, userId: userId ?? null })
      .returning();
    res.status(201).json(formatNotification(entry));
  } catch (err) {
    res.status(400).json({ error: "Invalid notification data" });
  }
});

// Mark as read
router.patch("/notifications/:id/read", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const [entry] = await db
      .update(notificationsTable)
      .set({ read: true })
      .where(eq(notificationsTable.id, id))
      .returning();
    if (!entry) return res.status(404).json({ error: "Notification not found" });
    res.json(formatNotification(entry));
  } catch (err) {
    res.status(500).json({ error: "Failed to mark as read" });
  }
});

// Mark all as read
router.post("/notifications/mark-all-read", async (_req, res) => {
  try {
    await db.update(notificationsTable).set({ read: true }).where(eq(notificationsTable.read, false));
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Failed to mark all as read" });
  }
});

function formatNotification(n: typeof notificationsTable.$inferSelect) {
  return {
    id: n.id,
    userId: n.userId ?? null,
    type: n.type,
    title: n.title,
    message: n.message,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  };
}

export default router;
