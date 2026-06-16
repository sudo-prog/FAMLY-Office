import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAssets, getListAssetsQueryKey,
  useCreateAsset, useUpdateAsset, useDeleteAsset,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Plus, Search, Trash2, Pencil, Sparkles, Scale, ArrowRight, ArrowLeft } from "lucide-react";
import { getStoredCurrency, convert, type Currency } from "@/lib/currency";
import { AIPanel } from "@/components/ai-panel";

const CATEGORIES = ["bank_account", "property", "investment", "crypto", "superannuation", "business", "bond", "other"];
const CURRENCIES = ["AUD", "USD", "EUR", "GBP", "CAD", "SGD"];

const DEFAULT_TARGETS: Record<string, number> = {
  property: 35, investment: 25, superannuation: 15, bank_account: 10,
  business: 8, bond: 5, crypto: 2, other: 0,
};

function formatDisplay(value: number, assetCurrency: string) {
  const disp = getStoredCurrency();
  const sym: Record<Currency, string> = { USD: "$", AUD: "A$", EUR: "€", GBP: "£", CAD: "C$", SGD: "S$" };
  const converted = convert(value, assetCurrency as Currency, disp);
  return `${sym[disp]}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(converted))}`;
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function fmtNum(v: number) {
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(v));
}

function loadTargets(): Record<string, number> {
  try {
    const s = localStorage.getItem("fo-rebalance-targets");
    if (s) return JSON.parse(s);
  } catch {}
  return { ...DEFAULT_TARGETS };
}

function saveTargets(t: Record<string, number>) {
  localStorage.setItem("fo-rebalance-targets", JSON.stringify(t));
}

type AssetForm = { name: string; category: string; value: string; currency: string; institution: string; notes: string };
const emptyForm: AssetForm = { name: "", category: "bank_account", value: "", currency: "AUD", institution: "", notes: "" };

