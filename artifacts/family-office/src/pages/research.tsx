import React, { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { MarkdownReport } from "@/components/markdown-report";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Globe, Database, BrainCircuit, BookOpen, Zap, ExternalLink,
  Save, Trash2, Clock, Copy, Check, FileCode, Loader2, StopCircle,
  AlertTriangle, Shield, TrendingUp, BarChart2, Building2, Bitcoin,
  Gem, Leaf, Landmark, Flame, DollarSign, ChevronDown, ChevronUp,
  Briefcase, ChevronRight, Play, Github, Star, GitFork, Code2,
  Bug, Package, GitBranch, Users, Cpu, AlertCircle, CheckCircle2,
  ArrowRight, Lightbulb, Target, PieChart, Rocket, Award, Search,
  FileText, ClipboardList, BadgeDollarSign, HandCoins, Building,
  RefreshCw, Plus, Minus, ChevronLeft,
} from "lucide-react";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

// ─── Types ────────────────────────────────────────────────────────────────────

type Source = { title: string; url: string; snippet: string };
type ResearchReport = {
  id: number; title: string; query: string; depth: string; report: string;
  summary?: string; sources: Source[]; portfolioIncluded: boolean;
  webSearched: boolean; createdAt: string;
};
type Component = { id: number; name: string; description: string; code: string; createdAt: string };
type Tab = "research" | "reports" | "github" | "bizplan" | "grants" | "builder";

// ─── Config ────────────────────────────────────────────────────────────────────

const DEPTH_OPTIONS = [
  { id: "quick",    label: "Quick Summary",   desc: "~2 min · Concise overview",              icon: Zap },
  { id: "standard", label: "Standard Report", desc: "~5 min · Structured full report",         icon: BarChart2 },
  { id: "deep",     label: "Deep Analysis",   desc: "~12 min · All sections + projections",    icon: BrainCircuit },
];

const TOPIC_CHIPS = [
  { label: "Australian Real Estate", icon: Building2, q: "Australian residential and commercial real estate market analysis 2025 2026" },
  { label: "ASX & Equities",         icon: TrendingUp, q: "ASX Australian stock market outlook and key sector analysis" },
  { label: "Global Markets",         icon: Globe,      q: "Global equity markets trends outlook and risks" },
  { label: "Crypto & Digital",       icon: Bitcoin,    q: "Cryptocurrency digital assets investment analysis outlook" },
  { label: "Gold & Commodities",     icon: Gem,        q: "Gold and commodities market analysis and investment outlook" },
  { label: "Fixed Income",           icon: Landmark,   q: "Fixed income bonds yield curves investment analysis Australia" },
  { label: "Energy & Resources",     icon: Flame,      q: "Energy sector resources investment analysis ASX Australia" },
  { label: "ESG & Sustainable",      icon: Leaf,       q: "ESG sustainable investing trends and opportunities Australia" },
  { label: "Inflation & RBA",        icon: DollarSign, q: "Australian inflation interest rates RBA monetary policy outlook" },
  { label: "Tax Optimisation",       icon: Briefcase,  q: "Australian high net worth tax optimisation strategies 2025 2026" },
];

const COMPONENT_PRESETS = [
  "Dark-themed portfolio allocation donut chart with recharts — showing asset classes and AUD values",
  "KPI card grid with animated counters — revenue, expenses, net profit, and growth percentage",
  "Net worth growth line chart over 5 years — dark theme with recharts and area fill",
  "Bull/Base/Bear scenario comparison table — colour-coded rows with 1yr/3yr/5yr projections",
  "Investment risk heat map — grid of asset classes vs risk factors, colour-coded cells",
  "Invoice status pipeline — horizontal stepper showing Draft → Sent → Paid stages",
  "Asset allocation rebalancing bar chart — current vs target allocation per category",
  "Time tracking weekly calendar heatmap — showing billable hours per day in gold",
];

// ─── SSE Parser ───────────────────────────────────────────────────────────────

async function readSSE(
  url: string,
  body: object,
  signal: AbortSignal,
  onEvent: (data: any) => void
) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split("\n");
    buf = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.startsWith("data: ")) continue;
      const raw = line.slice(6).trim();
      if (!raw || raw === "[DONE]") continue;
      try { onEvent(JSON.parse(raw)); } catch {}
    }
  }
}

// ─── Research Stream Hook ─────────────────────────────────────────────────────

function useResearchStream() {
  const [phase, setPhase] = useState<"idle"|"running"|"done"|"error">("idle");
  const [steps, setSteps] = useState<{step: string; message: string}[]>([]);
  const [text, setText] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const [model, setModel] = useState<string|null>(null);
  const [routing, setRouting] = useState<string|null>(null);
  const ctrl = useRef<AbortController|null>(null);

  const run = useCallback(async (params: object) => {
    setText(""); setSteps([]); setSources([]); setErr(null); setModel(null); setRouting(null);
    setPhase("running");
    ctrl.current = new AbortController();
    try {
      await readSSE(`${BASE}/api/research/query`, params, ctrl.current.signal, (data) => {
        if (typeof data.model === "string") setModel(data.model);
        if (typeof data.routing === "string") setRouting(data.routing);
        if (data.type === "step") setSteps(s => [...s, { step: data.step, message: data.message }]);
        else if (data.type === "sources") setSources(data.sources ?? []);
        else if (data.type === "done") setPhase("done");
        else if (data.error) { setErr(data.error); setPhase("error"); }
        else if (data.choices?.[0]?.delta?.content) setText(t => t + data.choices[0].delta.content);
      });
      setPhase(p => p === "running" ? "done" : p);
    } catch (e: any) {
      if (e.name !== "AbortError") { setErr(e.message); setPhase("error"); }
      else setPhase("idle");
    }
  }, []);

  const stop = useCallback(() => { ctrl.current?.abort(); setPhase("idle"); }, []);
  const reset = useCallback(() => { ctrl.current?.abort(); setText(""); setSteps([]); setSources([]); setErr(null); setModel(null); setRouting(null); setPhase("idle"); }, []);
  return { phase, steps, text, sources, err, model, routing, run, stop, reset };
}

// ─── Component Stream Hook ────────────────────────────────────────────────────

function useComponentStream() {
  const [phase, setPhase] = useState<"idle"|"running"|"done"|"error">("idle");
  const [code, setCode] = useState("");
  const [err, setErr] = useState<string|null>(null);
  const ctrl = useRef<AbortController|null>(null);

  const generate = useCallback(async (params: object) => {
    setCode(""); setErr(null); setPhase("running");
    ctrl.current = new AbortController();
    try {
      await readSSE(`${BASE}/api/research/component`, params, ctrl.current.signal, (data) => {
        if (data.type === "done") setPhase("done");
        else if (data.error) { setErr(data.error); setPhase("error"); }
        else if (data.choices?.[0]?.delta?.content) setCode(c => c + data.choices[0].delta.content);
      });
      setPhase(p => p === "running" ? "done" : p);
    } catch (e: any) {
      if (e.name !== "AbortError") { setErr(e.message); setPhase("error"); }
      else setPhase("idle");
    }
  }, []);

  const reset = useCallback(() => { ctrl.current?.abort(); setCode(""); setErr(null); setPhase("idle"); }, []);
  return { phase, code, err, generate, reset };
}

// ─── Data Hooks ───────────────────────────────────────────────────────────────

const api = (path: string, init?: RequestInit) => fetch(`${BASE}${path}`, init).then(r => r.json());

