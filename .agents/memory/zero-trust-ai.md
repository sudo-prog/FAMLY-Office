---
name: Zero-Trust AI Architecture
description: How the Family Office AI routing works — local vs cloud, signal classifier, fail-secure policy
---

## Rule
All sensitive financial data stays on the local LLM. Cloud AI receives only sanitized, non-sensitive research queries.

## Implementation
- Route: `artifacts/api-server/src/routes/ai.ts`
- Classifier: counts 20+ "sensitive signals" (my portfolio, my assets, capital gain, trust, entity names, etc.)
- Research signals: market analysis, economic outlook, regulatory, etc.
- Decision: if sensitiveSignals >= 2 → local. If researching AND sensitiveSignals < 2 → cloud. Default → local.

## Env vars / secrets
- `LOCAL_LLM_URL` — Ollama endpoint (default: http://localhost:11434/v1)
- `LOCAL_LLM_MODEL` — model name (default: llama3.2)
- `CLOUD_AI_KEY` — OpenAI API key (or custom provider)
- `CLOUD_AI_MODEL` — model name (default: gpt-4o-mini)
- `CLOUD_AI_URL` — optional custom OpenAI-compatible base URL

## Fail-secure
If local LLM is offline, the route returns a 503 with clear error. It never silently falls back to cloud for sensitive queries.

**Why:** Private wealth data must never leave user infrastructure. Even sanitized data leaks metadata. The classifier errs on the side of local.

**How to apply:** Any new AI feature that touches portfolio/entity/transaction/document data must use `mode: "local"` or the auto-classifier. Never bypass to cloud for financial context.
