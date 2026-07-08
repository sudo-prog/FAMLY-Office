# Agent Notes — FAMLY-Office

Architecture decisions, file structure, API patterns, and known issues.

---

## Project Path
`/home/thinkpad/Data/20_Projects/20.08_FAMLY_OFFICE/06_FAMLY-Office/`

## Repository
- GitHub: `sudo-prog/FAMLY-Office` (private)
- Main branch: `main`
- pnpm monorepo with workspaces

## Monorepo Structure
- `artifacts/family-office/` — React 19 frontend (Vite, Tailwind 4, shadcn/ui, Zustand, TanStack Query)
- `artifacts/api-server/` — Express 5 backend (Drizzle ORM, PostgreSQL, Zod validation)

- `lib/db/` — Shared database schema (Drizzle), migrations
- `lib/api-zod/` — Shared Zod schemas, API client
- `lib/api-client-react/` — Generated API client for frontend
- `lib/api-spec/` — OpenAPI spec, Orval codegen
- `lib/auth-web/` — Auth utilities

## Key Technologies
- Frontend: React 19, Vite 6, Tailwind CSS 4, shadcn/ui, Zustand, TanStack Query, Recharts, Framer Motion, Sonner (toasts)
- Backend: Express 5, Drizzle ORM, PostgreSQL, pgvector, Zod, Pino logging
- AI: Gemini Web2API proxy (free tier), local LLM via Ollama
- Auth: PIN lock (PBKDF2, 600k iterations, timing-safe), API key, JWT
- Deployment: Vercel (primary), Docker (for development)

## Vercel Deployment Configuration Audit (2026-07-03)

### GitHub Workflow Changes

**.github/workflows/build.yml** (formerly pages.yml)
- Converted from GitHub Pages deployment to build-only CI workflow
- Removed `pages: write` and `id-token: write` permissions
- Removed `actions/deploy-pages@v4` action
- Now runs `pnpm --filter @workspace/family-office run build` for Vercel deployment
- Vercel handles deployment automatically on git push to main

## Security Implementation (2026-06-28)

### PIN Lock
- PBKDF2 with 600,000 iterations (OWASP 2023 recommendation)
- Random 16-byte salt per PIN
- Timing-safe comparison via XOR-based constant-time compare
- Brute-force lockout: 5 attempts → 30-second lockout
- Auto-migration from V1 (plaintext) / V2 (SHA-256) → V3 (PBKDF2)
- Stored as `fo-pin-v3` with `{ salt, hash }` JSON

### Document Encryption
- AES-256-GCM module at `artifacts/api-server/src/lib/encryption.ts`
- Key derivation from `FAMLY_ENCRYPTION_KEY` env var
- Random 12-byte IV + 16-byte salt per encryption
- Auth tag for tampering protection
- **Remaining:** Wire into documents CRUD route for ocrText encryption

### API Security
- Auth middleware: API key (X-API-Key header) or JWT (Authorization: Bearer)
- Rate limiting: 100 req/15min per IP, X-RateLimit-* headers
- CORS: Production blocks all origins unless CORS_ORIGINS set
- Input sanitization: Strips script tags, on*= handlers, javascript: URLs
- Security headers: X-Content-Type-Options, X-Frame-Options, CSP, Referrer-Policy
- Request body size: 10mb limit
- SQL injection fixed in dashboard.ts (raw column names → Drizzle refs)
- Error message info leakage fixed in 5 routes

## Performance (2026-06-28)

- 30+ database indexes added in `lib/db/migrations/0001_add_indexes.sql`
- ErrorBoundary wrapping App + routes
- React.lazy code splitting for 25+ routes
- Sonner toast notifications on mutations
- @tanstack/react-virtual installed for future table virtualization

## Known Issues

### Pre-existing TypeScript Errors
- ~165+ tsc errors, all pre-existing:
  - JSX.IntrinsicElements (R3F v9 + React 19 type augmentation issue, affects all R3F files)
  - api-server routes (audit.ts, notifications.ts, ocr.ts)
  - sceneTemplates.ts type mismatches
- Build passes cleanly (esbuild handles JSX, errors are type-only)

