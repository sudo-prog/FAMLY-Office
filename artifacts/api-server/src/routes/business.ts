import { Router } from "express";
import { db } from "@workspace/db";
import {
  businessClientsTable, businessInvoicesTable, businessInvoiceItemsTable,
  businessExpensesTable, timeEntriesTable,
} from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";

const router = Router();

function num(v: unknown) { return Number(v) || 0; }

// ─── Summary ───────────────────────────────────────────────────────────────

router.get("/business/summary", async (_req, res) => {
  try {
    const invoices = await db.select().from(businessInvoicesTable);
    const expenses = await db.select().from(businessExpensesTable);
    const clients = await db.select().from(businessClientsTable);
    const timeEntries = await db.select().from(timeEntriesTable);

    const paidInvoices = invoices.filter(i => i.paid);
    const unpaidInvoices = invoices.filter(i => !i.paid && i.status !== "draft" && i.status !== "cancelled");
    const totalRevenue = paidInvoices.reduce((s, i) => s + num(i.total), 0);
    const outstanding = unpaidInvoices.reduce((s, i) => s + num(i.total), 0);
    const totalExpenses = expenses.reduce((s, e) => s + num(e.amount), 0);
    const totalHours = timeEntries.filter(t => t.billable).reduce((s, t) => s + num(t.hours), 0);

    const byStatus: Record<string, number> = {};
    invoices.forEach(i => { byStatus[i.status] = (byStatus[i.status] || 0) + 1; });

    res.json({
      totalRevenue,
      outstanding,
      totalExpenses,
      netProfit: totalRevenue - totalExpenses,
      clientCount: clients.length,
      invoiceCount: invoices.length,
      invoicesByStatus: byStatus,
      totalBillableHours: totalHours,
      recentInvoices: invoices
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(i => ({ ...i, total: num(i.total), subtotal: num(i.subtotal), taxAmount: num(i.taxAmount) })),
    });
  } catch {
    res.status(500).json({ error: "Failed to fetch business summary" });
  }
});

// ─── Clients ───────────────────────────────────────────────────────────────

router.get("/business/clients", async (_req, res) => {
  try {
    const clients = await db.select().from(businessClientsTable).orderBy(businessClientsTable.name);
    const invoices = await db.select().from(businessInvoicesTable);
    const result = clients.map(c => {
      const clientInvoices = invoices.filter(i => i.clientId === c.id);
      const outstanding = clientInvoices.filter(i => !i.paid && i.status !== "cancelled").reduce((s, i) => s + num(i.total), 0);
      const totalBilled = clientInvoices.filter(i => i.paid).reduce((s, i) => s + num(i.total), 0);
      return { ...c, outstanding, totalBilled, invoiceCount: clientInvoices.length };
    });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Failed to fetch clients" });
  }
});

router.post("/business/clients", async (req, res) => {
  try {
    const { name, email, phone, company, abn, address, notes } = req.body;
    if (!name) return res.status(400).json({ error: "Name required" });
    const [client] = await db.insert(businessClientsTable).values({ name, email, phone, company, abn, address, notes }).returning();
    res.status(201).json(client);
  } catch {
    res.status(400).json({ error: "Failed to create client" });
  }
});

router.patch("/business/clients/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, email, phone, company, abn, address, notes } = req.body;
    const [client] = await db.update(businessClientsTable).set({ name, email, phone, company, abn, address, notes, updatedAt: new Date() }).where(eq(businessClientsTable.id, id)).returning();
    res.json(client);
  } catch {
    res.status(400).json({ error: "Failed to update client" });
  }
});

router.delete("/business/clients/:id", async (req, res) => {
  try {
    await db.delete(businessClientsTable).where(eq(businessClientsTable.id, parseInt(req.params.id)));
    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Failed to delete client" });
  }
});

// ─── Invoices ──────────────────────────────────────────────────────────────

function formatInvoice(inv: any, items: any[]) {
  return {
    ...inv,
    subtotal: num(inv.subtotal),
    taxRate: num(inv.taxRate),
    taxAmount: num(inv.taxAmount),
    total: num(inv.total),
    items: items.map(it => ({
      ...it, quantity: num(it.quantity), unitPrice: num(it.unitPrice), amount: num(it.amount),
    })),
  };
}

