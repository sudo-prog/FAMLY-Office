import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListDocuments, getListDocumentsQueryKey,
  useCreateDocument,
} from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Lock, Plus, Search } from "lucide-react";

const FILE_TYPES = ["pdf", "contract", "tax", "insurance", "statement", "deed", "certificate", "other"];

const emptyForm = { title: "", description: "", fileType: "pdf", year: String(new Date().getFullYear()), encrypted: true };

export default function Vault() {
  const qc = useQueryClient();
  const { data: documents, isLoading } = useListDocuments();
  const createDocument = useCreateDocument();

  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const filtered = (documents ?? []).filter((d) =>
    !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.description ?? "").toLowerCase().includes(search.toLowerCase()) || d.fileType.toLowerCase().includes(search.toLowerCase())
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    try {
      await createDocument.mutateAsync({
        title: form.title,
        description: form.description || undefined,
        fileType: form.fileType as any,
        year: form.year ? parseInt(form.year) : undefined,
        encrypted: form.encrypted,
      } as any);
      await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
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
        <Button onClick={() => setOpen(true)} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Plus className="w-4 h-4" /> Add Document
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search by title, type, description…"
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
                <TableHead className="font-medium text-muted-foreground">Title</TableHead>
                <TableHead className="font-medium text-muted-foreground w-28">Type</TableHead>
                <TableHead className="font-medium text-muted-foreground w-20">Year</TableHead>
                <TableHead className="font-medium text-muted-foreground w-28">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((doc) => (
                <TableRow key={doc.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{doc.title}</span>
                      {doc.description && <span className="text-xs text-muted-foreground mt-0.5">{doc.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm capitalize text-xs">
                      {doc.fileType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{doc.year ?? "—"}</TableCell>
                  <TableCell>
                    {doc.encrypted && (
                      <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                        <Lock className="w-3 h-3" /> Encrypted
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-28 text-center text-muted-foreground text-sm">
                    {search ? "No documents match your search." : "No documents yet. Add your first record."}
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
            <DialogTitle className="font-serif text-xl">Add Document</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="text-sm text-muted-foreground">Title *</Label>
              <Input id="title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="e.g. Smith Family Trust Deed" className="bg-muted/30 border-border" required />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="docDesc" className="text-sm text-muted-foreground">Description</Label>
              <Input id="docDesc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description…" className="bg-muted/30 border-border" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="fileType" className="text-sm text-muted-foreground">Type</Label>
                <select id="fileType" value={form.fileType} onChange={(e) => setForm({ ...form, fileType: e.target.value })}
                  className="w-full h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary capitalize">
                  {FILE_TYPES.map((t) => <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="year" className="text-sm text-muted-foreground">Year</Label>
                <Input id="year" type="number" min="1900" max="2100" value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} placeholder="2025" className="bg-muted/30 border-border font-mono" />
              </div>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                id="enc"
                type="checkbox"
                checked={form.encrypted}
                onChange={(e) => setForm({ ...form, encrypted: e.target.checked })}
                className="w-4 h-4 accent-primary"
              />
              <Label htmlFor="enc" className="text-sm text-muted-foreground cursor-pointer">Mark as encrypted</Label>
            </div>

            <DialogFooter className="mt-6">
              <Button type="button" variant="ghost" onClick={() => { setOpen(false); setForm(emptyForm); }} className="text-muted-foreground">Cancel</Button>
              <Button type="submit" disabled={saving} className="bg-primary text-primary-foreground hover:bg-primary/90">
                {saving ? "Saving…" : "Add Document"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
