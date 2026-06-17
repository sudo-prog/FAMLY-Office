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

    // RAG: keyword-match documents with ocrText content
    const queryWords = message.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const ragDocs = queryWords.length > 0
      ? documents.filter((d) => {
          if (!d.ocrText) return false;
          const lower = d.ocrText.toLowerCase();
          return queryWords.some((w) => lower.includes(w));
        }).slice(0, 3)
      : [];
    const docRAGSection = ragDocs.length > 0
      ? `\nRAG — MATCHED DOCUMENT CONTENT:\n${ragDocs.map((d) => `[${d.title}]:\n${d.ocrText!.slice(0, 1500)}`).join("\n\n")}\n`
      : "";

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
${documents.map((d) => `  ${d.title} (${d.fileType}, ${d.year ?? "undated"})${d.encrypted ? " [ENCRYPTED]" : ""}${d.ocrText ? " [has content]" : ""}`).join("\n")}
${docRAGSection}
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

// ─── Proactive Insight Engine ─────────────────────────────────────────────────

interface Insight {
  type: "warning" | "opportunity" | "info";
  category: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  action: string;
}

function fmtCat(c: string) { return c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()); }

router.get("/ai/insights", async (req, res) => {
  try {
    const concentrationHigh = Number(req.query.concentrationHigh) || 60;
    const concentrationMedium = Number(req.query.concentrationMedium) || 45;
    const cryptoThreshold = Number(req.query.cryptoThreshold) || 25;
    const idleCashThreshold = Number(req.query.idleCashThreshold) || 30;

    const [assets, allTx, entities, documents] = await Promise.all([
      db.select().from(assetsTable),
      db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(100),
      db.select().from(entitiesTable),
      db.select().from(documentsTable),
    ]);

    const totalValue = assets.reduce((s, a) => s + Number(a.value), 0);
    const byCategory: Record<string, number> = {};
    assets.forEach((a) => { byCategory[a.category] = (byCategory[a.category] ?? 0) + Number(a.value); });

    const recentIncome = allTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
    const recentExpenses = allTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
    const taxDeductibleTotal = allTx.filter((t) => t.taxDeductible && t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);

    const insights: Insight[] = [];

    if (totalValue === 0) {
      insights.push({ type: "info", category: "setup", severity: "low", title: "Add your first assets to get started", detail: "Family Office is ready. Add assets, transactions, and entities to unlock AI-powered portfolio insights and analytics.", action: "Add Assets" });
    } else {
      Object.entries(byCategory).forEach(([cat, val]) => {
        const pct = (val / totalValue) * 100;
        if (pct > concentrationHigh) {
          insights.push({ type: "warning", category: "concentration", severity: "high", title: `High concentration — ${fmtCat(cat)} at ${pct.toFixed(0)}%`, detail: `${fmtCat(cat)} represents ${pct.toFixed(0)}% of your portfolio (A$${Math.round(val).toLocaleString()}). Concentration above ${concentrationHigh}% significantly increases single-asset-class risk.`, action: "Rebalance" });
        } else if (pct > concentrationMedium) {
          insights.push({ type: "warning", category: "concentration", severity: "medium", title: `Elevated ${fmtCat(cat)} allocation (${pct.toFixed(0)}%)`, detail: `${fmtCat(cat)} is at ${pct.toFixed(0)}% of total portfolio — approaching the ${concentrationMedium}% ceiling for a single class. Consider reviewing your target allocation.`, action: "Review Allocation" });
        }
      });

      const cryptoPct = ((byCategory["crypto"] ?? 0) / totalValue) * 100;
      if (cryptoPct > cryptoThreshold) {
        insights.push({ type: "warning", category: "risk", severity: "high", title: `Crypto exposure at ${cryptoPct.toFixed(0)}% — high volatility risk`, detail: `Crypto/digital assets at ${cryptoPct.toFixed(0)}% exceeds your ${cryptoThreshold}% threshold. High drawdown potential — consider trimming to reduce sequence-of-returns risk.`, action: "Review Crypto" });
      }

      const cashPct = ((byCategory["bank_account"] ?? 0) / totalValue) * 100;
      if (cashPct > idleCashThreshold) {
        insights.push({ type: "opportunity", category: "cashflow", severity: "medium", title: `Idle cash — A$${Math.round(byCategory["bank_account"] ?? 0).toLocaleString()} sitting at ${cashPct.toFixed(0)}%`, detail: `Cash/bank accounts at ${cashPct.toFixed(0)}% of portfolio exceeds your ${idleCashThreshold}% idle cash threshold. Deploying surplus could improve long-term returns.`, action: "Review Strategy" });
      }

      if (allTx.length > 0 && recentExpenses > 0) {
        if (recentExpenses > recentIncome * 1.25) {
          insights.push({ type: "warning", category: "cashflow", severity: "medium", title: "Negative cash flow detected", detail: `Recent expenses (A$${Math.round(recentExpenses).toLocaleString()}) are outpacing income (A$${Math.round(recentIncome).toLocaleString()}) by ${(((recentExpenses / Math.max(recentIncome, 1)) - 1) * 100).toFixed(0)}%. Review spending categories or income sources.`, action: "View Ledger" });
        } else if (recentIncome > recentExpenses * 1.5 && recentIncome > 10000) {
          insights.push({ type: "opportunity", category: "cashflow", severity: "low", title: "Strong surplus — consider deployment", detail: `Income (A$${Math.round(recentIncome).toLocaleString()}) exceeds expenses by ${((recentIncome / recentExpenses - 1) * 100).toFixed(0)}%. Strong positive cash flow — consider accelerating contributions or deploying surplus to higher-yield assets.`, action: "View Projections" });
        }
      }

      const catCount = Object.keys(byCategory).length;
      if (catCount < 3 && assets.length > 2) {
        insights.push({ type: "info", category: "diversification", severity: "medium", title: `Only ${catCount} asset ${catCount === 1 ? "class" : "classes"} — consider diversifying`, detail: `Your portfolio spans ${catCount} asset ${catCount === 1 ? "class" : "classes"}. Family offices typically maintain 5–8 categories for effective risk-adjusted returns across economic cycles.`, action: "Add Assets" });
      }

      if (entities.length === 0) {
        insights.push({ type: "info", category: "structure", severity: "low", title: "No legal entities — potential tax inefficiency", detail: "Family offices typically use discretionary trusts, holding companies, and SMSFs for asset protection and tax optimisation. Add your entities for complete structure reporting.", action: "Add Entities" });
      }

      if (taxDeductibleTotal > 5000) {
        insights.push({ type: "opportunity", category: "tax", severity: "low", title: `A$${Math.round(taxDeductibleTotal).toLocaleString()} in tagged deductible expenses`, detail: `You have A$${Math.round(taxDeductibleTotal).toLocaleString()} in tax-deductible expenses. Ensure all are correctly tagged with the appropriate ATO category and claimed at year-end.`, action: "View Ledger" });
      }

      if (documents.length === 0) {
        insights.push({ type: "info", category: "vault", severity: "low", title: "Document vault is empty", detail: "Upload key documents — trust deeds, wills, property contracts, and tax returns — to your encrypted vault for secure, searchable, always-available access.", action: "Open Vault" });
      }

      const superPct = ((byCategory["superannuation"] ?? 0) / totalValue) * 100;
      if (assets.length >= 4 && superPct < 5 && byCategory["superannuation"] !== undefined) {
        insights.push({ type: "info", category: "super", severity: "low", title: "Superannuation allocation appears low", detail: `Super at ${superPct.toFixed(1)}% — consider whether concessional contributions are being maximised (A$30,000/yr cap in FY25). Unused carry-forward caps may also be available.`, action: "Review Strategy" });
      }

      const propPct = ((byCategory["property"] ?? 0) / totalValue) * 100;
      if (propPct > 0 && entities.length > 0) {
        const hasLandTax = entities.some((e) => e.type?.includes("trust") || e.type?.includes("company"));
        if (!hasLandTax) {
          insights.push({ type: "info", category: "tax", severity: "low", title: "Property holdings — review land tax structure", detail: `You hold property (${propPct.toFixed(0)}% of portfolio). Property held in a trust may have different land tax thresholds per state. Review your ownership structure for efficiency.`, action: "Review Entities" });
        }
      }
    }

    const severityOrder = { high: 0, medium: 1, low: 2 };
    insights.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    res.json({ insights, generatedAt: new Date().toISOString(), totalValue, assetCount: assets.length, entityCount: entities.length });
  } catch (e: any) {
    res.status(500).json({ error: e.message, insights: [] });
  }
});

export default router;
