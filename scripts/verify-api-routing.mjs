#!/usr/bin/env node
/**
 * Deploy guard — verifies the Vercel SPA rewrite does NOT swallow /api/*.
 *
 * Root cause of the 2026-07-13 live /api 404s: the rewrite regex
 * `((?!api/).*)` was anchored such that `/api/dashboard/summary` still
 * matched (the lookahead only failed when the path *began* with `api/` sans
 * leading slash). Vercel then served the SPA `index.html` for API calls.
 *
 * The correct idiom strips the leading slash and uses an anchored negative
 * lookahead: `^((?!api/).*)$`. This script fails CI / a pre-deploy check
 * if the configured source would once again match an /api/ path.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const targets = [
  resolve(root, "vercel.json"),
  resolve(root, "artifacts/family-office/vercel.json"),
];

// Paths that MUST NOT be rewritten to the SPA.
const mustReachApi = [
  "/api/dashboard/summary",
  "/api/ai/insights",
  "/api/snapshots/record",
  "/api/dashboard/cash-flow",
  "/api/dashboard/net-worth-history",
  "/api/transactions/recent",
  "/api/assets/by-category",
];

// Paths that SHOULD be rewritten to the SPA (non-api routes).
const mustRewrite = ["/", "/assets", "/dashboard", "/report/export-pdf"];

let failed = false;

for (const file of targets) {
  let json;
  try {
    json = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    console.error(`✗ cannot read ${file}: ${e.message}`);
    failed = true;
    continue;
  }
  const rewrites = json.rewrites ?? [];
  if (rewrites.length === 0) {
    console.error(`✗ ${file}: no rewrites defined`);
    failed = true;
    continue;
  }
  // Vercel strips the leading slash from `source` before testing.
  const sources = rewrites.map((r) => r.source.replace(/^\//, ""));
  const isApiSafe = (path) =>
    !sources.some((src) => new RegExp(src).test(path.replace(/^\//, "")));

  let fileOk = true;
  for (const p of mustReachApi) {
    if (!isApiSafe(p)) {
      console.error(`✗ ${file}: rewrite matches ${p} (would 404 in prod)`);
      fileOk = false;
    }
  }
  for (const p of mustRewrite) {
    if (isApiSafe(p)) {
      // A non-api route not matched by the rewrite means it 404s instead of
      // serving index.html. Acceptable only if there's another rewrite; here
      // we just warn.
      console.warn(`⚠ ${file}: ${p} not matched by rewrite (SPA fallback may miss it)`);
    }
  }
  if (fileOk) {
    console.log(`✓ ${file}: /api/* correctly excluded from SPA rewrite`);
  } else {
    failed = true;
  }
}

if (failed) {
  console.error("\nDeploy guard FAILED — fix vercel.json rewrite before deploying.");
  process.exit(1);
}
console.log("\nDeploy guard passed.");
