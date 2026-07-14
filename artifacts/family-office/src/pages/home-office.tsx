import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { AIPanel } from "@/components/ai-panel";
import { useOnlineStatus } from "@/hooks/use-offline";
import { demoConfirm } from "@/components/demo-banner";
import { toast } from "sonner";
import {
  Briefcase, TrendingUp, TrendingDown, DollarSign, Clock, Users, FileText,
  Plus, Pencil, Trash2, Check, Printer, Search, ChevronDown, ChevronUp,
  LayoutDashboard, ScrollText, User2, Receipt, Timer, Sparkles, X, AlertCircle,
  CheckCircle2, Send, Ban, ArrowRight, BarChart3,
} from "lucide-react";
import {
  useBusinessSummary, useBusinessClients, useBusinessInvoices, useBusinessExpenses, useTimeEntries,
  useCreateClient, useUpdateClient, useDeleteClient,
  useCreateInvoice, useUpdateInvoice, useDeleteInvoice,
  useCreateExpense, useUpdateExpense, useDeleteExpense,
  useCreateTimeEntry, useUpdateTimeEntry, useDeleteTimeEntry,
  type BusinessClient, type BusinessInvoice, type BusinessExpense, type TimeEntry, type InvoiceItem,
} from "@/hooks/use-business-api";

type Tab = "dashboard" | "invoices" | "clients" | "expenses" | "time";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "invoices", label: "Invoices", icon: ScrollText },
  { id: "clients", label: "Clients", icon: User2 },
  { id: "expenses", label: "Expenses", icon: Receipt },
  { id: "time", label: "Time Tracker", icon: Timer },
];

const fmt = (v: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", maximumFractionDigits: 0 }).format(v);
const fmtFull = (v: number) => new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 2 }).format(v);
const today = () => new Date().toISOString().slice(0, 10);
const dueIn = (days = 30) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString().slice(0, 10); };

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft:     { label: "Draft",     color: "bg-muted/40 text-muted-foreground border-border",             icon: FileText },
  sent:      { label: "Sent",      color: "bg-blue-500/10 text-blue-400 border-blue-400/30",             icon: Send },
  paid:      { label: "Paid",      color: "bg-emerald-500/10 text-emerald-400 border-emerald-400/30",    icon: CheckCircle2 },
  overdue:   { label: "Overdue",   color: "bg-red-500/10 text-red-400 border-red-400/30",                icon: AlertCircle },
  cancelled: { label: "Cancelled", color: "bg-muted/30 text-muted-foreground/60 border-border/40",       icon: Ban },
};

const EXPENSE_CATS = ["office_supplies","software","travel","meals","marketing","professional_fees","utilities","equipment","insurance","subscriptions","other"];
const catLabel = (c: string) => c.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase());

function nextInvoiceNumber(invoices: BusinessInvoice[]) {
  const nums = invoices.map(i => parseInt(i.invoiceNumber.replace(/\D/g, "") || "0")).filter(Boolean);
  const max = nums.length ? Math.max(...nums) : 0;
  return `INV-${String(max + 1).padStart(4, "0")}`;
}

function printInvoice(inv: BusinessInvoice) {
  const w = window.open("", "_blank");
  if (!w) return;
  w.document.write(`<!DOCTYPE html><html><head><title>Invoice ${inv.invoiceNumber}</title>
  <style>
    body{font-family:Georgia,serif;margin:0;padding:48px;color:#111;background:#fff;font-size:14px}
    h1{margin:0;font-size:28px;font-weight:400;letter-spacing:0.5px}
    .header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:48px;padding-bottom:24px;border-bottom:2px solid #111}
    .label{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:#888;margin-bottom:2px}
    .value{font-size:15px;color:#111;font-weight:500}
    table{width:100%;border-collapse:collapse;margin:24px 0}
    th{text-align:left;padding:8px 12px;background:#f5f5f5;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;font-family:sans-serif}
    td{padding:10px 12px;border-bottom:1px solid #eee;font-family:sans-serif;font-size:13px}
    .right{text-align:right}
    .total-row{font-weight:600;border-top:2px solid #111}
    .total-box{float:right;width:260px;margin-top:16px}
    .total-box div{display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid #eee;font-family:sans-serif;font-size:13px}
    .total-box .grand{font-weight:700;font-size:16px;border-top:2px solid #111;border-bottom:none;padding-top:10px}
    .status{display:inline-block;padding:4px 12px;border:1px solid #111;font-size:11px;text-transform:uppercase;letter-spacing:1px}
    .footer{margin-top:64px;padding-top:16px;border-top:1px solid #eee;font-size:11px;color:#888;display:flex;justify-content:space-between;font-family:sans-serif}
  </style></head><body>
  <div class="header">
    <div><h1>${inv.businessName ?? "Family Office"}</h1>${inv.businessAbn ? `<div style="color:#888;font-size:12px;margin-top:4px">ABN ${inv.businessAbn}</div>` : ""}</div>
    <div style="text-align:right">
      <div style="font-size:22px;font-weight:400;letter-spacing:1px">INVOICE</div>
      <div style="font-size:20px;font-weight:700;margin-top:4px">${inv.invoiceNumber}</div>
      <div class="status" style="margin-top:8px">${inv.status.toUpperCase()}</div>
    </div>
  </div>
  <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:32px;margin-bottom:40px">
    <div><div class="label">Bill To</div><div class="value">${inv.clientName}</div>${inv.clientEmail ? `<div style="color:#888;font-size:12px">${inv.clientEmail}</div>` : ""}${inv.clientAddress ? `<div style="color:#888;font-size:12px">${inv.clientAddress}</div>` : ""}</div>
    <div><div class="label">Issue Date</div><div class="value">${inv.issueDate}</div></div>
    <div><div class="label">Due Date</div><div class="value">${inv.dueDate}</div></div>
  </div>
  <table><thead><tr><th>Description</th><th class="right">Qty</th><th class="right">Unit Price</th><th class="right">Amount</th></tr></thead>
  <tbody>${(inv.items ?? []).map(it => `<tr><td>${it.description}</td><td class="right">${it.quantity}</td><td class="right">${fmtFull(it.unitPrice)}</td><td class="right">${fmtFull(it.amount)}</td></tr>`).join("")}</tbody></table>
  <div class="total-box">
    <div><span>Subtotal</span><span>${fmtFull(inv.subtotal)}</span></div>
    <div><span>GST (${inv.taxRate}%)</span><span>${fmtFull(inv.taxAmount)}</span></div>
    <div class="grand"><span>TOTAL DUE</span><span>${fmtFull(inv.total)}</span></div>
  </div>
  <div style="clear:both"></div>
  ${inv.notes ? `<div style="margin-top:32px;padding:16px;background:#f9f9f9;font-family:sans-serif;font-size:13px;color:#555"><strong>Notes:</strong> ${inv.notes}</div>` : ""}
  <div class="footer"><span>${inv.businessName ?? "Family Office"}</span><span>Thank you for your business</span><span>Generated ${new Date().toLocaleDateString("en-AU")}</span></div>
  </body></html>`);
  w.document.close();
  w.print();
}

