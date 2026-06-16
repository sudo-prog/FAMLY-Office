import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  X, Printer, Mail, Sparkles, PenLine, Eraser, EyeOff, FileText,
  Lock, Shield, ChevronDown, ChevronUp, Pen, Download, Loader2,
  Highlighter, StickyNote, PenTool,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AIPanel } from "@/components/ai-panel";

interface PreviewDoc {
  id: number;
  title: string;
  fileType: string;
  year?: number | null;
  encrypted: boolean;
  ocrText?: string | null;
  description?: string | null;
}

interface DocumentPreviewProps {
  doc: PreviewDoc | null;
  onClose: () => void;
  onSave?: (id: number, updates: { ocrText?: string }) => Promise<void>;
}

const TYPE_COLORS: Record<string, string> = {
  pdf: "text-amber-400 bg-amber-500/10 border-amber-400/30",
  contract: "text-blue-400 bg-blue-500/10 border-blue-400/30",
  tax: "text-emerald-400 bg-emerald-500/10 border-emerald-400/30",
  insurance: "text-purple-400 bg-purple-500/10 border-purple-400/30",
  statement: "text-orange-400 bg-orange-500/10 border-orange-400/30",
  deed: "text-red-400 bg-red-500/10 border-red-400/30",
  certificate: "text-cyan-400 bg-cyan-500/10 border-cyan-400/30",
  other: "text-muted-foreground bg-muted/10 border-border",
};

type Tool = "none" | "highlight" | "pen" | "sign" | "redact" | "notes" | "ai";

