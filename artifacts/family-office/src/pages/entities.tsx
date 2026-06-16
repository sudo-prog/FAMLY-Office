import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListEntities, getListEntitiesQueryKey,
  useCreateEntity,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Building2, User, Shield } from "lucide-react";

const ENTITY_TYPES = ["trust", "company", "individual", "partnership", "fund", "other"];

const TYPE_ICONS: Record<string, React.ElementType> = {
  trust: Shield,
  company: Building2,
  individual: User,
  partnership: Building2,
};

const emptyForm = { name: "", type: "trust", jurisdiction: "", abn: "", acn: "", notes: "" };

function formatType(t: string) {
  return t.charAt(0).toUpperCase() + t.slice(1);
}

export default function Entities() {
  const qc = useQueryClient();
  const { data: entities, isLoading } = useListEntities();
  const createEntity = useCreateEntity();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = (entities ?? []).filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.type.includes(search.toLowerCase()) || (e.jurisdiction ?? "").toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      await createEntity.mutateAsync({
        name: form.name,
        type: form.type as any,
        jurisdiction: form.jurisdiction || undefined,
        abn: form.abn || undefined,
        acn: form.acn || undefined,
        notes: form.notes || undefined,
      } as any);
      await qc.invalidateQueries({ queryKey: getListEntitiesQueryKey() });
      setOpen(false);
      setForm(emptyForm);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[400px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Legal Entities</h1>
          <p className="text-muted-foreground text-sm">{entities?.length ?? 0} corporate structures and trusts.</p>
        </div>
        <Button onClick={() => setOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> New Entity
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by name, type, jurisdiction…"
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
                <TableHead className="font-medium text-muted-foreground w-28">Type</TableHead>
                <TableHead className="font-medium text-muted-foreground">Jurisdiction</TableHead>
                <TableHead className="font-medium text-muted-foreground">ABN / ACN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((entity) => {
                const Icon = TYPE_ICONS[entity.type] ?? Building2;
                return (
                  <TableRow key={entity.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span>{entity.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm text-xs">
                        {formatType(entity.type)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{entity.jurisdiction ?? "—"}</TableCell>
                    <TableCell className="text-muted-foreground font-mono text-sm">
                      {entity.abn ? `ABN: ${entity.abn}` : entity.acn ? `ACN: ${entity.acn}` : "—"}
                    </TableCell>
                  </TableRow>
                );
              })}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground text-sm">
                    {search ? "No entities match your search." : "No entities yet. Add your first structure."}
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
            <DialogTitle className="font-serif text-xl">New Entity</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="ename" className="text-sm text-muted-foreground">Name *</Label>
              <Input id="ename" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Smith Family Trust" className="bg-muted/30 border-border" required />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="etype" className="text-sm text-muted-foreground">Type *</Label>
                <select id="etype" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {ENTITY_TYPES.map((t) => <option key={t} value={t}>{formatType(t)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="juris" className="text-sm text-muted-foreground">Jurisdiction</Label>
                <Input id="juris" value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} placeholder="e.g. NSW, Australia" className="bg-muted/30 border-border" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="abn" className="text-sm text-muted-foreground">ABN</Label>
                <Input id="abn" value={form.abn} onChange={(e) => setForm({ ...form, abn: e.target.value })} placeholder="12 345 678 901" className="bg-muted/30 border-border font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="acn" className="text-sm text-muted-foreground">ACN</Label>
                <Input id="acn" value={form.acn} onChange={(e) => setForm({ ...form, acn: e.target.value })} placeholder="123 456 789" className="bg-muted/30 border-border font-mono" />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="enotes" className="text-sm text-muted-foreground">Notes</Label>
              <Input id="enotes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="bg-muted/30 border-border" />
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(emptyForm); }} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : "Add Entity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
