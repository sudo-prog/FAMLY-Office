// Vite plugin: serves /api/* from the Vercel serverless handler during
// `vite dev` and `vite preview` so the SPA has a real backend locally.
// The handler file uses a bracketed name that Node can't import by path, so
// we load it via vm (same approach as scripts/api-dev-server.mjs).
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { readFileSync } from "node:fs";
import vm from "node:vm";

export function apiMiddlewarePlugin() {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const handlerPath = resolve(__dirname, "api/[[...path]].js");

  let handler = null;
  function loadHandler() {
    if (handler) return handler;
    let src = readFileSync(handlerPath, "utf8");
    src = src.replace(/export\s+default\s+/, "module.exports = ");
    const sandbox = {
      module: { exports: {} },
      console,
      setTimeout,
      URL,
      Date,
      JSON,
      Math,
      process: { env: process.env },
    };
    vm.createContext(sandbox);
    vm.runInContext(src + "\nthis.__h = module.exports;", sandbox);
    handler = sandbox.__h;
    return handler;
  }

  // Vercel-compatible response adapter for Connect/Node's ServerResponse.
  function makeVercelRes(res) {
    let statusCode = 200;
    const headers = {};
    const chunks = [];
    const vres = {
      status(c) { statusCode = c; return vres; },
      setHeader(k, v) { headers[String(k).toLowerCase()] = v; return vres; },
      getHeader(k) { return headers[String(k).toLowerCase()]; },
      json(body) {
        if (!headers["content-type"]) headers["content-type"] = "application/json";
        const out = JSON.stringify(body);
        res.statusCode = statusCode;
        for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
        res.end(out);
        return vres;
      },
      write(c) { chunks.push(typeof c === "string" ? c : Buffer.from(c)); return true; },
      end(c) {
        if (c != null) chunks.push(typeof c === "string" ? c : Buffer.from(c));
        res.statusCode = statusCode;
        for (const [k, v] of Object.entries(headers)) res.setHeader(k, v);
        res.end(Buffer.concat(chunks.map((x) => (Buffer.isBuffer(x) ? x : Buffer.from(x)))));
        return vres;
      },
    };
    return vres;
  }

  async function dispatch(req, res, next) {
    if (!req.url || !req.url.startsWith("/api/")) return next();
    const h = loadHandler();
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", async () => {
      let body = null;
      if (chunks.length) {
        const raw = Buffer.concat(chunks).toString("utf8");
        try { body = raw ? JSON.parse(raw) : {}; } catch { body = {}; }
      }
      try {
        await h({ url: req.url, method: req.method, headers: req.headers, body }, makeVercelRes(res));
      } catch (e) {
        res.statusCode = 500;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: String(e?.message || e) }));
      }
    });
  }

  return {
    name: "family-office-api-middleware",
    configureServer(server) {
      server.middlewares.use((req, res, next) => dispatch(req, res, next));
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => dispatch(req, res, next));
    },
  };
}
