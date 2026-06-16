import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDocuments, getListDocumentsQueryKey,
  useCreateDocument, useUpdateDocument, useDeleteDocument,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Lock, Plus, Search, Pencil, Trash2 } from "lucide-react";

const FILE_TYPES = ["pdf", "contract", "tax", "insurance", "statement", "deed", "certificate", "other"];
const curYear = String(new Date().getFullYear());

type DocForm = { title: string; description: string; fileType: string; year: string; encrypted: boolean };
const emptyForm: DocForm = { title: "", description: "", fileType: "pdf", year: curYear, encrypted: true };

export default function Vault() {
  const qc = useQueryClient();
  const { data: documents, isLoading } = useListDocuments();
  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();
  const deleteDoc = useDeleteDocument();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<DocForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = (documents ?? []).filter((d) =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) ||
    (d.description ?? "").toLowerCase().includes(search.toLowerCase()) ||
    d.fileType.toLowerCase().includes(search.toLowerCase())
  );

  function openAdd() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(d: NonNullable<typeof documents>[number]) {
    setEditId(d.id);
    setForm({ title: d.title, description: d.description ?? "", fileType: d.fileType, year: d.year ? String(d.year) : "", encrypted: d.encrypted });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description || undefined, fileType: form.fileType as any, year: form.year ? parseInt(form.year) : undefined, encrypted: form.encrypted };
      if (editId !== null) {
        await updateDoc.mutateAsync({ id: editId, data: payload as any });
      } else {
        await createDoc.mutateAsync(payload as any);
      }
      await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      setOpen(false); setForm(emptyForm); setEditId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this document record?")) return;
    await deleteDoc.mutateAsync(id);
    await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[600px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Document Vault</h1>
          <p className="text-muted-foreground text-sm">{documents?.length ?? 0} documents &middot; Encrypted secure storage.</p>
        </div>
        <Button onClick={openAdd} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Document
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search by title, type, description…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-border" />
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground">Title</TableHead>
                <TableHead className="font-medium text-muted-foreground w-28">Type</TableHead>
                <TableHead className="font-medium text-muted-foreground w-20">Year</TableHead>
                <TableHead className="font-medium text-muted-foreground w-28">Status</TableHead>
                <TableHead className="w-16" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow key={doc.id} className="border-border hover:bg-muted/30 group cursor-pointer" onClick={() => openEdit(doc)}>
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{doc.title}</span>
                      {doc.description && <span className="text-xs text-muted-foreground mt-0.5">{doc.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm capitalize text-xs">{doc.fileType}</Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{doc.year ?? "—"}</TableCell>
                  <TableCell>
                    {doc.encrypted && (
                      <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                        <Lock className="w-3 h-3" /> Encrypted
                      </div>
                    )}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => openEdit(doc)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => handleDelete(doc.id)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="h-28 text-center text-muted-foreground text-sm">
                    {search ? "No documents match your search." : "No documents yet. Add your first record."}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editId ? "Edit Document" : "Add Document"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Title *</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Smith Family Trust Deed" className="bg-muted/30 border-border" required />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Description</Label>
              <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description…" className="bg-muted/30 border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Type</Label>
                <select value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
                  {FILE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-sm text-muted-foreground">Year</Label>
                <Input type="number" min="1900" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2025" className="bg-muted/30 border-border font-mono" />
              </div>
            </div>
            <div className="flex items-center gap-2.5">
              <input id="enc" type="checkbox" checked={form.encrypted} onChange={(e) => setForm({ ...form, encrypted: e.target.checked })} className="w-4 h-4 accent-primary" />
              <Label htmlFor="enc" className="text-sm text-muted-foreground cursor-pointer">Mark as encrypted</Label>
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(emptyForm); setEditId(null); }} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : editId ? "Save Changes" : "Add Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