router.get("/business/invoices", async (_req, res) => {
  try {
    const invoices = await db.select().from(businessInvoicesTable).orderBy(desc(businessInvoicesTable.createdAt));
    const allItems = await db.select().from(businessInvoiceItemsTable);
    res.json(invoices.map(inv => formatInvoice(inv, allItems.filter(it => it.invoiceId === inv.id))));
  } catch {
    res.status(500).json({ error: "Failed to fetch invoices" });
  }
});

router.get("/business/invoices/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [inv] = await db.select().from(businessInvoicesTable).where(eq(businessInvoicesTable.id, id));
    if (!inv) return res.status(404).json({ error: "Not found" });
    const items = await db.select().from(businessInvoiceItemsTable).where(eq(businessInvoiceItemsTable.invoiceId, id));
    res.json(formatInvoice(inv, items));
  } catch {
    res.status(500).json({ error: "Failed to fetch invoice" });
  }
});

router.post("/business/invoices", async (req, res) => {
  try {
    const { items = [], ...invData } = req.body;
    const subtotal = items.reduce((s: number, it: any) => s + (num(it.quantity) * num(it.unitPrice)), 0);
    const taxRate = num(invData.taxRate ?? 10);
    const taxAmount = subtotal * (taxRate / 100);
    const total = subtotal + taxAmount;
    const [inv] = await db.insert(businessInvoicesTable).values({
      ...invData,
      subtotal: subtotal.toFixed(2),
      taxRate: taxRate.toFixed(2),
      taxAmount: taxAmount.toFixed(2),
      total: total.toFixed(2),
    }).returning();
    if (items.length > 0) {
      await db.insert(businessInvoiceItemsTable).values(
        items.map((it: any) => ({
          invoiceId: inv.id,
          description: it.description,
          quantity: num(it.quantity).toFixed(2),
          unitPrice: num(it.unitPrice).toFixed(2),
          amount: (num(it.quantity) * num(it.unitPrice)).toFixed(2),
        }))
      );
    }
    const savedItems = await db.select().from(businessInvoiceItemsTable).where(eq(businessInvoiceItemsTable.invoiceId, inv.id));
    res.status(201).json(formatInvoice(inv, savedItems));
  } catch (e) {
    res.status(400).json({ error: "Failed to create invoice" });
  }
});

router.patch("/business/invoices/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { items, ...invData } = req.body;
    if (items !== undefined) {
      await db.delete(businessInvoiceItemsTable).where(eq(businessInvoiceItemsTable.invoiceId, id));
      const subtotal = items.reduce((s: number, it: any) => s + (num(it.quantity) * num(it.unitPrice)), 0);
      const taxRate = num(invData.taxRate ?? 10);
      const taxAmount = subtotal * (taxRate / 100);
      const total = subtotal + taxAmount;
      invData.subtotal = subtotal.toFixed(2);
      invData.taxAmount = taxAmount.toFixed(2);
      invData.total = total.toFixed(2);
      if (items.length > 0) {
        await db.insert(businessInvoiceItemsTable).values(
          items.map((it: any) => ({
            invoiceId: id,
            description: it.description,
            quantity: num(it.quantity).toFixed(2),
            unitPrice: num(it.unitPrice).toFixed(2),
            amount: (num(it.quantity) * num(it.unitPrice)).toFixed(2),
          }))
        );
      }
    }
    const [inv] = await db.update(businessInvoicesTable).set({ ...invData, updatedAt: new Date() }).where(eq(businessInvoicesTable.id, id)).returning();
    const savedItems = await db.select().from(businessInvoiceItemsTable).where(eq(businessInvoiceItemsTable.invoiceId, id));
    res.json(formatInvoice(inv, savedItems));
  } catch {
    res.status(400).json({ error: "Failed to update invoice" });
  }
});

