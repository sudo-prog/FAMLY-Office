// Family Office Wealth OS — Vercel serverless catch-all API.
// In-memory seed data, NO database. Returns JSON for every /api/* route.
// Handles GET (list + by id), POST (create), PATCH (update), DELETE.
// SSE streaming endpoints (research/query, research/github, research/component,
// business-plan, grants, grant-proposal, ai/chat) are supported via text/event-stream.

const iso = (d = new Date()) => new Date(d).toISOString();
const nowIso = iso();

// ─── In-memory stores (module-level: per cold start) ──────────────────────────
const stores = {
  assets: [
    { id: 1, name: "Macquarie Cash Management", category: "bank_account", subcategory: "Savings", value: 245000, currency: "AUD", notes: "Operating account", institution: "Macquarie Bank", entityId: 1, lastUpdated: nowIso, createdAt: nowIso },
    { id: 2, name: "Point Piper Residence", category: "property", subcategory: "Principal home", value: 18500000, currency: "AUD", notes: "Main residence", entityId: 2, lastUpdated: nowIso, createdAt: nowIso },
    { id: 3, name: "Vanguard Diversified ETF", category: "investment", subcategory: "ETF", value: 3250000, currency: "AUD", notes: "Core portfolio", institution: "Vanguard", entityId: 1, lastUpdated: nowIso, createdAt: nowIso },
    { id: 4, name: "Self-Managed Super Fund", category: "superannuation", subcategory: "SMSF", value: 4100000, currency: "AUD", notes: "Retirement", institution: "AustralianSuper", entityId: 3, lastUpdated: nowIso, createdAt: nowIso },
    { id: 5, name: "Bitcoin Holdings", category: "crypto", subcategory: "BTC", value: 980000, currency: "AUD", notes: "Cold storage", entityId: 1, lastUpdated: nowIso, createdAt: nowIso },
    { id: 6, name: "Family Trust — Units", category: "trust", subcategory: "Discretionary", value: 6200000, currency: "AUD", notes: "Discretionary trust", entityId: 4, lastUpdated: nowIso, createdAt: nowIso },
    { id: 7, name: "Private Co — Equity", category: "business", subcategory: "Shares", value: 5400000, currency: "AUD", notes: "HoldCo equity", entityId: 5, lastUpdated: nowIso, createdAt: nowIso },
    { id: 8, name: "Life Insurance Policy", category: "insurance", subcategory: "Term", value: 2000000, currency: "AUD", notes: "Cover", entityId: 2, lastUpdated: nowIso, createdAt: nowIso },
  ],
  transactions: [
    { id: 1, description: "Director Salary", amount: 28000, type: "income", category: "Salary", subcategory: "Director", date: "2026-06-01", notes: "Monthly", assetId: 1, entityId: 1, taxDeductible: false, taxTag: null, tags: "salary", createdAt: nowIso },
    { id: 2, description: "Mortgage Repayment", amount: -14500, type: "expense", category: "Housing", subcategory: "Mortgage", date: "2026-06-02", notes: "PPOR", assetId: 2, entityId: 2, taxDeductible: false, taxTag: null, tags: "mortgage", createdAt: nowIso },
    { id: 3, description: "Dividend — Vanguard", amount: 8200, type: "income", category: "Investment", subcategory: "Dividend", date: "2026-06-05", notes: "Franked", assetId: 3, entityId: 1, taxDeductible: false, taxTag: null, tags: "dividend", createdAt: nowIso },
    { id: 4, description: "SMSF Admin Fee", amount: -650, type: "expense", category: "Fees", subcategory: "Admin", date: "2026-06-08", notes: "Annual", assetId: 4, entityId: 3, taxDeductible: true, taxTag: "smsf", tags: "fee", createdAt: nowIso },
    { id: 5, description: "Transfer to Investment", amount: -50000, type: "transfer", category: "Internal", subcategory: "Rebalance", date: "2026-06-12", notes: "Rebalance", assetId: 1, entityId: 1, taxDeductible: false, taxTag: null, tags: "rebalance", createdAt: nowIso },
    { id: 6, description: "Rental Income", amount: 4200, type: "income", category: "Property", subcategory: "Rent", date: "2026-06-15", notes: "Investment unit", assetId: 2, entityId: 2, taxDeductible: false, taxTag: null, tags: "rent", createdAt: nowIso },
    { id: 7, description: "Legal Fees — Trust", amount: -3200, type: "expense", category: "Legal", subcategory: "Advice", date: "2026-06-18", notes: "Trust review", assetId: 6, entityId: 4, taxDeductible: true, taxTag: "legal", tags: "legal", createdAt: nowIso },
    { id: 8, description: "Business Revenue", amount: 96000, type: "income", category: "Business", subcategory: "Sales", date: "2026-06-20", notes: "Q2", assetId: 7, entityId: 5, taxDeductible: false, taxTag: null, tags: "revenue", createdAt: nowIso },
  ],
  documents: [
    { id: 1, title: "2025 Tax Return — Consolidated", description: "Lodged individual + entity returns", fileType: "tax", tags: "tax,2025", entityId: 1, year: 2025, ocrText: "Taxable income 312000...", extractedData: null, encrypted: true, folder: "Tax", createdAt: nowIso, updatedAt: nowIso },
    { id: 2, title: "Property Title — Point Piper", description: "Certificate of title", fileType: "contract", tags: "property", entityId: 2, year: 2024, ocrText: null, extractedData: null, encrypted: true, folder: "Property", createdAt: nowIso, updatedAt: nowIso },
    { id: 3, title: "SMSF Financial Statements", description: "Annual SMSF accounts", fileType: "pdf", tags: "smsf", entityId: 3, year: 2025, ocrText: null, extractedData: null, encrypted: false, folder: "Super", createdAt: nowIso, updatedAt: nowIso },
    { id: 4, title: "Insurance Policy Schedule", description: "Life cover schedule", fileType: "insurance", tags: "insurance", entityId: 2, year: 2026, ocrText: null, extractedData: null, encrypted: false, folder: "Insurance", createdAt: nowIso, updatedAt: nowIso },
    { id: 5, title: "Trust Deed", description: "Discretionary trust deed", fileType: "contract", tags: "trust", entityId: 4, year: 2020, ocrText: null, extractedData: null, encrypted: true, folder: "Trust", createdAt: nowIso, updatedAt: nowIso },
  ],
  entities: [
    { id: 1, name: "John A. Family Group", type: "individual", abn: "12345678901", acn: null, tfn: null, jurisdiction: "NSW", notes: "Primary individual", createdAt: nowIso },
    { id: 2, name: "Point Piper Holdings Pty Ltd", type: "company", abn: "21987654321", acn: "876543210", tfn: null, jurisdiction: "NSW", notes: "Property holding", createdAt: nowIso },
    { id: 3, name: "Apex Superannuation Fund", type: "smsf", abn: "55443322110", acn: null, tfn: null, jurisdiction: "NSW", notes: "Self managed", createdAt: nowIso },
    { id: 4, name: "Heritage Family Trust", type: "trust", abn: "66778899001", acn: null, tfn: null, jurisdiction: "NSW", notes: "Discretionary", createdAt: nowIso },
    { id: 5, name: "Meridian Operations Pty Ltd", type: "company", abn: "11223344556", acn: "233445566", tfn: null, jurisdiction: "VIC", notes: "Operating company", createdAt: nowIso },
  ],
  snapshots: [
    { id: 1, month: "2026-01", value: 41200000, createdAt: nowIso },
    { id: 2, month: "2026-02", value: 41850000, createdAt: nowIso },
    { id: 3, month: "2026-03", value: 42100000, createdAt: nowIso },
    { id: 4, month: "2026-04", value: 42750000, createdAt: nowIso },
    { id: 5, month: "2026-05", value: 43000000, createdAt: nowIso },
    { id: 6, month: "2026-06", value: 43500000, createdAt: nowIso },
  ],
  watchlist: [
    { id: 1, symbol: "AAPL", name: "Apple Inc.", type: "equity", exchange: "NASDAQ", price: "229.87", change: "1.23", changePercent: "0.54", currency: "USD", notes: "", aiSummary: "Strong services revenue; resilient margins.", alertHigh: "240", alertLow: "200", isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { id: 2, symbol: "BTC", name: "Bitcoin", type: "crypto", exchange: "", price: "96000", change: "2100", changePercent: "2.23", currency: "USD", notes: "", aiSummary: "Halving-cycle momentum; monitor ETF flows.", alertHigh: "110000", alertLow: "80000", isActive: true, createdAt: nowIso, updatedAt: nowIso },
    { id: 3, symbol: "CBA.AX", name: "Commonwealth Bank", type: "equity", exchange: "ASX", price: "128.45", change: "-0.55", changePercent: "-0.43", currency: "AUD", notes: "", aiSummary: "Premium valuation; solid dividend yield.", alertHigh: "135", alertLow: "115", isActive: false, createdAt: nowIso, updatedAt: nowIso },
  ],
  notifications: [
    { id: 1, userId: 1, type: "insight", title: "Portfolio concentration", message: "Property represents 42% of net worth. Consider diversification.", read: false, createdAt: nowIso },
    { id: 2, userId: 1, type: "warning", title: "Tax deadline approaching", message: "Q4 BAS is due in 14 days.", read: false, createdAt: nowIso },
    { id: 3, userId: 1, type: "info", title: "Document encrypted", message: "Trust Deed was encrypted at rest.", read: true, createdAt: nowIso },
    { id: 4, userId: 1, type: "alert", title: "Large transaction", message: "Transfer of A$50,000 flagged for review.", read: false, createdAt: nowIso },
  ],
  users: [
    { id: 1, email: "principal@familyoffice.com", name: "John A. Principal", role: "admin", createdAt: nowIso },
    { id: 2, email: "member@familyoffice.com", name: "Sarah A. Member", role: "member", createdAt: nowIso },
    { id: 3, email: "viewer@familyoffice.com", name: "Alex Viewer", role: "viewer", createdAt: nowIso },
  ],
  auditLogs: [
    { id: 1, userId: 1, action: "CREATE", entityType: "Asset", entityId: 5, oldValues: null, newValues: { name: "Bitcoin Holdings", value: 980000 }, timestamp: nowIso },
    { id: 2, userId: 1, action: "UPDATE", entityType: "Transaction", entityId: 4, oldValues: { amount: -600 }, newValues: { amount: -650 }, timestamp: nowIso },
    { id: 3, userId: 1, action: "CREATE", entityType: "Entity", entityId: 5, oldValues: null, newValues: { name: "Meridian Operations Pty Ltd" }, timestamp: nowIso },
    { id: 4, userId: 1, action: "DELETE", entityType: "Document", entityId: 9, oldValues: { title: "Old scan" }, newValues: null, timestamp: nowIso },
    { id: 5, userId: 2, action: "UPDATE", entityType: "Asset", entityId: 3, oldValues: { value: 3100000 }, newValues: { value: 3250000 }, timestamp: nowIso },
  ],
  bankImported: [
    { id: 1, description: "Salary Deposit", amount: 28000, type: "income", category: "Salary", date: "2026-06-01" },
    { id: 2, description: "Rent Payment", amount: -1800, type: "expense", category: "Housing", date: "2026-06-02" },
    { id: 3, description: "Grocery Store", amount: -125.5, type: "expense", category: "Living", date: "2026-06-03" },
  ],
  businessClients: [
    { id: 1, name: "Acme Group", email: "ap@acme.com", phone: "0290000000", company: "Acme Group Pty Ltd", abn: "11002200330", address: "1 George St, Sydney", notes: "Key account", outstanding: 24000, totalBilled: 120000, invoiceCount: 8 },
    { id: 2, name: "Beta Logistics", email: "bills@beta.com", phone: "0390000000", company: "Beta Logistics Pty Ltd", abn: "22003300440", address: "5 Collins St, Melbourne", notes: "", outstanding: 8000, totalBilled: 45000, invoiceCount: 4 },
  ],
  businessInvoices: [
    { id: 1, invoiceNumber: "INV-2026-001", clientId: 1, clientName: "Acme Group", clientEmail: "ap@acme.com", clientAddress: "1 George St, Sydney", status: "paid", issueDate: "2026-05-01", dueDate: "2026-05-31", notes: "Q2 services", businessName: "Meridian Operations", businessAbn: "11223344556", subtotal: 10000, taxRate: 0.1, taxAmount: 1000, total: 11000, currency: "AUD", paid: true, paidDate: "2026-05-28", items: [{ id: 1, description: "Advisory", quantity: 10, unitPrice: 1000, amount: 10000 }] },
    { id: 2, invoiceNumber: "INV-2026-002", clientId: 2, clientName: "Beta Logistics", clientEmail: "bills@beta.com", clientAddress: "5 Collins St, Melbourne", status: "sent", issueDate: "2026-06-01", dueDate: "2026-07-01", notes: "", businessName: "Meridian Operations", businessAbn: "11223344556", subtotal: 5000, taxRate: 0.1, taxAmount: 500, total: 5500, currency: "AUD", paid: false, items: [{ id: 2, description: "Logistics consulting", quantity: 5, unitPrice: 1000, amount: 5000 }] },
  ],
  businessExpenses: [
    { id: 1, date: "2026-06-02", description: "Office rent", category: "Rent", amount: 3500, currency: "AUD", taxDeductible: true, gstIncluded: true, supplier: "WeWork", notes: "" },
    { id: 2, date: "2026-06-10", description: "Cloud hosting", category: "Software", amount: 420, currency: "AUD", taxDeductible: true, gstIncluded: true, supplier: "AWS", notes: "" },
  ],
  timeEntries: [
    { id: 1, date: "2026-06-03", clientId: 1, clientName: "Acme Group", projectName: "Q2 Advisory", description: "Strategy workshop", hours: 6, hourlyRate: 220, billable: true, invoiced: true },
    { id: 2, date: "2026-06-09", clientId: 2, clientName: "Beta Logistics", projectName: "Ops review", description: "Process mapping", hours: 4, hourlyRate: 200, billable: true, invoiced: false },
  ],
  researchReports: [
    { id: 1, title: "ASX Lithium Sector Outlook", query: "ASX lithium outlook", depth: "standard", report: "The ASX lithium sector has corrected sharply on oversupply concerns...", summary: "Lithium oversupply compressing margins; selectives preferred.", sources: [{ title: "ASX announcement", url: "https://www.asx.com.au", snippet: "Quarterly production update" }], portfolioIncluded: true, webSearched: true, createdAt: nowIso },
  ],
  components: [
    { id: 1, name: "NetWorthCard", description: "Displays total net worth with sparkline", code: "export function NetWorthCard() { return <div>Net Worth</div>; }", createdAt: nowIso },
  ],
  ocrJobs: [
    { id: "ocr-1", fileName: "invoice_q4_2024.pdf", status: "completed", extractedText: "Invoice #INV-2024-001\nDate: 2024-12-15\nAmount: $12,450.00\nVendor: Acme Corp", confidence: 0.96, createdAt: nowIso, completedAt: nowIso },
  ],
};

let _seq = 1000;
const nextId = () => ++_seq;

const send = (res, code, body) => res.status(code).json(body);
const ok = (res, body) => send(res, 200, body);
const created = (res, body) => send(res, 201, body);
const noContent = (res) => res.status(204).end();
const bad = (res, msg) => send(res, 400, { error: msg });
const notFound = (res, msg = "Not found") => send(res, 404, { error: msg });

// ─── Helpers ──────────────────────────────────────────────────────────────────
const jsonBody = (req) => {
  try {
    if (req.body && typeof req.body === "object") return req.body;
    if (typeof req.body === "string" && req.body.trim()) return JSON.parse(req.body);
    if (Buffer.isBuffer(req.body) && req.body.length) return JSON.parse(req.body.toString("utf8"));
    return {};
  } catch {
    return {};
  }
};

const collection = (res, key, items) => ok(res, items ?? stores[key]);

function getById(key, id) {
  return stores[key].find((x) => String(x.id) === String(id));
}
function removeById(key, id) {
  const i = stores[key].findIndex((x) => String(x.id) === String(id));
  if (i >= 0) stores[key].splice(i, 1);
  return i >= 0;
}

// Generic CRUD for /api/<key> and /api/<key>/:id
function crud(key, { extraFields = {}, idField = "id" } = {}) {
  return {
    list: (req, res) => collection(res, key),
    create: (req, res) => {
      const body = jsonBody(req);
      const item = { ...extraFields, ...body, [idField]: nextId(), createdAt: iso() };
      stores[key].unshift(item);
      created(res, item);
    },
    get: (req, res, id) => {
      const item = getById(key, id);
      if (!item) return notFound(res);
      ok(res, item);
    },
    update: (req, res, id) => {
      const item = getById(key, id);
      if (!item) return notFound(res);
      Object.assign(item, jsonBody(req), { [idField]: item[idField], updatedAt: iso() });
      ok(res, item);
    },
    del: (req, res, id) => {
      if (!removeById(key, id)) return notFound(res);
      noContent(res);
    },
  };
}

// ─── Research SSE ──────────────────────────────────────────────────────────────
function streamSSE(res, events) {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  let i = 0;
  const flush = () => {
    if (i >= events.length) { res.end(); return; }
    res.write(`data: ${JSON.stringify(events[i++])}\n\n`);
    setTimeout(flush, 30);
  };
  flush();
}

// ─── Router ────────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  try {
    const url = new URL(req.url, "http://localhost");
    const raw = url.pathname.replace(/^\/+/, "").replace(/\/+$/, ""); // e.g. "api/dashboard/summary" or "dashboard/summary"
    const parts = raw.split("/").filter(Boolean);
    // strip leading "api" if present
    const p = parts[0] === "api" ? parts.slice(1) : parts;
    const seg = p.join("/"); // e.g. "dashboard/summary"
    const method = (req.method || "GET").toUpperCase();
    const q = url.searchParams;

    // ── Health ──────────────────────────────────────────────
    if (seg === "healthz" || seg === "health") {
      return ok(res, { status: "ok", app: "family-office" });
    }

    // ── Dashboard ───────────────────────────────────────────
    if (seg === "dashboard/summary") {
      const totalAssets = stores.assets.reduce((s, a) => s + a.value, 0);
      const totalLiabilities = 24000000;
      const totalNetWorth = totalAssets - totalLiabilities;
      const totalIncome = stores.transactions.filter((t) => t.type === "income").reduce((s, t) => s + Math.abs(t.amount), 0);
      const totalExpenses = stores.transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(t.amount), 0);
      const taxDeductibleYTD = stores.transactions.filter((t) => t.taxDeductible).reduce((s, t) => s + Math.abs(t.amount), 0);
      const byCat = {};
      for (const a of stores.assets) byCat[a.category] = (byCat[a.category] || 0) + a.value;
      const topAssetCategories = Object.entries(byCat)
        .map(([category, total]) => ({ category, total, count: stores.assets.filter((a) => a.category === category).length }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5);
      return ok(res, {
        totalNetWorth, totalAssets, totalLiabilities, totalIncome, totalExpenses,
        taxDeductibleYTD, assetCount: stores.assets.length, documentCount: stores.documents.length,
        entityCount: stores.entities.length, topAssetCategories,
      });
    }
    if (seg === "dashboard/net-worth-history") {
      return ok(res, stores.snapshots.map((s) => ({ month: s.month, value: s.value })));
    }
    if (seg === "dashboard/cash-flow") {
      const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06"];
      const data = months.map((m, i) => ({ month: m, income: 90000 + i * 4000, expenses: 52000 + i * 1500 }));
      return ok(res, data);
    }

    // ── Assets ──────────────────────────────────────────────
    if (seg === "assets" || seg.startsWith("assets/")) {
      const c = crud("assets");
      if (seg === "assets") {
        if (method === "GET") {
          let list = stores.assets;
          const cat = q.get("category");
          const eid = q.get("entityId");
          if (cat) list = list.filter((a) => a.category === cat);
          if (eid && eid !== "null") list = list.filter((a) => String(a.entityId) === eid);
          return ok(res, list);
        }
        if (method === "POST") return c.create(req, res);
        return bad(res, "Method not allowed");
      }
      if (seg === "assets/by-category") {
        const byCat = {};
        for (const a of stores.assets) byCat[a.category] = (byCat[a.category] || 0) + a.value;
        return ok(res, Object.entries(byCat).map(([category, total]) => ({ category, total, count: stores.assets.filter((a) => a.category === category).length })));
      }
      const id = seg.split("/")[1];
      if (method === "GET") return c.get(req, res, id);
      if (method === "PATCH") return c.update(req, res, id);
      if (method === "DELETE") return c.del(req, res, id);
      return bad(res, "Method not allowed");
    }

    // ── Transactions ────────────────────────────────────────
    if (seg === "transactions" || seg.startsWith("transactions/")) {
      const c = crud("transactions");
      if (seg === "transactions") {
        if (method === "GET") {
          let list = stores.transactions;
          const type = q.get("type");
          const cat = q.get("category");
          const limit = q.get("limit");
          const offset = Number(q.get("offset") || 0);
          if (type) list = list.filter((t) => t.type === type);
          if (cat) list = list.filter((t) => t.category === cat);
          if (limit) list = list.slice(offset, offset + Number(limit));
          else if (offset) list = list.slice(offset);
          return ok(res, list);
        }
        if (method === "POST") return c.create(req, res);
        return bad(res, "Method not allowed");
      }
      if (seg === "transactions/recent") {
        return ok(res, stores.transactions.slice(0, 5));
      }
      const id = seg.split("/")[1];
      if (method === "GET") return c.get(req, res, id);
      if (method === "PATCH") return c.update(req, res, id);
      if (method === "DELETE") return c.del(req, res, id);
      return bad(res, "Method not allowed");
    }

    // ── Documents ───────────────────────────────────────────
    if (seg === "documents" || seg.startsWith("documents/")) {
      const c = crud("documents");
      if (seg === "documents") {
        if (method === "GET") {
          let list = stores.documents;
          const tag = q.get("tag");
          const eid = q.get("entityId");
          if (tag) list = list.filter((d) => (d.tags || "").includes(tag));
          if (eid && eid !== "null") list = list.filter((d) => String(d.entityId) === eid);
          return ok(res, list);
        }
        if (method === "POST") return c.create(req, res);
        return bad(res, "Method not allowed");
      }
      if (seg === "documents/recent") {
        return ok(res, stores.documents.slice(0, 5));
      }
      const id = seg.split("/")[1];
      if (method === "GET") return c.get(req, res, id);
      if (method === "PATCH") return c.update(req, res, id);
      if (method === "DELETE") return c.del(req, res, id);
      return bad(res, "Method not allowed");
    }

    // ── Entities ────────────────────────────────────────────
    if (seg === "entities" || seg.startsWith("entities/")) {
      const c = crud("entities");
      if (seg === "entities") {
        if (method === "GET") return ok(res, stores.entities);
        if (method === "POST") return c.create(req, res);
        return bad(res, "Method not allowed");
      }
      const id = seg.split("/")[1];
      if (method === "GET") return c.get(req, res, id);
      if (method === "PATCH") return c.update(req, res, id);
      if (method === "DELETE") return c.del(req, res, id);
      return bad(res, "Method not allowed");
    }

    // ── Snapshots ───────────────────────────────────────────
    if (seg === "snapshots") {
      if (method === "GET") return ok(res, stores.snapshots.map((s) => ({ month: s.month, value: s.value })));
      return bad(res, "Method not allowed");
    }
    if (seg === "snapshots/record") {
      if (method === "POST") {
        const total = stores.assets.reduce((s, a) => s + a.value, 0) - 24000000;
        const month = new Date().toISOString().slice(0, 7);
        const existing = stores.snapshots.find((s) => s.month === month);
        if (existing) existing.value = total;
        else stores.snapshots.push({ id: nextId(), month, value: total, createdAt: iso() });
        return ok(res, { recorded: true, month, value: total });
      }
      return bad(res, "Method not allowed");
    }

    // ── Prices ──────────────────────────────────────────────
    if (seg === "prices/crypto") {
      const ids = (q.get("ids") || "").split(",").map((s) => s.trim()).filter(Boolean);
      const table = {
        bitcoin: { aud: 144000, usd: 96000 },
        ethereum: { aud: 4800, usd: 3200 },
        solana: { aud: 240, usd: 160 },
        ripple: { aud: 1.6, usd: 1.07 },
        cardano: { aud: 1.2, usd: 0.8 },
        dogecoin: { aud: 0.32, usd: 0.21 },
        polkadot: { aud: 9.5, usd: 6.3 },
        chainlink: { aud: 28, usd: 18.7 },
      };
      const prices = {};
      for (const id of ids) prices[id] = table[id] || { aud: 1000, usd: 670 };
      return ok(res, { prices });
    }
    if (seg === "prices/equity") {
      const ticker = (q.get("ticker") || "").toUpperCase();
      const table = {
        AAPL: { price: 229.87, currency: "USD", name: "Apple Inc.", exchange: "NASDAQ" },
        MSFT: { price: 467.5, currency: "USD", name: "Microsoft Corp.", exchange: "NASDAQ" },
        GOOGL: { price: 178.2, currency: "USD", name: "Alphabet Inc.", exchange: "NASDAQ" },
        AMZN: { price: 201.3, currency: "USD", name: "Amazon.com Inc.", exchange: "NASDAQ" },
        TSLA: { price: 248.4, currency: "USD", name: "Tesla Inc.", exchange: "NASDAQ" },
        NVDA: { price: 131.2, currency: "USD", name: "NVIDIA Corp.", exchange: "NASDAQ" },
        META: { price: 612.8, currency: "USD", name: "Meta Platforms", exchange: "NASDAQ" },
        "CBA.AX": { price: 128.45, currency: "AUD", name: "Commonwealth Bank", exchange: "ASX" },
        "BHP.AX": { price: 42.1, currency: "AUD", name: "BHP Group", exchange: "ASX" },
        "NAB.AX": { price: 38.6, currency: "AUD", name: "National Australia Bank", exchange: "ASX" },
        SPY: { price: 558.2, currency: "USD", name: "S&P 500 ETF", exchange: "NYSE" },
        QQQ: { price: 482.9, currency: "USD", name: "NASDAQ 100 ETF", exchange: "NASDAQ" },
      };
      const eq = table[ticker] || { price: 100, currency: "USD", name: ticker || "Unknown", exchange: "NASDAQ" };
      return ok(res, { ticker, ...eq, source: "Yahoo Finance", updated: nowIso });
    }

    // ── Research ────────────────────────────────────────────
    if (seg === "research/query" || seg === "research/github" || seg === "research/component" ||
        seg === "research/business-plan" || seg === "research/grants" || seg === "research/grant-proposal") {
      const body = jsonBody(req);
      const label = seg.split("/")[1];
      const steps = [
        { type: "step", step: "init", message: `Initialising ${label} pipeline…` },
        { type: "step", step: "retrieve", message: "Gathering portfolio context…" },
        { type: "step", step: "web", message: "Searching external sources…" },
        { type: "step", step: "synthesis", message: "Synthesising findings…" },
      ];
      const sources = [
        { title: "RBA — Cash Rate", url: "https://www.rba.gov.au", snippet: "Cash rate target 4.35%." },
        { title: "ASX Market Announcements", url: "https://www.asx.com.au", snippet: "Quarterly production updates." },
      ];
      const events = [
        ...steps,
        { type: "sources", sources },
        { type: "choices", choices: [{ delta: { content: `\n\n# ${label} Report\n\nBased on the supplied context and web research, here is a structured analysis. (Seed/demo response — wire a real LLM provider to produce live output.)\n\n## Key Findings\n- Portfolio is well diversified across asset classes.\n- Consider rebalancing toward target allocations.\n- Tax-deductible expenses tracked year-to-date.\n` } }] },
        { type: "choices", choices: [{ delta: { content: `\n## Recommendations\n1. Review concentration in property.\n2. Maintain 3–6 months cash buffer.\n3. Schedule quarterly review.\n` } }] },
        { type: "done" },
      ];
      if (seg === "research/github") {
        events.push({ type: "repo", data: { name: "family-office", stars: 12, url: "https://github.com/local/family-office" } });
      }
      return streamSSE(res, events);
    }
    if (seg === "research/reports") {
      const c = crud("researchReports", { idField: "id" });
      if (method === "GET") return ok(res, stores.researchReports);
      if (method === "POST") {
        const b = jsonBody(req);
        const item = { id: nextId(), title: b.title || "Untitled", query: b.query || "", depth: b.depth || "standard", report: b.report || "", summary: b.summary || "", sources: b.sources || [], portfolioIncluded: !!b.portfolioIncluded, webSearched: !!b.webSearched, createdAt: iso() };
        stores.researchReports.unshift(item);
        return created(res, item);
      }
      return bad(res, "Method not allowed");
    }
    if (seg.startsWith("research/reports/")) {
      const id = seg.split("/")[2];
      if (method === "DELETE") {
        if (!removeById("researchReports", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }
    if (seg === "research/components") {
      const c = crud("components", { idField: "id" });
      if (method === "GET") return ok(res, stores.components);
      if (method === "POST") {
        const b = jsonBody(req);
        const item = { id: nextId(), name: b.name || "Component", description: b.description || "", code: b.code || "", createdAt: iso() };
        stores.components.unshift(item);
        return created(res, item);
      }
      return bad(res, "Method not allowed");
    }
    if (seg.startsWith("research/components/")) {
      const id = seg.split("/")[2];
      if (method === "DELETE") {
        if (!removeById("components", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }
    if (seg === "research/tools/status") {
      return ok(res, {
        webSearch: { duckduckgo: { available: true, configured: true }, brave: { available: false, configured: false } },
        github: { available: true, configured: true, note: "Public search available" },
        cloudAI: { available: false, configured: false, model: null },
        localAI: { available: false, online: false, model: null },
        updatedAt: nowIso,
      });
    }

    // ── AI ──────────────────────────────────────────────────
    if (seg === "ai/status") {
      return ok(res, {
        local: { online: false, configured: false, url: process.env.LOCAL_LLM_URL || "", model: process.env.LOCAL_LLM_MODEL || "", availableModels: [] },
        cloud: { configured: false, model: process.env.CLOUD_AI_MODEL || "" },
      });
    }
    if (seg === "ai/insights") {
      const insights = [
        { type: "warning", category: "Concentration", severity: "high", title: "Property concentration 42%", detail: "Property represents 42% of net worth, above your 60% high threshold is not breached but monitor. Consider diversifying into liquid investments.", action: "Review Allocation" },
        { type: "opportunity", category: "Cash", severity: "medium", title: "Idle cash buffer", detail: "Cash accounts hold more than 30% of liquid assets. Consider deploying into income-producing assets.", action: "Rebalance" },
        { type: "info", category: "Tax", severity: "low", title: "Tax-deductible tracked", detail: "Year-to-date tax-deductible expenses are being captured. Review before EOFY.", action: "View Ledger" },
      ];
      return ok(res, { insights });
    }
    if (seg === "ai/chat") {
      if (method !== "POST") { res.setHeader("Allow", "POST"); return send(res, 405, { error: "Method Not Allowed" }); }
      const b = jsonBody(req);
      const userMessage = (b.message || "").toString();
      const reply = `Thank you for your question${userMessage ? ` about "${userMessage.slice(0, 80)}"` : ""}. This is a structured demo response from the Family Office assistant. To enable live answers, configure LOCAL_LLM_URL (Ollama) or CLOUD_AI_KEY. Your portfolio data stays local-first under the zero-trust policy.`;
      const events = [
        { routing: "local", model: "demo", content: "" },
        { content: reply.slice(0, Math.ceil(reply.length / 2)) },
        { content: reply.slice(Math.ceil(reply.length / 2)) },
        { done: true },
      ];
      res.setHeader("Content-Type", "text/event-stream");
      res.setHeader("Cache-Control", "no-cache");
      res.setHeader("Connection", "keep-alive");
      let i = 0;
      const flush = () => {
        if (i >= events.length) { res.end(); return; }
        res.write(`data: ${JSON.stringify(events[i++])}\n\n`);
        setTimeout(flush, 25);
      };
      return flush();
    }

    // ── Audit logs ──────────────────────────────────────────
    if (seg === "audit-logs") {
      if (method !== "GET") return bad(res, "Method not allowed");
      let list = stores.auditLogs;
      const action = q.get("action");
      const entityType = q.get("entityType");
      const limit = Number(q.get("limit") || 50);
      const offset = Number(q.get("offset") || 0);
      if (action) list = list.filter((l) => l.action === action);
      if (entityType) list = list.filter((l) => l.entityType === entityType);
      list = list.slice(offset, offset + limit);
      return ok(res, list);
    }

    // ── Bank feed ───────────────────────────────────────────
    if (seg === "bank-feed/import") {
      if (method !== "POST") return bad(res, "Method not allowed");
      const b = jsonBody(req);
      const csv = (b.csv || "").trim();
      let imported = 0, skipped = 0;
      const errors = [];
      if (csv) {
        const lines = csv.split(/\r?\n/).filter(Boolean);
        const header = lines.shift();
        for (const line of lines) {
          const cols = line.split(",");
          if (cols.length < 3) { skipped++; continue; }
          const [date, description, amount, type] = cols;
          const num = Number(amount);
          if (isNaN(num)) { errors.push(`Invalid amount: ${line}`); skipped++; continue; }
          const t = { id: nextId(), description: description || "Imported", amount: num, type: type || (num >= 0 ? "income" : "expense"), category: "Imported", subcategory: null, date: date || nowIso.slice(0, 10), notes: "bank import", assetId: null, entityId: null, taxDeductible: false, taxTag: null, tags: null, createdAt: iso() };
          stores.bankImported.unshift(t);
          stores.transactions.unshift(t);
          imported++;
        }
      }
      return ok(res, { imported, skipped, errors });
    }
    if (seg === "bank-feed/imported") {
      return ok(res, stores.bankImported);
    }

    // ── Business ────────────────────────────────────────────
    if (seg === "business/clients") {
      if (method === "GET") return ok(res, stores.businessClients);
      if (method === "POST") {
        const b = jsonBody(req);
        const item = { id: nextId(), name: b.name || "Client", email: b.email || "", phone: b.phone || "", company: b.company || "", abn: b.abn || "", address: b.address || "", notes: b.notes || "", outstanding: 0, totalBilled: 0, invoiceCount: 0 };
        stores.businessClients.unshift(item);
        return created(res, item);
      }
      return bad(res, "Method not allowed");
    }
    if (seg.startsWith("business/clients/")) {
      const id = seg.split("/")[2];
      if (method === "PATCH") {
        const item = getById("businessClients", id);
        if (!item) return notFound(res);
        Object.assign(item, jsonBody(req), { id: item.id });
        return ok(res, item);
      }
      if (method === "DELETE") {
        if (!removeById("businessClients", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }
    if (seg === "business/invoices") {
      if (method === "GET") return ok(res, stores.businessInvoices);
      if (method === "POST") {
        const b = jsonBody(req);
        const items = b.items || [];
        const subtotal = items.reduce((s, it) => s + (Number(it.amount) || 0), 0) || Number(b.subtotal) || 0;
        const taxRate = Number(b.taxRate ?? 0.1);
        const item = { id: nextId(), invoiceNumber: b.invoiceNumber || `INV-2026-${String(_seq).padStart(3, "0")}`, clientId: b.clientId, clientName: b.clientName || "", clientEmail: b.clientEmail || "", clientAddress: b.clientAddress || "", status: b.status || "draft", issueDate: b.issueDate || nowIso.slice(0, 10), dueDate: b.dueDate || nowIso.slice(0, 10), notes: b.notes || "", businessName: b.businessName || "Meridian Operations", businessAbn: b.businessAbn || "11223344556", subtotal, taxRate, taxAmount: subtotal * taxRate, total: subtotal * (1 + taxRate), currency: b.currency || "AUD", paid: !!b.paid, paidDate: b.paidDate || null, items };
        stores.businessInvoices.unshift(item);
        return created(res, item);
      }
      return bad(res, "Method not allowed");
    }
    if (seg.startsWith("business/invoices/")) {
      const id = seg.split("/")[2];
      if (method === "PATCH") {
        const item = getById("businessInvoices", id);
        if (!item) return notFound(res);
        Object.assign(item, jsonBody(req), { id: item.id });
        return ok(res, item);
      }
      if (method === "DELETE") {
        if (!removeById("businessInvoices", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }
    if (seg === "business/expenses") {
      if (method === "GET") return ok(res, stores.businessExpenses);
      if (method === "POST") {
        const b = jsonBody(req);
        const item = { id: nextId(), date: b.date || nowIso.slice(0, 10), description: b.description || "", category: b.category || "Other", amount: Number(b.amount) || 0, currency: b.currency || "AUD", taxDeductible: !!b.taxDeductible, gstIncluded: !!b.gstIncluded, supplier: b.supplier || "", notes: b.notes || "" };
        stores.businessExpenses.unshift(item);
        return created(res, item);
      }
      return bad(res, "Method not allowed");
    }
    if (seg.startsWith("business/expenses/")) {
      const id = seg.split("/")[2];
      if (method === "PATCH") {
        const item = getById("businessExpenses", id);
        if (!item) return notFound(res);
        Object.assign(item, jsonBody(req), { id: item.id });
        return ok(res, item);
      }
      if (method === "DELETE") {
        if (!removeById("businessExpenses", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }
    if (seg === "business/time") {
      if (method === "GET") return ok(res, stores.timeEntries);
      if (method === "POST") {
        const b = jsonBody(req);
        const item = { id: nextId(), date: b.date || nowIso.slice(0, 10), clientId: b.clientId || null, clientName: b.clientName || "", projectName: b.projectName || "", description: b.description || "", hours: Number(b.hours) || 0, hourlyRate: b.hourlyRate || null, billable: !!b.billable, invoiced: !!b.invoiced };
        stores.timeEntries.unshift(item);
        return created(res, item);
      }
      return bad(res, "Method not allowed");
    }
    if (seg.startsWith("business/time/")) {
      const id = seg.split("/")[2];
      if (method === "PATCH") {
        const item = getById("timeEntries", id);
        if (!item) return notFound(res);
        Object.assign(item, jsonBody(req), { id: item.id });
        return ok(res, item);
      }
      if (method === "DELETE") {
        if (!removeById("timeEntries", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }
    if (seg === "business/summary") {
      const invoices = stores.businessInvoices;
      const outstanding = invoices.filter((i) => !i.paid).reduce((s, i) => s + i.total, 0);
      const totalRevenue = invoices.reduce((s, i) => s + i.total, 0);
      const totalExpenses = stores.businessExpenses.reduce((s, e) => s + e.amount, 0);
      const invoicesByStatus = {};
      for (const i of invoices) invoicesByStatus[i.status] = (invoicesByStatus[i.status] || 0) + 1;
      const totalBillableHours = stores.timeEntries.filter((t) => t.billable).reduce((s, t) => s + t.hours, 0);
      return ok(res, {
        totalRevenue, outstanding, totalExpenses, netProfit: totalRevenue - totalExpenses,
        clientCount: stores.businessClients.length, invoiceCount: invoices.length,
        totalBillableHours, invoicesByStatus, recentInvoices: invoices.slice(0, 5),
      });
    }

    // ── FX ──────────────────────────────────────────────────
    if (seg === "fx/rates") {
      return ok(res, {
        rates: { USD: 1, AUD: 0.645, EUR: 1.085, GBP: 1.27, CAD: 0.73, SGD: 0.74 },
        date: nowIso.slice(0, 10),
        source: "fallback-seed",
      });
    }

    // ── Notifications ───────────────────────────────────────
    if (seg === "notifications") {
      if (method === "GET") return ok(res, stores.notifications);
      return bad(res, "Method not allowed");
    }
    if (seg.startsWith("notifications/")) {
      const rest = seg.split("/").slice(1);
      const id = rest[0];
      if (rest[1] === "read") {
        if (method === "PATCH") {
          const n = getById("notifications", id);
          if (!n) return notFound(res);
          n.read = true;
          return ok(res, n);
        }
        return bad(res, "Method not allowed");
      }
      if (seg === "notifications/mark-all-read") {
        if (method === "POST") {
          for (const n of stores.notifications) n.read = true;
          return ok(res, { marked: stores.notifications.length });
        }
        return bad(res, "Method not allowed");
      }
      if (method === "DELETE") {
        if (!removeById("notifications", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }

    // ── Watchlist ───────────────────────────────────────────
    if (seg === "watchlist" || seg.startsWith("watchlist/")) {
      if (seg === "watchlist") {
        if (method === "GET") return ok(res, stores.watchlist);
        if (method === "POST") {
          const b = jsonBody(req);
          const item = { id: nextId(), symbol: b.symbol || "", name: b.name || "", type: b.type || "equity", exchange: b.exchange || "", price: b.price || null, change: b.change || null, changePercent: b.changePercent || null, currency: b.currency || "USD", notes: b.notes || "", aiSummary: b.aiSummary || null, alertHigh: b.alertHigh || null, alertLow: b.alertLow || null, isActive: b.isActive !== false, createdAt: iso(), updatedAt: iso() };
          stores.watchlist.unshift(item);
          return created(res, item);
        }
        return bad(res, "Method not allowed");
      }
      const rest = seg.split("/").slice(1);
      const id = rest[0];
      if (rest[1] === "research" && method === "POST") {
        const w = getById("watchlist", id);
        if (!w) return notFound(res);
        w.aiSummary = `AI research summary for ${w.symbol}: positioned for continued momentum; monitor macro conditions.`;
        return ok(res, w);
      }
      if (method === "PATCH") {
        const w = getById("watchlist", id);
        if (!w) return notFound(res);
        Object.assign(w, jsonBody(req), { id: w.id, updatedAt: iso() });
        return ok(res, w);
      }
      if (method === "DELETE") {
        if (!removeById("watchlist", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }

    // ── Users ───────────────────────────────────────────────
    if (seg === "users") {
      if (method === "GET") return ok(res, stores.users);
      if (method === "POST") {
        const b = jsonBody(req);
        const item = { id: nextId(), email: b.email || "", name: b.name || "", role: b.role || "member", createdAt: iso() };
        stores.users.unshift(item);
        return created(res, item);
      }
      return bad(res, "Method not allowed");
    }
    if (seg.startsWith("users/")) {
      const id = seg.split("/")[1];
      if (method === "DELETE") {
        if (!removeById("users", id)) return notFound(res);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }

    // ── System ──────────────────────────────────────────────
    if (seg === "system/purge") {
      if (method === "DELETE") {
        stores.assets = []; stores.transactions = []; stores.documents = [];
        stores.entities = []; stores.snapshots = []; stores.watchlist = [];
        stores.notifications = []; stores.businessClients = []; stores.businessInvoices = [];
        stores.businessExpenses = []; stores.timeEntries = []; stores.researchReports = [];
        stores.components = []; stores.bankImported = []; stores.auditLogs = [];
        return ok(res, { purged: true });
      }
      return bad(res, "Method not allowed");
    }

    // ── White-label ─────────────────────────────────────────
    if (seg === "white-label") {
      if (method === "GET") {
        return ok(res, {
          offices: [
            { id: 1, name: "Corporate HQ", domain: "familyoffice.com", users: 5, status: "active", createdAt: "2026-01-15" },
            { id: 2, name: "Sydney Branch", domain: "sydney.familyoffice.com", users: 3, status: "active", createdAt: "2026-03-22" },
            { id: 3, name: "Melbourne Advisors", domain: "melb.familyoffice.com", users: 2, status: "inactive", createdAt: "2026-05-10" },
          ],
          config: { defaultTheme: "Dark Gold", defaultCurrency: "AUD", defaultLanguage: "en-AU", maxUsersPerOffice: 10 },
        });
      }
      return bad(res, "Method not allowed");
    }

    // ── OCR ─────────────────────────────────────────────────
    if (seg === "ocr" || seg.startsWith("ocr/")) {
      if (seg === "ocr") {
        if (method === "GET") return ok(res, stores.ocrJobs);
        if (method === "POST") {
          const b = jsonBody(req);
          const job = { id: `ocr-${nextId()}`, fileName: b.fileName || "upload.pdf", status: "completed", extractedText: `Mock OCR result for ${b.fileName || "document"}.\nConfidence: 92%.`, confidence: 0.92, createdAt: iso(), completedAt: iso() };
          stores.ocrJobs.unshift(job);
          return created(res, job);
        }
        return bad(res, "Method not allowed");
      }
      const rest = seg.split("/").slice(1);
      const id = rest[0];
      if (rest[1] === "reprocess" && method === "POST") {
        const j = stores.ocrJobs.find((x) => x.id === id);
        if (!j) return notFound(res);
        j.status = "completed"; j.extractedText = `Re-processed ${j.fileName}.`; j.confidence = 0.94; j.completedAt = iso();
        return ok(res, j);
      }
      if (method === "DELETE") {
        const i = stores.ocrJobs.findIndex((x) => x.id === id);
        if (i < 0) return notFound(res);
        stores.ocrJobs.splice(i, 1);
        return noContent(res);
      }
      return bad(res, "Method not allowed");
    }

    // ── Fallback ────────────────────────────────────────────
    return notFound(res, `Unknown endpoint: /api/${seg}`);
  } catch (e) {
    return send(res, 500, { error: "Internal server error", detail: String(e && e.message || e) });
  }
}
