import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router = Router();

router.get("/users", async (_req, res) => {
  try {
    const users = await db.select({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    }).from(usersTable);
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

router.post("/users", async (req, res) => {
  try {
    const { email, name, role, pinHash } = req.body;
    if (!email || !name) {
      res.status(400).json({ error: "email and name are required" });
      return;
    }
    const [user] = await db.insert(usersTable).values({
      email,
      name,
      role: role || "member",
      pinHash: pinHash || null,
    }).returning({
      id: usersTable.id,
      email: usersTable.email,
      name: usersTable.name,
      role: usersTable.role,
      createdAt: usersTable.createdAt,
    });
    res.status(201).json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to create user" });
  }
});

router.patch("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const { name, role, pinHash } = req.body;
    const [user] = await db.update(usersTable)
      .set({
        ...(name !== undefined && { name }),
        ...(role !== undefined && { role }),
        ...(pinHash !== undefined && { pinHash }),
      })
      .where(eq(usersTable.id, id))
      .returning({
        id: usersTable.id,
        email: usersTable.email,
        name: usersTable.name,
        role: usersTable.role,
        createdAt: usersTable.createdAt,
      });
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: "Failed to update user" });
  }
});

router.delete("/users/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (Number.isNaN(id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    await db.delete(usersTable).where(eq(usersTable.id, id));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete user" });
  }
});

export default router;
