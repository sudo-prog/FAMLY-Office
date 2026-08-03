# FAMLY-Office Mobile UI Visual Audit — 2026-08-03

## Audit Methodology
- **Standard**: mobile-ui-standards-bible + impeccable.style audit framework
- **Viewport**: 390×844 (iPhone 14 Pro, notched)
- **Tool**: Code-level audit + screenshot verification per page
- **Severity**: P0=Blocking, P1=Major, P2=Minor, P3=Polish

---

## CRITICAL: Shared Component Issues (affect ALL/most pages)

### ISSUE-001: AI Summary Panel Broken (P0)
- **Component**: `src/components/ai-panel.tsx`
- **Impact**: AI chat panel shows "Ask AI Anything" with prompt suggestions instead of a clean chat interface. User wants ONLY the chat box (input + send button), not the AI button/suggestions overlay.
- **Fix**: Remove the suggestions/prompt overlay when messages.length===0. Show only the input field and send button. Remove the "Replay Tour" / suggestion buttons.
- **Affected pages**: ALL pages that use `<AIPanel>` (vault, dashboard, assets, transactions, etc.)

### ISSUE-002: X Button Misaligned (P0)
- **Component**: Multiple pages use a close/dismiss button with `<X>` icon
- **Impact**: The X button appears off-center inside its square box container across many pages
- **Root cause**: Likely inconsistent button sizing or missing flex centering on the X button wrapper
- **Affected pages**: vault.tsx, tax-report.tsx, asset-prices.tsx, and potentially others with dialog/sheet close buttons

### ISSUE-003: Button/Text Alignment Missing Wrappers (P1)
- **Impact**: Dropdowns, buttons, and text labels are not properly aligned — need flex wrappers
- **Affected pages**: tax-report.tsx (FY selector + CSV button), asset-prices.tsx (Fetch All button)

---

## Page-Specific Issues

### ISSUE-004: Document Vault — Generic Folder Icons (P0)
- **File**: `src/pages/vault.tsx`
- **Current**: All documents show generic green folder icons
- **Expected**: Document-type-specific thumbnail icons (PDF red, XML blue, text gray, folder yellow, etc.)
- **Fix**: Create a `getDocIcon(type)` helper that returns the appropriate Lucide icon based on file type. Map: pdf→FileText (red), contract→FileCheck (blue), tax→Receipt (green), insurance→Shield (purple), statement→FileBarChart (teal), deed→ScrollText (amber), certificate→Award (emerald), folder→Folder (yellow)

### ISSUE-005: Tax Report — Button/Text Alignment (P1)
- **File**: `src/pages/tax-report.tsx`
- **Current**: FY dropdown and CSV export button are misaligned
- **Fix**: Wrap FY selector + CSV button in a flex container with `items-center gap-2`

### ISSUE-006: Asset Prices — X Button Misaligned (P1)
- **File**: `src/pages/asset-prices.tsx`
- **Current**: Close button on Market Price Refresh dialog is off-center
- **Fix**: Ensure X button wrapper uses flex centering

---

## Full Page Audit Checklist (29 pages)

| # | Page | File | Status | Issues |
|---|------|------|--------|--------|
| 1 | Dashboard | dashboard.tsx | AUDIT | AI panel, X buttons |
| 2 | Assets | assets.tsx | AUDIT | AI panel, X buttons |
| 3 | Transactions | transactions.tsx | AUDIT | AI panel, tables |
| 4 | Document Vault | vault.tsx | ISSUE-004 | Generic icons → type-specific |
| 5 | Tax Report | tax-report.tsx | ISSUE-005 | Button alignment |
| 6 | Asset Prices | asset-prices.tsx | ISSUE-006 | X button alignment |
| 7 | Bank Feed | bank-feed.tsx | AUDIT | |
| 8 | Cash Flow | cash-flow.tsx | AUDIT | Charts |
| 9 | Entities | entities.tsx | AUDIT | |
| 10 | Entity Detail | entity-detail.tsx | AUDIT | |
| 11 | Entity Tax | entity-tax.tsx | AUDIT | |
| 12 | Estate | estate.tsx | AUDIT | |
| 13 | Crypto | crypto.tsx | AUDIT | |
| 14 | Watchlist | watchlist.tsx | AUDIT | |
| 15 | Research | research.tsx | AUDIT | |
| 16 | Projections | projections.tsx | AUDIT | Charts |
| 17 | Benchmarks | benchmarks.tsx | AUDIT | |
| 18 | Targets | targets.tsx | AUDIT | |
| 19 | Notifications | notifications.tsx | AUDIT | |
| 20 | Audit Log | audit-log.tsx | AUDIT | Tables |
| 21 | OCR | ocr.tsx | AUDIT | |
| 22 | Home Office | home-office.tsx | AUDIT | |
| 23 | Property | property.tsx | AUDIT | |
| 24 | Report | report.tsx | AUDIT | |
| 25 | Export PDF | export-pdf.tsx | AUDIT | |
| 26 | Settings | settings.tsx | AUDIT | |
| 27 | Admin Users | admin-users.tsx | AUDIT | Tables |
| 28 | White Label | white-label.tsx | AUDIT | |
| 29 | Not Found | not-found.tsx | AUDIT | |

---

## Agent Dispatch Plan

### Wave 1: Shared Component Fixes (HIGH PRIORITY)
- **Agent 1**: Fix ai-panel.tsx — remove suggestions overlay, clean chat box only
- **Agent 2**: Fix X button alignment across all pages (global CSS or component fix)
- **Agent 3**: Fix vault.tsx — document-type-specific icons

### Wave 2: Page-Specific Fixes
- **Agent 4**: tax-report.tsx — button/text alignment wrappers
- **Agent 5**: asset-prices.tsx — X button alignment + layout
- **Agent 6**: dashboard.tsx — visual audit + fixes

### Wave 3: Remaining Pages (batched)
- **Agent 7-9**: Pages 7-15 (bank-feed through watchlist)
- **Agent 10-12**: Pages 16-24 (research through report)
- **Agent 13-14**: Pages 25-29 (export-pdf through not-found)

### Wave 4: Final Verification
- Deploy to Vercel
- Visual verification of ALL pages via Playwright harness
- Screenshot each page at 390×844
