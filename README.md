# FAMLY-Office — Sovereign Wealth OS

> A private, local-first, sovereign wealth management platform built for high-net-worth families and family offices. Bloomberg-meets-Apple aesthetic. Zero cloud exposure for sensitive financial data.

---

## 🚀 Live Demo

**https://sudo-prog.github.io/FAMLY-Office/**

PIN: `000000` (first-run, you'll set your own)

---

## Overview

FAMLY-Office is a full-stack Progressive Web App (PWA) that gives a family office complete control over their financial life — assets, transactions, entities, documents, projections, reporting, AI analysis, and business administration — in a single sovereign system that runs locally with optional AI enhancement.

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
| React 19 | UI framework |
| TypeScript | Type safety throughout |
| Vite 5 | Build tool and dev server |
| Tailwind CSS v4 (`@tailwindcss/vite`) | Utility-first styling |
| wouter | Lightweight client-side routing |
| @tanstack/react-query | Server state, caching, mutations |
| recharts | Charts (line, bar, pie/donut) |
| lucide-react | Icon library |
| @radix-ui/* (via shadcn/ui) | Accessible UI primitives (Dialog, Sheet, Badge, etc.) |

### Backend (`artifacts/api-server`)
| Technology | Purpose |
|---|---|
| Express.js 5 | HTTP server and REST API |
| TypeScript | Type safety |
| pino | Structured JSON logging |
| Server-Sent Events | Streaming AI responses |

### Database (`lib/db`)
| Technology | Purpose |
|---|---|
| PostgreSQL 16 | Primary database |
| pgvector | Vector similarity search for AI features |
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

## Prerequisites

- **Node.js** >= 20.x
- **pnpm** >= 9.x (`npm install -g pnpm`)
- **PostgreSQL** >= 14 (or Docker for containerized PostgreSQL)
- **Git**

---

## Quick Start

```bash
# Clone the repository
git clone https://github.com/sudo-prog/FAMLY-Office.git
cd FAMLY-Office

# Install dependencies
pnpm install

# Copy environment configuration
cp .env.example .env
# Edit .env and set your DATABASE_URL and other variables

# Push database schema (creates tables)
pnpm db:push

# Start the development server
pnpm dev
```

The frontend will be available at `http://localhost:5173` and the API server at `http://localhost:3001`.

---

## Docker Setup

The project includes a `docker-compose.yml` with PostgreSQL 16 + pgvector:

```bash
# Start PostgreSQL in Docker
pnpm db:up

# Run the application (in another terminal)
pnpn dev

# Stop PostgreSQL
pnpm db:down
```

### Docker Commands

| Command | Description |
|---|---|
| `pnpm db:up` | Start PostgreSQL container |
| `pnpm db:down` | Stop PostgreSQL container |
| `pnpm db:push` | Push schema to database |
| `pnpm db:studio` | Open Drizzle Studio (database GUI) |

> **Note:** The `db:up`, `db:down`, and `db:studio` commands are configured in the `lib/db` package. If they're not available as root-level scripts, run them directly: `pnpm --filter @workspace/db run push`.

---

## Available Scripts

| Script | Description |
|---|---|
| `pnpm dev` | Start all workspace packages in development mode |
| `pnpm build` | Type-check and build all packages |
| `pnpm typecheck` | Run TypeScript type checking across all packages |
| `pnpm db:push` | Push Drizzle schema to database (creates/updates tables) |
| `pnpm db:push-force` | Force push schema (drops and recreates) |
| `pnpm db:up` | Start PostgreSQL Docker container |
| `pnpm db:down` | Stop PostgreSQL Docker container |

### Frontend-only scripts (from `artifacts/family-office/`)

| Script | Description |
|---|---|
| `pnpm dev` | Start Vite dev server |
| `pnpm build` | Production build |
| `pnpm serve` | Preview production build |
| `pnpm typecheck` | TypeScript type check |

### API Server scripts (from `artifacts/api-server/`)

| Script | Description |
|---|---|
| `pnpm dev` | Build and start API server |
| `pnpm build` | Compile TypeScript |
| `pnpm start` | Run compiled server |
| `pnpm typecheck` | TypeScript type check |

---

## Environment Variables

Copy `.env.example` to `.env` and configure as needed.

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | ✅ Yes | — | PostgreSQL connection string (e.g., `postgresql://user:pass@localhost:5432/famly_office`) |
| `PORT` | ✅ Yes | `3001` | API server port |
| `NODE_ENV` | ✅ Yes | `development` | Environment: `development`, `production`, or `test` |
| `BASE_PATH` | Production | `/` | URL base path for frontend (use `/FAMLY-Office/` for GitHub Pages) |
| `FAMLY_API_KEY` | Production | — | API key for `X-API-Key` header authentication |
| `FAMLY_JWT_SECRET` | Production | — | JWT secret for HS256 token signing |
| `FAMLY_ENCRYPTION_KEY` | Production | — | AES-256-GCM encryption key for document vault (generate: `openssl rand -hex 32`) |
| `CORS_ORIGINS` | No | — | Comma-separated allowed CORS origins |
| `LOCAL_LLM_URL` | No | `http://localhost:11434/v1` | Local LLM endpoint (Ollama/LM Studio) |
| `LOCAL_LLM_MODEL` | No | `llama3.2` | Local LLM model name |
| `OPENAI_API_KEY` | No | — | Cloud AI key for research queries |
| `CLOUD_AI_KEY` | No | — | Alternative cloud AI key |
| `CLOUD_AI_URL` | No | OpenAI default | Custom OpenAI-compatible endpoint URL |
| `CLOUD_AI_MODEL` | No | `gpt-4o-mini` | Cloud AI model name |
| `BRAVE_SEARCH_KEY` | No | — | Brave Search API key for web search |
| `GITHUB_TOKEN` | No | — | GitHub token for private repo analysis |
| `SERP_API_KEY` | No | — | SerpAPI key for AI deep research |
| `LOG_LEVEL` | No | `info` | Logging level: `fatal`, `error`, `warn`, `info`, `debug`, `trace`, `silent` |
| `POSTGRES_USER` | Docker | `famly` | PostgreSQL Docker user |
| `POSTGRES_PASSWORD` | Docker | `famly_secret` | PostgreSQL Docker password |
| `POSTGRES_DB` | Docker | `famly_office` | PostgreSQL Docker database name |

---

## Project Structure

```
FAMLY-Office/
├── artifacts/
│   ├── family-office/              # React 19 + Vite frontend PWA
│   │   ├── src/
│   │   │   ├── pages/              # Route-level pages (dashboard, assets, vault, etc.)
│   │   │   ├── components/         # Shared components (layout, ai-panel, command-palette, etc.)
│   │   │   ├── hooks/              # Custom hooks (use-theme, etc.)
│   │   │   └── lib/                # Utilities (currency conversion, etc.)
│   │   ├── public/                 # Static assets, manifest.webmanifest, sw.js, favicon.svg
│   │   └── vite.config.ts          # Vite configuration
│   │
│   ├── api-server/                 # Express 5 REST API
│   │   ├── src/
│   │   │   ├── routes/             # Route handlers (assets, transactions, documents, ai, research, etc.)
│   │   │   └── lib/                # Shared utilities (ai-router for zero-trust routing)
│   │   └── build.mjs               # esbuild build script
│   │
│   └── family-office-pitch/        # Pitch deck (10 slides)
│
├── lib/
│   ├── db/                         # Drizzle ORM schema + migrations
│   │   ├── src/schema/             # Table definitions (assets, transactions, documents, entities, etc.)
│   │   ├── drizzle.config.ts       # Drizzle Kit configuration
│   │   └── package.json
│   │
│   ├── api-zod/                    # Shared Zod validation schemas for API contracts
│   ├── api-spec/                   # API specification (OpenAPI/routes)
│   └── api-client-react/           # Auto-generated React Query hooks from API spec
│
├── scripts/                        # Utility scripts
│
├── docker-compose.yml              # PostgreSQL 16 + pgvector container
├── .env.example                    # Environment variable template
├── pnpm-workspace.yaml             # Monorepo workspace configuration
├── tsconfig.base.json              # Base TypeScript configuration
├── tsconfig.json                   # Root TypeScript configuration
└── package.json                    # Root workspace package
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

## Deployment

### Option 1: GitHub Pages (Frontend Only)

The frontend can be deployed as a static site to GitHub Pages:

```bash
# Update vite.config.ts base path to match your repo name
# Set base: '/FAMLY-Office/' in vite.config.ts

# Build for production
pnpm build

# The `dist` folder in artifacts/family-office can be deployed to GitHub Pages
# Use GitHub Actions or the `gh-pages` branch method
```

For API backend, deploy separately to a server or cloud platform (see Option 3).

### Option 2: Vercel

Deploy the frontend to Vercel:

1. Import the repository into Vercel
2. Set the root directory to `artifacts/family-office`
3. Set build command: `pnpm build`
4. Set output directory: `dist`
5. Add environment variables in the Vercel dashboard

For the API server, consider Vercel serverless functions or deploy the Express server to a platform like Railway, Render, or Fly.io.

### Option 3: Docker (Full Stack)

```bash
# Build and run with Docker Compose
docker-compose up --build

# Or build a production image for the API server
docker build -t famly-office-api ./artifacts/api-server

# Run migrations and start
docker run --env-file .env -p 3001:3001 famly-office-api
```

### Option 4: Self-Hosted / VPS

```bash
# On your server
git clone https://github.com/sudo-prog/FAMLY-Office.git
cd FAMLY-Office
pnpm install
pnpm build

# Set up PostgreSQL, configure .env, then:
pnpm db:push
pnpm start

# Use PM2, systemd, or your preferred process manager
```

---

## Contributing

We welcome contributions! Please follow these guidelines:

### Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/FAMLY-Office.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `pnpm install`

### Development Workflow

1. Make your changes
2. Run type checking: `pnpm typecheck`
3. Run the dev server: `pnpm dev`
4. Test your changes thoroughly

### Submitting Changes

1. Ensure all types pass: `pnpm typecheck`
2. Commit with clear, descriptive messages following conventional commits:
   - `feat:` — New feature
   - `fix:` — Bug fix
   - `docs:` — Documentation changes
   - `refactor:` — Code refactoring
   - `chore:` — Maintenance tasks
3. Push to your fork: `git push origin feature/your-feature-name`
4. Open a Pull Request against the `main` branch

### Code Style

- TypeScript strict mode is enforced
- Use functional components with hooks
- Follow the existing file structure and naming conventions
- Use Tailwind CSS for styling; avoid inline styles where possible
- All API routes must have Zod validation schemas

### Security

- Never commit `.env` files or secrets
- Follow the zero-trust AI pattern: portfolio data never leaves the local environment
- Use the existing encryption utilities for sensitive data

---

## Roadmap

- [ ] Mobile app (React Native)
- [ ] Multi-family office support
- [ ] Advanced reporting and compliance
- [ ] Integration with accounting software (Xero, MYOB)
- [ ] Collaborative features (multi-user, role-based access)
- [ ] Automated data feeds (bank APIs, broker APIs)

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

> **Note:** While the source code is open for review and learning, FAMLY-Office is designed as a production system for private family wealth management. Please respect the license terms and contribute back improvements when possible.

---

## Acknowledgements

- Built with React 19, Express 5, Drizzle ORM, PostgreSQL, and Tailwind CSS v4
- AI features powered by Ollama (local) and OpenAI-compatible APIs (cloud)
- Icons by Lucide React
- Charts by Recharts

---

## Support

For issues, feature requests, or questions, please open an issue on the GitHub repository.

---

*Built with privacy-first principles. Your wealth data stays yours.*