### Security Remaining
- Encryption not yet wired into documents CRUD route
- Rate limiter is in-memory (won't work across multiple instances, needs Redis for production)
- chart.tsx dangerouslySetInnerHTML (low risk, shadcn/ui pattern)

### Removed Dependencies

## Additional Fixes (2026-07-05)

**API Client Base URL Wiring**
- `artifacts/family-office/src/main.tsx` — Added `setBaseUrl(import.meta.env.VITE_API_BASE_URL)` to enable API calls to the backend server. Without this, relative fetches would hit the static Vercel frontend and 404.

## Environment Variables
```
# Required for full functionality
FAMLY_ENCRYPTION_KEY=    # 64-char hex key or passphrase
FAMLY_API_KEY=           # API key for programmatic access
FAMLY_JWT_SECRET=        # JWT secret
CORS_ORIGINS=            # Comma-separated allowed origins
DATABASE_URL=            # PostgreSQL connection string
SUPABASE_URL=            # Supabase project URL
SUPABASE_SERVICE_ROLE_KEY= # Supabase service role key
```

## Deployment Checklist
- [ ] Set environment variables in deployment platform
- [ ] Apply database migrations (`pnpm db:push` or direct SQL)
- [ ] Configure CORS_ORIGINS for production domain
- [ ] Set up Redis for rate limiting (multi-instance)
- [ ] Configure FAMLY_ENCRYPTION_KEY for document encryption
- [ ] Set up SSL/TLS for API server
- [ ] Configure backup strategy for PostgreSQL

## Audit History
- 2026-06-28: Full audit completed (Phases 0-2)
  - Repo cleanup: 39,264 files removed (node_modules, dist, AI tooling)
  - Security: PIN lock, encryption, auth middleware, rate limiting, XSS/SQL fixes
  - Performance: DB indexes, error boundaries, code splitting, toasts
- 2026-07-09: Frontend route audit + backend API implementation (chief-of-staff agent)
  - **Backend**: Implemented `api/[[...path]].js` Vercel serverless catch-all (49 endpoints, in-memory seed data, no DB). Self-contained `stores` object, returns JSON for GET/POST/PATCH/DELETE + SSE streaming stubs. Created `scripts/api-dev-server.mjs` (local Node wrapper providing Vercel-compatible `res` shim) so `vite` proxies `/api` → `localhost:4001` in dev.
  - **vercel.json**: Fixed greedy SPA rewrite `/(.*)` → `/((?!api/).*)` so `/api/*` reaches serverless functions instead of being swallowed by SPA fallback.
  - **vite.config.ts**: Added `/api` proxy → `http://localhost:4001` (local dev parity with Vercel prod).
  - **Bug fix**: `src/components/ui/virtualized-table.tsx` — nested `<thead>` hydration error on `/transactions` and `/entities`. Root cause: component wrapped `header` (shadcn `TableHeader` = `<thead>`) in an extra outer `<thead>`, producing `<thead><thead>`. Fixed via `React.cloneElement(header, {className: ...sticky...})` rendering `header` directly. Verified: 0 console errors, tables render with rows on both routes.
  - **Route audit**: 25 real routes (from `App.tsx` router) crawled headless past the PIN gate (drove on-screen digit buttons to set PIN `123456`, valid `fo-pin-v3`). All 25 render correct headings + real data, 0 console errors, 0 error boundaries. `/vault` NAV_ERROR earlier was the PIN gate, not a bug — confirmed OK after unlock.
  - **Build**: `pnpm build` passes (`vite build && cp -r api dist/`), 9.95s, `dist/index.html` + `dist/api/[[...path]].js` emitted. Warning only: 1MB main chunk (299KB gzip) — acceptable.
  - **Visual confirmation**: DOM-based assertions used (moondream:v2 pegs CPU to ~149%/28% MEM and tripped the resource watchdog; abandoned). All routes confirmed via heading + table-row + error-text checks.
  - **Resource watchdog**: Added `cron/resource-watchdog.sh` (every 1m, no_agent) — kills heavy agent procs + writes STOP flag if CPU>90% or MEM>85%. `pre-flight-check.sh` run before heavy tasks. Fired once during audit (moondream overload) and correctly prevented a crash.
