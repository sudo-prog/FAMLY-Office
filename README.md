# Family Office — Sovereign Wealth OS

> A private, local-first, sovereign wealth management system built for high-net-worth families and family offices. Bloomberg-meets-Apple aesthetic. Zero cloud exposure for sensitive financial data.

---

## 🚀 Live Demo

**https://sudo-prog.github.io/FAMLY-Office/**

PIN: `000000` (first-run, you'll set your own)

---

## Overview

Family Office is a full-stack Progressive Web App (PWA) that gives a family office complete control over their financial life — assets, transactions, entities, documents, projections, reporting, AI analysis, and business administration — in a single sovereign system that runs locally with optional AI enhancement.

**Core principles:**
- **Local-first** — all wealth data stays in your PostgreSQL database, never leaves your environment
- **Zero-trust AI** — portfolio data is never sent to cloud AI; only public research queries are cloud-routed
- **AES-256 framing** — document vault flagged as encrypted; PIN-locked on every session open
- **Sovereign** — no third-party data brokers, no telemetry, no external financial APIs required

---

## Features

### Portfolio Management
- **Asset Register** — full CRUD for all asset classes (property, equities, crypto, superannuation, bank accounts, bonds, business interests). Multi-currency with live FX conversion (AUD, USD, EUR, GBP, CAD, SGD)
- **Net Worth Snapshots** — automatic daily wealth snapshot on dashboard load; historical sparkline chart tracks portfolio value over time
- **Portfolio Rebalancing Tool** — set target allocation percentages per asset class via sliders; gap analysis table shows required buy/sell amounts with disclaimer; persists in localStorage
- **Allocation Dashboard** — donut chart, concentration warnings, allocation percentages inline on asset table

### Transaction Ledger
- **Full CRUD ledger** — income, expense, and transfer transactions with date, category, amount, notes
- **Tax Tagging** — 15 ATO-aligned tax categories per transaction (Capital Gain, Deductible, Franked Dividend, Super Contribution, GST Included, Foreign Income, etc.)
- **Tax Summary Panel** — colour-coded breakdown of all tagged transactions by ATO category with totals
- **Cash Flow Analysis** — monthly income vs. expense bar charts on dashboard

### Document Vault
- **Encrypted document store** — title, type, year, folder, content, and AI-searchable OCR text per document
- **Canvas & list views** — grid card view with type-coded icons; list view with bulk operations
- **Folder management** — create, rename, move, and isolate folders; bulk select and group
- **Auto CSV Import** — drag or select any CSV file; automatically detects financial columns (date, description, amount/debit/credit); parses and offers bulk transaction import with row-by-row preview and selection
- **Document Preview** — in-app document viewer with editable content for AI search context
- **Document AI** — query AI about a specific document or entire folder

### Entity Management
- **Legal entity register** — trusts (family, unit, SMSF), companies (Pty Ltd, holding), individuals
- **Entity detail pages** — ABN, TFN, ACN, jurisdiction, registration date, linked assets and transactions
- **Entity dashboard widget** — entity count and type summary on Command Center

### AI Intelligence
- **AI Insight Engine** — proactive, always-on rule-based portfolio analysis: concentration risk, crypto overexposure, idle cash, cash flow direction, entity structure gaps, tax optimisation opportunities, super allocation, document vault status
- **Zero-Trust AI Chat** — on-demand portfolio AI using local LLM (Ollama/LM Studio) for sensitive data; cloud AI for research only (sanitised, no financial data)
- **Document RAG** — keyword-matched document content injected as context into local LLM queries
- **AI Deep Research** — streaming web research, academic and news synthesis, custom reports
- **GitHub Analyser** — analyse any public repository: architecture, tech debt, security review, contribution patterns
- **Business Plan Generator** — executive summary and full VC-grade business plan with streaming output
- **Grant Finder + Proposal Creator** — Australian R&D/innovation grant search with AI proposal drafting
- **Component Builder** — AI-generated React/UI component builder from natural language specs

### Projections & Reporting
- **10-Year Projections** — conservative, moderate, and aggressive scenarios; compound growth modelling; AI analysis panel
- **Portfolio Report** — auto-generated markdown report with allocation, cash flow, entities, and vault status; exportable

### Home Office (Business Suite)
- **CRM** — client management with contact details, value, and notes
- **Invoicing** — create, send, and track invoices per client with line items and GST
- **Expense Tracking** — business expenses with GST, tax-deductible flag, supplier, and category
- **Time Tracking** — log billable time per client/project; auto-calculate invoice totals

### System & Configuration
- **Command Palette (⌘K)** — global search and navigation across all sections
- **Customisable Dashboard** — toggle/reorder 10 widgets: Net Worth, Asset Stats, Allocation, Cash Flow, Recent Activity, Vault, Entities, Quick Add, AI Assistant, AI Insights
- **PIN Lock** — 6-digit PIN on every session open; create on first run
- **PWA Install** — installable as standalone app via Settings → Install App (PWA); service worker with offline fallback
- **Multi-Currency Display** — per-session display currency selector; FX rates applied to all values
- **Theme Customiser** — accent colour, background colour, font family, text scale; 6 colour presets
- **Data Export** — CSV export of assets and transactions from Settings
- **Data Purge** — one-click complete data wipe from Settings
- **AI Configuration** — local LLM URL/model configuration; cloud AI key support; zero-trust routing policy display

---

## Tech Stack

### Frontend (`artifacts/family-office`)
| Technology | Purpose |
|---|---|
| React 18 | UI framework |
| TypeScript | Type safety throughout |
| Vite | Build tool and dev server |
| Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-first styling |
| wouter | Lightweight client-side routing |
| @tanstack/react-query | Server state, caching, mutations |
| recharts | Charts (line, bar, pie/donut) |
| lucide-react | Icon library |
| @radix-ui/* (via shadcn/ui) | Accessible UI primitives (Dialog, Sheet, Badge, etc.) |

### Backend (`artifacts/api-server`)
| Technology | Purpose |
|---|---|
| Express.js | HTTP server and REST API |
| TypeScript | Type safety |
| pino | Structured JSON logging |
| Server-Sent Events | Streaming AI responses |

### Database (`lib/db`)
| Technology | Purpose |
|---|---|
| PostgreSQL | Primary database (Replit-managed) |
| Drizzle ORM | Type-safe query builder and schema |
| drizzle-kit | Migrations and schema push |
| drizzle-zod | Auto-generated Zod validation schemas from Drizzle types |
| pg | PostgreSQL Node.js client |

### Validation & Shared (`lib/api-zod`)
| Technology | Purpose |
|---|---|
| Zod v4 | Runtime validation for all API request/response bodies |

### Workspace
| Technology | Purpose |
|---|---|
| pnpm workspaces | Monorepo package management |
| TypeScript project references | Cross-package type checking |

### AI Integrations
| Technology | Purpose |
|---|---|
| Ollama / LM Studio (local) | Local LLM for sensitive portfolio queries |
| OpenAI-compatible API (cloud) | Cloud AI for sanitised research queries |

---

## Project Structure

```
/
├── artifacts/
│   ├── family-office/          # React + Vite frontend PWA
│   │   ├── src/
│   │   │   ├── pages/          # Route-level pages (dashboard, assets, vault, etc.)
│   │   │   ├── components/     # Shared components (layout, ai-panel, command-palette, etc.)
│   │   │   ├── hooks/          # Custom hooks (use-theme)
│   │   │   └── lib/            # Utilities (currency conversion, etc.)
│   │   └── public/             # Static assets, manifest.webmanifest, sw.js, favicon.svg
│   │
│   ├── api-server/             # Express REST API
│   │   └── src/
│   │       ├── routes/         # Route handlers (assets, transactions, documents, ai, research, etc.)
│   │       └── lib/            # Shared utilities (ai-router for zero-trust routing)
│   │
│   └── family-office-pitch/    # Pitch deck (10 slides)
│
├── lib/
│   ├── db/                     # Drizzle ORM schema + migrations
│   │   └── src/schema/         # Table definitions (assets, transactions, documents, entities, etc.)
│   ├── api-zod/                # Shared Zod validation schemas for API contracts
│   └── api-client-react/       # Auto-generated React Query hooks from API spec
│
└── pnpm-workspace.yaml
```

---

## Database Schema

| Table | Purpose |
|---|---|
| `assets` | Asset holdings (name, category, value, currency, institution) |
| `transactions` | Ledger entries (date, description, amount, type, category, taxTag, taxDeductible) |
| `documents` | Vault documents (title, fileType, year, folder, ocrText, encrypted) |
| `entities` | Legal entities (trusts, companies, individuals — ABN, TFN, jurisdiction) |
| `wealth_snapshots` | Daily net worth snapshots (date, totalValue, assetCount) |
| `business_clients` | CRM clients |
| `business_invoices` | Invoices with line items |
| `business_expenses` | Business expenses with GST and tax flags |
| `business_time_entries` | Billable time logs |
| `research_reports` | Saved AI research reports |

---

## AI Architecture — Zero Trust

```
User Query
    │
    ▼
Query Classifier (20+ signals)
    │
    ├─── SENSITIVE (contains financial terms, numbers, entity names)
    │         └──► Local LLM (Ollama) — full portfolio context injected
    │
    └─── RESEARCH (public topics, market research, general)
              └──► Cloud AI (OpenAI/compatible) — sanitised query only, NO portfolio data
```

Portfolio data (asset values, transaction amounts, entity names, document content) is **never** sent to cloud AI under any circumstances.

---

## Getting Started

The app runs within the Replit environment:

1. **API Server** — starts automatically via workflow `artifacts/api-server: API Server`
2. **Frontend** — starts automatically via workflow `artifacts/family-office: web`
3. **Database** — Replit PostgreSQL is provisioned automatically; `DATABASE_URL` env var is set

### Environment Variables

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | ✅ Auto-set by Replit | PostgreSQL connection string |
| `PORT` | ✅ Auto-set | Server port (each artifact gets its own) |
| `BASE_PATH` | ✅ Auto-set | URL base path for the frontend |
| `LOCAL_LLM_URL` | Optional | Ollama/LM Studio endpoint (default: `http://localhost:11434/v1`) |
| `LOCAL_LLM_MODEL` | Optional | Local model name (default: `llama3.2`) |
| `OPENAI_API_KEY` | Optional | Cloud AI key for research queries |
| `CLOUD_AI_MODEL` | Optional | Cloud model name (default: `gpt-4o-mini`) |
| `CLOUD_AI_URL` | Optional | Custom OpenAI-compatible endpoint |
| `GITHUB_TOKEN` | Optional | GitHub token for private repo analysis |
| `SERP_API_KEY` | Optional | Search API for AI deep research |

---

## Pitch Deck

A 10-slide investor/stakeholder pitch deck is available at `/family-office-pitch` covering: vision, problem, solution, technology, AI architecture, security model, modules, AI features, roadmap, and contact.
