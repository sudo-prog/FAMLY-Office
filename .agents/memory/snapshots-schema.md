---
name: Net Worth Snapshots
description: Daily wealth_snapshots table for real historical sparkline data
---

## Schema
Table: `wealth_snapshots`
Columns: id (serial PK), value (numeric 20,2), currency (text, default AUD), asset_count (integer), snapshot_date (text YYYY-MM-DD), created_at (timestamp)

File: `lib/db/src/schema/snapshots.ts` — exported from `lib/db/src/schema/index.ts`

## API Endpoints
- `GET /api/snapshots` — returns last 365 snapshots ordered by date, as `{ month, value, assetCount }[]`
- `POST /api/snapshots/record` — idempotent, records today's snapshot if none exists for that date; computes total from assets table

## Frontend Usage
Dashboard auto-records on mount via `useEffect`. Uses `snapHistory.length >= 2 ? snapHistory : (history ?? [])` in NetWorthWidget — falls back to synthetic history until enough real data accumulates.

**Why:** The dashboard previously showed synthetic/fake sparkline data. Real historical snapshots accumulate one per day automatically from the moment the user first visits.