function RebalancingSheet({
  open, onClose, assets, totalValue,
}: {
  open: boolean; onClose: () => void;
  assets: NonNullable<ReturnType<typeof useListAssets>["data"]>;
  totalValue: number;
}) {
  const [targets, setTargets] = useState<Record<string, number>>(loadTargets);

  const disp = getStoredCurrency();
  const sym: Record<Currency, string> = { USD: "$", AUD: "A$", EUR: "€", GBP: "£", CAD: "C$", SGD: "S$" };
  const s = sym[disp];

  const byCategory: Record<string, number> = {};
  assets.forEach((a) => {
    const val = convert(Number(a.value), a.currency as Currency, disp);
    byCategory[a.category] = (byCategory[a.category] ?? 0) + val;
  });

  const totalTarget = Object.values(targets).reduce((s, v) => s + v, 0);

  function updateTarget(cat: string, val: number) {
    const next = { ...targets, [cat]: Math.max(0, Math.min(100, val)) };
    setTargets(next);
    saveTargets(next);
  }

  function resetTargets() {
    setTargets({ ...DEFAULT_TARGETS });
    saveTargets({ ...DEFAULT_TARGETS });
  }

  const rows = CATEGORIES.map((cat) => {
    const currentVal = byCategory[cat] ?? 0;
    const currentPct = totalValue > 0 ? (currentVal / totalValue) * 100 : 0;
    const targetPct = targets[cat] ?? 0;
    const gapPct = targetPct - currentPct;
    const gapVal = (gapPct / 100) * totalValue;
    return { cat, currentVal, currentPct, targetPct, gapPct, gapVal };
  }).filter((r) => r.currentVal > 0 || r.targetPct > 0);

  return (
    <Sheet open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <SheetContent side="right" className="bg-card border-border w-[600px] max-w-[95vw] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="font-serif text-xl flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Portfolio Rebalancer
          </SheetTitle>
          <p className="text-sm text-muted-foreground">Set target allocations and see the gap analysis. Data is saved locally.</p>
        </SheetHeader>

        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">Total targets: <span className={`font-mono ${Math.abs(totalTarget - 100) > 1 ? "text-destructive" : "text-emerald-500"}`}>{totalTarget.toFixed(0)}%</span> <span className="text-xs">(should be 100%)</span></div>
            <button onClick={resetTargets} className="text-xs text-muted-foreground hover:text-foreground transition-colors">Reset to defaults</button>
          </div>

          <Card className="bg-muted/20 border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr className="border-b border-border">
                    <th className="text-left text-xs font-medium text-muted-foreground px-4 py-2.5 w-32">Category</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Current</th>
                    <th className="text-center text-xs font-medium text-muted-foreground px-4 py-2.5 w-32">Target %</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Gap</th>
                    <th className="text-right text-xs font-medium text-muted-foreground px-4 py-2.5">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map(({ cat, currentVal, currentPct, targetPct, gapPct, gapVal }) => (
                    <tr key={cat} className="border-b border-border/50 hover:bg-muted/20">
                      <td className="px-4 py-3">
                        <span className="font-medium text-foreground text-xs">{formatCategory(cat)}</span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="font-mono text-xs tabular-nums">{s}{fmtNum(currentVal)}</div>
                        <div className="text-[10px] text-muted-foreground">{currentPct.toFixed(1)}%</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <input
                            type="range" min="0" max="100" step="1"
                            value={targetPct}
                            onChange={(e) => updateTarget(cat, Number(e.target.value))}
                            className="flex-1 h-1.5 accent-primary rounded cursor-pointer"
                          />
                          <span className="text-xs font-mono w-8 text-right tabular-nums">{targetPct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className={`font-mono text-xs tabular-nums ${Math.abs(gapPct) < 1 ? "text-muted-foreground" : gapPct > 0 ? "text-emerald-500" : "text-destructive"}`}>
                          {gapPct > 0 ? "+" : ""}{gapPct.toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {Math.abs(gapVal) < 100 ? (
                          <span className="text-[10px] text-emerald-500 font-medium">✓ On target</span>
                        ) : gapVal > 0 ? (
                          <div className="flex items-center justify-end gap-1 text-emerald-500">
                            <ArrowRight className="w-3 h-3" />
                            <span className="text-[10px] font-medium">Buy {s}{fmtNum(Math.abs(gapVal))}</span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-1 text-destructive">
                            <ArrowLeft className="w-3 h-3" />
                            <span className="text-[10px] font-medium">Reduce {s}{fmtNum(Math.abs(gapVal))}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <div className="text-[11px] text-muted-foreground bg-muted/20 border border-border rounded-lg px-4 py-3">
            <strong className="text-foreground">Disclaimer:</strong> These are indicative rebalancing suggestions only. Consult your financial adviser before making investment decisions. Values are converted to your display currency and may vary with exchange rates.
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default function Assets() {
  const qc = useQueryClient();
  const { data: assets, isLoading } = useListAssets();
  const createAsset = useCreateAsset();
  const updateAsset = useUpdateAsset();
  const deleteAsset = useDeleteAsset();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AssetForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [rebalanceOpen, setRebalanceOpen] = useState(false);

  const filtered = (assets ?? []).filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.category.includes(search.toLowerCase()) ||
    (a.institution ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const disp = getStoredCurrency();
  const sym: Record<Currency, string> = { USD: "$", AUD: "A$", EUR: "€", GBP: "£", CAD: "C$", SGD: "S$" };
  const totalValue = (assets ?? []).reduce((s, a) => s + convert(Number(a.value), a.currency as Currency, disp), 0);

  function openAdd() { setEditId(null); setForm(emptyForm); setOpen(true); }

  function openEdit(a: NonNullable<typeof assets>[number]) {
    setEditId(a.id);
    setForm({ name: a.name, category: a.category, value: String(a.value), currency: a.currency, institution: a.institution ?? "", notes: a.notes ?? "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.value) return;
    setSaving(true);
    try {
      const payload = { name: form.name, category: form.category as any, value: parseFloat(form.value), currency: form.currency, institution: form.institution || undefined, notes: form.notes || undefined };
      if (editId !== null) {
        await updateAsset.mutateAsync({ id: editId, data: payload as any });
      } else {
        await createAsset.mutateAsync(payload as any);
      }
      await qc.invalidateQueries({ queryKey: getListAssetsQueryKey() });
      setOpen(false);
      setForm(emptyForm);
      setEditId(null);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this asset?")) return;
    await deleteAsset.mutateAsync(id);
    await qc.invalidateQueries({ queryKey: getListAssetsQueryKey() });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-9 w-full bg-muted/50 rounded" />
        <Skeleton className="h-[400px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Asset Register</h1>
          <p className="text-muted-foreground text-sm">
            {assets?.length ?? 0} holdings &middot; {sym[disp]}{new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(Math.round(totalValue))} total
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setRebalanceOpen(true)} variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground">
            <Scale className="w-4 h-4" /> Rebalance
          </Button>
          <Button onClick={() => setAiOpen(true)} variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground">
            <Sparkles className="w-4 h-4" /> AI Analysis
          </Button>
          <Button onClick={openAdd} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" /> New Asset
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, category, institution…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-border" />
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground">Name</TableHead>
                <TableHead className="font-medium text-muted-foreground">Category</TableHead>
                <TableHead className="font-medium text-muted-foreground">Institution</TableHead>
                <TableHead className="text-right font-medium text-muted-foreground">Value</TableHead>
                <TableHead className="text-right font-medium text-muted-foreground w-16">% of Portfolio</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((asset) => {
                const val = convert(Number(asset.value), asset.currency as Currency, disp);
                const pct = totalValue > 0 ? (val / totalValue) * 100 : 0;
                return (
                  <TableRow key={asset.id} className="border-border hover:bg-muted/30 group cursor-pointer" onClick={() => openEdit(asset)}>
                    <TableCell className="font-medium">{asset.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm text-xs">
                        {formatCategory(asset.category)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{asset.institution || "—"}</TableCell>
                    <TableCell className="text-right font-mono text-foreground tabular-nums">
                      {formatDisplay(Number(asset.value), asset.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="w-16 h-1.5 bg-muted/50 rounded-full overflow-hidden">
                          <div className="h-full bg-primary/70 rounded-full" style={{ width: `${Math.min(pct, 100)}%` }} />
                        </div>
                        <span className="text-xs text-muted-foreground tabular-nums w-8">{pct.toFixed(0)}%</span>
                      </div>
                    </TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={(e) => { e.stopPropagation(); openEdit(asset); }} className="text-muted-foreground hover:text-foreground p-1">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(asset.id); }} className="text-muted-foreground hover:text-destructive p-1">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="h-28 text-center text-muted-foreground text-sm">
                    {search ? "No assets match your search." : "No assets yet. Add your first holding."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <RebalancingSheet
        open={rebalanceOpen}
        onClose={() => setRebalanceOpen(false)}
        assets={assets ?? []}
        totalValue={totalValue}
      />

      <AIPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="Portfolio Analysis"
        suggestions={[
          "Analyze my portfolio concentration risk and suggest diversification",
          "Which assets are underperforming and should be reviewed?",
          "Identify tax optimization opportunities across my holdings",
          "What is my exposure to interest rate risk?",
          "Suggest a rebalancing strategy for my current allocation",
          "Compare my asset allocation to typical family office benchmarks",
        ]}
      />

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editId ? "Edit Asset" : "New Asset"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sydney Apartment" className="bg-muted/30 border-border" required />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Category *</Label>
                <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{formatCategory(c)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Currency</Label>
                <select value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Current Value *</Label>
              <Input type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0.00" className="bg-muted/30 border-border font-mono" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Institution / Custodian</Label>
              <Input value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="e.g. ANZ Bank" className="bg-muted/30 border-border" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="bg-muted/30 border-border" />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(emptyForm); setEditId(null); }} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