function useReports() {
  return useQuery<ResearchReport[]>({ queryKey: ["research", "reports"], queryFn: () => api("/api/research/reports") });
}
function useSaveReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => api("/api/research/reports", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["research", "reports"] }) });
}
function useDeleteReport() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => fetch(`${BASE}/api/research/reports/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["research", "reports"] }) });
}
function useComponents() {
  return useQuery<Component[]>({ queryKey: ["research", "components"], queryFn: () => api("/api/research/components") });
}
function useSaveComponent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (d: any) => api("/api/research/components", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }), onSuccess: () => qc.invalidateQueries({ queryKey: ["research", "components"] }) });
}
function useDeleteComponent() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (id: number) => fetch(`${BASE}/api/research/components/${id}`, { method: "DELETE" }), onSuccess: () => qc.invalidateQueries({ queryKey: ["research", "components"] }) });
}

// ─── Code Block ───────────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  function copy() { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }

  return (
    <div className="rounded-xl border border-border overflow-hidden bg-[#0a0f16]">
      <div className="flex items-center justify-between px-4 py-2 bg-muted/20 border-b border-border">
        <div className="flex items-center gap-2"><FileCode className="w-3.5 h-3.5 text-primary" /><span className="text-xs font-mono text-muted-foreground">TSX · React · shadcn/ui · Tailwind</span></div>
        <button onClick={copy} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          {copied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied!</> : <><Copy className="w-3 h-3" /> Copy</>}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono leading-5 overflow-auto max-h-[540px] text-foreground/80 whitespace-pre">{code}</pre>
    </div>
  );
}

// ─── Research Panel ───────────────────────────────────────────────────────────

function ResearchPanel() {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState("standard");
  const [incPortfolio, setIncPortfolio] = useState(true);
  const [incWeb, setIncWeb] = useState(true);
  const [allowCloud, setAllowCloud] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showSources, setShowSources] = useState(false);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number|null>(null);
  const { phase, steps, text, sources, err, model, routing, run, stop, reset } = useResearchStream();
  const saveReport = useSaveReport();
  const inputRef = useRef<HTMLInputElement>(null);

  async function start() {
    if (!query.trim() || phase === "running") return;
    setSavedId(null);
    await run({ query: query.trim(), depth, includePortfolio: incPortfolio, includeWeb: incWeb, allowCloudPortfolio: allowCloud });
  }

  async function handleSave() {
    if (!text || !query) return;
    setSaving(true);
    try {
      const r = await saveReport.mutateAsync({ title: saveTitle.trim() || query.slice(0, 80), query, depth, report: text, summary: text.slice(0, 400), sources, portfolioIncluded: incPortfolio, webSearched: incWeb });
      setSavedId(r.id);
    } finally { setSaving(false); }
  }

  const isRunning = phase === "running";
  const isDone = phase === "done";
  const noReport = !text && phase === "idle";
  const lastStep = steps[steps.length - 1];

  return (
    <div className="space-y-5">
      {/* Hero when empty */}
      {noReport && (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/5">
            <BrainCircuit className="w-8 h-8 text-primary" />
          </div>
          <h2 className="text-2xl font-serif text-foreground mb-1">AI Research Engine</h2>
          <p className="text-muted-foreground text-sm max-w-lg mx-auto">Deep financial analysis with live web search, portfolio-aware insights, and multi-scenario future projections.</p>
        </div>
      )}

      {/* Input row */}
      <div className={`flex gap-3 ${!noReport ? "border-b border-border pb-5" : ""}`}>
        <Input ref={inputRef} value={query} onChange={e => setQuery(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !isRunning) start(); }}
          placeholder="What would you like to research? e.g. Australian real estate market outlook 2026…"
          className="flex-1 bg-muted/30 border-border text-sm h-10" disabled={isRunning} />
        {isRunning
          ? <Button onClick={stop} variant="outline" className="gap-1.5 border-destructive/60 text-destructive hover:bg-destructive/10 h-10 shrink-0"><StopCircle className="w-4 h-4" /> Stop</Button>
          : <Button onClick={start} disabled={!query.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5 h-10 shrink-0"><Sparkles className="w-4 h-4" /> Research</Button>
        }
        {isDone && <Button onClick={() => { reset(); setSavedId(null); }} variant="outline" className="border-border text-muted-foreground h-10 shrink-0">New</Button>}
      </div>

      {/* Quick chips + options when idle/empty */}
      {noReport && (
        <>
          <div className="flex flex-wrap gap-2">
            {TOPIC_CHIPS.map(t => (
              <button key={t.label} onClick={() => { setQuery(t.q); inputRef.current?.focus(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground bg-muted/30 border border-border hover:border-primary/50 hover:text-foreground transition-colors">
                <t.icon className="w-3 h-3 text-primary" /> {t.label}
              </button>
            ))}
          </div>

          <div>
            <button onClick={() => setShowOptions(o => !o)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
              {showOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              Research options &amp; depth
            </button>
            {showOptions && (
              <div className="mt-3 p-4 rounded-xl border border-border bg-muted/10 space-y-4">
                <div>
                  <Label className="text-xs text-muted-foreground mb-2 block">Report depth</Label>
                  <div className="flex gap-2">
                    {DEPTH_OPTIONS.map(d => (
                      <button key={d.id} onClick={() => setDepth(d.id)}
                        className={`flex-1 p-3 rounded-lg border text-left transition-colors ${depth === d.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/20"}`}>
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <d.icon className={`w-3.5 h-3.5 ${depth === d.id ? "text-primary" : "text-muted-foreground"}`} />
                          <span className={`text-xs font-medium ${depth === d.id ? "text-foreground" : "text-muted-foreground"}`}>{d.label}</span>
                        </div>
                        <p className="text-[10px] text-muted-foreground/60">{d.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={incPortfolio} onChange={e => setIncPortfolio(e.target.checked)} className="accent-primary" />
                    <Database className="w-3.5 h-3.5" /> Portfolio context
                  </label>
                  <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                    <input type="checkbox" checked={incWeb} onChange={e => setIncWeb(e.target.checked)} className="accent-primary" />
                    <Globe className="w-3.5 h-3.5" /> Live web search
                  </label>
                </div>
                {incPortfolio && (
                  <div className={`p-3 rounded-lg border text-xs ${allowCloud ? "border-amber-500/30 bg-amber-500/5" : "border-border bg-muted/10"}`}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${allowCloud ? "text-amber-400" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`font-medium mb-0.5 ${allowCloud ? "text-amber-400" : "text-muted-foreground"}`}>Cloud AI + Portfolio</p>
                        <p className="text-muted-foreground/70">By default your portfolio data stays on-device (local AI). Enable to allow cloud AI to see your portfolio for richer personalised analysis.</p>
                        <label className="flex items-center gap-2 mt-2 cursor-pointer">
                          <input type="checkbox" checked={allowCloud} onChange={e => setAllowCloud(e.target.checked)} className="accent-amber-500" />
                          <span className={allowCloud ? "text-amber-400" : "text-muted-foreground"}>I consent — use cloud AI with my portfolio data</span>
                        </label>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* Progress steps */}
      {(isRunning || (isDone && steps.length > 0)) && (
        <div className="space-y-1.5 px-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < steps.length - 1 ? "bg-emerald-500" : isRunning ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
              {s.message}
            </div>
          ))}
          {isRunning && <div className="flex items-center gap-2 mt-1"><Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /><span className="text-xs text-muted-foreground italic">{text ? "Writing report…" : "Preparing…"}</span></div>}
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /><div><p className="font-medium">Research failed</p><p className="text-xs mt-0.5 opacity-80">{err}</p></div>
        </div>
      )}

      {/* Web sources panel */}
      {sources.length > 0 && (
        <div className="rounded-xl border border-border overflow-hidden">
          <button onClick={() => setShowSources(o => !o)} className="w-full flex items-center justify-between px-4 py-2.5 bg-muted/20 hover:bg-muted/30 transition-colors">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><Globe className="w-3.5 h-3.5 text-primary" />{sources.length} web sources retrieved</div>
            {showSources ? <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />}
          </button>
          {showSources && (
            <div className="divide-y divide-border/40">
              {sources.map((s, i) => (
                <div key={i} className="px-4 py-3">
                  <a href={s.url} target="_blank" rel="noreferrer" className="flex items-start gap-2 group">
                    <ExternalLink className="w-3 h-3 text-primary mt-0.5 flex-shrink-0" />
                    <div><p className="text-xs font-medium text-foreground/80 group-hover:text-primary transition-colors line-clamp-1">{s.title}</p><p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{s.snippet}</p></div>
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Report output */}
      {text && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-foreground">Research Report</span>
              {[
                { show: true, label: DEPTH_OPTIONS.find(d => d.id === depth)?.label ?? depth, color: "border-border text-muted-foreground" },
                { show: incPortfolio, label: "Portfolio-aware", color: "border-primary/30 text-primary" },
                { show: incWeb && sources.length > 0, label: "Web-sourced", color: "border-blue-400/30 text-blue-400" },
              ].filter(b => b.show).map(b => <Badge key={b.label} variant="outline" className={`text-[10px] ${b.color}`}>{b.label}</Badge>)}
              {(model === "demo" || routing === "demo") && (
                <Badge variant="outline" className="text-[10px] border-amber-500/30 text-amber-400">Demo response — configure an AI provider in Settings</Badge>
              )}
            </div>
            {isDone && !savedId && (
              <div className="flex items-center gap-2 shrink-0">
                <Input value={saveTitle} onChange={e => setSaveTitle(e.target.value)} placeholder="Report title…" className="h-7 w-44 text-xs bg-muted/30 border-border" />
                <Button onClick={handleSave} disabled={saving} size="sm" variant="outline" className="h-7 text-xs gap-1 border-border">
                  <Save className="w-3 h-3" />{saving ? "Saving…" : "Save"}
                </Button>
              </div>
            )}
            {savedId && <span className="text-xs text-emerald-400 flex items-center gap-1 shrink-0"><Check className="w-3 h-3" />Saved</span>}
          </div>
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
            <MarkdownReport content={text} />
            {isRunning && <span className="inline-block w-1.5 h-4 bg-primary/80 animate-pulse ml-1 rounded-sm align-middle" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Saved Reports ────────────────────────────────────────────────────────────

function SavedReports() {
  const { data: reports = [], isLoading } = useReports();
  const delReport = useDeleteReport();
  const [active, setActive] = useState<ResearchReport|null>(null);

  if (isLoading) return <Skeleton className="h-64 bg-muted/50 rounded-xl" />;

  if (active) return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <button onClick={() => setActive(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
          <ChevronRight className="w-3.5 h-3.5 rotate-180" /> All Reports
        </button>
        <span className="text-muted-foreground/30">·</span>
        <span className="text-sm text-foreground truncate flex-1">{active.title}</span>
        <div className="flex items-center gap-1.5 shrink-0">
          {active.portfolioIncluded && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Portfolio</Badge>}
          {active.webSearched && <Badge variant="outline" className="text-[10px] border-blue-400/30 text-blue-400">Web</Badge>}
          <Badge variant="outline" className={`text-[10px] border-border capitalize ${active.depth === "deep" ? "text-purple-400" : active.depth === "quick" ? "text-emerald-400" : "text-blue-400"}`}>{active.depth}</Badge>
        </div>
      </div>
      <div className="bg-card border border-border rounded-xl p-6"><MarkdownReport content={active.report} /></div>
    </div>
  );

  if (reports.length === 0) return (
    <div className="text-center py-20 text-muted-foreground">
      <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-20" />
      <p className="text-sm">No saved reports yet. Run a research query and save it.</p>
    </div>
  );

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {reports.map(r => (
        <Card key={r.id} onClick={() => setActive(r)}
          className="bg-card border-border hover:border-primary/30 transition-colors cursor-pointer group">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-2">
              <div className="flex gap-1.5 flex-wrap">
                <Badge variant="outline" className={`text-[10px] border-border capitalize ${r.depth === "deep" ? "text-purple-400 border-purple-400/30" : r.depth === "quick" ? "text-emerald-400 border-emerald-400/30" : "text-blue-400 border-blue-400/30"}`}>{r.depth}</Badge>
                {r.portfolioIncluded && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">Portfolio</Badge>}
                {r.webSearched && <Badge variant="outline" className="text-[10px] border-blue-400/30 text-blue-400">Web</Badge>}
              </div>
              <button onClick={e => { e.stopPropagation(); if (confirm("Delete report?")) delReport.mutate(r.id); }}
                className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-destructive rounded transition-all">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
            <h3 className="text-sm font-medium text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-2">{r.title}</h3>
            {r.summary && <p className="text-xs text-muted-foreground/60 line-clamp-3">{r.summary}</p>}
            <div className="flex items-center gap-1.5 mt-3 text-[10px] text-muted-foreground/40">
              <Clock className="w-3 h-3" />
              {new Date(r.createdAt).toLocaleDateString("en-AU", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Component Builder ────────────────────────────────────────────────────────

function ComponentBuilder({ seedDescription }: { seedDescription?: string }) {
  const [desc, setDesc] = useState(seedDescription ?? "");
  const [incPortfolio, setIncPortfolio] = useState(false);

  React.useEffect(() => {
    if (seedDescription) setDesc(seedDescription);
  }, [seedDescription]);
  const [compName, setCompName] = useState("");
  const [savedId, setSavedId] = useState<number|null>(null);
  const [activeComp, setActiveComp] = useState<Component|null>(null);
  const { phase, code, err, generate, reset } = useComponentStream();
  const { data: components = [] } = useComponents();
  const saveComp = useSaveComponent();
  const delComp = useDeleteComponent();

  async function handleGenerate() {
    if (!desc.trim() || phase === "running") return;
    setSavedId(null);
    const context = incPortfolio ? "The user has an Australian multi-asset portfolio with real estate, equities, super, and trusts. Use realistic AUD sample data for the dark Bloomberg-meets-Apple premium aesthetic." : undefined;
    await generate({ description: desc, context });
  }

  async function handleSave() {
    if (!code) return;
    const r = await saveComp.mutateAsync({ name: compName.trim() || desc.slice(0, 60), description: desc, code });
    setSavedId(r.id);
  }

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-xl border border-border bg-card">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-7 h-7 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center"><FileCode className="w-3.5 h-3.5 text-primary" /></div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Component Builder</h3>
            <p className="text-[11px] text-muted-foreground">Describe a UI component and the AI generates production-ready React + shadcn/ui + Tailwind code</p>
          </div>
        </div>
        <div className="space-y-3">
          <textarea value={desc} onChange={e => setDesc(e.target.value)} rows={3} placeholder="e.g. A dark-themed portfolio allocation donut chart with a legend, using recharts, showing each asset class as a segment with AUD values…"
            className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
          <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
            <input type="checkbox" checked={incPortfolio} onChange={e => setIncPortfolio(e.target.checked)} className="accent-primary" />
            Include Australian portfolio sample data
          </label>
          <div className="flex gap-2">
            {phase === "running"
              ? <Button onClick={reset} variant="outline" className="gap-1.5 border-destructive/60 text-destructive"><StopCircle className="w-3.5 h-3.5" /> Stop</Button>
              : <Button onClick={handleGenerate} disabled={!desc.trim()} className="bg-primary text-primary-foreground hover:bg-primary/90 gap-1.5"><Sparkles className="w-3.5 h-3.5" /> Generate Component</Button>
            }
            {code && <Button onClick={reset} variant="outline" className="border-border text-muted-foreground">Reset</Button>}
          </div>
        </div>
        {phase === "idle" && !code && (
          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-2">Quick presets</p>
            <div className="flex flex-wrap gap-1.5">
              {COMPONENT_PRESETS.map((p, i) => (
                <button key={i} onClick={() => setDesc(p)} className="text-[11px] px-2.5 py-1 rounded-md bg-muted/30 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-left">
                  {p.slice(0, 52)}…
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {phase === "running" && !code && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin text-primary" /> Generating component…</div>
      )}
      {err && <div className="text-sm text-destructive p-4 rounded-xl border border-destructive/30 bg-destructive/5">{err}</div>}

      {code && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-foreground flex items-center gap-2">Generated Component {phase === "running" && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}</p>
            {phase !== "running" && !savedId && (
              <div className="flex items-center gap-2">
                <Input value={compName} onChange={e => setCompName(e.target.value)} placeholder="Component name…" className="h-7 w-40 text-xs bg-muted/30 border-border" />
                <Button onClick={handleSave} size="sm" variant="outline" className="h-7 text-xs gap-1 border-border"><Save className="w-3 h-3" /> Save</Button>
              </div>
            )}
            {savedId && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
          </div>
          <CodeBlock code={code} />
        </div>
      )}

      {components.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            Saved Components <Badge variant="outline" className="text-[10px] border-border text-muted-foreground">{components.length}</Badge>
          </h3>
          {activeComp
            ? (
              <div className="space-y-3">
                <button onClick={() => setActiveComp(null)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" /> Back to list
                </button>
                <CodeBlock code={activeComp.code} />
              </div>
            )
            : (
              <div className="space-y-2">
                {components.map(c => (
                  <div key={c.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card/50 hover:border-primary/30 transition-colors group">
                    <FileCode className="w-4 h-4 text-primary shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground font-medium truncate">{c.name}</p>
                      <p className="text-xs text-muted-foreground/60 truncate">{c.description}</p>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
                      <button onClick={() => setActiveComp(c)} className="p-1.5 text-muted-foreground hover:text-foreground rounded" title="View code"><Play className="w-3 h-3" /></button>
                      <button onClick={() => { if (confirm("Delete?")) delComp.mutate(c.id); }} className="p-1.5 text-muted-foreground hover:text-destructive rounded"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

// ─── GitHub Panel ─────────────────────────────────────────────────────────────

const FOCUS_OPTIONS = [
  { id: "architecture",   label: "Architecture & Structure", icon: Code2 },
  { id: "dependencies",   label: "Dependencies & Security",  icon: Package },
  { id: "ui_components",  label: "UI Components",            icon: FileCode },
  { id: "integration",    label: "Integration Plan",         icon: ArrowRight },
  { id: "code_quality",   label: "Code Quality",             icon: CheckCircle2 },
];

function useGitHubStream() {
  const [phase, setPhase] = useState<"idle"|"running"|"done"|"error">("idle");
  const [steps, setSteps] = useState<{step: string; message: string}[]>([]);
  const [text, setText] = useState("");
  const [repoData, setRepoData] = useState<any>(null);
  const [err, setErr] = useState<string|null>(null);
  const ctrl = useRef<AbortController|null>(null);

  const run = useCallback(async (params: object) => {
    setText(""); setSteps([]); setRepoData(null); setErr(null);
    setPhase("running");
    ctrl.current = new AbortController();
    try {
      await readSSE(`${BASE}/api/research/github`, params, ctrl.current.signal, (data) => {
        if (data.type === "step") setSteps(s => [...s, { step: data.step, message: data.message }]);
        else if (data.type === "repo") setRepoData(data.data);
        else if (data.type === "done") setPhase("done");
        else if (data.type === "error" || data.error) { setErr(data.error); setPhase("error"); }
        else if (data.choices?.[0]?.delta?.content) setText(t => t + data.choices[0].delta.content);
      });
      setPhase(p => p === "running" ? "done" : p);
    } catch (e: any) {
      if (e.name !== "AbortError") { setErr(e.message); setPhase("error"); }
      else setPhase("idle");
    }
  }, []);

  const stop = useCallback(() => { ctrl.current?.abort(); setPhase("idle"); }, []);
  const reset = useCallback(() => { ctrl.current?.abort(); setText(""); setSteps([]); setRepoData(null); setErr(null); setPhase("idle"); }, []);
  return { phase, steps, text, repoData, err, run, stop, reset };
}

function GitHubPanel({ onSendToBuilder }: { onSendToBuilder: (desc: string) => void }) {
  const [repoUrl, setRepoUrl] = useState("");
  const [depth, setDepth] = useState("standard");
  const [focus, setFocus] = useState<string[]>(["architecture", "integration"]);
  const [saveTitle, setSaveTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number|null>(null);
  const { phase, steps, text, repoData, err, run, stop, reset } = useGitHubStream();
  const saveReport = useSaveReport();

  function toggleFocus(id: string) {
    setFocus(f => f.includes(id) ? f.filter(x => x !== id) : [...f, id]);
  }

  async function handleAnalyse() {
    if (!repoUrl.trim() || phase === "running") return;
    setSavedId(null);
    const focusLabels = focus.map(f => FOCUS_OPTIONS.find(o => o.id === f)?.label ?? f);
    await run({ repoUrl: repoUrl.trim(), depth, focus: focusLabels });
  }

  async function handleSave() {
    if (!text) return;
    setSaving(true);
    const title = saveTitle.trim() || (repoData ? `GitHub: ${repoData.name}` : repoUrl);
    try {
      const r = await saveReport.mutateAsync({ title, query: `GitHub analysis: ${repoUrl}`, depth, report: text, summary: text.slice(0, 400), sources: [], portfolioIncluded: false, webSearched: false });
      setSavedId(r.id);
    } finally { setSaving(false); }
  }

  function handleSendToBuilder() {
    if (!repoData) return;
    const desc = `Generate a dark premium React component inspired by the ${repoData.name} GitHub project. The component should use the repository's purpose (${repoData.description || "software project"}) as context, use recharts for any data visualisation, shadcn/ui components, Tailwind CSS, and match the dark Bloomberg-meets-Apple aesthetic of the Family Office app (background #0d1117, accent gold #C9A227). Create something that could be useful in a wealth management dashboard context.`;
    onSendToBuilder(desc);
  }

  const isRunning = phase === "running";
  const isDone = phase === "done";
  const noData = !text && phase === "idle";

  return (
    <div className="space-y-5">
      {noData && (
        <div className="text-center py-6">
          <div className="w-16 h-16 rounded-2xl bg-muted/30 border border-border flex items-center justify-center mx-auto mb-4">
            <Github className="w-8 h-8 text-foreground/60" />
          </div>
          <h2 className="text-xl font-serif text-foreground mb-1">GitHub Repository Analyser</h2>
          <p className="text-muted-foreground text-sm max-w-md mx-auto">Paste any GitHub repo URL. The AI fetches its metadata, README, issues, dependencies, and code structure — then delivers a deep analysis and integration plan.</p>
        </div>
      )}

      {/* URL input */}
      <div className={`flex gap-3 ${!noData ? "border-b border-border pb-5" : ""}`}>
        <div className="flex-1 relative">
          <Github className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <input value={repoUrl} onChange={e => setRepoUrl(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !isRunning) handleAnalyse(); }}
            placeholder="https://github.com/owner/repo"
            className="w-full h-10 pl-9 pr-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono"
            disabled={isRunning} />
        </div>
        {isRunning
          ? <button onClick={stop} className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-destructive/60 text-destructive hover:bg-destructive/10 text-sm transition-colors shrink-0"><StopCircle className="w-4 h-4" /> Stop</button>
          : <button onClick={handleAnalyse} disabled={!repoUrl.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm disabled:opacity-40 transition-colors shrink-0">
              <Sparkles className="w-4 h-4" /> Analyse
            </button>
        }
        {isDone && <button onClick={() => { reset(); setSavedId(null); }} className="px-4 py-2 rounded-lg border border-border text-muted-foreground hover:text-foreground text-sm shrink-0">New</button>}
      </div>

      {/* Options */}
      {noData && (
        <div className="space-y-4">
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Analysis Depth</p>
            <div className="flex gap-2">
              {DEPTH_OPTIONS.map(d => (
                <button key={d.id} onClick={() => setDepth(d.id)}
                  className={`flex-1 p-3 rounded-lg border text-left transition-colors ${depth === d.id ? "border-primary bg-primary/10" : "border-border hover:bg-muted/20"}`}>
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <d.icon className={`w-3.5 h-3.5 ${depth === d.id ? "text-primary" : "text-muted-foreground"}`} />
                    <span className={`text-xs font-medium ${depth === d.id ? "text-foreground" : "text-muted-foreground"}`}>{d.label}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/60">{d.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Focus Areas</p>
            <div className="flex flex-wrap gap-2">
              {FOCUS_OPTIONS.map(o => (
                <button key={o.id} onClick={() => toggleFocus(o.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs border transition-colors ${focus.includes(o.id) ? "border-primary bg-primary/10 text-foreground" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                  <o.icon className={`w-3 h-3 ${focus.includes(o.id) ? "text-primary" : "text-muted-foreground"}`} />
                  {o.label}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 rounded-lg border border-border bg-muted/10 text-xs text-muted-foreground flex items-start gap-2">
            <Shield className="w-3.5 h-3.5 mt-0.5 shrink-0 text-emerald-500" />
            Public repos work without a GitHub token (60 req/hr). Add a <code className="font-mono text-primary bg-muted/40 px-1 rounded">GITHUB_TOKEN</code> secret for private repos and higher rate limits (5,000 req/hr). Configure in Settings → Tools &amp; Integrations.
          </div>
        </div>
      )}

      {/* Progress */}
      {(isRunning || (isDone && steps.length > 0)) && (
        <div className="space-y-1.5 px-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i < steps.length - 1 ? "bg-emerald-500" : isRunning ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
              {s.message}
            </div>
          ))}
          {isRunning && <div className="flex items-center gap-2 mt-1"><Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /><span className="text-xs text-muted-foreground italic">{text ? "Writing analysis…" : "Preparing…"}</span></div>}
        </div>
      )}

      {/* Error */}
      {err && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div><p className="font-medium">Analysis failed</p><p className="text-xs mt-0.5 opacity-80">{err}</p></div>
        </div>
      )}

      {/* Repo stats card */}
      {repoData && (
        <div className="p-4 rounded-xl border border-border bg-card">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-muted/40 border border-border flex items-center justify-center">
                <Github className="w-4 h-4 text-foreground/60" />
              </div>
              <div>
                <a href={`https://github.com/${repoData.name}`} target="_blank" rel="noreferrer"
                  className="text-sm font-semibold text-foreground hover:text-primary transition-colors font-mono">{repoData.name}</a>
                {repoData.description && <p className="text-xs text-muted-foreground mt-0.5">{repoData.description}</p>}
              </div>
            </div>
            {isDone && (
              <button onClick={handleSendToBuilder}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-primary/30 text-primary bg-primary/5 hover:bg-primary/10 text-xs font-medium transition-colors shrink-0">
                <FileCode className="w-3 h-3" /> Generate Component
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Star className="w-3 h-3 text-primary" />{repoData.stars?.toLocaleString() ?? 0}</span>
            <span className="flex items-center gap-1"><GitFork className="w-3 h-3" />{repoData.forks?.toLocaleString() ?? 0}</span>
            <span className="flex items-center gap-1"><Bug className="w-3 h-3" />{repoData.openIssues ?? 0} open issues</span>
            {repoData.language && <span className="flex items-center gap-1"><Code2 className="w-3 h-3" />{repoData.language}</span>}
            {repoData.license && <span className="flex items-center gap-1"><Shield className="w-3 h-3" />{repoData.license}</span>}
          </div>
          {repoData.topics?.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {repoData.topics.slice(0, 8).map((t: string) => (
                <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">{t}</span>
              ))}
            </div>
          )}
          {repoData.languages && Object.keys(repoData.languages).length > 0 && (
            <div className="mt-3">
              <p className="text-[10px] text-muted-foreground/60 uppercase tracking-wide mb-1.5">Languages</p>
              <div className="flex gap-1 h-1.5 rounded-full overflow-hidden">
                {(() => {
                  const total = Object.values(repoData.languages).reduce((s: number, v: any) => s + v, 0) as number;
                  const colors = ["bg-primary", "bg-blue-400", "bg-purple-400", "bg-emerald-400", "bg-orange-400", "bg-pink-400"];
                  return Object.entries(repoData.languages).map(([lang, bytes]: any, i) => (
                    <div key={lang} className={`${colors[i % colors.length]} transition-all`} style={{ width: `${((bytes / total) * 100).toFixed(1)}%` }} title={`${lang}: ${((bytes / total) * 100).toFixed(1)}%`} />
                  ));
                })()}
              </div>
              <div className="flex flex-wrap gap-3 mt-1.5">
                {(() => {
                  const total = Object.values(repoData.languages).reduce((s: number, v: any) => s + v, 0) as number;
                  const colors = ["text-primary", "text-blue-400", "text-purple-400", "text-emerald-400", "text-orange-400", "text-pink-400"];
                  return Object.entries(repoData.languages).slice(0, 6).map(([lang, bytes]: any, i) => (
                    <span key={lang} className={`text-[10px] flex items-center gap-1 ${colors[i % colors.length]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${colors[i % colors.length].replace("text-", "bg-")}`} />
                      {lang} {((bytes / total) * 100).toFixed(0)}%
                    </span>
                  ));
                })()}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Analysis report */}
      {text && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Github className="w-4 h-4 text-foreground/60" />
              <span className="text-sm font-medium text-foreground">Repository Analysis</span>
              <Badge variant="outline" className={`text-[10px] border-border capitalize ${depth === "deep" ? "text-purple-400 border-purple-400/30" : depth === "quick" ? "text-emerald-400 border-emerald-400/30" : "text-blue-400 border-blue-400/30"}`}>{depth}</Badge>
            </div>
            {isDone && !savedId && (
              <div className="flex items-center gap-2 shrink-0">
                <input value={saveTitle} onChange={e => setSaveTitle(e.target.value)} placeholder="Report title…"
                  className="h-7 w-44 px-2 text-xs rounded-md border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
                <button onClick={handleSave} disabled={saving}
                  className="flex items-center gap-1 h-7 px-2.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                  <Save className="w-3 h-3" />{saving ? "Saving…" : "Save"}
                </button>
              </div>
            )}
            {savedId && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
          </div>
          <div className="bg-card border border-border rounded-xl p-6">
            <MarkdownReport content={text} />
            {isRunning && <span className="inline-block w-1.5 h-4 bg-primary/80 animate-pulse ml-1 rounded-sm align-middle" />}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Business Plan Generator ──────────────────────────────────────────────────

const BIZ_STAGES = ["Pre-idea", "Idea / Concept", "MVP / Prototype", "Early Revenue", "Growth", "Scale-up", "Established"];
const BIZ_INDUSTRIES = [
  "FinTech", "PropTech", "HealthTech", "EdTech", "SaaS / B2B Software",
  "E-Commerce / Retail", "AI / Machine Learning", "CleanTech / GreenTech",
  "AgriTech", "Logistics / Supply Chain", "Media / Content", "Biotech / MedTech",
  "Cybersecurity", "Legal Tech", "HR Tech", "Marketplace", "Hardware / IoT",
  "Professional Services", "Food & Beverage", "Other",
];

function usePlanStream() {
  const [phase, setPhase] = useState<"idle"|"running"|"done"|"error">("idle");
  const [steps, setSteps] = useState<{step: string; message: string}[]>([]);
  const [text, setText] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [err, setErr] = useState<string|null>(null);
  const ctrl = useRef<AbortController|null>(null);

  const run = useCallback(async (endpoint: string, params: object) => {
    setText(""); setSteps([]); setSources([]); setErr(null);
    setPhase("running");
    ctrl.current = new AbortController();
    try {
      await readSSE(`${BASE}${endpoint}`, params, ctrl.current.signal, (data) => {
        if (data.type === "step")    setSteps(s => [...s, { step: data.step, message: data.message }]);
        else if (data.type === "sources") setSources(data.sources ?? []);
        else if (data.type === "done")    setPhase("done");
        else if (data.type === "error" || data.error) { setErr(data.error); setPhase("error"); }
        else if (data.choices?.[0]?.delta?.content)   setText(t => t + data.choices[0].delta.content);
      });
      setPhase(p => p === "running" ? "done" : p);
    } catch (e: any) {
      if (e.name !== "AbortError") { setErr(e.message); setPhase("error"); }
      else setPhase("idle");
    }
  }, []);

  const stop  = useCallback(() => { ctrl.current?.abort(); setPhase("idle"); }, []);
  const reset = useCallback(() => { ctrl.current?.abort(); setText(""); setSteps([]); setSources([]); setErr(null); setPhase("idle"); }, []);
  return { phase, steps, text, sources, err, run, stop, reset };
}

function BusinessPlanPanel() {
  const [mode, setMode] = useState<"executive"|"full">("executive");
  const [step, setStep] = useState<"form"|"result">("form");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number|null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const saveReport = useSaveReport();

  const [form, setForm] = useState({
    businessName: "", description: "", industry: "SaaS / B2B Software", stage: "MVP / Prototype",
    problem: "", solution: "", revenueModel: "", targetMarket: "", competitors: "",
    traction: "", teamSize: "2-5", teamBackground: "", fundingAsk: "", useOfFunds: "",
    includeResearch: true,
  });

  const { phase, steps, text, sources, err, run, stop, reset } = usePlanStream();
  const isRunning = phase === "running";
  const isDone    = phase === "done";

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }

  async function handleGenerate() {
    if (!form.businessName.trim() || !form.description.trim()) return;
    setSavedId(null); setSaveTitle("");
    await run("/api/research/business-plan", { ...form, mode });
    setStep("result");
  }

  async function handleSave() {
    if (!text) return;
    setSaving(true);
    const title = saveTitle.trim() || `${form.businessName} — ${mode === "executive" ? "Executive Summary" : "Full Business Plan"}`;
    try {
      const r = await saveReport.mutateAsync({ title, query: `Business plan: ${form.businessName}`, depth: mode, report: text, summary: text.slice(0, 400), sources, portfolioIncluded: false, webSearched: form.includeResearch });
      setSavedId(r.id);
    } finally { setSaving(false); }
  }

  const InputRow = ({ label, k, placeholder, textarea }: { label: string; k: string; placeholder: string; textarea?: boolean }) => (
    <div>
      <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
      {textarea
        ? <textarea value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder} rows={2}
            className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        : <input value={(form as any)[k]} onChange={e => set(k, e.target.value)} placeholder={placeholder}
            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
      }
    </div>
  );

  if (step === "result" || isRunning) return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => { reset(); setStep("form"); setSavedId(null); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" /> Back
          </button>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 border border-primary/20 flex items-center justify-center">
              {mode === "executive" ? <FileText className="w-3 h-3 text-primary" /> : <ClipboardList className="w-3 h-3 text-primary" />}
            </div>
            <span className="text-sm font-medium text-foreground">{form.businessName || "Business Plan"}</span>
            <Badge variant="outline" className={`text-[10px] border-border ${mode === "executive" ? "text-emerald-400 border-emerald-400/30" : "text-purple-400 border-purple-400/30"}`}>
              {mode === "executive" ? "Executive Summary" : "Full VC-Grade Plan"}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isRunning && <button onClick={stop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/60 text-destructive hover:bg-destructive/10 text-xs transition-colors"><StopCircle className="w-3 h-3" /> Stop</button>}
          {isDone && !savedId && (
            <>
              <input value={saveTitle} onChange={e => setSaveTitle(e.target.value)} placeholder="Report title…"
                className="h-7 w-40 px-2 text-xs rounded-md border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
              <button onClick={handleSave} disabled={saving}
                className="flex items-center gap-1 h-7 px-2.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
                <Save className="w-3 h-3" />{saving ? "Saving…" : "Save"}
              </button>
            </>
          )}
          {savedId && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
        </div>
      </div>

      {/* Progress */}
      {steps.length > 0 && (
        <div className="space-y-1.5 px-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i < steps.length - 1 ? "bg-emerald-500" : isRunning ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
              {s.message}
            </div>
          ))}
          {isRunning && <div className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /><span className="text-xs text-muted-foreground italic">{text ? "Writing plan…" : "Researching market…"}</span></div>}
        </div>
      )}

      {err && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div><p className="font-medium">Generation failed</p><p className="text-xs mt-0.5 opacity-80">{err}</p></div>
        </div>
      )}

      {/* Sources */}
      {sources.length > 0 && !isRunning && (
        <div className="flex flex-wrap gap-1.5">
          {sources.slice(0, 6).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors max-w-[200px] truncate">
              <Globe className="w-2.5 h-2.5 shrink-0" />{s.title.slice(0, 30)}
            </a>
          ))}
        </div>
      )}

      {/* Document */}
      {text && (
        <div className="bg-card border border-border rounded-xl p-6">
          <MarkdownReport content={text} />
          {isRunning && <span className="inline-block w-1.5 h-4 bg-primary/80 animate-pulse ml-1 rounded-sm align-middle" />}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
          <Rocket className="w-7 h-7 text-primary" />
        </div>
        <h2 className="text-2xl font-serif text-foreground mb-1">Business Plan Generator</h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">AI-powered, research-backed business plans that meet the standard of the world's top VC firms. From 1-page executive summaries to full investment-committee ready documents.</p>
      </div>

      {/* Mode selector */}
      <div className="grid grid-cols-2 gap-3">
        {[
          { id: "executive" as const, icon: FileText, label: "Executive Summary", badge: "1-Page", desc: "Investor-ready 1-pager with key metrics, unit economics, funding ask, and market data. Perfect for initial outreach and warm intros.", color: "emerald" },
          { id: "full" as const, icon: ClipboardList, label: "Full Business Plan", badge: "VC-Grade", desc: "Complete 13-section document: market analysis, 5-year financials, competitive matrix, risk assessment, GTM strategy, and exit planning.", color: "purple" },
        ].map(m => (
          <button key={m.id} onClick={() => setMode(m.id)}
            className={`p-4 rounded-xl border text-left transition-all ${mode === m.id ? `border-primary bg-primary/10` : "border-border hover:bg-muted/20"}`}>
            <div className="flex items-center gap-2 mb-2">
              <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${mode === m.id ? "bg-primary/20" : "bg-muted/40"}`}>
                <m.icon className={`w-3.5 h-3.5 ${mode === m.id ? "text-primary" : "text-muted-foreground"}`} />
              </div>
              <span className={`text-sm font-semibold ${mode === m.id ? "text-foreground" : "text-muted-foreground"}`}>{m.label}</span>
              <span className={`ml-auto text-[10px] px-1.5 py-0.5 rounded-full border ${mode === m.id ? `border-primary/40 bg-primary/10 text-primary` : "border-border bg-muted/20 text-muted-foreground"}`}>{m.badge}</span>
            </div>
            <p className={`text-xs leading-relaxed ${mode === m.id ? "text-muted-foreground" : "text-muted-foreground/60"}`}>{m.desc}</p>
          </button>
        ))}
      </div>

      {/* Form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Building className="w-3.5 h-3.5 text-primary" /> Business Details
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <InputRow label="Business / Startup Name *" k="businessName" placeholder="e.g. Acme AI" />
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Industry *</label>
            <select value={form.industry} onChange={e => set("industry", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {BIZ_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
        </div>

        <InputRow label="Business Description *" k="description" placeholder="What does your business do? What's the core product or service?" textarea />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Stage</label>
            <select value={form.stage} onChange={e => set("stage", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {BIZ_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <InputRow label="Funding Ask" k="fundingAsk" placeholder="e.g. $500K, $2M Seed" />
        </div>

        <InputRow label="Problem Being Solved" k="problem" placeholder="What specific pain point or problem does your business solve?" textarea />
        <InputRow label="Solution / Product" k="solution" placeholder="How does your product/service solve this problem? What's unique about it?" textarea />

        <div className="grid grid-cols-2 gap-3">
          <InputRow label="Revenue Model" k="revenueModel" placeholder="e.g. SaaS subscription, marketplace commission, licensing" />
          <InputRow label="Target Market" k="targetMarket" placeholder="e.g. SMEs in Australia, enterprise HR departments" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputRow label="Traction / Validation" k="traction" placeholder="e.g. 50 paying customers, $30K MRR, LOIs from 3 enterprise clients" />
          <InputRow label="Key Competitors" k="competitors" placeholder="e.g. Salesforce, HubSpot, local startup XYZ" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InputRow label="Team Size" k="teamSize" placeholder="e.g. 3 co-founders" />
          <InputRow label="Team Background" k="teamBackground" placeholder="e.g. Ex-Google CTO, 10yr finance background" />
        </div>

        <InputRow label="Use of Funds" k="useOfFunds" placeholder="e.g. 60% product dev, 30% sales & marketing, 10% ops" />

        <div className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/10">
          <button onClick={() => set("includeResearch", !form.includeResearch)}
            className={`w-8 h-4 rounded-full transition-colors relative ${form.includeResearch ? "bg-primary" : "bg-muted/60"}`}>
            <div className={`w-3 h-3 rounded-full bg-white absolute top-0.5 transition-all ${form.includeResearch ? "left-4" : "left-0.5"}`} />
          </button>
          <span className="text-xs text-muted-foreground">Include live market research (searches current TAM data, competitor analysis, VC funding trends)</span>
        </div>
      </div>

      <button onClick={handleGenerate} disabled={!form.businessName.trim() || !form.description.trim()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-40">
        <Sparkles className="w-4 h-4" />
        Generate {mode === "executive" ? "Executive Summary" : "Full Business Plan"}
      </button>
    </div>
  );
}

// ─── Grant Research & Proposal Panel ─────────────────────────────────────────

const GRANT_INDUSTRIES = [
  "Technology / SaaS", "Manufacturing", "Agriculture / AgriTech", "Clean Energy / GreenTech",
  "HealthTech / Biotech", "Export / International Trade", "Education", "Creative Industries",
  "Social Enterprise", "Mining / Resources", "Construction", "Food & Beverage",
  "Professional Services", "Tourism", "Transport / Logistics", "Cybersecurity", "AI / ML", "Other",
];
const GRANT_STAGES = ["Pre-revenue", "Early Stage (<$500K revenue)", "Growth ($500K–$5M revenue)", "Established (>$5M revenue)"];
const GRANT_TYPES = ["Any", "Government Grants", "R&D / Innovation", "Export Grants", "Employment / Jobs", "Equity Free / Non-dilutive", "State / Territory", "Federal", "Private / Corporate"];
const LOCATIONS = ["New South Wales", "Victoria", "Queensland", "South Australia", "Western Australia", "Tasmania", "ACT", "Northern Territory", "National (Australia-wide)"];

function GrantPanel() {
  const [grantStep, setGrantStep] = useState<"search"|"results"|"proposal">("search");
  const [selectedGrant, setSelectedGrant] = useState<{name: string; org?: string; amount?: string} | null>(null);
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<number|null>(null);
  const [saveTitle, setSaveTitle] = useState("");
  const saveReport = useSaveReport();

  const [form, setForm] = useState({
    businessDescription: "", industry: "Technology / SaaS", stage: "Early Stage (<$500K revenue)",
    location: "National (Australia-wide)", businessType: "For-profit", employeeCount: "1-10",
    annualRevenue: "", researchFocus: "",
  });

  const [propForm, setPropForm] = useState({
    businessName: "", problem: "", solution: "", traction: "", teamBackground: "", fundingUse: "",
  });

  const { phase, steps, text, sources, err, run, stop, reset } = usePlanStream();
  const isRunning = phase === "running";
  const isDone    = phase === "done";

  function setF(k: string, v: any) { setForm(f => ({ ...f, [k]: v })); }
  function setP(k: string, v: any) { setPropForm(f => ({ ...f, [k]: v })); }

  async function handleSearch() {
    setSavedId(null);
    await run("/api/research/grants", form);
    setGrantStep("results");
  }

  async function handleProposal() {
    if (!selectedGrant || !propForm.businessName.trim()) return;
    setSavedId(null);
    await run("/api/research/grant-proposal", {
      grantName: selectedGrant.name,
      grantOrganisation: selectedGrant.org,
      grantAmount: selectedGrant.amount,
      businessDescription: form.businessDescription,
      industry: form.industry,
      stage: form.stage,
      ...propForm,
    });
  }

  async function handleSave() {
    if (!text) return;
    setSaving(true);
    const title = saveTitle.trim() || (grantStep === "proposal" && selectedGrant ? `Grant Proposal: ${selectedGrant.name}` : `Grant Research: ${form.industry}`);
    try {
      const r = await saveReport.mutateAsync({ title, query: `Grant research: ${form.industry} ${form.stage}`, depth: "standard", report: text, summary: text.slice(0, 400), sources, portfolioIncluded: false, webSearched: true });
      setSavedId(r.id);
    } finally { setSaving(false); }
  }

  const ResultHeader = ({ icon: Icon, title, badge }: { icon: React.ElementType; title: string; badge?: string }) => (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button onClick={() => { reset(); setGrantStep("search"); setSavedId(null); }} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium text-foreground">{title}</span>
          {badge && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary">{badge}</Badge>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {isRunning && <button onClick={stop} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-destructive/60 text-destructive hover:bg-destructive/10 text-xs"><StopCircle className="w-3 h-3" /> Stop</button>}
        {isDone && !savedId && (
          <>
            <input value={saveTitle} onChange={e => setSaveTitle(e.target.value)} placeholder="Report title…"
              className="h-7 w-40 px-2 text-xs rounded-md border border-border bg-muted/30 text-foreground placeholder:text-muted-foreground/50 focus:outline-none" />
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-1 h-7 px-2.5 text-xs rounded-md border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50">
              <Save className="w-3 h-3" />{saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
        {savedId && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>}
      </div>
    </div>
  );

  const StreamOutput = () => (
    <div className="space-y-4">
      {steps.length > 0 && (
        <div className="space-y-1.5 px-1">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${i < steps.length - 1 ? "bg-emerald-500" : isRunning ? "bg-primary animate-pulse" : "bg-emerald-500"}`} />
              {s.message}
            </div>
          ))}
          {isRunning && <div className="flex items-center gap-2"><Loader2 className="w-3.5 h-3.5 text-primary animate-spin" /><span className="text-xs text-muted-foreground italic">{text ? "Writing report…" : "Searching grants database…"}</span></div>}
        </div>
      )}

      {err && (
        <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/5 text-sm text-destructive">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div><p className="font-medium">Search failed</p><p className="text-xs mt-0.5 opacity-80">{err}</p></div>
        </div>
      )}

      {sources.length > 0 && !isRunning && (
        <div className="flex flex-wrap gap-1.5">
          {sources.slice(0, 6).map((s, i) => (
            <a key={i} href={s.url} target="_blank" rel="noreferrer"
              className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-border bg-muted/20 text-muted-foreground hover:text-foreground transition-colors max-w-[200px] truncate">
              <Globe className="w-2.5 h-2.5 shrink-0" />{s.title.slice(0, 32)}
            </a>
          ))}
        </div>
      )}

      {text && (
        <div className="bg-card border border-border rounded-xl p-6">
          <MarkdownReport content={text} />
          {isRunning && <span className="inline-block w-1.5 h-4 bg-primary/80 animate-pulse ml-1 rounded-sm align-middle" />}
        </div>
      )}
    </div>
  );

  if (grantStep === "results") return (
    <div className="space-y-5">
      <ResultHeader icon={HandCoins} title={`Grant Research — ${form.industry}`} badge={form.location} />
      <StreamOutput />
      {isDone && text && (
        <div className="p-4 rounded-xl border border-primary/20 bg-primary/5">
          <p className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Generate a Grant Proposal
          </p>
          <p className="text-xs text-muted-foreground mb-3">Found a grant you want to apply for? Enter the grant name and your business details to generate a full, submission-ready proposal.</p>
          <div className="flex gap-2">
            <input placeholder="Grant name (e.g. R&D Tax Incentive, Austrade EMDG…)"
              className="flex-1 h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
              onKeyDown={e => { if (e.key === "Enter") { const v = (e.target as HTMLInputElement).value; if (v.trim()) { setSelectedGrant({ name: v.trim() }); setGrantStep("proposal"); reset(); } } }}
              onChange={e => setSelectedGrant(g => g ? { ...g, name: e.target.value } : { name: e.target.value })} />
            <button onClick={() => { if (selectedGrant?.name) { setGrantStep("proposal"); reset(); } }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 text-sm transition-colors">
              <FileText className="w-3.5 h-3.5" /> Write Proposal
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (grantStep === "proposal") return (
    <div className="space-y-5">
      <ResultHeader icon={ClipboardList} title={selectedGrant?.name || "Grant Proposal"} badge="Full Proposal" />

      {!text && !isRunning && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Building className="w-3.5 h-3.5 text-primary" /> Proposal Details
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Grant Name *</label>
              <input value={selectedGrant?.name ?? ""} onChange={e => setSelectedGrant(g => ({ ...g, name: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Grant Organisation</label>
              <input placeholder="e.g. ATO, Austrade, Business Victoria"
                onChange={e => setSelectedGrant(g => ({ ...g, org: e.target.value }))}
                className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
          </div>
          {[
            { label: "Business / Applicant Name *", k: "businessName", p: "Legal entity name" },
            { label: "Problem Being Solved", k: "problem", p: "What pain point does your business solve?" },
            { label: "Solution / Product", k: "solution", p: "What is your product/service?" },
            { label: "Traction & Validation", k: "traction", p: "Customers, revenue, milestones, awards…" },
            { label: "Team Background", k: "teamBackground", p: "Relevant experience and qualifications" },
            { label: "Proposed Use of Grant Funds", k: "fundingUse", p: "How will the grant money be spent?" },
          ].map(({ label, k, p }) => (
            <div key={k}>
              <label className="block text-xs font-medium text-muted-foreground mb-1">{label}</label>
              <textarea value={(propForm as any)[k]} onChange={e => setP(k, e.target.value)} placeholder={p} rows={2}
                className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
            </div>
          ))}
          <button onClick={handleProposal} disabled={!propForm.businessName.trim() || isRunning}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-40">
            <Sparkles className="w-4 h-4" /> Generate Full Grant Proposal
          </button>
        </div>
      )}

      <StreamOutput />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Hero */}
      <div className="text-center py-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto mb-4">
          <HandCoins className="w-7 h-7 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-serif text-foreground mb-1">Grant Finder & Proposal Creator</h2>
        <p className="text-muted-foreground text-sm max-w-lg mx-auto">AI searches federal, state, and private grant databases to find the best opportunities for your business — then writes a complete, submission-ready proposal.</p>
      </div>

      {/* Search form */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Search className="w-3.5 h-3.5 text-primary" /> Tell us about your business
        </h3>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">Business Description *</label>
          <textarea value={form.businessDescription} onChange={e => setF("businessDescription", e.target.value)}
            placeholder="Describe your business — what it does, who it serves, and what makes it unique. The more detail you provide, the better the grant matches."
            rows={3} className="w-full px-3 py-2 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary resize-none" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Industry</label>
            <select value={form.industry} onChange={e => setF("industry", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {GRANT_INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Business Stage</label>
            <select value={form.stage} onChange={e => setF("stage", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {GRANT_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Location</label>
            <select value={form.location} onChange={e => setF("location", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Employees</label>
            <select value={form.employeeCount} onChange={e => setF("employeeCount", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {["1 (solo)", "2-5", "6-20", "21-50", "51-200", "200+"].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Business Type</label>
            <select value={form.businessType} onChange={e => setF("businessType", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {["For-profit", "Not-for-profit", "Social Enterprise", "Co-operative", "Start-up", "SME", "Mid-Market"].map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Annual Revenue</label>
            <select value={form.annualRevenue} onChange={e => setF("annualRevenue", e.target.value)}
              className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary">
              {["Pre-revenue", "< $50K", "$50K–$250K", "$250K–$1M", "$1M–$5M", "$5M–$20M", "$20M+"].map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-muted-foreground mb-1">R&D / Innovation Focus (optional)</label>
          <input value={form.researchFocus} onChange={e => setF("researchFocus", e.target.value)}
            placeholder="e.g. AI-powered diagnostics, sustainable packaging, export market expansion to Asia"
            className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 p-3 rounded-lg border border-border bg-muted/10">
          {[
            { icon: Building, label: "Government & Federal", desc: "Austrade, ARC, ARENA, ATO" },
            { icon: Globe, label: "State Programs",         desc: "Business Victoria, Investment NSW" },
            { icon: Award, label: "Private & Corporate",    desc: "Accelerators, CVC programs" },
          ].map(b => (
            <div key={b.label} className="text-center p-2">
              <b.icon className="w-4 h-4 text-primary mx-auto mb-1" />
              <p className="text-[10px] font-medium text-foreground">{b.label}</p>
              <p className="text-[10px] text-muted-foreground/70">{b.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <button onClick={handleSearch} disabled={!form.businessDescription.trim() || isRunning}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-medium transition-colors disabled:opacity-40">
        {isRunning ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching grants database…</> : <><Search className="w-4 h-4" /> Find Matching Grants</>}
      </button>
    </div>
  );
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "research", label: "Research",          icon: BrainCircuit },
  { id: "reports",  label: "Saved Reports",      icon: BookOpen },
  { id: "github",   label: "GitHub",             icon: Github },
  { id: "bizplan",  label: "Business Plan",      icon: Rocket },
  { id: "grants",   label: "Grants",             icon: HandCoins },
  { id: "builder",  label: "Components",         icon: FileCode },
];

export default function Research() {
  const [tab, setTab] = useState<Tab>("research");
  const [builderSeed, setBuilderSeed] = useState<string | undefined>(undefined);

  function sendToBuilder(desc: string) {
    setBuilderSeed(desc);
    setTab("builder");
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary" />
            </div>
            <h1 className="text-3xl font-serif text-foreground">AI Research</h1>
          </div>
          <p className="text-muted-foreground text-sm">Deep financial analysis · Live web search · Portfolio-aware · Multi-scenario projections · GitHub integration · Component builder</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground border border-border rounded-lg px-3 py-1.5 bg-muted/10">
          <Shield className="w-3.5 h-3.5 text-emerald-500" />
          Portfolio stays local by default
        </div>
      </div>

      <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); if (t.id !== "builder") setBuilderSeed(undefined); }}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center ${tab === t.id ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground hover:bg-muted/40"}`}>
            <t.icon className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {tab === "research" && <ResearchPanel />}
      {tab === "reports"  && <SavedReports />}
      {tab === "github"   && <GitHubPanel onSendToBuilder={sendToBuilder} />}
      {tab === "bizplan"  && <BusinessPlanPanel />}
      {tab === "grants"   && <GrantPanel />}
      {tab === "builder"  && <ComponentBuilder seedDescription={builderSeed} />}
    </div>
  );
}
