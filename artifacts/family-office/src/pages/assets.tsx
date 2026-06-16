import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAssets, getListAssetsQueryKey,
  useCreateAsset, useDeleteAsset,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Trash2 } from "lucide-react";

const CATEGORIES = ["bank_account", "property", "investment", "crypto", "superannuation", "business", "bond", "other"];
const CURRENCIES = ["AUD", "USD", "EUR", "GBP", "CAD", "SGD"];

function formatCurrency(value: number, currency = "USD") {
  return new Intl.NumberFormat("en-US", { style: "currency", currency, maximumFractionDigits: 0 }).format(value);
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const emptyForm = { name: "", category: "bank_account", value: "", currency: "AUD", institution: "", notes: "" };

export default function Assets() {
  const qc = useQueryClient();
  const { data: assets, isLoading } = useListAssets();
  const createAsset = useCreateAsset();
  const deleteAsset = useDeleteAsset();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = (assets ?? []).filter((a) =>
    !search || a.name.toLowerCase().includes(search.toLowerCase()) || a.category.includes(search.toLowerCase()) || (a.institution ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const totalValue = (assets ?? []).reduce((s, a) => s + a.value, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.value) return;
    setSaving(true);
    try {
      await createAsset.mutateAsync({
        name: form.name,
        category: form.category as any,
        value: parseFloat(form.value),
        currency: form.currency,
        institution: form.institution || undefined,
        notes: form.notes || undefined,
      } as any);
      await qc.invalidateQueries({ queryKey: getListAssetsQueryKey() });
      setOpen(false);
      setForm(emptyForm);
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
        <div className="flex gap-3">
          <Skeleton className="h-9 flex-1 bg-muted/50 rounded" />
          <Skeleton className="h-9 w-32 bg-muted/50 rounded" />
        </div>
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
            {assets?.length ?? 0} holdings &middot; {formatCurrency(totalValue, "USD")} total
          </p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Asset
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, category, institution…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-muted/30 border-border"
        />
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
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((asset) => (
                <TableRow key={asset.id} className="border-border hover:bg-muted/30 group">
                  <TableCell className="font-medium">{asset.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm text-xs">
                      {formatCategory(asset.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{asset.institution || "—"}</TableCell>
                  <TableCell className="text-right font-mono text-foreground tabular-nums">
                    {formatCurrency(asset.value, asset.currency)}
                  </TableCell>
                  <TableCell>
                    <button
                      onClick={() => handleDelete(asset.id)}
                      className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-sm">
                    {search ? "No assets match your search." : "No assets yet. Add your first holding."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">New Asset</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-sm text-muted-foreground">Name *</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Sydney Apartment" className="bg-muted/30 border-border" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="category" className="text-sm text-muted-foreground">Category *</Label>
                <select
                  id="category"
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CATEGORIES.map((c) => <option key={c} value={c}>{formatCategory(c)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="currency" className="text-sm text-muted-foreground">Currency</Label>
                <select
                  id="currency"
                  value={form.currency}
                  onChange={(e) => setForm({ ...form, currency: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="value" className="text-sm text-muted-foreground">Current Value *</Label>
              <Input id="value" type="number" step="0.01" min="0" value={form.value} onChange={(e) => setForm({ ...form, value: e.target.value })} placeholder="0.00" className="bg-muted/30 border-border font-mono" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="institution" className="text-sm text-muted-foreground">Institution / Custodian</Label>
              <Input id="institution" value={form.institution} onChange={(e) => setForm({ ...form, institution: e.target.value })} placeholder="e.g. ANZ Bank" className="bg-muted/30 border-border" />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="notes" className="text-sm text-muted-foreground">Notes</Label>
              <Input id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="bg-muted/30 border-border" />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(emptyForm); }} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : "Add Asset"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
