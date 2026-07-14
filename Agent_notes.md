# Agent Notes — Family Office Development Log

> Internal notes for AI agents working on this codebase. Captures architectural decisions, feature inventory, and the development roadmap.

---

## Features Built (Complete Inventory)

### Session 1 — Foundation
| Feature | Description | Key Files |
|---|---|---|
| **Project scaffold** | pnpm monorepo with React/Vite frontend, Express API server, shared DB/API-zod libs | `pnpm-workspace.yaml`, `artifacts/family-office/`, `artifacts/api-server/` |
| **Database schema** | Drizzle ORM schema for all core tables | `lib/db/src/schema/` |
| **PIN Lock** | 6-digit PIN on session open; stored in localStorage; first run creates PIN | `src/pages/` (App.tsx / pin-lock) |
| **Dark gold theme** | Bloomberg-meets-Apple: charcoal `#0d1117`, gold `#C9A227`; CSS vars in HSL without wrapper | `src/index.css`, `src/hooks/use-theme.ts` |
| **Navigation layout** | Left sidebar, collapsible, with section groups and active state | `src/components/layout.tsx` |
| **⌘K Command Palette** | Global fuzzy search/navigation; keyboard shortcut; all routes indexed | `src/components/command-palette.tsx` |

### Session 2 — Core Modules
| Feature | Description | Key Files |
|---|---|---|
| **Dashboard** | Customisable widget grid (10 widgets); net worth chart; allocation donut; cash flow bars; recent activity; vault status; entities; quick-add; AI assistant; AI insights | `src/pages/dashboard.tsx` |
| **Asset Register** | CRUD for all asset classes; multi-currency; institution/notes; % of portfolio bar; rebalancing button | `src/pages/assets.tsx` |
| **Transaction Ledger** | CRUD ledger; type filter; search; tax deductible flag; tax tag ATO categories; tax summary panel | `src/pages/transactions.tsx` |
| **Document Vault** | Canvas/list views; folder management; bulk select; drag-drop file upload; CSV auto-import; document preview; AI query | `src/pages/vault.tsx` |
| **Entities** | Legal entity register (trusts, companies, SMSF, individuals); detail pages with linked assets/transactions | `src/pages/entities.tsx`, `src/pages/entity-detail.tsx` |
| **Projections** | 10-year wealth projections; 3 scenarios (conservative/moderate/aggressive); compound growth; AI analysis panel | `src/pages/projections.tsx` |
| **Portfolio Report** | Auto-generated markdown report with all portfolio sections; AI panel; export | `src/pages/report.tsx` |

### Session 3 — Business Suite & AI
| Feature | Description | Key Files |
|---|---|---|
| **Home Office** | CRM (clients), invoicing (line items, GST), expense tracking, time logging — complete business back-office | `src/pages/home-office.tsx`, `api-server/src/routes/business.ts` |
| **AI Research** | 6-tab research hub: deep web research (streaming), saved reports, GitHub analyser, business plan generator, grant finder, component builder | `src/pages/research.tsx`, `api-server/src/routes/research.ts` |
| **GitHub Analyser** | Fetch any public repo; AI architecture review, tech debt analysis, security scan, contribution patterns | `api-server/src/routes/research.ts` |
| **Business Plan Generator** | Executive summary + full VC-grade business plan; streaming AI output; markdown rendered | `api-server/src/routes/research.ts` |
| **Grant Finder** | Australian R&D/innovation grant search; AI proposal drafting per grant | `api-server/src/routes/research.ts` |
| **Component Builder** | Natural language → React/UI component code with live preview | `src/pages/research.tsx` |
| **Settings** | Currency selector; theme customiser (presets + sliders + font import); AI config; data export CSV; data purge | `src/pages/settings.tsx` |
| **Tools & Integrations panel** | Live AI status (local LLM online/offline, cloud configured); env var config guide; tool connectivity status | `src/pages/settings.tsx` |

