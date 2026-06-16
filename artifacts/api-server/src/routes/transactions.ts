import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import {
  ListTransactionsQueryParams,
  CreateTransactionBody,
  GetTransactionParams,
  UpdateTransactionParams,
  UpdateTransactionBody,
  DeleteTransactionParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/transactions/recent", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(10);
    res.json(rows.map(formatTransaction));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch recent transactions" });
  }
});

router.get("/transactions", async (req, res) => {
  try {
    const query = ListTransactionsQueryParams.parse(req.query);
    let rows = await db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(query.limit ?? 100)
      .offset(query.offset ?? 0);
    if (query.type) rows = rows.filter((t) => t.type === query.type);
    if (query.category) rows = rows.filter((t) => t.category === query.category);
    res.json(rows.map(formatTransaction));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transactions" });
  }
});

router.post("/transactions", async (req, res) => {
  try {
    const body = CreateTransactionBody.parse(req.body);
    const [tx] = await db.insert(transactionsTable).values(body as any).returning();
    res.status(201).json(formatTransaction(tx));
  } catch (err) {
    res.status(400).json({ error: "Invalid transaction data" });
  }
});

router.get("/transactions/:id", async (req, res) => {
  try {
    const { id } = GetTransactionParams.parse({ id: Number(req.params.id) });
    const [tx] = await db.select().from(transactionsTable).where(eq(transactionsTable.id, id));
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(formatTransaction(tx));
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction" });
  }
});

router.patch("/transactions/:id", async (req, res) => {
  try {
    const { id } = UpdateTransactionParams.parse({ id: Number(req.params.id) });
    const body = UpdateTransactionBody.parse(req.body);
    const [tx] = await db.update(transactionsTable).set(body as any).where(eq(transactionsTable.id, id)).returning();
    if (!tx) return res.status(404).json({ error: "Transaction not found" });
    res.json(formatTransaction(tx));
  } catch (err) {
    res.status(400).json({ error: "Invalid transaction data" });
  }
});

router.delete("/transactions/:id", async (req, res) => {
  try {
    const { id } = DeleteTransactionParams.parse({ id: Number(req.params.id) });
    await db.delete(transactionsTable).where(eq(transactionsTable.id, id));
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ error: "Failed to delete transaction" });
  }
});

function formatTransaction(t: typeof transactionsTable.$inferSelect) {
  return {
    id: t.id,
    description: t.description,
    amount: Number(t.amount),
    type: t.type,
    category: t.category ?? null,
    subcategory: t.subcategory ?? null,
    date: t.date,
    notes: t.notes ?? null,
    assetId: t.assetId ?? null,
    entityId: t.entityId ?? null,
    taxDeductible: t.taxDeductible,
    taxTag: (t as any).taxTag ?? null,
    tags: t.tags ?? null,
    createdAt: t.createdAt.toISOString(),
  };
}

export default router;
