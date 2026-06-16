import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable, transactionsTable, entitiesTable, documentsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import {
  classifyQuery, sanitizeForCloud, streamLocalLLM, streamCloudLLM, checkLocalLLMStatus, type AISensitivity
} from "../lib/ai-router";

const router = Router();

router.get("/ai/status", async (_req, res) => {
  const localUrl = process.env.LOCAL_LLM_URL || "http://localhost:11434/v1";
  const localModel = process.env.LOCAL_LLM_MODEL || "llama3.2";
  const cloudConfigured = !!(process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY);
  const cloudModel = process.env.CLOUD_AI_MODEL || "gpt-4o-mini";
  const { online: localOnline, models: localModels } = await checkLocalLLMStatus();

  res.json({
    local: {
      url: localUrl,
      model: localModel,
      configured: !!process.env.LOCAL_LLM_URL,
      online: localOnline,
      availableModels: localModels.slice(0, 10),
    },
    cloud: {
      configured: cloudConfigured,
      model: cloudModel,
      provider: process.env.CLOUD_AI_URL ? "custom" : "openai",
    },
    zeroTrust: true,
    policy: "Portfolio data is NEVER sent to cloud AI. Cloud is research-only.",
  });
});

router.post("/ai/chat", async (req, res) => {
  const { message, documentText, history = [], mode } = req.body as {
    message: string;
    documentText?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
    mode?: "auto" | "local" | "cloud";
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: "Message required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const sensitivity: AISensitivity =
    mode === "local" ? "local" :
    mode === "cloud" ? "cloud" :
    classifyQuery(message);

  res.write(`data: ${JSON.stringify({ routing: sensitivity, model: sensitivity === "local" ? (process.env.LOCAL_LLM_MODEL || "llama3.2") : (process.env.CLOUD_AI_MODEL || "gpt-4o-mini") })}\n\n`);

  if (sensitivity === "cloud") {
    const sanitizedMessage = sanitizeForCloud(message);
    const sanitizedHistory = history.map((m) => ({
      ...m,
      content: sanitizeForCloud(m.content),
    }));

    res.write(`data: ${JSON.stringify({ notice: "ZERO-TRUST: Query sanitized. No portfolio data sent to cloud AI." })}\n\n`);

    await streamCloudLLM(
      [...sanitizedHistory, { role: "user", content: sanitizedMessage }],
      res
    );
  } else {
    const [assets, recentTx, entities, documents] = await Promise.all([
      db.select().from(assetsTable),
      db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(20),
      db.select().from(entitiesTable),
      db.select().from(documentsTable),
    ]);

    const totalValue = assets.reduce((s, a) => s + Number(a.value), 0);
    const income = recentTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const expenses = recentTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    const byCategory: Record<string, number> = {};
    assets.forEach((a) => { byCategory[a.category] = (byCategory[a.category] ?? 0) + Number(a.value); });

    const system = `You are a world-class sovereign wealth management AI embedded in a private Family Office system. All data is local and confidential.

PORTFOLIO SNAPSHOT:
Total Net Worth: $${totalValue.toLocaleString("en-AU")}
Assets: ${assets.length} holdings
Entities: ${entities.length}

ALLOCATION BY CATEGORY:
${Object.entries(byCategory).map(([c, v]) => `  ${c.replace(/_/g, " ")}: $${v.toLocaleString()} (${((v / totalValue) * 100).toFixed(1)}%)`).join("\n")}

ASSETS:
${assets.map((a) => `  ${a.name} | ${a.category} | ${a.currency} ${Number(a.value).toLocaleString()} | ${a.institution ?? "N/A"}`).join("\n")}

ENTITIES:
${entities.map((e) => `  ${e.name} | ${e.type} | ${e.jurisdiction ?? "N/A"} | ABN: ${e.abn ?? "N/A"}`).join("\n")}

RECENT CASH FLOW:
  Income (recent): $${income.toLocaleString()}
  Expenses (recent): $${expenses.toLocaleString()}

RECENT TRANSACTIONS:
${recentTx.slice(0, 15).map((t) => `  ${t.date} | ${t.type.toUpperCase()} | ${t.description} | $${Number(t.amount).toLocaleString()}${t.taxDeductible ? " [TAX DEDUCTIBLE]" : ""}`).join("\n")}

DOCUMENT VAULT: ${documents.length} documents
${documents.map((d) => `  ${d.title} (${d.fileType}, ${d.year ?? "undated"})${d.encrypted ? " [ENCRYPTED]" : ""}`).join("\n")}

${documentText ? `\nUSER UPLOADED DOCUMENT:\n${documentText.slice(0, 6000)}\n` : ""}

Guidelines:
- Be precise and cite actual figures from the portfolio
- Flag tax deductible items and optimization opportunities
- Identify concentration risks and suggest rebalancing
- Provide jurisdiction-aware Australian tax context by default
- Format numbers clearly (commas, $ signs)
- Keep responses concise and actionable`;

    await streamLocalLLM([...history, { role: "user", content: message }], system, res);
  }

  if (!res.writableEnded) res.end();
});

export default router;