### Session 4 — PWA & Intelligence Layer
| Feature | Description | Key Files |
|---|---|---|
| **PWA Install** | Service worker registered with correct BASE_URL scope; SVG-only manifest (no missing PNG refs); Install App card in Settings with `beforeinstallprompt` handling | `src/main.tsx`, `public/manifest.webmanifest`, `src/pages/settings.tsx` |
| **Wealth Snapshots** | Auto-records one snapshot per day on dashboard load (idempotent); sparkline uses real snapshot history; `wealth_snapshots` table | `api-server/src/routes/snapshots.ts`, `src/pages/dashboard.tsx` |
| **AI Insight Engine** | `GET /api/ai/insights` — 9 rule-based checks: concentration >60%/45%, crypto >25%, idle cash >30%, negative cash flow, low diversification <3 classes, no entities, tax deductibles, empty vault, low super; severity-sorted; no LLM required | `api-server/src/routes/ai.ts` |
| **AI Insights Widget** | New dashboard widget (col-span-3); 3-column card grid; colour-coded severity dots (red/amber/green); click to expand detail + action link with navigation | `src/pages/dashboard.tsx` |
| **Tax Tagging** | 15 ATO tax categories on transactions (capital gain/loss, assessable income, deductible, non-deductible, GST included/free, super concessional/non-concessional, franked/unfranked dividend, foreign income, FBT); colour-coded badges in table; tax summary panel | `src/pages/transactions.tsx` |
| **Rebalancing Tool** | Sheet panel on Assets page; target allocation sliders per category; gap analysis table (current vs target %; buy/sell recommendations); localStorage persistence; defaults to typical family office benchmarks; disclaimer | `src/pages/assets.tsx` |
| **Auto CSV Import** | Drag-drop or file-pick on vault Add Document dialog; auto-detects financial CSV columns (date, description, amount, debit/credit); smart date normaliser; auto-categorisation from description keywords; row-level preview with checkboxes; bulk transaction import | `src/pages/vault.tsx` |

---

## AI Configuration
- **Default Provider:** `gemini-web2api` (model: `gemini-3.5-flash`) — runs locally via gemini-web2api proxy at `http://localhost:8081/v1`
- **Fallback Provider:** OpenRouter — uses `OPENROUTER_API_KEY` env var, defaults to `openrouter/free` model
- **Self-Heal:** `artifacts/family-office/src/lib/ai-self-heal.ts` — provides DOM snapshot, EVAL, FIX_NOTIFICATIONS, and CLEAR_STALE operations
- **Provider Fallback Order:** Gemini Web2API → OpenRouter → Ollama (local)
- **Key Files:**
  - `artifacts/api-server/src/lib/ai-router.ts` — Zero-trust AI routing with OpenRouter fallback
  - `artifacts/family-office/src/lib/ai-self-heal.ts` — Self-healing AI capability

## Architecture Decisions

### Zero-Trust AI Routing
The AI router (`api-server/src/lib/ai-router.ts`) classifies every query using 20+ signals. Queries containing financial terms, entity names, or numbers are routed to the local LLM with full portfolio context. Public research queries are sanitised and routed to cloud AI. This is a hard architectural constraint — never weaken it.

### CSS Variables Pattern
All theme colours use HSL values **without** the `hsl()` wrapper: `--primary: 43 65% 52%` not `hsl(43 65% 52%)`. This allows Tailwind's opacity modifier syntax to work (e.g. `bg-primary/10`).

### BASE_URL Pattern
Frontend fetches always use:
```typescript
const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
fetch(`${BASE}/api/...`)
```
The service worker uses the same pattern for registration scope.

### API Client Generation
The hooks in `lib/api-client-react` are generated from `lib/api-zod` schemas. After any schema change, run `pnpm --filter @workspace/api-client-react run codegen` to regenerate.

### DB Schema Push
After modifying `lib/db/src/schema/*.ts`, run `pnpm --filter @workspace/db run push` to sync with the database. If "no changes detected", verify the column exists directly via SQL — the schema may already match.

### Drizzle ORM Casting
Numeric columns (value, amount) are returned as `string` from Drizzle by default. Always cast: `Number(asset.value)` before arithmetic. The `formatTransaction` and `formatDocument` helper functions in API routes handle this normalisation.

---

## Development Roadmap

### ✅ Completed

| # | Feature |
|---|---|
| 1 | Core monorepo scaffold with TypeScript, Drizzle, Express, React/Vite |
| 2 | PIN lock with 6-digit entry UI |
| 3 | Dashboard with 10 customisable widgets |
| 4 | Asset Register (CRUD, multi-currency, category, institution) |
| 5 | Transaction Ledger (CRUD, categories, tax-deductible flag) |
| 6 | Document Vault (canvas/list, folders, preview, AI search) |
| 7 | Entity Management (trusts, companies, SMSF, individuals; detail pages) |
| 8 | 10-Year Projections (3 scenarios, compound growth, AI panel) |
| 9 | Portfolio Report (auto-generated markdown, AI panel) |
| 10 | ⌘K Command Palette |
| 11 | Home Office — CRM, Invoicing, Expenses, Time Tracking |
| 12 | AI Research — Deep research, GitHub analyser, Business plan, Grants, Component builder |
| 13 | Settings — Currency, Theme, AI config, Export, Purge |
| 14 | Zero-Trust AI Chat with RAG (document content injected as context) |
| 15 | PWA manifest, service worker, install prompt |
| 16 | Wealth Snapshots — auto daily record, historical sparkline |
| 17 | AI Insight Engine — 9 rule-based proactive alerts on dashboard |
| 18 | Tax Tagging — 15 ATO categories, tax summary panel |
| 19 | Portfolio Rebalancing Tool — target sliders, gap analysis, buy/sell recommendations |
| 20 | Auto CSV Import — drag-drop vault upload with financial column detection and bulk transaction import |
| 21 | 10-slide Pitch Deck |

