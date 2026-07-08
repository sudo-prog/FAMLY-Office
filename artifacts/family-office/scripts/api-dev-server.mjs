// Local dev API server — wraps api/[[...path]].js handler so vite can proxy /api to it.
// Copies the bracketed Vercel handler to a temp .mjs (Node can't import() bracketed names)
// and provides a Vercel-compatible res shim (res.status().json() etc).
// Run: node scripts/api-dev-server.mjs  (PORT env or 4001)
import { createServer } from "node:http";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync, writeFileSync, mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const handlerPath = resolve(root, "api/[[...path]].js");

const tmp = mkdtempSync(join(tmpdir(), "fo-api-"));
const tmpHandler = join(tmp, "handler.mjs");
writeFileSync(tmpHandler, readFileSync(handlerPath, "utf8"));

const { default: handler } = await import(pathToFileURL(tmpHandler).href);
const PORT = Number(process.env.PORT || 4001);

// Vercel-compatible response shim.
function makeRes(nodeRes) {
  let statusCode = 200;
  const headers = {};
  const shim = {
    status(code) { statusCode = code; return shim; },
    setHeader(k, v) { headers[k] = v; return shim; },
    getHeader(k) { return headers[k]; },
    json(body) {
      nodeRes.statusCode = statusCode;
      for (const [k, v] of Object.entries(headers)) nodeRes.setHeader(k, v);
      if (!nodeRes.getHeader("Content-Type")) nodeRes.setHeader("Content-Type", "application/json");
      nodeRes.end(JSON.stringify(body));
      return shim;
    },
    send(body) {
      nodeRes.statusCode = statusCode;
      for (const [k, v] of Object.entries(headers)) nodeRes.setHeader(k, v);
      nodeRes.end(typeof body === "string" ? body : JSON.stringify(body));
      return shim;
    },
    end(body) {
      nodeRes.statusCode = statusCode;
      for (const [k, v] of Object.entries(headers)) nodeRes.setHeader(k, v);
      nodeRes.end(body);
      return shim;
    },
    write(chunk) { nodeRes.write(chunk); return shim; },
  };
  return shim;
}

const server = createServer(async (req, res) => {
  try {
    let body = null;
    if (req.method === "POST" || req.method === "PATCH") {
      const chunks = [];
      for await (const c of req) chunks.push(c);
      const raw = Buffer.concat(chunks).toString("utf8");
      try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
    }
    const wrappedReq = { url: req.url, method: req.method, headers: req.headers, body };
    const shim = makeRes(res);
    await handler(wrappedReq, shim);
  } catch (e) {
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: String(e?.message || e) }));
  }
});

server.listen(PORT, () => console.log(`[api-dev] listening on http://localhost:${PORT}`));