// ─── Dashboard ──────────────────────────────────────────────────────────────

function Dashboard({ onTabChange }: { onTabChange: (t: Tab) => void }) {
  const { data: summary, isLoading } = useBusinessSummary();
  const [aiOpen, setAiOpen] = useState(false);

  if (isLoading) return <div className="space-y-4"><Skeleton className="h-32 w-full bg-muted/50 rounded-xl" /><Skeleton className="h-64 w-full bg-muted/50 rounded-xl" /></div>;

  const kpis = [
    { label: "Total Revenue", value: fmt(summary?.totalRevenue ?? 0), icon: TrendingUp, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
    { label: "Outstanding", value: fmt(summary?.outstanding ?? 0), icon: AlertCircle, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
    { label: "Total Expenses", value: fmt(summary?.totalExpenses ?? 0), icon: TrendingDown, color: "text-red-400", bg: "bg-red-500/10 border-red-500/20" },
    { label: "Net Profit", value: fmt(summary?.netProfit ?? 0), icon: DollarSign, color: (summary?.netProfit ?? 0) >= 0 ? "text-primary" : "text-destructive", bg: (summary?.netProfit ?? 0) >= 0 ? "bg-primary/10 border-primary/20" : "bg-destructive/10 border-destructive/20" },
    { label: "Clients", value: String(summary?.clientCount ?? 0), icon: Users, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
    { label: "Invoices", value: String(summary?.invoiceCount ?? 0), icon: ScrollText, color: "text-purple-400", bg: "bg-purple-500/10 border-purple-500/20" },
    { label: "Billable Hours", value: `${(summary?.totalBillableHours ?? 0).toFixed(1)}h`, icon: Clock, color: "text-cyan-400", bg: "bg-cyan-500/10 border-cyan-500/20" },
    { label: "Gross Margin", value: summary?.totalRevenue ? `${(((summary.totalRevenue - summary.totalExpenses) / summary.totalRevenue) * 100).toFixed(0)}%` : "—", icon: BarChart3, color: "text-primary", bg: "bg-primary/5 border-primary/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-serif text-foreground">Business Overview</h2>
          <p className="text-xs text-muted-foreground mt-0.5">All-time cumulative figures</p>
        </div>
        <Button onClick={() => setAiOpen(true)} variant="outline" size="sm" className="gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs">
          <Sparkles className="w-3.5 h-3.5" /> AI Insights
        </Button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpis.map(k => (
          <div key={k.label} className={`p-4 rounded-xl border ${k.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground">{k.label}</p>
              <k.icon className={`w-4 h-4 ${k.color}`} />
            </div>
            <p className={`text-xl font-mono font-semibold tabular-nums ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {summary && Object.keys(summary.invoicesByStatus).length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Invoice Status Breakdown</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(summary.invoicesByStatus).map(([status, count]) => {
                const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
                return (
                  <div key={status} className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-sm font-mono text-foreground">{count} invoice{count !== 1 ? "s" : ""}</span>
                  </div>
                );
              })}
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Quick Actions</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: "New Invoice", tab: "invoices" as Tab, icon: ScrollText },
                { label: "Add Client", tab: "clients" as Tab, icon: User2 },
                { label: "Log Expense", tab: "expenses" as Tab, icon: Receipt },
                { label: "Log Time", tab: "time" as Tab, icon: Timer },
              ].map(a => (
                <button key={a.tab} onClick={() => onTabChange(a.tab)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/20 border border-border hover:border-primary/40 hover:text-foreground text-sm text-muted-foreground transition-colors">
                  <a.icon className="w-3.5 h-3.5 text-primary" />
                  {a.label}
                  <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {summary?.recentInvoices && summary.recentInvoices.length > 0 && (
        <Card className="bg-card border-border">
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-sm text-muted-foreground font-medium">Recent Invoices</CardTitle>
            <button onClick={() => onTabChange("invoices")} className="text-xs text-primary hover:underline">View all →</button>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground text-xs">Invoice</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Client</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Due</TableHead>
                  <TableHead className="text-muted-foreground text-xs">Status</TableHead>
                  <TableHead className="text-muted-foreground text-xs text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {summary.recentInvoices.map(inv => {
                  const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
                  return (
                    <TableRow key={inv.id} className="border-border/40">
                      <TableCell className="font-mono text-xs">{inv.invoiceNumber}</TableCell>
                      <TableCell className="text-sm">{inv.clientName}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{inv.dueDate}</TableCell>
                      <TableCell><span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span></TableCell>
                      <TableCell className="text-right font-mono text-sm">{fmtFull(inv.total)}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} title="Business AI Insights"
        suggestions={["What is my most profitable service or product line?","Analyse my cash flow trend — when should I expect the next cash crunch?","Which clients generate the most revenue?","What expenses could I reduce to improve margins?","Summarise my business health and flag any risks","What is my average invoice payment time?"]} />
    </div>
  );
}

// ─── Invoices ───────────────────────────────────────────────────────────────

type InvoiceForm = { invoiceNumber: string; clientName: string; clientEmail: string; clientAddress: string; businessName: string; businessAbn: string; status: string; issueDate: string; dueDate: string; notes: string; taxRate: string; items: { description: string; quantity: string; unitPrice: string }[] };
const emptyItem = () => ({ description: "", quantity: "1", unitPrice: "" });
const emptyInvoiceForm = (num = "INV-0001"): InvoiceForm => ({ invoiceNumber: num, clientName: "", clientEmail: "", clientAddress: "", businessName: "", businessAbn: "", status: "draft", issueDate: today(), dueDate: dueIn(30), notes: "", taxRate: "10", items: [emptyItem()] });

function Invoices() {
  const { data: invoices = [], isLoading } = useBusinessInvoices();
  const { data: clients = [] } = useBusinessClients();
  const createInv = useCreateInvoice();
  const updateInv = useUpdateInvoice();
  const deleteInv = useDeleteInvoice();
  const isOnline = useOnlineStatus();

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<InvoiceForm>(() => emptyInvoiceForm());
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [aiOpen, setAiOpen] = useState(false);

  const filtered = invoices.filter(i =>
    (statusFilter === "all" || i.status === statusFilter) &&
    (!search || i.invoiceNumber.toLowerCase().includes(search.toLowerCase()) || i.clientName.toLowerCase().includes(search.toLowerCase()))
  );

  const subtotal = form.items.reduce((s, it) => s + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0);
  const taxRate = parseFloat(form.taxRate) || 0;
  const tax = subtotal * (taxRate / 100);
  const total = subtotal + tax;

  function openCreate() {
    setEditId(null);
    setForm(emptyInvoiceForm(nextInvoiceNumber(invoices)));
    setOpen(true);
  }
  function openEdit(inv: BusinessInvoice) {
    setEditId(inv.id);
    setForm({
      invoiceNumber: inv.invoiceNumber, clientName: inv.clientName, clientEmail: inv.clientEmail ?? "",
      clientAddress: inv.clientAddress ?? "", businessName: inv.businessName ?? "", businessAbn: inv.businessAbn ?? "",
      status: inv.status, issueDate: inv.issueDate, dueDate: inv.dueDate, notes: inv.notes ?? "", taxRate: String(inv.taxRate),
      items: inv.items.length > 0 ? inv.items.map(it => ({ description: it.description, quantity: String(it.quantity), unitPrice: String(it.unitPrice) })) : [emptyItem()],
    });
    setOpen(true);
  }

  function setItem(i: number, field: string, value: string) {
    setForm(f => { const items = [...f.items]; items[i] = { ...items[i], [field]: value }; return { ...f, items }; });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.invoiceNumber || !form.clientName) return;
    setSaving(true);
    try {
      const payload = { ...form, taxRate: taxRate, items: form.items.filter(it => it.description).map(it => ({ description: it.description, quantity: parseFloat(it.quantity) || 1, unitPrice: parseFloat(it.unitPrice) || 0, amount: (parseFloat(it.quantity) || 1) * (parseFloat(it.unitPrice) || 0) })) };
      if (editId !== null) await updateInv.mutateAsync({ id: editId, data: payload as any });
      else await createInv.mutateAsync(payload as any);
      setOpen(false);
    } finally { setSaving(false); }
  }

  async function markPaid(inv: BusinessInvoice) {
    await updateInv.mutateAsync({ id: inv.id, data: { paid: true, status: "paid", paidDate: today() } as any });
  }

  if (isLoading) return <Skeleton className="h-96 w-full bg-muted/50 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search invoices…" className="pl-8 bg-muted/30 border-border h-8 text-sm" /></div>
        <div className="flex gap-1 bg-muted/30 border border-border rounded-md p-0.5">
          {["all", "draft", "sent", "paid", "overdue"].map(s => <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded text-xs capitalize transition-colors ${statusFilter === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>{s}</button>)}
        </div>
        <Button onClick={() => setAiOpen(true)} variant="outline" size="sm" className="gap-1.5 border-border text-muted-foreground h-8 text-xs"><Sparkles className="w-3 h-3" /> AI</Button>
        <Button onClick={openCreate} size="sm" disabled={!isOnline} className="gap-1.5 bg-primary text-primary-foreground h-8 text-xs"><Plus className="w-3.5 h-3.5" /> New Invoice</Button>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow className="border-border hover:bg-transparent">
              <TableHead className="text-muted-foreground text-xs w-28">Number</TableHead>
              <TableHead className="text-muted-foreground text-xs">Client</TableHead>
              <TableHead className="text-muted-foreground text-xs w-24">Issued</TableHead>
              <TableHead className="text-muted-foreground text-xs w-24">Due</TableHead>
              <TableHead className="text-muted-foreground text-xs w-24">Status</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right w-28">Total</TableHead>
              <TableHead className="w-24" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(inv => {
              const cfg = STATUS_CONFIG[inv.status] ?? STATUS_CONFIG.draft;
              return (
                <TableRow key={inv.id} className="border-border/40 group">
                  <TableCell className="font-mono text-xs text-primary">{inv.invoiceNumber}</TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{inv.clientName}</div>
                    {inv.clientEmail && <div className="text-xs text-muted-foreground">{inv.clientEmail}</div>}
                  </TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{inv.issueDate}</TableCell>
                  <TableCell className="font-mono text-xs text-muted-foreground">{inv.dueDate}</TableCell>
                  <TableCell><span className={`text-[10px] px-2 py-0.5 rounded-full border ${cfg.color}`}>{cfg.label}</span></TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmtFull(inv.total)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      {!inv.paid && inv.status !== "cancelled" && <button onClick={() => markPaid(inv)} title="Mark paid" className="p-1 text-emerald-500 hover:bg-emerald-500/10 rounded"><Check className="w-3.5 h-3.5" /></button>}
                      <button onClick={() => printInvoice(inv)} title="Print" className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"><Printer className="w-3.5 h-3.5" /></button>
                      <button onClick={() => openEdit(inv)} className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={async () => { if (!isOnline) { toast.error("You're offline — changes cannot be saved."); return; } if (!demoConfirm("Delete invoice?")) return; await deleteInv.mutateAsync(inv.id); }} className="p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground text-sm">No invoices yet.</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) setEditId(null); }}>
        <DialogContent className="bg-card border-border max-w-2xl max-w-[95vw] max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-xl">{editId ? "Edit Invoice" : "New Invoice"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Invoice Number *</Label><Input value={form.invoiceNumber} onChange={e => setForm(f => ({...f, invoiceNumber: e.target.value}))} className="bg-muted/30 border-border font-mono" required /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Status</Label>
                <select value={form.status} onChange={e => setForm(f => ({...f, status: e.target.value}))} className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground">
                  {Object.entries(STATUS_CONFIG).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Client Name *</Label>
                <Input value={form.clientName} onChange={e => setForm(f => ({...f, clientName: e.target.value}))} list="client-names" className="bg-muted/30 border-border" required />
                <datalist id="client-names">{(clients as BusinessClient[]).map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Client Email</Label><Input value={form.clientEmail} onChange={e => setForm(f => ({...f, clientEmail: e.target.value}))} type="email" className="bg-muted/30 border-border" /></div>
            </div>
            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Client Address</Label><Input value={form.clientAddress} onChange={e => setForm(f => ({...f, clientAddress: e.target.value}))} className="bg-muted/30 border-border" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Your Business Name</Label><Input value={form.businessName} onChange={e => setForm(f => ({...f, businessName: e.target.value}))} className="bg-muted/30 border-border" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">ABN</Label><Input value={form.businessAbn} onChange={e => setForm(f => ({...f, businessAbn: e.target.value}))} className="bg-muted/30 border-border font-mono" /></div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Issue Date</Label><Input type="date" value={form.issueDate} onChange={e => setForm(f => ({...f, issueDate: e.target.value}))} className="bg-muted/30 border-border" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Due Date</Label><Input type="date" value={form.dueDate} onChange={e => setForm(f => ({...f, dueDate: e.target.value}))} className="bg-muted/30 border-border" /></div>
              <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">GST Rate (%)</Label><Input type="number" value={form.taxRate} onChange={e => setForm(f => ({...f, taxRate: e.target.value}))} className="bg-muted/30 border-border font-mono" /></div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2"><Label className="text-xs text-muted-foreground">Line Items</Label><button type="button" onClick={() => setForm(f => ({...f, items: [...f.items, emptyItem()]}))} className="text-xs text-primary hover:underline flex items-center gap-1"><Plus className="w-3 h-3" /> Add line</button></div>
              <div className="space-y-1.5">
                <div className="grid grid-cols-12 gap-1 text-[10px] text-muted-foreground px-1"><span className="col-span-6">Description</span><span className="col-span-2 text-right">Qty</span><span className="col-span-3 text-right">Unit Price</span><span className="col-span-1" /></div>
                {form.items.map((item, i) => (
                  <div key={i} className="grid grid-cols-12 gap-1 items-center">
                    <Input value={item.description} onChange={e => setItem(i, "description", e.target.value)} placeholder="Description…" className="col-span-6 bg-muted/30 border-border h-8 text-sm" />
                    <Input type="number" value={item.quantity} onChange={e => setItem(i, "quantity", e.target.value)} className="col-span-2 bg-muted/30 border-border h-8 text-sm font-mono text-right" />
                    <Input type="number" value={item.unitPrice} onChange={e => setItem(i, "unitPrice", e.target.value)} placeholder="0.00" className="col-span-3 bg-muted/30 border-border h-8 text-sm font-mono text-right" />
                    <button type="button" onClick={() => setForm(f => ({...f, items: f.items.filter((_, j) => j !== i)}))} className="col-span-1 flex items-center justify-center text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>
              <div className="mt-3 space-y-1 text-sm border-t border-border pt-3">
                <div className="flex justify-between text-muted-foreground"><span>Subtotal</span><span className="font-mono">{fmtFull(subtotal)}</span></div>
                <div className="flex justify-between text-muted-foreground"><span>GST ({taxRate}%)</span><span className="font-mono">{fmtFull(tax)}</span></div>
                <div className="flex justify-between text-foreground font-semibold text-base"><span>Total</span><span className="font-mono text-primary">{fmtFull(total)}</span></div>
              </div>
            </div>

            <div className="space-y-1.5"><Label className="text-xs text-muted-foreground">Notes</Label><textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} placeholder="Payment terms, bank details…" className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving || !isOnline} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving ? "Saving…" : editId ? "Save Changes" : "Create Invoice"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} title="Invoice AI Analysis" suggestions={["What is my average invoice value?","Which invoices are at risk of going overdue?","What is my invoice-to-payment conversion rate?","Suggest professional invoice payment terms","Which clients have the highest outstanding balance?"]} />
    </div>
  );
}

// ─── Clients ────────────────────────────────────────────────────────────────

type ClientForm = { name: string; email: string; phone: string; company: string; abn: string; address: string; notes: string };
const emptyClientForm: ClientForm = { name: "", email: "", phone: "", company: "", abn: "", address: "", notes: "" };

function Clients() {
  const { data: clients = [], isLoading } = useBusinessClients();
  const createClient = useCreateClient(); const updateClient = useUpdateClient(); const deleteClient = useDeleteClient();
  const isOnline = useOnlineStatus();
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyClientForm); const [saving, setSaving] = useState(false); const [search, setSearch] = useState("");

  const filtered = clients.filter(c => !search || c.name.toLowerCase().includes(search.toLowerCase()) || (c.company ?? "").toLowerCase().includes(search.toLowerCase()));

  function openCreate() { setEditId(null); setForm(emptyClientForm); setOpen(true); }
  function openEdit(c: BusinessClient) { setEditId(c.id); setForm({ name: c.name, email: c.email ?? "", phone: c.phone ?? "", company: c.company ?? "", abn: c.abn ?? "", address: c.address ?? "", notes: c.notes ?? "" }); setOpen(true); }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!form.name) return; setSaving(true);
    try { if (editId !== null) await updateClient.mutateAsync({ id: editId, data: form }); else await createClient.mutateAsync(form as any); setOpen(false); setForm(emptyClientForm); setEditId(null); } finally { setSaving(false); }
  }

  if (isLoading) return <Skeleton className="h-96 w-full bg-muted/50 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search clients…" className="pl-8 bg-muted/30 border-border h-8 text-sm" /></div>
        <Button onClick={openCreate} size="sm" disabled={!isOnline} className="gap-1.5 bg-primary text-primary-foreground h-8 text-xs"><Plus className="w-3.5 h-3.5" /> Add Client</Button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(c => (
          <Card key={c.id} className="bg-card border-border hover:border-primary/30 transition-colors group relative overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-serif text-sm font-bold">{c.name[0].toUpperCase()}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                  <button onClick={() => openEdit(c)} className="p-1 text-muted-foreground hover:text-foreground rounded"><Pencil className="w-3 h-3" /></button>
                  <button onClick={async () => { if (!isOnline) { toast.error("You're offline — changes cannot be saved."); return; } if (!demoConfirm("Delete client?")) return; await deleteClient.mutateAsync(c.id); }} className="p-1 text-muted-foreground hover:text-destructive rounded"><Trash2 className="w-3 h-3" /></button>
                </div>
              </div>
              <h3 className="font-semibold text-sm text-foreground">{c.name}</h3>
              {c.company && <p className="text-xs text-muted-foreground mt-0.5">{c.company}</p>}
              {c.email && <p className="text-xs text-muted-foreground/70 mt-0.5 truncate">{c.email}</p>}
              <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2">
                <div><p className="text-[10px] text-muted-foreground">Outstanding</p><p className={`text-sm font-mono font-medium ${c.outstanding > 0 ? "text-amber-400" : "text-muted-foreground"}`}>{fmt(c.outstanding)}</p></div>
                <div><p className="text-[10px] text-muted-foreground">Total Billed</p><p className="text-sm font-mono font-medium text-emerald-400">{fmt(c.totalBilled)}</p></div>
              </div>
              {c.abn && <p className="text-[10px] text-muted-foreground/50 mt-2 font-mono">ABN {c.abn}</p>}
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && <div className="col-span-3 text-center py-16 text-muted-foreground text-sm">No clients yet. Add your first client.</div>}
      </div>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm(emptyClientForm); } }}>
        <DialogContent className="bg-card border-border max-w-md max-w-[95vw]">
          <DialogHeader><DialogTitle className="font-serif text-xl">{editId ? "Edit Client" : "New Client"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Full Name *</Label><Input value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} className="bg-muted/30 border-border" required /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Company</Label><Input value={form.company} onChange={e => setForm(f => ({...f, company: e.target.value}))} className="bg-muted/30 border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} className="bg-muted/30 border-border" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Phone</Label><Input value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} className="bg-muted/30 border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">ABN</Label><Input value={form.abn} onChange={e => setForm(f => ({...f, abn: e.target.value}))} className="bg-muted/30 border-border font-mono" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Address</Label><Input value={form.address} onChange={e => setForm(f => ({...f, address: e.target.value}))} className="bg-muted/30 border-border" /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Notes</Label><textarea value={form.notes} onChange={e => setForm(f => ({...f, notes: e.target.value}))} rows={2} className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" /></div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving || !isOnline} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving ? "Saving…" : editId ? "Save" : "Add Client"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Expenses ────────────────────────────────────────────────────────────────

type ExpenseForm = { date: string; description: string; category: string; amount: string; supplier: string; taxDeductible: boolean; gstIncluded: boolean; notes: string };
const emptyExpenseForm: ExpenseForm = { date: today(), description: "", category: "other", amount: "", supplier: "", taxDeductible: true, gstIncluded: true, notes: "" };

function Expenses() {
  const { data: expenses = [], isLoading } = useBusinessExpenses();
  const createExp = useCreateExpense(); const updateExp = useUpdateExpense(); const deleteExp = useDeleteExpense();
  const isOnline = useOnlineStatus();
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ExpenseForm>(emptyExpenseForm); const [saving, setSaving] = useState(false); const [search, setSearch] = useState("");
  const [aiOpen, setAiOpen] = useState(false);

  const filtered = expenses.filter(e => !search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.supplier ?? "").toLowerCase().includes(search.toLowerCase()));
  const totalAmount = filtered.reduce((s, e) => s + e.amount, 0);
  const taxDedTotal = filtered.filter(e => e.taxDeductible).reduce((s, e) => s + e.amount, 0);
  const gstTotal = filtered.filter(e => e.gstIncluded).reduce((s, e) => s + (e.amount / 11), 0);

  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach(e => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [expenses]);

  function openCreate() { setEditId(null); setForm(emptyExpenseForm); setOpen(true); }
  function openEdit(e: BusinessExpense) { setEditId(e.id); setForm({ date: e.date, description: e.description, category: e.category, amount: String(e.amount), supplier: e.supplier ?? "", taxDeductible: e.taxDeductible, gstIncluded: e.gstIncluded, notes: e.notes ?? "" }); setOpen(true); }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault(); if (!form.description || !form.amount) return; setSaving(true);
    try { const payload = { ...form, amount: parseFloat(form.amount) }; if (editId !== null) await updateExp.mutateAsync({ id: editId, data: payload }); else await createExp.mutateAsync(payload as any); setOpen(false); setForm(emptyExpenseForm); setEditId(null); } finally { setSaving(false); }
  }

  if (isLoading) return <Skeleton className="h-96 w-full bg-muted/50 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search expenses…" className="pl-8 bg-muted/30 border-border h-8 text-sm" /></div>
        <Button onClick={() => setAiOpen(true)} variant="outline" size="sm" className="gap-1.5 border-border text-muted-foreground h-8 text-xs"><Sparkles className="w-3 h-3" /> AI</Button>
        <Button onClick={openCreate} size="sm" disabled={!isOnline} className="gap-1.5 bg-primary text-primary-foreground h-8 text-xs"><Plus className="w-3.5 h-3.5" /> Add Expense</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border bg-muted/10"><p className="text-xs text-muted-foreground mb-1">Total Expenses</p><p className="text-xl font-mono font-semibold text-foreground">{fmtFull(totalAmount)}</p></div>
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5"><p className="text-xs text-muted-foreground mb-1">Tax Deductible</p><p className="text-xl font-mono font-semibold text-primary">{fmtFull(taxDedTotal)}</p></div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"><p className="text-xs text-muted-foreground mb-1">GST Claimable</p><p className="text-xl font-mono font-semibold text-emerald-400">{fmtFull(gstTotal)}</p></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border col-span-2 overflow-hidden">
          <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/40"><TableRow className="border-border hover:bg-transparent"><TableHead className="text-muted-foreground text-xs w-24">Date</TableHead><TableHead className="text-muted-foreground text-xs">Description</TableHead><TableHead className="text-muted-foreground text-xs">Category</TableHead><TableHead className="text-muted-foreground text-xs">Supplier</TableHead><TableHead className="text-muted-foreground text-xs text-right w-24">Amount</TableHead><TableHead className="w-16" /></TableRow></TableHeader>
            <TableBody>
              {filtered.map(e => (
                <TableRow key={e.id} className="border-border/40 group">
                  <TableCell className="font-mono text-xs text-muted-foreground">{e.date}</TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{e.description}</div>
                    <div className="flex gap-1 mt-0.5">{e.taxDeductible && <span className="text-[9px] text-primary bg-primary/10 px-1 rounded">deductible</span>}{e.gstIncluded && <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1 rounded">GST</span>}</div>
                  </TableCell>
                  <TableCell><span className="text-[10px] text-muted-foreground bg-muted/30 px-1.5 py-0.5 rounded">{catLabel(e.category)}</span></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{e.supplier ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-sm">{fmtFull(e.amount)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEdit(e)} className="p-1 text-muted-foreground hover:text-foreground rounded"><Pencil className="w-3 h-3" /></button>
                      <button onClick={async () => { if (!isOnline) { toast.error("You're offline — changes cannot be saved."); return; } if (!demoConfirm("Delete expense?")) return; await deleteExp.mutateAsync(e.id); }} className="p-1 text-muted-foreground hover:text-destructive rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && <TableRow><TableCell colSpan={6} className="text-center h-24 text-muted-foreground text-sm">No expenses yet.</TableCell></TableRow>}
            </TableBody>
          </Table>
          </div>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground font-medium">Top Categories</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {catBreakdown.map(([cat, amt]) => (
              <div key={cat}>
                <div className="flex items-center justify-between mb-1"><span className="text-xs text-muted-foreground">{catLabel(cat)}</span><span className="text-xs font-mono text-foreground">{fmtFull(amt)}</span></div>
                <div className="h-1.5 rounded-full bg-muted/40"><div className="h-1.5 rounded-full bg-primary/60" style={{ width: `${Math.min(100, (amt / totalAmount) * 100)}%` }} /></div>
              </div>
            ))}
            {catBreakdown.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No expenses yet</p>}
          </CardContent>
        </Card>
      </div>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm(emptyExpenseForm); } }}>
        <DialogContent className="bg-card border-border max-w-md max-w-[95vw]">
          <DialogHeader><DialogTitle className="font-serif text-xl">{editId ? "Edit Expense" : "Log Expense"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="bg-muted/30 border-border" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Amount *</Label><Input type="number" step="0.01" value={form.amount} onChange={e => setForm(f => ({...f, amount: e.target.value}))} placeholder="0.00" className="bg-muted/30 border-border font-mono" required /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Description *</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} className="bg-muted/30 border-border" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Category</Label>
                <select value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))} className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary text-foreground">
                  {EXPENSE_CATS.map(c => <option key={c} value={c}>{catLabel(c)}</option>)}
                </select>
              </div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Supplier</Label><Input value={form.supplier} onChange={e => setForm(f => ({...f, supplier: e.target.value}))} className="bg-muted/30 border-border" /></div>
            </div>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"><input type="checkbox" checked={form.taxDeductible} onChange={e => setForm(f => ({...f, taxDeductible: e.target.checked}))} className="accent-primary" />Tax deductible</label>
              <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"><input type="checkbox" checked={form.gstIncluded} onChange={e => setForm(f => ({...f, gstIncluded: e.target.checked}))} className="accent-primary" />GST included</label>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving || !isOnline} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving ? "Saving…" : editId ? "Save" : "Log Expense"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AIPanel open={aiOpen} onClose={() => setAiOpen(false)} title="Expense AI Analysis" suggestions={["What are my largest expense categories?","What can I claim as tax deductions this year?","How does my spending compare month to month?","Which subscriptions or recurring expenses should I review?","Calculate my total GST credits claimable"]} />
    </div>
  );
}

