import React, { useState, useMemo } from "react";
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
import {
  Lock, Plus, Search, Pencil, Trash2, LayoutGrid, List, FileText, FileCheck,
  ScrollText, Shield, FileBarChart, Award, File, Folder, FolderOpen, ChevronDown,
  ChevronRight, CheckSquare, Square, FolderPlus, ArrowLeft, Sparkles, X, Move,
} from "lucide-react";
import { DocumentPreview } from "@/components/document-preview";
import { AIPanel } from "@/components/ai-panel";

const FILE_TYPES = ["pdf", "contract", "tax", "insurance", "statement", "deed", "certificate", "other"];
const curYear = String(new Date().getFullYear());

const TYPE_CONFIG: Record<string, { icon: React.ElementType; color: string; border: string; bg: string }> = {
  pdf:         { icon: FileText,    color: "text-amber-400",   border: "border-amber-400/40",  bg: "bg-amber-500/5" },
  contract:    { icon: ScrollText,  color: "text-blue-400",    border: "border-blue-400/40",   bg: "bg-blue-500/5" },
  tax:         { icon: FileBarChart,color: "text-emerald-400", border: "border-emerald-400/40",bg: "bg-emerald-500/5" },
  insurance:   { icon: Shield,      color: "text-purple-400",  border: "border-purple-400/40", bg: "bg-purple-500/5" },
  statement:   { icon: FileCheck,   color: "text-orange-400",  border: "border-orange-400/40", bg: "bg-orange-500/5" },
  deed:        { icon: ScrollText,  color: "text-red-400",     border: "border-red-400/40",    bg: "bg-red-500/5" },
  certificate: { icon: Award,       color: "text-cyan-400",    border: "border-cyan-400/40",   bg: "bg-cyan-500/5" },
  other:       { icon: File,        color: "text-muted-foreground", border: "border-border", bg: "bg-muted/10" },
};

type DocForm = { title: string; description: string; fileType: string; year: string; encrypted: boolean; ocrText: string; folder: string };
const emptyForm: DocForm = { title: "", description: "", fileType: "pdf", year: curYear, encrypted: true, ocrText: "", folder: "" };
type ViewMode = "canvas" | "list";
type Doc = { id: number; title: string; fileType: string; year?: number | null; encrypted: boolean; ocrText?: string | null; description?: string | null; folder?: string | null };

