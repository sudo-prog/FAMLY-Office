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
- `artifacts/mockup-sandbox/` — Separate sandbox app (has Replit deps, keep separate)
- `artifacts/family-office-pitch/` — Pitch deck app (has Replit deps, keep separate)
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
- Deployment: GitHub Pages (live), Vercel (configured), Docker (not yet set up)

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

### Replit Dependencies
- Only in `mockup-sandbox` and `family-office-pitch` (separate apps)
- Main `family-office` app is clean of Replit coupling
- Settings page has documentation reference to "Replit Secrets" (instructional text only)

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