// ─── Time Tracker ────────────────────────────────────────────────────────────

type TimeForm = { date: string; clientName: string; projectName: string; description: string; hours: string; hourlyRate: string; billable: boolean };
const emptyTimeForm: TimeForm = { date: today(), clientName: "", projectName: "", description: "", hours: "", hourlyRate: "", billable: true };

function TimeTracker() {
  const { data: entries = [], isLoading } = useTimeEntries();
  const { data: clients = [] } = useBusinessClients();
  const createEntry = useCreateTimeEntry(); const updateEntry = useUpdateTimeEntry(); const deleteEntry = useDeleteTimeEntry();
  const isOnline = useOnlineStatus();
  const [open, setOpen] = useState(false); const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TimeForm>(emptyTimeForm); const [saving, setSaving] = useState(false); const [search, setSearch] = useState("");

  const filtered = entries.filter(e => !search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.clientName ?? "").toLowerCase().includes(search.toLowerCase()) || (e.projectName ?? "").toLowerCase().includes(search.toLowerCase()));
  const totalHours = filtered.filter(e => e.billable).reduce((s, e) => s + e.hours, 0);
  const totalValue = filtered.filter(e => e.billable && e.hourlyRate).reduce((s, e) => s + e.hours * (e.hourlyRate ?? 0), 0);
  const unbilledHours = filtered.filter(e => e.billable && !e.invoiced).reduce((s, e) => s + e.hours, 0);

  function openCreate() { setEditId(null); setForm(emptyTimeForm); setOpen(true); }
  function openEdit(e: TimeEntry) { setEditId(e.id); setForm({ date: e.date, clientName: e.clientName ?? "", projectName: e.projectName ?? "", description: e.description, hours: String(e.hours), hourlyRate: e.hourlyRate ? String(e.hourlyRate) : "", billable: e.billable }); setOpen(true); }

  async function handleSubmit(ev: React.FormEvent) {
    ev.preventDefault(); if (!form.description || !form.hours) return; setSaving(true);
    try { const payload = { ...form, hours: parseFloat(form.hours), hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined }; if (editId !== null) await updateEntry.mutateAsync({ id: editId, data: payload }); else await createEntry.mutateAsync(payload as any); setOpen(false); setForm(emptyTimeForm); setEditId(null); } finally { setSaving(false); }
  }

  if (isLoading) return <Skeleton className="h-96 w-full bg-muted/50 rounded-xl" />;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" /><Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search entries…" className="pl-8 bg-muted/30 border-border h-8 text-sm" /></div>
        <Button onClick={openCreate} size="sm" disabled={!isOnline} className="gap-1.5 bg-primary text-primary-foreground h-8 text-xs"><Plus className="w-3.5 h-3.5" /> Log Time</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-xl border border-border bg-muted/10"><p className="text-xs text-muted-foreground mb-1">Total Billable Hours</p><p className="text-xl font-mono font-semibold text-foreground">{totalHours.toFixed(1)}h</p></div>
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5"><p className="text-xs text-muted-foreground mb-1">Unbilled Hours</p><p className="text-xl font-mono font-semibold text-primary">{unbilledHours.toFixed(1)}h</p></div>
        <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5"><p className="text-xs text-muted-foreground mb-1">Billable Value</p><p className="text-xl font-mono font-semibold text-emerald-400">{fmtFull(totalValue)}</p></div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted/40"><TableRow className="border-border hover:bg-transparent"><TableHead className="text-muted-foreground text-xs w-24">Date</TableHead><TableHead className="text-muted-foreground text-xs">Description</TableHead><TableHead className="text-muted-foreground text-xs">Client</TableHead><TableHead className="text-muted-foreground text-xs">Project</TableHead><TableHead className="text-muted-foreground text-xs text-right w-16">Hours</TableHead><TableHead className="text-muted-foreground text-xs text-right w-24">Value</TableHead><TableHead className="w-16" /></TableRow></TableHeader>
          <TableBody>
            {filtered.map(e => (
              <TableRow key={e.id} className="border-border/40 group">
                <TableCell className="font-mono text-xs text-muted-foreground">{e.date}</TableCell>
                <TableCell>
                  <div className="text-sm text-foreground">{e.description}</div>
                  <div className="flex gap-1 mt-0.5">{e.billable && !e.invoiced && <span className="text-[9px] text-amber-400 bg-amber-500/10 px-1 rounded">unbilled</span>}{e.invoiced && <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1 rounded">invoiced</span>}{!e.billable && <span className="text-[9px] text-muted-foreground bg-muted/30 px-1 rounded">non-billable</span>}</div>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.clientName ?? "—"}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{e.projectName ?? "—"}</TableCell>
                <TableCell className="text-right font-mono text-sm">{e.hours.toFixed(2)}h</TableCell>
                <TableCell className="text-right font-mono text-sm text-muted-foreground">{e.hourlyRate ? fmtFull(e.hours * e.hourlyRate) : "—"}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => openEdit(e)} className="p-1 text-muted-foreground hover:text-foreground rounded"><Pencil className="w-3 h-3" /></button>
                    <button onClick={async () => { if (!isOnline) { toast.error("You're offline — changes cannot be saved."); return; } if (!demoConfirm("Delete entry?")) return; await deleteEntry.mutateAsync(e.id); }} className="p-1 text-muted-foreground hover:text-destructive rounded"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && <TableRow><TableCell colSpan={7} className="text-center h-24 text-muted-foreground text-sm">No time entries yet. Log your first session.</TableCell></TableRow>}
          </TableBody>
        </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={o => { setOpen(o); if (!o) { setEditId(null); setForm(emptyTimeForm); } }}>
        <DialogContent className="bg-card border-border max-w-md max-w-[95vw]">
          <DialogHeader><DialogTitle className="font-serif text-xl">{editId ? "Edit Time Entry" : "Log Time"}</DialogTitle></DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-3 mt-2">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Date</Label><Input type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} className="bg-muted/30 border-border" /></div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Hours *</Label><Input type="number" step="0.25" min="0.25" value={form.hours} onChange={e => setForm(f => ({...f, hours: e.target.value}))} placeholder="0.00" className="bg-muted/30 border-border font-mono" required /></div>
            </div>
            <div className="space-y-1"><Label className="text-xs text-muted-foreground">Description *</Label><Input value={form.description} onChange={e => setForm(f => ({...f, description: e.target.value}))} placeholder="What did you work on?" className="bg-muted/30 border-border" required /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Client</Label>
                <Input value={form.clientName} onChange={e => setForm(f => ({...f, clientName: e.target.value}))} list="time-clients" className="bg-muted/30 border-border" />
                <datalist id="time-clients">{(clients as BusinessClient[]).map(c => <option key={c.id} value={c.name} />)}</datalist>
              </div>
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Project</Label><Input value={form.projectName} onChange={e => setForm(f => ({...f, projectName: e.target.value}))} className="bg-muted/30 border-border" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><Label className="text-xs text-muted-foreground">Hourly Rate ($)</Label><Input type="number" step="0.01" value={form.hourlyRate} onChange={e => setForm(f => ({...f, hourlyRate: e.target.value}))} placeholder="0.00" className="bg-muted/30 border-border font-mono" /></div>
              <div className="flex items-end pb-1"><label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer"><input type="checkbox" checked={form.billable} onChange={e => setForm(f => ({...f, billable: e.target.checked}))} className="accent-primary" />Billable</label></div>
            </div>
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving || !isOnline} className="bg-primary text-primary-foreground hover:bg-primary/90">{saving ? "Saving…" : editId ? "Save" : "Log Time"}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomeOffice() {
  const [tab, setTab] = useState<Tab>("dashboard");

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Briefcase className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-serif text-foreground">Home Office</h1>
          </div>
          <p className="text-muted-foreground text-sm">Business management — invoicing, clients, expenses &amp; time tracking</p>
        </div>
      </div>

      <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dashboard" && <Dashboard onTabChange={setTab} />}
      {tab === "invoices" && <Invoices />}
      {tab === "clients" && <Clients />}
      {tab === "expenses" && <Expenses />}
      {tab === "time" && <TimeTracker />}
    </div>
  );
}
