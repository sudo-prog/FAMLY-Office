# Dev Roadmap — FAMLY-Office

> Project: sudo-prog/FAMLY-Office (private)
> Live: https://family-office-blush.vercel.app
> Repo root: `06_FAMLY-Office/` (Vercel deploys from here; root `vercel.json`, `api/`)
> Frontend: `artifacts/family-office/` (React 19, Vite, Tailwind, shadcn/ui)
> Backend (prod): `api/[[...path]].js` (Vercel serverless, in-memory mock)
> Backend (dev): `artifacts/api-server/` (Express + Postgres, NOT deployed)
> Last updated: 2026-07-15

---

## Status (2026-07-15)

**Audit COMPLETE — verified.** The 2026-07-14 comprehensive audit (FAMILY-OFFICE-AUDIT-REPORT.md) is fully remediated and deployed. Re-verified 2026-07-15: builds green, live `/api/*` 200, SPA deep links 200, onboarding + full nav + ⌘K working.

**MOBILE UI — ROOT-CAUSED + FIXED (2026-07-15, commit c0b5711a).** Two mobile-only bugs found via Playwright computed-style forensics at 390px (a `pnpm build` check hid both):
- **Colors not rendering (Tailwind v4.3.1 oklab/color-mix):** v4 emits `oklab()`/`color-mix()` for ALL colors (e.g. `bg-primary/10` → `oklab(...)`). User's older mobile browser rejects oklab → theme colors silently dropped. Lightning CSS `targets` did NOT downlevel it. Fixed by a post-build downleveler (`scripts/downlevel-colors.mjs`, chained into `pnpm build`) that converts `oklab/oklch/color-mix` → `rgb()/rgba()` (with `var(--tw-shadow-alpha)` preserved as alpha). Built CSS now 0 oklab/oklch/color-mix.
- **Menu pushes app down (leaked `md:relative`):** `md:relative` on the sidebar leaked out of its `@media` wrapper (Tailwind v4.3.1 build bug) and, being source-order-after `.fixed`, overrode `fixed` at mobile → `aside` computed `position:relative` (in-flow) → pushed main to `top:1606px` ("scroll halfway before you see it"). Fixed by replacing the Tailwind `md:` variant with a hand-rolled `.fo-sidebar` media query (`position:fixed` overlay on mobile, `static` on desktop).
- **Verified live at 390px:** `aside.position=fixed`, `main.top=0`, `bodyBg=rgb(244,237,221)` (cream renders), 0 overflowers, dashboard unlocks, 0 console errors. Deployed prod (Ready 59s, aliased family-office-blush.vercel.app).

## Status (2026-07-16) — ROUND 2 + REGRESSION FIX, VERIFIED 3-WAY

**MOBILE RENDERING BUGS ROUND 2 — DONE (commit b79b1410)** + **REGRESSION FIXED (06e8f7fe, 22e61fdf)**, all deployed prod 2026-07-16. The original round-2 sign-off ("34/34 GREEN") was a FALSE PASS — it only checked page-level overflow on 8 routes and missed 11 unwrapped wide tables pushing content past 390px on the other routes. User was right that pages still broke. Fixed centrally in `src/index.css`: `table{display:block;width:100%;overflow-x:auto}` (table = self scroll container, capped to viewport). Re-verified across ALL 25 routes three ways (see agent_notes.md 2026-07-16 retraction entry):

- Playwright per-element scan (`fo-scan-accurate.mjs`, excludes scroll containers): **0 page overflow, 0 true offenders** on all 25 routes.
- **OmniParser** grounding (`/home/thinkpad/Data/OmniParser`, detection-only — bypasses Florence `flash_attn` CPU build failure): **0 detected elements past 390px** on all 25 clean screenshots.
- agent-browser: `overflowX=0`.