export function DocumentPreview({ doc, onClose, onSave }: DocumentPreviewProps) {
  const [activeTool, setActiveTool] = useState<Tool>("none");
  const [content, setContent] = useState(doc?.ocrText ?? "");
  const [noteText, setNoteText] = useState("");
  const [notes, setNotes] = useState<{ text: string; time: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [highlightMode, setHighlightMode] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isDrawing = useRef(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setContent(doc?.ocrText ?? "");
    setActiveTool("none");
    setNotes([]);
    setHighlightMode(false);
  }, [doc?.id]);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "p" && (e.metaKey || e.ctrlKey)) { e.preventDefault(); handlePrint(); }
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  function toggleTool(tool: Tool) {
    if (tool === "ai") { setAiOpen(true); setActiveTool("none"); return; }
    if (tool === "sign") { setActiveTool((prev) => prev === "sign" ? "none" : "sign"); return; }
    if (tool === "highlight") setHighlightMode((h) => !h);
    setActiveTool((prev) => prev === tool ? "none" : tool);
  }

  function handleRedact() {
    const textarea = contentRef.current;
    if (!textarea) return;
    const { selectionStart, selectionEnd } = textarea;
    if (selectionStart === selectionEnd) return;
    const len = selectionEnd - selectionStart;
    const redacted = content.slice(0, selectionStart) + "█".repeat(len) + content.slice(selectionEnd);
    setContent(redacted);
  }

  async function handleSave() {
    if (!doc || !onSave) return;
    setSaving(true);
    await onSave(doc.id, { ocrText: content });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function addNote() {
    if (!noteText.trim()) return;
    setNotes((prev) => [...prev, { text: noteText.trim(), time: new Date().toLocaleTimeString() }]);
    setNoteText("");
  }

  function handlePrint() {
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(`<html><body><h1>${doc?.title}</h1><pre style="font-family:serif;line-height:1.6">${content}</pre></body></html>`);
    w.document.close();
    w.print();
  }

  function handleEmail() {
    const subject = encodeURIComponent(doc?.title ?? "Document");
    const body = encodeURIComponent(`${doc?.title ?? "Document"}\n\n${content}`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  }

  const getCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    return canvas.getContext("2d");
  }, []);

  function startDraw(e: React.MouseEvent<HTMLCanvasElement>) {
    isDrawing.current = true;
    const rect = canvasRef.current!.getBoundingClientRect();
    lastPos.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }

  function draw(e: React.MouseEvent<HTMLCanvasElement>) {
    if (!isDrawing.current) return;
    const ctx = getCanvas();
    if (!ctx) return;
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ctx.strokeStyle = "hsl(43 65% 52%)";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastPos.current = { x, y };
  }

  function clearSign() {
    const ctx = getCanvas();
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  }

  function acceptSign() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    setContent((prev) => prev + `\n\n[SIGNED: ${new Date().toLocaleDateString()}]\n[signature: ${dataUrl.slice(0, 30)}...]`);
    setActiveTool("none");
  }

  if (!doc) return null;

  const typeColor = TYPE_COLORS[doc.fileType] ?? TYPE_COLORS.other;

  const tools: { id: Tool; icon: React.ElementType; label: string; color?: string }[] = [
    { id: "highlight", icon: Highlighter, label: "Highlight", color: "text-yellow-400" },
    { id: "pen", icon: PenLine, label: "Add Notes" },
    { id: "sign", icon: PenTool, label: "Signature", color: "text-primary" },
    { id: "redact", icon: EyeOff, label: "Redact" },
    { id: "ai", icon: Sparkles, label: "AI Auto-fill", color: "text-primary" },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-stretch bg-background/95 backdrop-blur-sm">
        <div className="w-14 bg-card border-r border-border flex flex-col items-center py-4 gap-1 flex-shrink-0">
          {tools.map((t) => (
            <button key={t.id} onClick={() => toggleTool(t.id)} title={t.label}
              className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                activeTool === t.id
                  ? "bg-primary text-primary-foreground"
                  : `text-muted-foreground hover:bg-muted/50 hover:text-foreground ${t.color ?? ""}`
              }`}>
              <t.icon className="w-4 h-4" />
            </button>
          ))}
          <div className="flex-1" />
          <button onClick={handleEmail} title="Email document"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all">
            <Mail className="w-4 h-4" />
          </button>
          <button onClick={handlePrint} title="Print document"
            className="w-9 h-9 rounded-lg flex items-center justify-center text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all">
            <Printer className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="h-14 border-b border-border flex items-center justify-between px-6 flex-shrink-0 bg-card">
            <div className="flex items-center gap-3">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <span className="font-serif font-semibold text-foreground">{doc.title}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-mono uppercase ${typeColor}`}>{doc.fileType}</span>
              {doc.year && <span className="text-xs text-muted-foreground font-mono">{doc.year}</span>}
              {doc.encrypted && (
                <span className="flex items-center gap-1 text-xs text-emerald-500">
                  <Lock className="w-3 h-3" /> AES-256
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              {activeTool === "redact" && (
                <Button onClick={handleRedact} size="sm" variant="outline" className="text-xs border-destructive/50 text-destructive hover:bg-destructive/10">
                  <EyeOff className="w-3 h-3 mr-1.5" /> Apply Redaction
                </Button>
              )}
              {onSave && (
                <Button onClick={handleSave} size="sm" disabled={saving}
                  className="text-xs bg-primary text-primary-foreground hover:bg-primary/90">
                  {saving ? <><Loader2 className="w-3 h-3 mr-1.5 animate-spin" />Saving…</> : saved ? "Saved ✓" : "Save Changes"}
                </Button>
              )}
              <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {highlightMode && (
            <div className="px-6 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-xs text-yellow-400 flex items-center gap-2">
              <Highlighter className="w-3.5 h-3.5" /> Highlight mode active — select text in the document to highlight it
              <button onClick={() => { setHighlightMode(false); setActiveTool("none"); }} className="ml-auto text-yellow-400/70 hover:text-yellow-400">Disable</button>
            </div>
          )}

          <div className="flex-1 overflow-auto p-8 bg-background">
            <div className="max-w-3xl mx-auto">
              {doc.description && (
                <p className="text-muted-foreground text-sm mb-6 italic">{doc.description}</p>
              )}
              {content ? (
                <textarea
                  ref={contentRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className={`w-full min-h-[500px] bg-transparent border-none outline-none resize-none text-sm leading-loose text-foreground font-mono ${highlightMode ? "selection:bg-yellow-400/40" : ""}`}
                  spellCheck={false}
                  placeholder="Document content will appear here. Paste or type document text to enable AI search and preview."
                />
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-center space-y-4">
                  <FileText className="w-12 h-12 text-muted-foreground/30" />
                  <div>
                    <p className="text-muted-foreground font-medium">No content yet</p>
                    <p className="text-muted-foreground/60 text-sm mt-1">Paste document text below to enable AI search and analysis</p>
                  </div>
                  <button onClick={() => contentRef.current?.focus()} className="text-xs text-primary hover:underline">
                    Click to start typing
                  </button>
                </div>
              )}
            </div>
          </div>

          {activeTool === "pen" && (
            <div className="border-t border-border bg-card px-6 py-4 flex-shrink-0">
              <div className="flex items-start gap-3 max-w-3xl mx-auto">
                <StickyNote className="w-4 h-4 text-primary mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-2">Add annotation note</p>
                  <div className="flex gap-2">
                    <input value={noteText} onChange={(e) => setNoteText(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") addNote(); }}
                      placeholder="Type a note and press Enter…"
                      className="flex-1 bg-muted/30 border border-border rounded-md px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                    <Button onClick={addNote} size="sm" disabled={!noteText.trim()} className="bg-primary text-primary-foreground">Add</Button>
                  </div>
                  {notes.length > 0 && (
                    <div className="mt-2 space-y-1.5 max-h-24 overflow-y-auto">
                      {notes.map((n, i) => (
                        <div key={i} className="flex items-start gap-2 text-xs">
                          <span className="text-muted-foreground/60 font-mono flex-shrink-0">{n.time}</span>
                          <span className="text-foreground">{n.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTool === "sign" && (
            <div className="border-t border-border bg-card px-6 py-4 flex-shrink-0">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-foreground flex items-center gap-2">
                    <PenTool className="w-4 h-4 text-primary" /> Electronic Signature
                  </p>
                  <div className="flex gap-2">
                    <Button onClick={clearSign} size="sm" variant="outline" className="text-xs border-border">Clear</Button>
                    <Button onClick={acceptSign} size="sm" className="text-xs bg-primary text-primary-foreground">Accept & Insert</Button>
                    <button onClick={() => setActiveTool("none")} className="text-muted-foreground hover:text-foreground p-1"><X className="w-4 h-4" /></button>
                  </div>
                </div>
                <canvas ref={canvasRef} width={700} height={120}
                  className="w-full rounded-lg border border-border bg-muted/20 cursor-crosshair touch-none"
                  onMouseDown={startDraw} onMouseMove={draw}
                  onMouseUp={() => { isDrawing.current = false; }}
                  onMouseLeave={() => { isDrawing.current = false; }}
                />
                <p className="text-xs text-muted-foreground mt-1.5">Draw your signature above</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <AIPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title={`AI — ${doc.title}`}
        suggestions={[
          `Summarize the key points of this ${doc.fileType} document`,
          "What are the critical dates and deadlines mentioned?",
          "Identify any obligations, penalties, or risk clauses",
          "Extract all monetary amounts and financial figures",
          "What action items does this document require?",
          "Draft a professional summary for a lawyer to review",
        ]}
      />
    </>
  );
}
