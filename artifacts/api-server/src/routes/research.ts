import { Router } from "express";
import { db } from "@workspace/db";
import {
  assetsTable, transactionsTable, entitiesTable, documentsTable,
  businessClientsTable, businessInvoicesTable, businessExpensesTable,
  researchReportsTable, generatedComponentsTable,
} from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { webSearch, buildSearchQueries } from "../lib/web-search";
import { streamCloudLLM, streamLocalLLM } from "../lib/ai-router";

const router = Router();

function sse(res: any, data: object) { res.write(`data: ${JSON.stringify(data)}\n\n`); }

async function buildPortfolioContext() {
  const [assets, txs, entities] = await Promise.all([
    db.select().from(assetsTable),
    db.select().from(transactionsTable).orderBy(desc(transactionsTable.createdAt)).limit(30),
    db.select().from(entitiesTable),
  ]);
  const total = assets.reduce((s, a) => s + Number(a.value), 0);
  const bycat: Record<string, number> = {};
  assets.forEach(a => { bycat[a.category] = (bycat[a.category] ?? 0) + Number(a.value); });
  return `
PORTFOLIO (total: A$${total.toLocaleString()}):
${Object.entries(bycat).map(([c, v]) => `  ${c}: A$${v.toLocaleString()} (${((v/total)*100).toFixed(1)}%)`).join("\n")}
${assets.length} holdings across ${entities.length} entities.
Cash flow: Income A$${txs.filter(t=>t.type==="income").reduce((s,t)=>s+Number(t.amount),0).toLocaleString()} | Expenses A$${txs.filter(t=>t.type==="expense").reduce((s,t)=>s+Number(t.amount),0).toLocaleString()} (last 30 tx)
`;
}

async function buildBusinessContext() {
  const [clients, invoices, expenses] = await Promise.all([
    db.select().from(businessClientsTable),
    db.select().from(businessInvoicesTable),
    db.select().from(businessExpensesTable),
  ]);
  const revenue = invoices.filter(i=>i.paid).reduce((s,i)=>s+Number(i.total),0);
  const outstanding = invoices.filter(i=>!i.paid&&i.status!=="cancelled").reduce((s,i)=>s+Number(i.total),0);
  const exp = expenses.reduce((s,e)=>s+Number(e.amount),0);
  return `
BUSINESS: ${clients.length} clients | Revenue A$${revenue.toLocaleString()} | Outstanding A$${outstanding.toLocaleString()} | Expenses A$${exp.toLocaleString()}
`;
}

function depthInstructions(depth: string) {
  if (depth === "quick") return `Write a concise 3–4 paragraph Quick Summary. Include: (1) What it is and current state, (2) Key risks, (3) Relevance to the user's situation. Be direct and actionable.`;
  if (depth === "deep") return `Write a comprehensive Deep Analysis report with ALL of the following sections:
## Executive Summary
## What Is It & Current State (include latest data from web search)
## Market Context & Macro Drivers
## Portfolio Relevance & Exposure Analysis
## Risk Assessment (Rate each risk: HIGH/MEDIUM/LOW)
## Opportunity Analysis
## Tax & Regulatory Considerations (Australian focus)
## Future Projections
Create a markdown table with 3 scenarios × 3 time horizons:
| Scenario | 1 Year | 3 Years | 5 Years |
|---|---|---|---|
| 🐻 Bear Case | ... | ... | ... |
| 📊 Base Case | ... | ... | ... |
| 🚀 Bull Case | ... | ... | ... |
## Strategic Recommendations (numbered, ranked by impact)
## Key Risks to Monitor
## Sources & Methodology`;
  return `Write a thorough Standard Research Report with these sections:
## Executive Summary
## Current State & Context
## Key Drivers & Risks
## Portfolio Relevance
## Future Projections
Brief table:
| Scenario | 12 Months | 3 Years |
|---|---|---|
| Bear | ... | ... |
| Base | ... | ... |
| Bull | ... | ... |
## Recommendations`;
}

// ─── Streaming Research ─────────────────────────────────────────────────────

