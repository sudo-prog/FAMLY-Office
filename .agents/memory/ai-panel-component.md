---
name: Shared AIPanel Component
description: Reusable slide-in AI chat panel used across multiple pages
---

## Location
`artifacts/family-office/src/components/ai-panel.tsx`

## Props
- `open: boolean` — controls visibility
- `onClose: () => void`
- `title: string` — shown in panel header
- `suggestions: string[]` — pre-built query chips shown when chat is empty
- `mode?: "auto" | "local" | "cloud"` — default "local"

## Usage
Used on:
- Assets page (`/assets`) — "Portfolio Analysis" with concentration/rebalancing prompts
- Transactions page (`/transactions`) — "Transaction Insights" with spending pattern prompts  
- Projections page (`/projections`) — "Projections Analysis" with growth rate review prompts

## Behavior
- Renders as fixed right-side drawer (440px wide) with backdrop overlay
- Streams SSE from `POST /api/ai/chat`
- Shows routing badge (🔒 Local or ☁️ Cloud) with model name on each AI response
- Clears messages when closed (re-opens fresh)

**Why:** Avoids duplicating streaming chat logic across every page. Single component to maintain for SSE parsing, error handling, and routing badge display.
