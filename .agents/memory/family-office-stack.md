---
name: Family Office Stack
description: Architecture and artifact layout for the Family Office PWA project.
---

# Family Office Stack

## Artifacts
- `artifacts/family-office` — React/Vite PWA, previewPath `/`, port from $PORT
- `artifacts/api-server` — Express API, port 8080, all CRUD routes + purge
- `artifacts/family-office-pitch` — Slide deck, previewPath `/family-office-pitch/`
- Video — deferred, not started

## DB Tables
`assetsTable`, `transactionsTable`, `documentsTable`, `entitiesTable` — all use snake_case columns.

## Key conventions
- Route ordering: `/assets/by-category` BEFORE `/:id`
- API base URL: `/api/` prefix
- Purge endpoint: `DELETE /api/system/purge` — truncates all 4 tables
- FX utility: `src/lib/currency.ts`
- PIN auth: `src/components/pin-lock.tsx`, stored in `localStorage['fo-pin']`
- PWA: `public/manifest.webmanifest` + `public/sw.js` + meta tags in `index.html`

**Why:** User wants sovereign, local-first, no cloud exposure. PIN + local storage is intentional.