---

### 🔄 In Progress / Partial

| Feature | Status | Notes |
|---|---|---|
| Local LLM AI responses | Backend ready | Requires user to configure Ollama/LM Studio at `LOCAL_LLM_URL` |
| Cloud AI research | Backend ready | Requires user to set `OPENAI_API_KEY` or `CLOUD_AI_KEY` |
| GitHub Analyser | Routes ready | Requires `GITHUB_TOKEN` for private repos; public repos work without |

---

### 📋 Roadmap — Not Yet Built

#### High Priority
| # | Feature | Description |
|---|---|---|
| R1 | **Asset Price Feeds** | Auto-fetch live prices for equities (Yahoo Finance), crypto (CoinGecko), and property estimates. One-click "refresh all prices" on Asset Register |
| R2 | **Tax Year Summary Report** | Dedicated FY tax report: total income by category, deductible expenses, capital gains events (short/long term), super contributions, GST payable — exportable to PDF/CSV for accountant |
| R3 | **Bank Feed CSV Auto-Sync** | Scheduled CSV drop zone: place bank export files in a watched folder and transactions auto-import on server start |
| R4 | **Multi-User / Family Members** | Role-based access (admin, viewer, accountant); separate PIN per user; audit log of all changes |

#### Medium Priority
| # | Feature | Description |
|---|---|---|
| R5 | **Cash Flow Forecasting** | AI-powered 12-month cash flow forecast based on recurring transactions; shows projected runway |
| R6 | **Entity Tax Optimisation** | Per-entity tax modelling: discretionary trust distribution calculator, company tax rate comparison, SMSF contribution room tracker |
| R7 | **Document OCR** | Real OCR processing of uploaded PDF/image files (via Tesseract or cloud vision API) to auto-populate `ocrText` for AI search |
| R8 | **Mobile App** | Expo React Native companion app for on-the-go portfolio viewing and quick transaction entry |
| R9 | **Notifications & Alerts** | Email/push alerts for AI insights triggering above threshold; overdue invoice reminders; document expiry warnings |
| R10 | **Net Worth Targets** | Set a net worth target for a specific date; dashboard shows progress bar and required monthly savings/growth rate |

#### Lower Priority / Future
| # | Feature | Description |
|---|---|---|
| R11 | **PDF Report Export** | One-click PDF generation of the Portfolio Report using Puppeteer or React-PDF |
| R12 | **Audit Log** | Immutable append-only log of all create/update/delete operations with timestamp and user |
| R13 | **Benchmark Comparison** | Compare portfolio allocation and returns to ASX 200, S&P 500, and typical family office benchmarks |
| R14 | **Estate Planning Module** | Will register, beneficiary tracker, inheritance simulation ("what if" scenarios) |
| R15 | **Crypto Portfolio Tracker** | Deep crypto integration: wallet address monitoring, DeFi positions, NFT holdings, on-chain tax events |
| R16 | **Property Valuation Tracker** | Auto-fetch CoreLogic/Domain suburb median price estimates; property-specific yield and capital growth tracking |
| R17 | **Investment Research Watchlist** | Track stocks/assets on a watchlist with AI-generated research summaries and news digests |
| R18 | **MCP Server Integration** | Model Context Protocol server exposing Family Office data to external AI tools (Claude Desktop, etc.) |
| R19 | **Offline Mode Enhancement** | Full offline-capable PWA with IndexedDB sync queue; background sync when reconnected |
| R20 | **White-Label / Multi-Office** | Multi-tenant architecture for advisers managing multiple family offices from one instance |

---

## Known Limitations & Caveats

1. **FX Rates** — currency conversion uses hardcoded approximate mid-rates (mid-2025). Not real-time. Values labelled as "approximate".
2. **PIN Security** — PIN is stored in localStorage as plain text. For production deployment, hash the PIN with bcrypt server-side with session tokens.
3. **PWA Install** — `beforeinstallprompt` is not supported in Safari (iOS). Safari users must use "Add to Home Screen" via the Share menu. The Settings page explains this.
4. **AI Insights** — all insights are rule-based (no LLM). They use heuristic thresholds (e.g. >60% concentration). These thresholds should be configurable by the user in a future iteration.
5. **Document Storage** — documents are stored as text/metadata only. Binary files (actual PDFs, images) are not stored in the database. The `ocrText` field stores extracted text for AI search.
6. **No Authentication** — there is no server-side authentication. The PIN lock is client-side only. The system is designed for single-user local/private deployment.
7. **Snapshot Granularity** — wealth snapshots are once-per-day maximum. Intra-day portfolio changes are not tracked in the snapshot history.

