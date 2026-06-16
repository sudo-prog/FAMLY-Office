import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListTransactions, getListTransactionsQueryKey,
  useCreateTransaction, useUpdateTransaction, useDeleteTransaction,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Pencil, Trash2, Sparkles, Receipt, TrendingDown, TrendingUp, Tag } from "lucide-react";
import { AIPanel } from "@/components/ai-panel";

const CATEGORIES = [
  "salary", "dividend", "rental", "interest", "investment",
  "mortgage", "utilities", "insurance", "professional_services",
  "home_office", "personal", "other",
];

const TAX_TAGS = [
  { value: "", label: "— No tax tag —" },
  { value: "assessable_income", label: "Assessable Income" },
  { value: "exempt_income", label: "Exempt Income" },
  { value: "capital_gain", label: "Capital Gain (CGT event)" },
  { value: "capital_loss", label: "Capital Loss" },
  { value: "deductible", label: "Tax Deductible Expense" },
  { value: "non_deductible", label: "Non-Deductible Expense" },
  { value: "gst_included", label: "GST Included" },
  { value: "gst_free", label: "GST Free" },
  { value: "super_contribution", label: "Super Contribution (concessional)" },
  { value: "super_non_concessional", label: "Super Contribution (non-concessional)" },
  { value: "franked_dividend", label: "Franked Dividend" },
  { value: "unfranked_dividend", label: "Unfranked Dividend" },
  { value: "foreign_income", label: "Foreign Source Income" },
  { value: "private_use", label: "Private Use / FBT" },
];

const TAX_TAG_COLORS: Record<string, string> = {
  assessable_income: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  exempt_income: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5",
  capital_gain: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  capital_loss: "text-red-400 border-red-500/40 bg-red-500/10",
  deductible: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  non_deductible: "text-muted-foreground border-border bg-muted/20",
  gst_included: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  gst_free: "text-purple-300 border-purple-400/30 bg-purple-400/5",
  super_contribution: "text-primary border-primary/40 bg-primary/10",
  super_non_concessional: "text-primary border-primary/30 bg-primary/5",
  franked_dividend: "text-emerald-500 border-emerald-600/40 bg-emerald-600/10",
  unfranked_dividend: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5",
  foreign_income: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  private_use: "text-red-300 border-red-400/30 bg-red-400/5",
};

