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

// ─── Tools Status ─────────────────────────────────────────────────────────────

router.get("/research/tools/status", async (_req, res) => {
  const localOnline = await fetch(
    `${process.env.LOCAL_LLM_URL || "http://localhost:11434/v1"}/models`,
    { signal: AbortSignal.timeout(2000) }
  ).then(() => true).catch(() => false);

  res.json({
    webSearch: {
      duckduckgo: { available: true, label: "DuckDuckGo", note: "Free · No key required", keyRequired: false },
      brave:      { available: !!process.env.BRAVE_SEARCH_KEY, label: "Brave Search", note: "Richer results · Fresher data", keyRequired: true, envVar: "BRAVE_SEARCH_KEY" },
    },
    github: {
      available: !!process.env.GITHUB_TOKEN,
      label: "GitHub",
      note: "Public repos work without a token. Token unlocks private repos + higher rate limits (5 000 vs 60 req/hr).",
      keyRequired: false,
      envVar: "GITHUB_TOKEN",
    },
    cloudAI: {
      available: !!(process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY),
      label: "Cloud AI",
      note: process.env.CLOUD_AI_URL ? "Custom endpoint" : "OpenAI",
      keyRequired: true,
      envVar: "CLOUD_AI_KEY",
      model: process.env.CLOUD_AI_MODEL || "gpt-4o-mini",
    },
    localAI: {
      available: !!process.env.LOCAL_LLM_URL,
      online: localOnline,
      label: "Local AI (Ollama)",
      note: "Full portfolio context · 100% private · Zero data leaves device",
      keyRequired: false,
      envVar: "LOCAL_LLM_URL",
      url: process.env.LOCAL_LLM_URL || "http://localhost:11434/v1",
      model: process.env.LOCAL_LLM_MODEL || "llama3.2",
    },
  });
});

// ─── GitHub Analysis ──────────────────────────────────────────────────────────