router.post("/research/query", async (req, res) => {
  const { query, depth = "standard", includePortfolio = true, includeWeb = true, allowCloudPortfolio = false } = req.body as {
    query: string; depth: string; includePortfolio: boolean; includeWeb: boolean; allowCloudPortfolio: boolean;
  };
  if (!query?.trim()) return res.status(400).json({ error: "Query required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  sse(res, { type: "step", step: "start", message: "Research agent initialising…" });

  let portfolioCtx = "";
  let businessCtx = "";
  let sources: { title: string; url: string; snippet: string }[] = [];

  if (includePortfolio) {
    sse(res, { type: "step", step: "portfolio", message: "Loading your financial context…" });
    try { portfolioCtx = await buildPortfolioContext(); businessCtx = await buildBusinessContext(); } catch {}
  }

  if (includeWeb) {
    const queries = buildSearchQueries(query, depth);
    sse(res, { type: "step", step: "searching", message: `Searching the web (${queries.length} queries)…`, queries });
    const results = await Promise.all(queries.map(q => webSearch(q, depth === "deep" ? 4 : 3)));
    sources = results.flat().filter(r => r.snippet);
    sse(res, { type: "sources", sources });
    sse(res, { type: "step", step: "analyzing", message: `Found ${sources.length} sources. Synthesising…` });
  } else {
    sse(res, { type: "step", step: "analyzing", message: "Analysing with AI…" });
  }

  const webSection = sources.length > 0
    ? `\nWEB SEARCH RESULTS (${new Date().toLocaleDateString("en-AU")}):\n${sources.map((s,i) => `[${i+1}] ${s.title}\n${s.snippet}`).join("\n\n")}\n`
    : "";

  const systemPrompt = `You are a world-class sovereign wealth management research analyst embedded in a private Australian Family Office system. Today is ${new Date().toLocaleDateString("en-AU", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}.

RESEARCH REQUEST: "${query}"
REPORT DEPTH: ${depth.toUpperCase()}

${portfolioCtx ? `USER FINANCIAL CONTEXT:\n${portfolioCtx}${businessCtx}` : "No portfolio context (research mode only)."}

${webSection}

INSTRUCTIONS: ${depthInstructions(depth)}

FORMAT RULES:
- Use markdown headers (##, ###), bold (**text**), and tables
- All monetary figures in AUD unless stated otherwise
- Be specific, cite figures, avoid vague statements
- Always relate findings back to the user's specific situation where portfolio context is available
- For projections, provide specific % ranges not vague "up/down"
- Flag any conflicts of interest or limitations in your analysis`;

  const useCloud = !!(process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY);
  sse(res, { type: "step", step: "writing", message: `Composing ${depth} report with ${useCloud ? "cloud" : "local"} AI…` });

  if (useCloud && (!includePortfolio || allowCloudPortfolio)) {
    await streamCloudLLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Please write the ${depth} research report for: ${query}` },
    ], res);
  } else {
    await streamLocalLLM(
      [{ role: "user", content: `Please write the ${depth} research report for: ${query}` }],
      systemPrompt, res
    );
  }

  sse(res, { type: "done", sources, depth, query });
  if (!res.writableEnded) res.end();
});

// ─── Reports CRUD ───────────────────────────────────────────────────────────

router.get("/research/reports", async (_req, res) => {
  try {
    const rows = await db.select().from(researchReportsTable).orderBy(desc(researchReportsTable.createdAt));
    res.json(rows.map(r => ({ ...r, sources: r.sources ? JSON.parse(r.sources) : [], tags: r.tags ? JSON.parse(r.tags) : [] })));
  } catch { res.status(500).json({ error: "Failed to fetch reports" }); }
});

router.post("/research/reports", async (req, res) => {
  try {
    const { title, query, depth, report, summary, sources, assetClass, tags, portfolioIncluded, webSearched } = req.body;
    const [row] = await db.insert(researchReportsTable).values({
      title, query, depth: depth || "standard", report, summary,
      sources: sources ? JSON.stringify(sources) : null,
      assetClass, tags: tags ? JSON.stringify(tags) : null,
      portfolioIncluded: !!portfolioIncluded, webSearched: !!webSearched,
    }).returning();
    res.status(201).json(row);
  } catch { res.status(400).json({ error: "Failed to save report" }); }
});

router.delete("/research/reports/:id", async (req, res) => {
  try {
    await db.delete(researchReportsTable).where(eq(researchReportsTable.id, parseInt(req.params.id)));
    res.status(204).end();
  } catch { res.status(400).json({ error: "Failed to delete" }); }
});

// ─── Component Builder ──────────────────────────────────────────────────────

router.post("/research/component", async (req, res) => {
  const { description, context } = req.body as { description: string; context?: string };
  if (!description?.trim()) return res.status(400).json({ error: "Description required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  sse(res, { type: "step", step: "generating", message: "Generating component…" });

  const systemPrompt = `You are an expert React and TypeScript developer specialising in shadcn/ui and Tailwind CSS v3.
Generate a complete, self-contained React component based on the user's description.

RULES:
- Use only: React, TypeScript, Tailwind CSS, shadcn/ui components (Card, Button, Badge, etc.), recharts for charts, lucide-react for icons
- Export a single default component
- Include all imports at the top
- Use the design system variables: bg-background, text-foreground, bg-card, border-border, text-primary (gold), text-muted-foreground
- Dark theme: background is #0d1117 (charcoal), accent is #C9A227 (gold)
- Make it production-quality with real example data (no placeholders like "...")
- Use Tailwind classes only (no inline styles except for dynamic values)
- The component should be visually impressive and match a dark premium Bloomberg-meets-Apple aesthetic
- If the user mentions their portfolio or financial data, use realistic sample data

${context ? `USER CONTEXT:\n${context}` : ""}

Respond with ONLY the component code (no explanation, no markdown fences). Start directly with imports.`;

  const useCloud = !!(process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY);
  if (useCloud) {
    await streamCloudLLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: description },
    ], res);
  } else {
    await streamLocalLLM([{ role: "user", content: description }], systemPrompt, res);
  }

  sse(res, { type: "done" });
  if (!res.writableEnded) res.end();
});

// ─── Saved Components ────────────────────────────────────────────────────────

router.get("/research/components", async (_req, res) => {
  try {
    const rows = await db.select().from(generatedComponentsTable).orderBy(desc(generatedComponentsTable.createdAt));
    res.json(rows);
  } catch { res.status(500).json({ error: "Failed to fetch components" }); }
});

router.post("/research/components", async (req, res) => {
  try {
    const { name, description, code, framework } = req.body;
    const [row] = await db.insert(generatedComponentsTable).values({ name, description, code, framework: framework || "react-shadcn" }).returning();
    res.status(201).json(row);
  } catch { res.status(400).json({ error: "Failed to save component" }); }
});

router.delete("/research/components/:id", async (req, res) => {
  try {
    await db.delete(generatedComponentsTable).where(eq(generatedComponentsTable.id, parseInt(req.params.id)));
    res.status(204).end();
  } catch { res.status(400).json({ error: "Failed to delete" }); }
});

export default router;