export default function Vault() {
  const qc = useQueryClient();
  const { data: documents, isLoading } = useListDocuments();
  const createDoc = useCreateDocument();
  const updateDoc = useUpdateDocument();
  const deleteDoc = useDeleteDocument();

  const [search, setSearch] = useState("");
  const [view, setView] = useState<ViewMode>("canvas");
  const [typeFilter, setTypeFilter] = useState("all");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<DocForm>(emptyForm);
  const [saving, setSaving] = useState(false);

  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [isolatedFolder, setIsolatedFolder] = useState<string | null>(null);
  const [previewDoc, setPreviewDoc] = useState<Doc | null>(null);
  const [folderAiOpen, setFolderAiOpen] = useState(false);
  const [newFolderOpen, setNewFolderOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [moveToFolderOpen, setMoveToFolderOpen] = useState(false);

  const filtered = (documents ?? []).filter((d) => {
    const matchSearch = !search || d.title.toLowerCase().includes(search.toLowerCase()) || (d.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchType = typeFilter === "all" || d.fileType === typeFilter;
    const matchIsolated = isolatedFolder === null || d.folder === isolatedFolder;
    return matchSearch && matchType && matchIsolated;
  });

  const folderMap = useMemo(() => {
    const map: Record<string, Doc[]> = {};
    (documents ?? []).forEach((d) => {
      if (d.folder) (map[d.folder] ??= []).push(d as Doc);
    });
    return map;
  }, [documents]);

  const folderNames = Object.keys(folderMap).sort();
  const unfiledDocs = filtered.filter((d) => !d.folder);
  const filteredFolderDocs = (folder: string) => filtered.filter((d) => d.folder === folder);

  function openAdd() { setEditId(null); setForm(emptyForm); setOpen(true); }
  function openEdit(d: Doc) {
    setEditId(d.id);
    setForm({ title: d.title, description: d.description ?? "", fileType: d.fileType, year: d.year ? String(d.year) : "", encrypted: d.encrypted, ocrText: d.ocrText ?? "", folder: d.folder ?? "" });
    setOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title) return;
    setSaving(true);
    try {
      const payload = { title: form.title, description: form.description || undefined, fileType: form.fileType as any, year: form.year ? parseInt(form.year) : undefined, encrypted: form.encrypted, ocrText: form.ocrText || undefined, folder: form.folder || undefined };
      if (editId !== null) await updateDoc.mutateAsync({ id: editId, data: payload as any });
      else await createDoc.mutateAsync(payload as any);
      await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
      setOpen(false); setForm(emptyForm); setEditId(null);
    } finally { setSaving(false); }
  }

  async function handleDelete(id: number, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!confirm("Delete this document record?")) return;
    await deleteDoc.mutateAsync(id);
    await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
  }

  async function handleSaveContent(id: number, updates: { ocrText?: string }) {
    await updateDoc.mutateAsync({ id, data: updates as any });
    await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
  }

  function toggleSelect(id: number, e: React.MouseEvent) {
    e.stopPropagation();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function selectAll() {
    setSelectedIds(new Set(filtered.map((d) => d.id)));
  }

  function clearSelection() {
    setSelectedIds(new Set());
    setSelectMode(false);
  }

  async function createFolder() {
    if (!newFolderName.trim() || selectedIds.size === 0) return;
    const name = newFolderName.trim();
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        updateDoc.mutateAsync({ id, data: { folder: name } as any })
      )
    );
    await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    setExpandedFolders((prev) => new Set([...prev, name]));
    setNewFolderOpen(false);
    setNewFolderName("");
    clearSelection();
  }

  async function moveToFolder(folderName: string | null) {
    await Promise.all(
      Array.from(selectedIds).map((id) =>
        updateDoc.mutateAsync({ id, data: { folder: folderName } as any })
      )
    );
    await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    setMoveToFolderOpen(false);
    clearSelection();
  }

  async function deleteFolderDocs(folderName: string) {
    if (!confirm(`Remove folder "${folderName}"? Documents will become unfiled.`)) return;
    const inFolder = (documents ?? []).filter((d) => d.folder === folderName);
    await Promise.all(inFolder.map((d) => updateDoc.mutateAsync({ id: d.id, data: { folder: null } as any })));
    await qc.invalidateQueries({ queryKey: getListDocumentsQueryKey() });
    if (isolatedFolder === folderName) setIsolatedFolder(null);
  }

  function toggleFolder(name: string) {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name); else next.add(name);
      return next;
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[600px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  const docCardClass = (doc: Doc, selected: boolean) => {
    const cfg = TYPE_CONFIG[doc.fileType] ?? TYPE_CONFIG.other;
    return `group relative rounded-xl border-2 p-4 cursor-pointer transition-all hover:scale-[1.01] hover:shadow-lg hover:shadow-black/20 ${cfg.border} ${cfg.bg} ${selected ? "ring-2 ring-primary ring-offset-1 ring-offset-background" : ""}`;
  };

  function DocCard({ doc, compact = false }: { doc: Doc; compact?: boolean }) {
    const cfg = TYPE_CONFIG[doc.fileType] ?? TYPE_CONFIG.other;
    const Icon = cfg.icon;
    const selected = selectedIds.has(doc.id);
    return (
      <div
        onClick={(e) => {
          if (selectMode) { toggleSelect(doc.id, e); return; }
          setPreviewDoc(doc);
        }}
        className={docCardClass(doc, selected)}
      >
        {selectMode && (
          <div className="absolute top-2 left-2 z-10" onClick={(e) => toggleSelect(doc.id, e)}>
            {selected ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
          </div>
        )}
        <div className="flex items-start justify-between mb-3">
          <Icon className={`w-6 h-6 ${cfg.color}`} />
          {doc.encrypted && <Lock className="w-3 h-3 text-muted-foreground/60" />}
        </div>
        <h3 className="font-medium text-sm text-foreground leading-snug line-clamp-2 mb-2">{doc.title}</h3>
        {doc.description && !compact && <p className="text-xs text-muted-foreground/70 line-clamp-1 mb-2">{doc.description}</p>}
        <div className="flex items-center justify-between mt-auto">
          <span className={`text-[10px] font-mono uppercase ${cfg.color}`}>{doc.fileType}</span>
          {doc.year && <span className="text-[10px] text-muted-foreground font-mono">{doc.year}</span>}
        </div>
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 flex gap-1 transition-all" onClick={(e) => e.stopPropagation()}>
          <button onClick={() => openEdit(doc)} className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted/60"><Pencil className="w-3 h-3" /></button>
          <button onClick={(e) => handleDelete(doc.id, e)} className="p-1 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10"><Trash2 className="w-3 h-3" /></button>
        </div>
      </div>
    );
  }

  if (isolatedFolder !== null) {
    const folderDocs = (documents ?? []).filter((d) => d.folder === isolatedFolder);
    return (
      <div className="space-y-6 pb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsolatedFolder(null)} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Vault
            </button>
            <span className="text-muted-foreground">/</span>
            <div className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              <h1 className="text-2xl font-serif text-foreground">{isolatedFolder}</h1>
            </div>
            <Badge variant="outline" className="bg-muted/30 border-border text-muted-foreground text-xs">
              {folderDocs.length} documents
            </Badge>
          </div>
          <Button onClick={() => setFolderAiOpen(true)} variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground">
            <Sparkles className="w-4 h-4" /> Ask AI about this folder
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {folderDocs.map((doc) => (
            <DocCard key={doc.id} doc={doc as Doc} />
          ))}
          {folderDocs.length === 0 && (
            <div className="col-span-4 text-center py-12 text-muted-foreground text-sm">This folder is empty.</div>
          )}
        </div>

        <AIPanel
          open={folderAiOpen}
          onClose={() => setFolderAiOpen(false)}
          title={`Folder: ${isolatedFolder}`}
          suggestions={[
            `What documents are in the "${isolatedFolder}" folder?`,
            "Summarize the key terms and obligations across all documents in this folder",
            "Are there any upcoming deadlines or renewal dates?",
            "Identify any cross-document dependencies or conflicts",
            "Draft a professional summary of this folder for a lawyer",
          ]}
        />

        {previewDoc && (
          <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} onSave={handleSaveContent} />
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Document Vault</h1>
          <p className="text-muted-foreground text-sm">
            {documents?.length ?? 0} documents · {folderNames.length} folders · AES-256 encrypted
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => { setSelectMode((s) => { if (s) clearSelection(); return !s; }); }}
            variant="outline"
            className={`gap-2 border-border text-sm ${selectMode ? "border-primary text-primary" : "text-muted-foreground hover:text-foreground"}`}>
            <CheckSquare className="w-4 h-4" /> {selectMode ? "Exit Select" : "Select"}
          </Button>
          <Button onClick={openAdd} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
            <Plus className="w-4 h-4" /> Add Document
          </Button>
        </div>
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by title, description…" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 bg-muted/30 border-border" />
        </div>
        <div className="flex gap-1 bg-muted/30 border border-border rounded-md p-1 flex-shrink-0">
          <button onClick={() => setTypeFilter("all")} className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${typeFilter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>All</button>
          {FILE_TYPES.slice(0, 4).map((t) => (
            <button key={t} onClick={() => setTypeFilter(t === typeFilter ? "all" : t)}
              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors capitalize ${typeFilter === t ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex bg-muted/30 border border-border rounded-md p-1">
          <button onClick={() => setView("canvas")} className={`px-2 py-1 rounded transition-colors ${view === "canvas" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setView("list")} className={`px-2 py-1 rounded transition-colors ${view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {selectMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-xl">
          <span className="text-sm text-primary font-medium">{selectedIds.size} selected</span>
          <div className="flex gap-2 ml-auto">
            <Button onClick={() => setNewFolderOpen(true)} size="sm" variant="outline" className="text-xs gap-1.5 border-border">
              <FolderPlus className="w-3.5 h-3.5" /> New Folder
            </Button>
            {folderNames.length > 0 && (
              <Button onClick={() => setMoveToFolderOpen(true)} size="sm" variant="outline" className="text-xs gap-1.5 border-border">
                <Move className="w-3.5 h-3.5" /> Move to Folder
              </Button>
            )}
            <Button onClick={() => moveToFolder(null)} size="sm" variant="outline" className="text-xs gap-1.5 border-border text-muted-foreground">
              <X className="w-3.5 h-3.5" /> Unfiled
            </Button>
            <button onClick={clearSelection} className="text-xs text-muted-foreground hover:text-foreground px-2">Cancel</button>
          </div>
        </div>
      )}

      {view === "canvas" ? (
        <div className="space-y-6">
          {folderNames.map((folderName) => {
            const docs = filteredFolderDocs(folderName);
            if (docs.length === 0 && search) return null;
            const expanded = expandedFolders.has(folderName);
            return (
              <div key={folderName} className="rounded-xl border border-border bg-card/50 overflow-hidden">
                <div
                  className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/20 transition-colors select-none"
                  onClick={() => toggleFolder(folderName)}
                >
                  {expanded ? <FolderOpen className="w-4 h-4 text-primary" /> : <Folder className="w-4 h-4 text-primary" />}
                  <span className="font-medium text-sm text-foreground flex-1">{folderName}</span>
                  <span className="text-xs text-muted-foreground bg-muted/40 px-2 py-0.5 rounded-full">{folderMap[folderName]?.length ?? 0}</span>
                  <div className="flex items-center gap-1 mr-2" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setIsolatedFolder(folderName)}
                      className="text-xs text-muted-foreground hover:text-foreground px-2 py-1 rounded hover:bg-muted/50 transition-colors flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> View
                    </button>
                    <button onClick={() => deleteFolderDocs(folderName)}
                      className="text-xs text-muted-foreground hover:text-destructive px-2 py-1 rounded hover:bg-destructive/10 transition-colors flex items-center gap-1">
                      <X className="w-3 h-3" /> Ungroup
                    </button>
                  </div>
                  {expanded ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                </div>
                {expanded && (
                  <div className="p-4 pt-0 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 border-t border-border/50">
                    {docs.map((doc) => (
                      <DocCard key={doc.id} doc={doc as Doc} compact />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {unfiledDocs.length > 0 && (
            <div>
              {folderNames.length > 0 && (
                <div className="flex items-center gap-2 mb-3">
                  <File className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Unfiled</span>
                </div>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {unfiledDocs.map((doc) => (
                  <DocCard key={doc.id} doc={doc as Doc} />
                ))}
              </div>
            </div>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-muted-foreground text-sm">
              {search ? "No documents match your search." : "No documents yet. Add your first document."}
            </div>
          )}
        </div>
      ) : (
        <Card className="bg-card border-border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  {selectMode && <TableHead className="w-10" />}
                  <TableHead className="font-medium text-muted-foreground">Title</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Type</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Folder</TableHead>
                  <TableHead className="font-medium text-muted-foreground w-16">Year</TableHead>
                  <TableHead className="w-16 font-medium text-muted-foreground">Enc.</TableHead>
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id} className="border-border hover:bg-muted/30 group cursor-pointer" onClick={() => selectMode ? toggleSelect(doc.id, { stopPropagation: () => {} } as any) : setPreviewDoc(doc as Doc)}>
                    {selectMode && (
                      <TableCell onClick={(e) => { e.stopPropagation(); toggleSelect(doc.id, e); }}>
                        {selectedIds.has(doc.id) ? <CheckSquare className="w-4 h-4 text-primary" /> : <Square className="w-4 h-4 text-muted-foreground" />}
                      </TableCell>
                    )}
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm text-xs capitalize">{doc.fileType}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {doc.folder ? (
                        <span className="flex items-center gap-1 text-primary/80">
                          <Folder className="w-3 h-3" /> {doc.folder}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm font-mono">{doc.year ?? "—"}</TableCell>
                    <TableCell>{doc.encrypted ? <Lock className="w-3.5 h-3.5 text-emerald-500" /> : null}</TableCell>
                    <TableCell onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                        <button onClick={() => openEdit(doc as Doc)} className="text-muted-foreground hover:text-foreground p-1"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={(e) => handleDelete(doc.id, e)} className="text-muted-foreground hover:text-destructive p-1"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="h-28 text-center text-muted-foreground text-sm">
                      {search ? "No documents match your search." : "No documents yet."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Dialog open={newFolderOpen} onOpenChange={setNewFolderOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Create Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Folder Name</Label>
              <Input value={newFolderName} onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") createFolder(); }}
                placeholder="e.g. Tax 2024, Trust Deeds, Insurance"
                className="bg-muted/30 border-border" autoFocus />
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedIds.size} document{selectedIds.size !== 1 ? "s" : ""} will be added to this folder.
            </p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setNewFolderOpen(false)} className="text-muted-foreground">Cancel</Button>
            <Button onClick={createFolder} disabled={!newFolderName.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90">
              <FolderPlus className="w-4 h-4 mr-2" /> Create Folder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={moveToFolderOpen} onOpenChange={setMoveToFolderOpen}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Move to Folder</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {folderNames.map((f) => (
              <button key={f} onClick={() => moveToFolder(f)}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg bg-muted/20 border border-border hover:border-primary/40 hover:text-foreground text-sm text-muted-foreground transition-colors">
                <Folder className="w-4 h-4 text-primary" />
                {f}
                <span className="ml-auto text-xs text-muted-foreground/60">{folderMap[f]?.length ?? 0} docs</span>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) { setEditId(null); setForm(emptyForm); } }}>
        <DialogContent className="bg-card border-border max-w-md max-h-[90vh] overflow-y-auto">
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
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Folder <span className="text-muted-foreground/50">(optional)</span></Label>
              <Input value={form.folder} onChange={(e) => setForm({ ...form, folder: e.target.value })}
                placeholder="e.g. Tax 2024, Insurance, Trust Deeds"
                list="folder-list"
                className="bg-muted/30 border-border" />
              <datalist id="folder-list">
                {folderNames.map((f) => <option key={f} value={f} />)}
              </datalist>
            </div>
            <div className="flex items-center gap-2.5">
              <input id="enc" type="checkbox" checked={form.encrypted} onChange={(e) => setForm({ ...form, encrypted: e.target.checked })} className="w-4 h-4 accent-primary" />
              <Label htmlFor="enc" className="text-sm text-muted-foreground cursor-pointer">Mark as encrypted</Label>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm text-muted-foreground">Document Content <span className="text-muted-foreground/50">(for AI search &amp; preview)</span></Label>
              <textarea value={form.ocrText} onChange={(e) => setForm({ ...form, ocrText: e.target.value })}
                placeholder="Paste document text, key clauses, or extracted content here…"
                rows={4}
                className="w-full rounded-md border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
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

      {previewDoc && (
        <DocumentPreview doc={previewDoc} onClose={() => setPreviewDoc(null)} onSave={handleSaveContent} />
      )}
    </div>
  );
}