---

## File Reference — Important Paths

| Path | Purpose |
|---|---|
| `artifacts/api-server/src/lib/ai-router.ts` | Zero-trust AI routing with gemini-web2api default + OpenRouter fallback |
| `artifacts/family-office/src/lib/ai-self-heal.ts` | Self-healing AI capability |
| `artifacts/family-office/src/pages/dashboard.tsx` | Main dashboard — widgets, snapshot record, insights widget |
| `artifacts/family-office/src/pages/assets.tsx` | Asset register + rebalancing sheet |
| `artifacts/family-office/src/pages/transactions.tsx` | Ledger + tax tags + tax summary |
| `artifacts/family-office/src/pages/vault.tsx` | Document vault + CSV auto-import |
| `artifacts/family-office/src/pages/research.tsx` | AI Research hub (6 tabs) |
| `artifacts/family-office/src/pages/settings.tsx` | Settings + PWA install + AI config |
| `artifacts/family-office/src/components/ai-panel.tsx` | Shared AI chat panel (used on 4+ pages) |
| `artifacts/family-office/src/components/command-palette.tsx` | ⌘K global command palette |
| `artifacts/family-office/src/lib/currency.ts` | FX conversion utilities |
| `artifacts/family-office/src/hooks/use-theme.ts` | Theme customisation hook |
| `artifacts/family-office/public/sw.js` | Service worker (cache-first for static, network-first for nav) |
| `artifacts/api-server/src/routes/ai.ts` | AI chat + proactive insights endpoint |
| `artifacts/api-server/src/routes/research.ts` | Deep research, GitHub, business plan, grants |
| `artifacts/api-server/src/routes/snapshots.ts` | Wealth snapshot record + history |
| `artifacts/api-server/src/routes/dashboard.ts` | Dashboard summary, cash flow, net worth history |
| `artifacts/api-server/src/lib/ai-router.ts` | Zero-trust AI routing classifier |
| `lib/db/src/schema/` | All Drizzle ORM table schemas |
| `lib/api-zod/src/` | Zod validation schemas for all API endpoints |

---

## Mobile UI Audit + Fix (2026-07-10, chief-of-staff agent)

- **Method**: Headless Playwright (Chromium, cached) at 390×844 mobile viewport across all 22 routes. DOM/computed-style assertions only — no moondream (CPU/MEM watchdog risk). Reusable harness committed to `artifacts/family-office/`: `audit2.mjs` (status/console/overflow), `layout.mjs` (off-screen els, tap targets, table overflow), `check-offscreen.mjs` (false-positive classifier for intentional off-canvas drawers).
- **Findings (pre-fix)**: 0 console errors, all 22 routes HTTP 200. Real breakages: (1) **table overflow** on benchmarks/white-label/admin-users/audit-log/estate/projections/cash-flow/home-office/tax-report — root cause: 13 pages use RAW `<table className="w-full text-sm">` instead of the shadcn `Table` component (which wraps in `relative w-full overflow-auto`); (2) **sub-36px tap targets** (settings 28, watchlist 21, research 20, assets/prices 16).
- **Fix**: ONE global mobile CSS block in `artifacts/family-office/src/index.css` (Tailwind v4 `@media (max-width:640px)`): `table { table-layout: fixed; width:100% !important }` + `th,td { word-break/overflow-wrap/white-space:normal }` + `button,a,[role=button] { min-height:36px }` (toolbar-icon exclusions `.h-8/.h-9/.h-10/.size-*`) + `html,body { max-width:100%; overflow-x: clip }`. No per-file JSX churn (simplest fix = right fix).
- **Post-fix verification**: `docOverflow=0` (scrollWidth===clientWidth===390) every route — zero horizontal page scroll. Table overflow resolved on all routes except `/admin/audit-log` (table intentionally wraps in shadcn `Table` + radix `ScrollArea`, scrolls internally; body `clip` contains it). Tap targets ≤4 everywhere.
- **Build**: `pnpm build` passes (18s, benign 1MB chunk warning).
- **Pushed**: commit `a6ccbf7a` → `sudo-prog/FAMLY-Office` `main` (SSH). Harness scripts + CSS included.
- **Reusable pattern**: same global-CSS fix applies to any shadcn/Tailwind app with raw-table mobile overflow — being rolled out to the other 9 Vercel projects via sub-agents.