function fmtCur(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(v);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function taxTagLabel(value: string) {
  return TAX_TAGS.find((t) => t.value === value)?.label ?? value;
}

const today = new Date().toISOString().slice(0, 10);
type TxForm = { description: string; amount: string; type: string; category: string; date: string; taxDeductible: boolean; taxTag: string };
const emptyForm: TxForm = { description: "", amount: "", type: "expense", category: "other", date: today, taxDeductible: false, taxTag: "" };

export default function Transactions() {
  const qc = useQueryClient();
  const { data: transactions, isLoading } = useListTransactions();
  const createTx = useCreateTransaction();
  const updateTx = useUpdateTransaction();
  const deleteTx = useDeleteTransaction();

  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<TxForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [showTaxSummary, setShowTaxSummary] = useState(false);

  const filtered = (transactions ?? []).filter((tx) => {
    const matchType = typeFilter === "all" || tx.type === typeFilter;
    const matchSearch = !search || tx.description.toLowerCase().includes(search.toLowerCase()) || (tx.category ?? "").toLowerCase().includes(search.toLowerCase());
    return matchType && matchSearch;
  });

  const totalIncome = (transactions ?? []).filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = (transactions ?? []).filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalDeductible = (transactions ?? []).filter((t) => t.taxDeductible).reduce((s, t) => s + Number(t.amount), 0);

  const taxTagSummary = TAX_TAGS.slice(1).reduce<Record<string, { count: number; total: number }>>((acc, tag) => {
    const matching = (transactions ?? []).filter((t) => (t as any).taxTag === tag.value);
    if (matching.length > 0) {
      acc[tag.value] = {
        count: matching.length,
        total: matching.reduce((s, t) => s + Number(t.amount), 0),
      };
    }
    return acc;
  }, {});

  function openAdd() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(tx: NonNullable<typeof transactions>[number]) {
    setEditId(tx.id);
    setForm({
      description: tx.description, amount: String(tx.amount), type: tx.type,
      category: tx.category ?? "other", date: tx.date,
      taxDeductible: tx.taxDeductible,
      taxTag: (tx as any).taxTag ?? "",
    });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      const payload = {
        description: form.description, amount: parseFloat(form.amount),
        type: form.type as any, category: form.category, date: form.date,
        taxDeductible: form.taxDeductible,
        taxTag: form.taxTag || null,
      };
      if (editId !== null) {
        await updateTx.mutateAsync({ id: editId, data: payload as any });
      } else {
        await createTx.mutateAsync(payload as any);
      }
      await qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      setOpen(false); setForm(emptyForm); setEditId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this transaction?")) return;
    await deleteTx.mutateAsync(id);
    await qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56 bg-muted/50 rounded" />
        <Skeleton className="h-[600px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Transaction Ledger</h1>
          <p className="text-muted-foreground text-sm">
            <span className="text-emerald-500 font-mono">+{fmtCur(totalIncome)}</span>
            <span className="text-muted-foreground"> income &middot; </span>
            <span className="font-mono">{fmtCur(totalExpenses)}</span>
            <span className="text-muted-foreground"> expenses &middot; </span>
            <span className="text-blue-400 font-mono">{fmtCur(totalDeductible)}</span>
            <span className="text-muted-foreground"> deductible</span>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setShowTaxSummary(!showTaxSummary)} variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground">
            <Tag className="w-4 h-4" /> Tax Summary
          </Button>
          <Button onClick={() => setAiOpen(true)} variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground">
            <Sparkles className="w-4 h-4" /> AI Insights
          </Button>
          <Button onClick={openAdd} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" /> New Transaction
          </Button>
        </div>
      </div>

      {showTaxSummary && (
        <Card className="bg-card border-border overflow-hidden">
          <div className="p-5 border-b border-border flex items-center gap-2">
            <Receipt className="w-4 h-4 text-primary" />
            <h2 className="text-sm font-semibold text-foreground">Tax Summary by Category</h2>
            <span className="ml-auto text-xs text-muted-foreground">Australian FY categorisation</span>
          </div>
          {Object.keys(taxTagSummary).length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              No tax tags assigned yet. Edit transactions to add ATO tax categories.
            </div>
          ) : (
            <div className="p-4 grid grid-cols-2 gap-3">
              {Object.entries(taxTagSummary).map(([tag, { count, total }]) => (
                <div key={tag} className={`flex items-center justify-between rounded-lg border px-4 py-3 ${TAX_TAG_COLORS[tag] ?? "border-border bg-muted/20"}`}>
                  <div>
                    <div className="text-xs font-medium">{taxTagLabel(tag)}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{count} transaction{count !== 1 ? "s" : ""}</div>
                  </div>
                  <div className="font-mono text-sm tabular-nums font-semibold">{fmtCur(total)}</div>
                </div>
              ))}
            </div>
          )}
          <div className="px-5 pb-4 flex gap-6 border-t border-border pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs text-muted-foreground">Total Deductible:</span>
              <span className="text-xs font-mono text-blue-400">{fmtCur(totalDeductible)}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-xs text-muted-foreground">Total Income:</span>
              <span className="text-xs font-mono text-emerald-400">{fmtCur(totalIncome)}</span>
            </div>
          </div>
        </Card>
      )}

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search description or category…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-border" />
        </div>
        <div className="flex gap-1 bg-muted/30 border border-border rounded-md p-1">
          {(["all", "income", "expense", "transfer"] as const).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground w-32">Date</TableHead>
                <TableHead className="font-medium text-muted-foreground">Description</TableHead>
                <TableHead className="font-medium text-muted-foreground w-24">Type</TableHead>
                <TableHead className="font-medium text-muted-foreground">Category</TableHead>
                <TableHead className="font-medium text-muted-foreground">Tax Tag</TableHead>
                <TableHead className="text-right font-medium text-muted-foreground w-32">Amount</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((tx) => (
                <TableRow key={tx.id} className="border-border hover:bg-muted/30 group cursor-pointer" onClick={() => openEdit(tx)}>
                  <TableCell className="text-muted-foreground text-sm tabular-nums">{formatDate(tx.date)}</TableCell>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      {tx.description}
                      {tx.taxDeductible && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/50 text-primary bg-primary/10 rounded-sm">Deductible</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs font-medium uppercase tracking-wider ${tx.type === "income" ? "text-emerald-500" : tx.type === "expense" ? "text-destructive" : "text-blue-400"}`}>
                      {tx.type}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{tx.category ? formatCategory(tx.category) : "—"}</TableCell>
                  <TableCell>
                    {(tx as any).taxTag ? (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-sm border font-medium ${TAX_TAG_COLORS[(tx as any).taxTag] ?? "border-border text-muted-foreground"}`}>
                        {taxTagLabel((tx as any).taxTag)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </TableCell>
                  <TableCell className={`text-right font-mono tabular-nums ${tx.type === "income" ? "text-emerald-500" : "text-foreground"}`}>
                    {tx.type === "expense" ? "−" : tx.type === "income" ? "+" : ""}{fmtCur(Number(tx.amount))}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEdit(tx)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(tx.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="h-28 text-center text-muted-foreground text-sm">
                    {search || typeFilter !== "all" ? "No transactions match your filters." : "No transactions yet."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <AIPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="Transaction Insights"
        suggestions={[
          "Analyze my spending patterns over the past 12 months",
          "Which expense categories have the highest tax deductible potential?",
          "Identify unusual or recurring transactions worth reviewing",
          "What is my net cash flow trend and is it improving?",
          "Summarize all tax-deductible expenses for this financial year",
          "Flag any transactions that look like they could be categorized differently",
        ]}
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editId ? "Edit Transaction" : "New Transaction"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Description *</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="e.g. Rental Income — Harbour Apt" className="bg-muted/30 border-border" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Type *</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  <option value="income">Income</option>
                  <option value="expense">Expense</option>
                  <option value="transfer">Transfer</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Amount *</Label>
                <Input type="number" step="0.01" min="0" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="0.00" className="bg-muted/30 border-border font-mono" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Category</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{formatCategory(c)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Date *</Label>
                <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-muted/30 border-border" required />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground flex items-center gap-1.5"><Tag className="w-3 h-3" /> ATO Tax Tag</Label>
              <select value={form.taxTag} onChange={(e) => setForm({ ...form, taxTag: e.target.value })}
                className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                {TAX_TAGS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2.5">
              <input id="taxded" type="checkbox" checked={form.taxDeductible} onChange={(e) => setForm({ ...form, taxDeductible: e.target.checked })} className="w-4 h-4 accent-primary" />
              <Label htmlFor="taxded" className="text-sm text-muted-foreground cursor-pointer">Mark as tax deductible expense</Label>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(emptyForm); setEditId(null); }} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Transaction"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