function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  const match = url.trim().match(/github\.com\/([^/]+)\/([^/\s?#]+)/);
  if (!match) return null;
  return { owner: match[1], repo: match[2].replace(/\.git$/, "") };
}

async function ghFetch(path: string, token?: string): Promise<any> {
  const headers: Record<string, string> = {
    "Accept": "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "FamilyOfficeWealthOS/1.0",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const res = await fetch(`https://api.github.com${path}`, { headers, signal: AbortSignal.timeout(10000) });
  if (!res.ok) return null;
  return res.json();
}

router.post("/research/github", async (req, res) => {
  const { repoUrl, depth = "standard", focus = [] } = req.body as {
    repoUrl: string; depth: string; focus: string[];
  };

  const parsed = parseGitHubUrl(repoUrl);
  if (!parsed) return res.status(400).json({ error: "Invalid GitHub URL. Use format: https://github.com/owner/repo" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const { owner, repo } = parsed;
  const token = process.env.GITHUB_TOKEN;

  sse(res, { type: "step", step: "init", message: `Connecting to GitHub API for ${owner}/${repo}…` });

  const gh = (path: string) => ghFetch(path, token);

  // Fetch core repo data
  sse(res, { type: "step", step: "metadata", message: "Fetching repository metadata…" });
  const [repoData, languages, contributors] = await Promise.all([
    gh(`/repos/${owner}/${repo}`),
    gh(`/repos/${owner}/${repo}/languages`),
    gh(`/repos/${owner}/${repo}/contributors?per_page=10&anon=false`),
  ]);

  if (!repoData) {
    sse(res, { type: "error", error: "Repository not found or access denied. For private repos, add a GITHUB_TOKEN secret." });
    return res.end();
  }

  sse(res, { type: "repo", data: {
    name: repoData.full_name,
    description: repoData.description,
    stars: repoData.stargazers_count,
    forks: repoData.forks_count,
    language: repoData.language,
    license: repoData.license?.name,
    openIssues: repoData.open_issues_count,
    createdAt: repoData.created_at,
    pushedAt: repoData.pushed_at,
    size: repoData.size,
    topics: repoData.topics,
    languages: languages ?? {},
  }});

  sse(res, { type: "step", step: "content", message: "Fetching README, commits, and issues…" });
  const [readmeRes, commits, issues, releases, pkgRes, workflowsRes] = await Promise.all([
    gh(`/repos/${owner}/${repo}/readme`),
    gh(`/repos/${owner}/${repo}/commits?per_page=15`),
    gh(`/repos/${owner}/${repo}/issues?state=open&per_page=10`),
    gh(`/repos/${owner}/${repo}/releases?per_page=5`),
    gh(`/repos/${owner}/${repo}/contents/package.json`),
    gh(`/repos/${owner}/${repo}/actions/workflows`),
  ]);

  const readme = readmeRes?.content
    ? Buffer.from(readmeRes.content.replace(/\n/g, ""), "base64").toString("utf-8").slice(0, 4000)
    : "";

  let pkg: any = null;
  if (pkgRes?.content) {
    try { pkg = JSON.parse(Buffer.from(pkgRes.content.replace(/\n/g, ""), "base64").toString("utf-8")); } catch {}
  }

  sse(res, { type: "step", step: "analyzing", message: "AI is analysing the repository…" });

  const totalLangBytes = Object.values(languages ?? {}).reduce((s: number, v: any) => s + v, 0) as number;
  const langBreakdown = Object.entries(languages ?? {})
    .sort(([, a]: any, [, b]: any) => b - a)
    .map(([lang, bytes]: any) => `${lang}: ${((bytes / totalLangBytes) * 100).toFixed(1)}%`)
    .join(", ");

  const focusInstructions = focus.length > 0
    ? `Focus especially on: ${focus.join(", ")}.`
    : "Provide a balanced analysis covering architecture, code quality, dependencies, and integration opportunities.";

  const depthInstr = depth === "deep"
    ? `Write a COMPREHENSIVE Deep Analysis with ALL sections:
## Repository Overview
## Architecture & Code Structure
## Technology Stack Analysis
## Language Breakdown
## Dependencies & Security Assessment
## Code Quality Indicators
## Recent Activity & Team Dynamics
## Open Issues & Pain Points
## Integration Opportunities
Detailed table:
| Integration Point | Effort | Value | Priority |
|---|---|---|---|
| ... | ... | ... | ... |
## Recommended Integration Plan (step-by-step)
## Component Extraction Opportunities (React/UI components that could be adapted)
## Security & Risk Assessment
## Strategic Recommendations`
    : depth === "quick"
    ? "Write a concise 3–4 paragraph Quick Summary covering: what the repo does, tech stack, key strengths/weaknesses, and integration value."
    : `Write a Standard Report with sections:
## Repository Overview
## Technology Stack
## Architecture Assessment
## Integration Opportunities
## Security & Dependencies
## Recommendations`;

  const systemPrompt = `You are a world-class software architect and technical analyst embedded in a private Australian Family Office system.

GITHUB REPOSITORY: ${owner}/${repo}
URL: https://github.com/${owner}/${repo}
Description: ${repoData.description || "No description"}
Primary Language: ${repoData.language || "Unknown"}
Stars: ${repoData.stargazers_count?.toLocaleString()} | Forks: ${repoData.forks_count?.toLocaleString()} | Open Issues: ${repoData.open_issues_count}
Created: ${new Date(repoData.created_at).toLocaleDateString("en-AU")} | Last pushed: ${new Date(repoData.pushed_at).toLocaleDateString("en-AU")}
Size: ${Math.round((repoData.size ?? 0) / 1024)} MB
License: ${repoData.license?.name || "None"}
Topics: ${(repoData.topics ?? []).join(", ") || "None"}
CI/CD: ${workflowsRes?.total_count > 0 ? `${workflowsRes.total_count} workflow(s)` : "None detected"}

LANGUAGE BREAKDOWN: ${langBreakdown || "Unknown"}

TOP CONTRIBUTORS:
${(contributors ?? []).slice(0, 5).map((c: any) => `  ${c.login}: ${c.contributions} commits`).join("\n")}

RECENT COMMITS (last ${(commits ?? []).length}):
${(commits ?? []).slice(0, 10).map((c: any) => `  ${c.commit?.author?.date?.slice(0, 10)} | ${c.commit?.message?.split("\n")[0]?.slice(0, 80)} [${c.commit?.author?.name}]`).join("\n")}

OPEN ISSUES (${(issues ?? []).length} shown):
${(issues ?? []).slice(0, 8).map((i: any) => `  #${i.number}: ${i.title} [${(i.labels ?? []).map((l: any) => l.name).join(", ") || "no labels"}]`).join("\n")}

LATEST RELEASES: ${(releases ?? []).map((r: any) => r.tag_name).join(", ") || "None"}

${pkg ? `PACKAGE.JSON:
  Name: ${pkg.name} v${pkg.version}
  Dependencies: ${Object.keys(pkg.dependencies ?? {}).slice(0, 20).join(", ")}
  Dev Dependencies: ${Object.keys(pkg.devDependencies ?? {}).slice(0, 10).join(", ")}
  Scripts: ${Object.keys(pkg.scripts ?? {}).join(", ")}` : ""}

README (first 4000 chars):
${readme || "No README found."}

ANALYSIS INSTRUCTIONS: ${focusInstructions}

${depthInstr}

FORMAT: Use markdown headers, tables, bullet points. Be specific, cite actual repo details, and provide actionable recommendations. Where relevant, suggest how this repo could be integrated into or inspire components for a dark premium (Bloomberg-meets-Apple) Australian Family Office wealth management PWA.`;

  const useCloud = !!(process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY);
  if (useCloud) {
    await streamCloudLLM([
      { role: "system", content: systemPrompt },
      { role: "user", content: `Analyse this GitHub repository: https://github.com/${owner}/${repo}` },
    ], res);
  } else {
    await streamLocalLLM(
      [{ role: "user", content: `Analyse this GitHub repository: https://github.com/${owner}/${repo}` }],
      systemPrompt, res
    );
  }

  sse(res, { type: "done" });
  if (!res.writableEnded) res.end();
});

// ─── Business Plan Generator ──────────────────────────────────────────────────

router.post("/research/business-plan", async (req, res) => {
  const {
    businessName, description, industry, stage, problem, solution,
    revenueModel, teamSize, teamBackground, fundingAsk, useOfFunds,
    targetMarket, competitors, traction, mode = "executive",
    includeResearch = true,
  } = req.body as {
    businessName: string; description: string; industry: string;
    stage: string; problem: string; solution: string; revenueModel: string;
    teamSize?: string; teamBackground?: string; fundingAsk?: string;
    useOfFunds?: string; targetMarket?: string; competitors?: string;
    traction?: string; mode: "executive" | "full"; includeResearch: boolean;
  };

  if (!businessName?.trim() || !description?.trim()) {
    return res.status(400).json({ error: "Business name and description required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  sse(res, { type: "step", step: "start", message: `Initialising ${mode === "executive" ? "Executive Summary" : "Full Business Plan"} generator…` });

  let webContext = "";
  if (includeResearch) {
    sse(res, { type: "step", step: "research", message: `Researching ${industry} market, competitors, and funding landscape…` });
    try {
      const queries = [
        `${industry} startup market size TAM SAM SOM 2024 2025`,
        `${industry} venture capital funding trends investors 2024 2025`,
        competitors ? `${competitors} competitor analysis business model` : `${industry} competitive landscape key players`,
        `${businessName || industry} startup growth opportunities Australia`,
      ];
      const results = await Promise.all(queries.map(q => webSearch(q, "standard")));
      const flat = results.flat().filter(r => r.snippet).slice(0, 14);
      webContext = flat.map((s, i) => `[${i + 1}] ${s.title}\n${s.snippet}`).join("\n\n");
      sse(res, { type: "sources", sources: flat });
      sse(res, { type: "step", step: "researched", message: `Found ${flat.length} market intelligence sources.` });
    } catch {}
  }

  sse(res, { type: "step", step: "writing", message: `Composing ${mode === "executive" ? "1-page Executive Summary" : "full VC-grade Business Plan"}…` });

  const bizContext = `
BUSINESS: ${businessName}
DESCRIPTION: ${description}
INDUSTRY: ${industry}
STAGE: ${stage}
PROBLEM BEING SOLVED: ${problem || "Not specified"}
SOLUTION: ${solution || "Not specified"}
REVENUE MODEL: ${revenueModel || "Not specified"}
TARGET MARKET: ${targetMarket || "Not specified"}
TRACTION / VALIDATION: ${traction || "Early stage / pre-revenue"}
TEAM: ${teamSize || "1-3"} people — ${teamBackground || "Not specified"}
FUNDING ASK: ${fundingAsk || "To be determined"}
USE OF FUNDS: ${useOfFunds || "Not specified"}
COMPETITORS: ${competitors || "Not specified"}
`;

  const execPrompt = `You are a world-class startup pitch consultant who has helped raise over $2B from top-tier VCs (a16z, Sequoia, Accel, Tiger Global). You write the most compelling, data-driven executive summaries in the industry.

Create a STUNNING one-page Executive Summary for the following business. This must be so compelling that a partner at any top-tier VC firm would immediately forward it to their investment committee.

${bizContext}

${webContext ? `MARKET RESEARCH:\n${webContext}\n` : ""}

Write the Executive Summary in this exact format:

# ${businessName}
### [One killer tagline — 10 words max]

---

## The Problem
[2-3 sentences. Make it visceral and quantified. Include market pain size in $.]

## The Solution
[2-3 sentences. Crisp product description. What makes it 10x better?]

## Market Opportunity
| Metric | Value |
|---|---|
| TAM (Total Addressable Market) | $X billion |
| SAM (Serviceable Addressable Market) | $X billion |
| SOM (Target Market Share, Year 3) | $X million |
| Market Growth Rate | X% CAGR |

## Business Model
[How do you make money? Key revenue streams. Pricing model.]

## Key Metrics & Unit Economics
| KPI | Current | Target (Year 2) |
|---|---|---|
| MRR / ARR | $X | $X |
| Customer Acquisition Cost (CAC) | $X | $X |
| Lifetime Value (LTV) | $X | $X |
| LTV:CAC Ratio | X:1 | X:1 |
| Gross Margin | X% | X% |
| Monthly Burn Rate | $X | — |
| Runway | X months | — |

## Traction
[Key milestones, customers, revenue, growth rates, partnerships. Specific numbers.]

## Competitive Advantage
[3-4 bullet points. What is your moat? Why can't incumbents copy you?]

## The Team
[Why THIS team? Relevant experience, past exits, domain expertise.]

## Funding Ask
**Raising:** ${fundingAsk || "$X"} [Round type: Seed / Series A]

| Use of Funds | % | Amount |
|---|---|---|
| [Category 1] | X% | $X |
| [Category 2] | X% | $X |
| [Category 3] | X% | $X |

**18-month milestones this funding achieves:** [3 key milestones]

Use real market data from the research provided. Be specific with numbers — never use vague language. Make every sentence earn its place.`;

  const fullPrompt = `You are a world-class venture capital pitch consultant and business strategist who has helped companies raise over $5B from the world's top investors. You have deep expertise in crafting business plans that have secured funding from a16z, Sequoia, General Catalyst, Tiger Global, and Australia's leading VCs (AirTree, Blackbird, Square Peg).

Write a COMPLETE, COMPREHENSIVE, FULLY DETAILED Business Plan that exceeds the standard expected by any top-tier VC firm globally. This document should be investment-committee ready — every claim substantiated, every projection defensible, every risk addressed.

${bizContext}

${webContext ? `MARKET INTELLIGENCE:\n${webContext}\n` : ""}

Write the complete business plan with ALL of the following sections (be extremely thorough — this should be a complete document):

# ${businessName}
### [Killer tagline]

---

## 1. Executive Summary
[Compelling 3-paragraph overview: the problem, the solution, the opportunity. End with the funding ask and key metrics.]

## 2. Problem & Market Opportunity

### The Problem
[Deep dive into the pain point. Quantify the cost of the problem. Include data.]

### Market Size Analysis
| Segment | Value | Methodology |
|---|---|---|
| TAM | $Xbn | [How calculated] |
| SAM | $Xbn | [How calculated] |
| SOM (Yr 3) | $Xm | [How calculated] |

### Market Timing
[Why NOW? What macro trends make this the perfect moment? Regulatory, technological, behavioural shifts.]

## 3. Solution & Product

### Core Product
[Detailed description. Screenshots/UI described. Key features.]

### Technology Stack & Architecture
[Technical overview. Defensibility. IP. Data advantages.]

### Product Roadmap
| Phase | Timeline | Key Features | Milestone |
|---|---|---|---|
| Phase 1 | Q1-Q2 | ... | ... |
| Phase 2 | Q3-Q4 | ... | ... |
| Phase 3 | Year 2 | ... | ... |

## 4. Business Model & Revenue Streams

### Revenue Architecture
[All revenue streams. Pricing tiers. Expansion revenue. NRR targets.]

### Unit Economics (Deep Dive)
| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| MRR (end of year) | $X | $X | $X |
| ARR | $X | $X | $X |
| CAC | $X | $X | $X |
| LTV | $X | $X | $X |
| LTV:CAC | X:1 | X:1 | X:1 |
| Gross Margin | X% | X% | X% |
| Net Margin | X% | X% | X% |
| Payback Period | X months | X months | X months |

## 5. Go-To-Market Strategy

### Customer Acquisition Strategy
[Detailed GTM. Channels. CAC by channel. Conversion funnel.]

### Sales Motion
[PLG / Sales-led / Channel. ACV. Sales cycle. Pipeline.]

### Marketing Strategy
[Content, SEO, events, partnerships, influencer/community.]

### Partnership & Channel Strategy
[Strategic partnerships. Revenue share. Distribution.]

## 6. Competitive Analysis

### Competitive Landscape
[Full competitive analysis. Direct and indirect competitors.]

| Feature | ${businessName} | Competitor A | Competitor B | Incumbent |
|---|---|---|---|---|
| [Key Feature 1] | ✅ | ❌ | ⚠️ | ❌ |
| [Key Feature 2] | ✅ | ✅ | ❌ | ⚠️ |
| [Pricing/Value] | ✅ | ❌ | ✅ | ❌ |

### Competitive Moats
[Detailed moat analysis: Network effects, data, switching costs, brand, regulatory, technology, distribution.]

## 7. Traction & Validation
[All proof points: customers, revenue, growth rate, NPS, LOIs, pilots, awards, press. Specific numbers and dates.]

### Growth Metrics
[MoM growth rate. Key cohort retention. Customer success stories.]

## 8. Financial Projections (5-Year Model)

### Revenue Projections
| Year | Revenue | YoY Growth | Gross Profit | EBITDA | Headcount |
|---|---|---|---|---|---|
| Year 1 | $X | — | $X | ($X) | X |
| Year 2 | $X | X% | $X | ($X) | X |
| Year 3 | $X | X% | $X | $X | X |
| Year 4 | $X | X% | $X | $X | X |
| Year 5 | $X | X% | $X | $X | X |

### Scenario Analysis
| Scenario | Key Assumptions | Year 3 Revenue | Path to Profitability |
|---|---|---|---|
| 🐻 Bear Case | [assumptions] | $X | [timeline] |
| 📊 Base Case | [assumptions] | $X | [timeline] |
| 🚀 Bull Case | [assumptions] | $X | [timeline] |

### Cash Flow & Burn
[Detailed burn profile. Runway with and without funding. Break-even analysis.]

## 9. Team & Advisors

### Leadership Team
[Detailed bios. Relevant experience. Why this team can execute this specific opportunity.]

### Advisory Board
[Key advisors and their value-add.]

### Hiring Plan
[Next 18-month hires. Critical roles. Culture.]

## 10. Investment Thesis

### Why This Investment
[3-5 reasons this is a compelling investment. Risk-adjusted returns. Upside scenario.]

### Valuation Rationale
[Comparable transactions. Revenue multiples. Justification.]

## 11. Funding Ask & Use of Funds

**Total Raise:** ${fundingAsk || "$X"}
**Round Type:** [Seed / Series A / Series B]
**Pre-money Valuation:** $X
**Lead Investor Sought:** [Type of investor]

### Use of Funds
| Category | % | Amount | Rationale |
|---|---|---|---|
| Product & Engineering | X% | $X | [Why] |
| Sales & Marketing | X% | $X | [Why] |
| Operations | X% | $X | [Why] |
| Working Capital | X% | $X | [Why] |

### 18-Month Milestones
[Specific KPIs this raise achieves. What Series A readiness looks like.]

## 12. Risk Analysis & Mitigation
| Risk | Probability | Impact | Mitigation Strategy |
|---|---|---|---|
| [Market Risk] | Medium | High | [Strategy] |
| [Execution Risk] | Low | High | [Strategy] |
| [Competitive Risk] | High | Medium | [Strategy] |
| [Regulatory Risk] | Low | Medium | [Strategy] |
| [Technology Risk] | Low | High | [Strategy] |

## 13. Exit Strategy & Investor Returns
[Target acquirers. IPO pathway. Comparable exits in the space. Expected multiples. Timeline.]

---
*Prepared: ${new Date().toLocaleDateString("en-AU", { month: "long", year: "numeric" })}*

Use all available market research data. Make every number specific and defensible. This is a complete, investor-ready document.`;

  const useCloud = !!(process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY);
  const prompt = mode === "executive" ? execPrompt : fullPrompt;

  if (useCloud) {
    await streamCloudLLM([
      { role: "system", content: "You are an elite startup pitch consultant and VC advisor. Write with authority, precision, and a keen eye for what investors care about. Every claim must be substantiated. Every number must be specific. No filler, no vagueness." },
      { role: "user", content: prompt },
    ], res);
  } else {
    await streamLocalLLM([{ role: "user", content: prompt }], "You are an elite startup pitch consultant. Be specific, data-driven, and compelling.", res);
  }

  sse(res, { type: "done", mode });
  if (!res.writableEnded) res.end();
});

// ─── Grant Research & Proposal ────────────────────────────────────────────────

router.post("/research/grants", async (req, res) => {
  const {
    businessDescription, industry, stage, location = "Australia",
    businessType, employeeCount, annualRevenue, researchFocus,
  } = req.body as {
    businessDescription: string; industry: string; stage: string;
    location?: string; businessType?: string; employeeCount?: string;
    annualRevenue?: string; researchFocus?: string;
  };

  if (!businessDescription?.trim()) return res.status(400).json({ error: "Business description required" });

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  sse(res, { type: "step", step: "start", message: "Initialising grant research agent…" });
  sse(res, { type: "step", step: "searching", message: `Searching government and private grant databases for ${industry} businesses…` });

  const queries = [
    `${location} government grants ${industry} small business 2024 2025`,
    `${location} startup grants funding ${stage} stage ${industry}`,
    `${industry} R&D grants innovation funding ${location} 2025`,
    `${location} export market development grants ${industry}`,
    `${location} state government grants ${industry} ${businessType || ""}`,
    `${location} accelerator programs grants ${industry} startup`,
  ];

  let sources: any[] = [];
  try {
    const results = await Promise.all(queries.map(q => webSearch(q, "standard")));
    sources = results.flat().filter(r => r.snippet).slice(0, 18);
    sse(res, { type: "sources", sources });
    sse(res, { type: "step", step: "analysing", message: `Found ${sources.length} grant program references. Identifying best matches…` });
  } catch {}

  const bizContext = `
BUSINESS: ${businessDescription}
INDUSTRY: ${industry}
STAGE: ${stage}
LOCATION: ${location}
BUSINESS TYPE: ${businessType || "Not specified"}
EMPLOYEES: ${employeeCount || "Not specified"}
ANNUAL REVENUE: ${annualRevenue || "Pre-revenue / early stage"}
RESEARCH/INNOVATION FOCUS: ${researchFocus || "Not specified"}
`;

  const webContext = sources.map((s, i) => `[${i + 1}] ${s.title}\nURL: ${s.url}\n${s.snippet}`).join("\n\n");

  const prompt = `You are a world-class grant consultant with 20 years of experience securing funding for Australian startups and SMEs. You have helped businesses secure over $500M in grants, and you know every federal, state, and territory program, plus key private and EU grants relevant to Australian businesses.

Find and detail ALL relevant grant opportunities for this business:

${bizContext}

GRANT PROGRAM REFERENCES FOUND (from current search):
${webContext}

Write a comprehensive Grant Research Report in this format:

# Grant Research Report: ${industry} — ${stage}

## Summary
[2-3 sentences summarising the funding landscape and top opportunities]

## 🏆 Priority Grants (Best Match)

For each top grant, use this exact format:

### [Grant Name]
| Field | Details |
|---|---|
| **Administrator** | [Government body / organisation] |
| **Funding Amount** | $X — $X (or up to $X) |
| **Grant Type** | [Rebate / Competitive / Matched / Non-dilutive] |
| **Eligibility Stage** | [Pre-revenue / Early / Growth / Established] |
| **Application Window** | [Open / Rolling / [Month Year]] |
| **Success Rate** | [X% if known / Competitive] |
| **Match Requirement** | [Yes — $X:$1 / No] |
| **Processing Time** | [X weeks] |

**Why this fits your business:** [2-3 sentences explaining why this specific business qualifies and how to position the application]

**Key eligibility criteria:**
- [Criterion 1]
- [Criterion 2]
- [Criterion 3]

**Application tips from past successful applicants:**
- [Tip 1]
- [Tip 2]

**More info:** [URL if available from search results]

---

[Include at least 8-10 grants across different categories]

## 🌐 Federal Government Grants

[3-4 specific federal programs with full details]

## 🏛️ State & Territory Grants (${location})

[2-3 specific state programs]

## 💡 R&D and Innovation Grants

[Include R&D Tax Incentive details, CSIRO programs, ARC grants if applicable]

## 🌏 Export & International Grants

[EMDG and other export grants]

## 🏢 Accelerator & Private Programs

[Relevant accelerators, corporate programs, incubators]

## 📅 Grant Calendar: Next 90 Days

| Grant | Deadline | Amount | Priority |
|---|---|---|---|
| [Grant] | [Date] | $X | 🔴 High |
| [Grant] | [Date] | $X | 🟡 Medium |

## 💼 Grant Strategy & Sequencing

[Strategic advice: which grants to apply for in which order, how to build a grant portfolio, common mistakes to avoid]

## ⚠️ Important Compliance Notes

[Key compliance requirements, record-keeping, reporting obligations, common disqualifying factors]

Be extremely specific with grant names, amounts, and eligibility. Only include real Australian grant programs. Use the web search results to ground your response in current, real programs.`;

  const useCloud = !!(process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY);
  if (useCloud) {
    await streamCloudLLM([
      { role: "system", content: "You are an expert Australian grant consultant. Only cite real grant programs. Be specific with amounts, eligibility, and deadlines. Ground all recommendations in the web search results provided." },
      { role: "user", content: prompt },
    ], res);
  } else {
    await streamLocalLLM([{ role: "user", content: prompt }], "You are an expert grant consultant. Be specific and only cite real programs.", res);
  }

  sse(res, { type: "done" });
  if (!res.writableEnded) res.end();
});

router.post("/research/grant-proposal", async (req, res) => {
  const { grantName, grantOrganisation, grantAmount, businessName, businessDescription, industry, stage, problem, solution, traction, teamBackground, fundingUse } = req.body as {
    grantName: string; grantOrganisation?: string; grantAmount?: string;
    businessName: string; businessDescription: string; industry: string;
    stage: string; problem?: string; solution?: string; traction?: string;
    teamBackground?: string; fundingUse?: string;
  };

  if (!grantName?.trim() || !businessDescription?.trim()) {
    return res.status(400).json({ error: "Grant name and business description required" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  sse(res, { type: "step", step: "start", message: `Researching ${grantName} criteria and successful past proposals…` });

  let grantContext = "";
  try {
    const results = await webSearch(`${grantName} ${grantOrganisation || ""} application criteria eligibility requirements successful examples`, "standard");
    grantContext = results.slice(0, 5).map((r, i) => `[${i + 1}] ${r.title}\n${r.snippet}`).join("\n\n");
    sse(res, { type: "sources", sources: results.slice(0, 5) });
  } catch {}

  sse(res, { type: "step", step: "writing", message: "Composing grant proposal…" });

  const prompt = `You are a world-class grant writer with a 95% success rate securing Australian government grants. You know exactly what grant assessors look for and how to frame applications to score maximum points.

Write a COMPLETE, SUBMISSION-READY grant proposal for:

GRANT: ${grantName}
ADMINISTERED BY: ${grantOrganisation || "To be confirmed"}
GRANT AMOUNT: ${grantAmount || "As per program guidelines"}

APPLICANT:
Business Name: ${businessName}
Description: ${businessDescription}
Industry: ${industry}
Stage: ${stage}
Problem: ${problem || "See business description"}
Solution: ${solution || "See business description"}
Traction: ${traction || "Early stage"}
Team: ${teamBackground || "Experienced founders"}
Proposed Use of Funds: ${fundingUse || "Growth and expansion"}

GRANT PROGRAM RESEARCH:
${grantContext || "Standard grant application format"}

Write a complete, compelling grant proposal that includes:

# Grant Application: ${grantName}
**Applicant:** ${businessName}
**Date:** ${new Date().toLocaleDateString("en-AU", { day: "numeric", month: "long", year: "numeric" })}

---

## Section 1: Applicant Overview
[Compelling business overview — 2-3 paragraphs. Who you are, what you do, your mission.]

## Section 2: Project Description
[Detailed description of what the grant will fund. Specific activities, timeline, deliverables.]

## Section 3: Problem Statement & Need
[Articulate the problem this business solves. Market validation. Why this matters now.]

## Section 4: Solution & Innovation
[What makes this solution innovative, unique, and commercially viable.]

## Section 5: Market Opportunity & Impact
[Market size, target customers, growth potential. Economic and social impact.]

### Projected Outcomes
| Metric | Year 1 | Year 2 | Year 3 |
|---|---|---|---|
| Jobs Created/Retained | X | X | X |
| Revenue Generated | $X | $X | $X |
| Customers Served | X | X | X |
| [Grant-specific KPI] | X | X | X |

## Section 6: Project Plan & Milestones
| Milestone | Activity | Timeline | Budget | Success Metric |
|---|---|---|---|---|
| M1 | [Activity] | Month 1-3 | $X | [Metric] |
| M2 | [Activity] | Month 4-6 | $X | [Metric] |
| M3 | [Activity] | Month 7-12 | $X | [Metric] |

## Section 7: Budget & Expenditure Plan
| Budget Category | Amount | % of Total | Description |
|---|---|---|---|
| [Category 1] | $X | X% | [Detail] |
| [Category 2] | $X | X% | [Detail] |
| **TOTAL** | **${grantAmount || "$X"}** | **100%** | |

**Value for Money Justification:** [Why this is an efficient use of grant funds]

## Section 8: Team & Capability
[Detailed team bios. Demonstrate you have the skills and experience to execute. Past successes.]

## Section 9: Commercialisation & Sustainability
[How will the business be sustainable after the grant period? Commercialisation pathway. Revenue model.]

## Section 10: Traction & Validation
[Evidence of market demand. Customers, LOIs, pilots, partnerships, awards. Every data point matters.]

## Section 11: Risk Management
| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| [Risk 1] | Low | Medium | [Strategy] |
| [Risk 2] | Medium | Medium | [Strategy] |

## Section 12: Alignment with Program Objectives
[Explicitly connect your project to the grant program's stated objectives and priorities. Use their language.]

---
## Reviewer's Checklist
- [ ] All mandatory fields completed
- [ ] Budget totals correctly
- [ ] Supporting documents listed
- [ ] Declaration signed
- [ ] Submitted before deadline

## Application Strengthening Tips
[5 specific tips to maximise the score for THIS specific grant based on its assessment criteria]

Write in a professional, confident, government-submission style. Be specific with every number. Use the grant program's own language and priorities where known from the research.`;

  const useCloud = !!(process.env.CLOUD_AI_KEY || process.env.OPENAI_API_KEY);
  if (useCloud) {
    await streamCloudLLM([
      { role: "system", content: "You are an expert Australian grant writer with a 95% success rate. Write in precise, professional government-submission language. Be specific with every claim, number and milestone. No filler." },
      { role: "user", content: prompt },
    ], res);
  } else {
    await streamLocalLLM([{ role: "user", content: prompt }], "You are an expert grant writer. Be specific, professional, and compelling.", res);
  }

  sse(res, { type: "done" });
  if (!res.writableEnded) res.end();
});

export default router;
