---
name: Document RAG
description: Keyword-based document retrieval for AI context — no vector DB needed
---

## Approach
Not vector embeddings — simple keyword matching on `ocrText` column in documents table.

## How it works (in ai.ts local branch)
1. Split query into words > 3 chars
2. For each document with ocrText, check if any query word appears in the lowercased ocrText
3. Take up to 3 matching documents
4. Inject as `RAG — MATCHED DOCUMENT CONTENT` section in the local LLM system prompt (up to 1500 chars per doc)

## User input
Vault page (`artifacts/family-office/src/pages/vault.tsx`) — dialog form has a "Document Content" textarea that saves to `ocrText` column. Users paste extracted text, key clauses, or OCR output here.

**Why:** Vector embeddings require an embedding model (additional infrastructure). Keyword RAG works well for structured financial documents where key terms (property address, trust name, ABN, dates) are searchable. Can be upgraded to vector RAG later without changing the UX.
