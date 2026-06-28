import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  useListEntities, getListEntitiesQueryKey,
  useCreateEntity, useUpdateEntity, useDeleteEntity,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { VirtualizedTable } from "@/components/ui/virtualized-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Search, Building2, User, Shield, Pencil, Trash2, ChevronRight } from "lucide-react";

const ENTITY_TYPES = ["trust", "company", "individual", "partnership", "fund", "other"];
const TYPE_ICONS: Record<string, React.ElementType> = { trust: Shield, company: Building2, individual: User, partnership: Building2 };

type EntityForm = { name: string; type: string; jurisdiction: string; abn: string; acn: string; notes: string };
const emptyForm: EntityForm = { name: "", type: "trust", jurisdiction: "", abn: "", acn: "", notes: "" };

function formatType(t: string) { return t.charAt(0).toUpperCase() + t.slice(1); }

export default function Entities() {
  const qc = useQueryClient();
  const [, navigate] = useLocation();
  const { data: entities, isLoading } = useListEntities();
  const createEntity = useCreateEntity();
  const updateEntity = useUpdateEntity();
  const deleteEntity = useDeleteEntity();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<EntityForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = (entities ?? []).filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.type.includes(search.toLowerCase()) ||
    (e.jurisdiction ?? "").toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(entity: NonNullable<typeof entities>[number], ev: React.MouseEvent) {
    ev.stopPropagation();
    setEditId(entity.id);
    setForm({ name: entity.name, type: entity.type, jurisdiction: entity.jurisdiction ?? "", abn: entity.abn ?? "", acn: entity.acn ?? "", notes: entity.notes ?? "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = { name: form.name, type: form.type as any, jurisdiction: form.jurisdiction || undefined, abn: form.abn || undefined, acn: form.acn || undefined, notes: form.notes || undefined };
      if (editId !== null) {
        await updateEntity.mutateAsync({ id: editId, data: payload as any });
      } else {
        await createEntity.mutateAsync(payload as any);
      }
      await qc.invalidateQueries({ queryKey: getListEntitiesQueryKey() });
      setOpen(false); setForm(emptyForm); setEditId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number, ev: React.MouseEvent) {
    ev.stopPropagation();
    if (!confirm("Delete this entity?")) return;
    await deleteEntity.mutateAsync({ id });
    await qc.invalidateQueries({ queryKey: getListEntitiesQueryKey() });
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
    <div className="space-y-4 md:space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-foreground mb-1">Legal Entities</h1>
          <p className="text-muted-foreground text-xs md:text-sm">{entities?.length ?? 0} corporate structures and trusts. Click a row to view details.</p>
        </div>
        <Button onClick={openAdd} size="sm" className="gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs flex-shrink-0">
          <Plus className="w-3.5 h-3.5" /> <span className="hidden sm:inline">New Entity</span><span className="sm:hidden">Add</span>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by name, type, jurisdiction…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-border" />
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <VirtualizedTable
          data={filtered}
          getRowKey={(entity) => entity.id}
          colCount={5}
          rowHeight={52}
          overscan={8}
          maxHeight={640}
          className="overflow-x-auto"
          header={
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground">Name</TableHead>
                <TableHead className="font-medium text-muted-foreground w-28">Type</TableHead>
                <TableHead className="font-medium text-muted-foreground">Jurisdiction</TableHead>
                <TableHead className="font-medium text-muted-foreground">ABN / ACN</TableHead>
                <TableHead className="w-24" />
              </TableRow>
            </TableHeader>
          }
          rowClassName="border-border hover:bg-muted/30 group cursor-pointer"
          renderCells={(entity) => {
            const Icon = TYPE_ICONS[entity.type] ?? Building2;
            return (
              <>
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
                <TableCell>
                  <div className="flex items-center gap-1">
                    <button onClick={(e) => openEdit(entity, e)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3.5 h-3.5" /></button>
                    <button onClick={(e) => handleDelete(entity.id, e)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
                  </div>
                </TableCell>
              </>
            );
          }}
          emptyState={search ? "No entities match your search." : "No entities yet. Add your first structure."}
        />
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editId ? "Edit Entity" : "New Entity"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Name *</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Smith Family Trust" className="bg-muted/30 border-border" required />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Type *</Label>
                <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {ENTITY_TYPES.map((t) => <option key={t} value={t}>{formatType(t)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Jurisdiction</Label>
                <Input value={form.jurisdiction} onChange={(e) => setForm({ ...form, jurisdiction: e.target.value })} placeholder="e.g. NSW, Australia" className="bg-muted/30 border-border" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">ABN</Label>
                <Input value={form.abn} onChange={(e) => setForm({ ...form, abn: e.target.value })} placeholder="12 345 678 901" className="bg-muted/30 border-border font-mono" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">ACN</Label>
                <Input value={form.acn} onChange={(e) => setForm({ ...form, acn: e.target.value })} placeholder="123 456 789" className="bg-muted/30 border-border font-mono" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Notes</Label>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional notes" className="bg-muted/30 border-border" />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(emptyForm); setEditId(null); }} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Entity"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