Round-2 content fixes (G#1–G#7) still apply: help-button auto-dismiss + smaller footprint, responsive stat grids / settings rows / projections header, iOS Safari install instructions.

### Done ✅ (from audit)
- §1 Malformed Vercel SPA rewrite → fixed (root + nested `vercel.json`); deep links/refresh no longer 404.
- §2 In-memory mock backend → honest `VITE_DEMO_MODE=true` demo banner ("non-persistent data"). Chose demo-banner path, NOT real Postgres (no DB provisioned on Vercel).
- §3 AI demo responses labeled via SSE `model:"demo"` chip in `ai-panel.tsx` + `research.tsx`.
- §4a Onboarding auto-shows on first visit; §4b HelpButton `onComplete` no longer `resetOnboarding` (self-reset fixed).
- §5 Offline banner truthful ("changes cannot be saved"); Add/Save/Delete disabled offline. Offline queue (`useOfflineSync`) remains defined-but-unwired (see backlog).
- §6 `/admin/users` linked in `layout.tsx` + `command-palette.tsx`.
- §7 ⌘K palette expanded to all 28 routes.
- §8 PWA PNG icons generated (ImageMagick) + iOS `apple-touch-icon.png`.
- §9 Dead code removed (`ui/sidebar.tsx`, `use-mobile.tsx`, duplicate `/vault/ocr` route, stray root GH-Pages artifacts).
- §11 Apple Passkey / Face ID unlock (`src/lib/webauthn.ts` + `pin-lock.tsx` + `settings.tsx`). Local device-bound; documented as NOT server-verified.

---

## Known Limitations / Backlog (not audit defects)

- **Production backend is a stateless in-memory mock.** Anything "saved" resets on cold start. This is by design (honest demo banner) — but if real persistence is ever wanted, deploy `artifacts/api-server` to Vercel/Fly + provision Postgres + `DATABASE_URL` + `pnpm db:push`, then delete `api/[[...path]].js`. §2 Option A.
- **Offline mutation queue (`useOfflineSync`) is defined but never called.** `enqueue()` has zero call sites. Currently the UI just disables buttons offline (§5 min-fix). Full wiring (queue → flush on reconnect) is a future feature, not a bug.
- **Encryption not wired into documents CRUD route** (audit "Security Remaining").
- **Rate limiter in-memory** (won't work across Vercel instances without Redis).
- **~165 pre-existing tsc type errors** (R3F v9 + React 19 `JSX.IntrinsicElements`, api-server routes). Build passes (esbuild handles JSX); type-only.
- **Tailwind v4.3.1 emits oklab/color-mix for ALL colors** — requires the post-build downleveler (`scripts/downlevel-colors.mjs`) chained into `pnpm build`. If you bypass `pnpm build` (e.g. raw `vite build`), the shipped CSS will contain oklab/color-mix and older mobile browsers will drop the colors. Do NOT remove the downleveler step from `package.json` `build` script.
- **Sidebar uses a hand-rolled `.fo-sidebar` media query** (not Tailwind `md:`), because `md:relative` leaked out of its wrapper in Tailwind v4.3.1 and overrode `fixed` on mobile. Keep `.fo-sidebar` in `index.css`; do not re-introduce `md:relative` on the sidebar.
- **1MB main chunk** warning on build — code-splitting opportunity, not a regression.

---

## Next Up (post-audit ideas, unprioritised)
- Wire real offline queue (enqueue + flushQueue on `isOnline` transition).
- Decide demo-vs-persistent product posture; if persistent, deploy `api-server` + Postgres.
- Upgrade Passkey to server-verified WebAuthn once a real backend exists.
- Bundle-size: manualChunks / lazy-load the 1MB index chunk.

---

## Verification Routine (keep this live)
- `pnpm --filter @workspace/family-office run build` → must exit 0.
- `vercel build` → must emit `.vercel/output` with no errors.
- Live: `curl -I https://family-office-blush.vercel.app/api/health` → 200; nested `/api/*` → 200; deep link `/vault` → 200 (not Vercel 404).
- Mobile gate (390×844): menu opens, no overlay trap, 0 console errors. **Plus:** `aside` computed `position` must be `fixed` (not `relative`) and `main` `top` must be `0` (regression check for the leaked-`md:relative` push-down bug). Built `dist/assets/*.css` must contain 0 `oklab`/`oklch`/`color-mix` (regression check for the color-downlevel step).