router.delete("/business/invoices/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(businessInvoiceItemsTable).where(eq(businessInvoiceItemsTable.invoiceId, id));
    await db.delete(businessInvoicesTable).where(eq(businessInvoicesTable.id, id));
    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Failed to delete invoice" });
  }
});

// ─── Expenses ──────────────────────────────────────────────────────────────

router.get("/business/expenses", async (_req, res) => {
  try {
    const rows = await db.select().from(businessExpensesTable).orderBy(desc(businessExpensesTable.date));
    res.json(rows.map(e => ({ ...e, amount: num(e.amount) })));
  } catch {
    res.status(500).json({ error: "Failed to fetch expenses" });
  }
});

router.post("/business/expenses", async (req, res) => {
  try {
    const { date, description, category, amount, currency, taxDeductible, gstIncluded, supplier, notes } = req.body;
    if (!date || !description || !amount) return res.status(400).json({ error: "Required fields missing" });
    const [row] = await db.insert(businessExpensesTable).values({ date, description, category: category || "other", amount: String(amount), currency: currency || "AUD", taxDeductible: taxDeductible !== false, gstIncluded: gstIncluded !== false, supplier, notes }).returning();
    res.status(201).json({ ...row, amount: num(row.amount) });
  } catch {
    res.status(400).json({ error: "Failed to create expense" });
  }
});

router.patch("/business/expenses/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, description, category, amount, currency, taxDeductible, gstIncluded, supplier, notes } = req.body;
    const [row] = await db.update(businessExpensesTable).set({ date, description, category, amount: amount !== undefined ? String(amount) : undefined, currency, taxDeductible, gstIncluded, supplier, notes, updatedAt: new Date() }).where(eq(businessExpensesTable.id, id)).returning();
    res.json({ ...row, amount: num(row.amount) });
  } catch {
    res.status(400).json({ error: "Failed to update expense" });
  }
});

router.delete("/business/expenses/:id", async (req, res) => {
  try {
    await db.delete(businessExpensesTable).where(eq(businessExpensesTable.id, parseInt(req.params.id)));
    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Failed to delete expense" });
  }
});

// ─── Time Entries ──────────────────────────────────────────────────────────

router.get("/business/time", async (_req, res) => {
  try {
    const rows = await db.select().from(timeEntriesTable).orderBy(desc(timeEntriesTable.date));
    res.json(rows.map(t => ({ ...t, hours: num(t.hours), hourlyRate: num(t.hourlyRate) })));
  } catch {
    res.status(500).json({ error: "Failed to fetch time entries" });
  }
});

router.post("/business/time", async (req, res) => {
  try {
    const { date, clientId, clientName, projectName, description, hours, hourlyRate, billable } = req.body;
    if (!date || !description || !hours) return res.status(400).json({ error: "Required fields missing" });
    const [row] = await db.insert(timeEntriesTable).values({ date, clientId: clientId || null, clientName, projectName, description, hours: String(hours), hourlyRate: hourlyRate ? String(hourlyRate) : null, billable: billable !== false }).returning();
    res.status(201).json({ ...row, hours: num(row.hours), hourlyRate: num(row.hourlyRate) });
  } catch {
    res.status(400).json({ error: "Failed to create time entry" });
  }
});

router.patch("/business/time/:id", async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { date, clientId, clientName, projectName, description, hours, hourlyRate, billable, invoiced } = req.body;
    const [row] = await db.update(timeEntriesTable).set({ date, clientId: clientId || null, clientName, projectName, description, hours: hours !== undefined ? String(hours) : undefined, hourlyRate: hourlyRate !== undefined ? String(hourlyRate) : undefined, billable, invoiced }).where(eq(timeEntriesTable.id, id)).returning();
    res.json({ ...row, hours: num(row.hours), hourlyRate: num(row.hourlyRate) });
  } catch {
    res.status(400).json({ error: "Failed to update time entry" });
  }
});

router.delete("/business/time/:id", async (req, res) => {
  try {
    await db.delete(timeEntriesTable).where(eq(timeEntriesTable.id, parseInt(req.params.id)));
    res.status(204).end();
  } catch {
    res.status(400).json({ error: "Failed to delete time entry" });
  }
});

export default router;
