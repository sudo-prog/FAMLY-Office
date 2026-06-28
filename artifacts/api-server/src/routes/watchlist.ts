import { Router } from "express";
import { eq, desc } from "drizzle-orm";
import { db } from "@workspace/db";
import { watchlistTable } from "@workspace/db";

const router = Router();

// List all watchlist items
router.get("/", async (_req, res) => {
  try {
    const items = await db.select().from(watchlistTable).orderBy(desc(watchlistTable.createdAt));
    res.json(items);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch watchlist" });
  }
});

// Add to watchlist
router.post("/", async (req, res) => {
  try {
    const { symbol, name, type, exchange, currency, notes, alertHigh, alertLow } = req.body;
    if (!symbol || !name) return res.status(400).json({ error: "symbol and name required" });

    const [item] = await db.insert(watchlistTable).values({
      symbol: String(symbol).toUpperCase(),
      name: String(name),
      type: type || "equity",
      exchange: exchange || null,
      currency: currency || "USD",
      notes: notes || null,
      alertHigh: alertHigh ? String(alertHigh) : null,
      alertLow: alertLow ? String(alertLow) : null,
    }).returning();
    res.status(201).json(item);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to add watchlist item" });
  }
});

// Update watchlist item
router.patch("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, notes, alertHigh, alertLow, isActive, aiSummary, price, change, changePercent } = req.body;
    const updates: any = { updatedAt: new Date() };
    if (name !== undefined) updates.name = name;
    if (notes !== undefined) updates.notes = notes;
    if (alertHigh !== undefined) updates.alertHigh = alertHigh ? String(alertHigh) : null;
    if (alertLow !== undefined) updates.alertLow = alertLow ? String(alertLow) : null;
    if (isActive !== undefined) updates.isActive = isActive;
    if (aiSummary !== undefined) updates.aiSummary = aiSummary;
    if (price !== undefined) updates.price = String(price);
    if (change !== undefined) updates.change = String(change);
    if (changePercent !== undefined) updates.changePercent = String(changePercent);

    const [item] = await db.update(watchlistTable).set(updates).where(eq(watchlistTable.id, id)).returning();
    if (!item) return res.status(404).json({ error: "Not found" });
    res.json(item);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to update watchlist item" });
  }
});

// Delete watchlist item
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await db.delete(watchlistTable).where(eq(watchlistTable.id, id));
    res.json({ ok: true });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to delete watchlist item" });
  }
});

// Generate AI summary for a watchlist item
router.post("/:id/research", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const item = await db.select().from(watchlistTable).where(eq(watchlistTable.id, id)).limit(1);
    if (!item.length) return res.status(404).json({ error: "Not found" });

    const wi = item[0];
    const isCrypto = wi.type === "crypto";
    const prompt = isCrypto
      ? `Provide a brief 2-3 sentence investment research summary for ${wi.name} (${wi.symbol}). Include current market sentiment, key metrics to watch, and risk considerations.`
      : `Provide a brief 2-3 sentence investment research summary for ${wi.name} (${wi.symbol}${wi.exchange ? `:${wi.exchange}` : ""}). Include current market outlook, key financial metrics to watch, and risk factors.`;

    // Try local LLM, fall back to generated summary
    let summary = "";
    try {
      const baseUrl = process.env.LOCAL_LLM_URL || "http://localhost:11434/v1";
      const model = process.env.LOCAL_LLM_MODEL || "llama3.2";
      const llmRes = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer ollama" },
        body: JSON.stringify({
          model,
          stream: false,
          messages: [
            { role: "system", content: "You are a concise financial analyst. Provide brief 2-3 sentence summaries." },
            { role: "user", content: prompt },
          ],
        }),
        signal: AbortSignal.timeout(30000),
      });
      if (llmRes.ok) {
        const data: any = await llmRes.json();
        summary = data?.choices?.[0]?.message?.content || "";
      }
    } catch {}
    if (!summary) {
      summary = `${wi.name} (${wi.symbol}) is a ${isCrypto ? "cryptocurrency" : "equity"} investment. Monitor key metrics, market trends, and risk factors regularly. Connect a local AI service for richer summaries.`;
    }

    await db.update(watchlistTable).set({ aiSummary: summary, updatedAt: new Date() }).where(eq(watchlistTable.id, id));
    res.json({ aiSummary: summary });
  } catch (err: any) {
    res.status(500).json({ error: "Failed to generate research summary" });
  }
});

export default router;
