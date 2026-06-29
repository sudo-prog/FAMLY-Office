import React, { useState, useEffect, useRef, useCallback, memo } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  useGetDashboardSummary, useGetNetWorthHistory, useGetCashFlow,
  useGetAssetsByCategory, useGetRecentTransactions,
  useListDocuments, useListEntities,
  useCreateTransaction, getListTransactionsQueryKey,
} from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
} from "recharts";
import {
  TrendingUp, Wallet, FileKey, Users, Activity, Sparkles, Plus, Settings2,
  ArrowRight, Lock, Cloud, Shield, ChevronRight, X, Send, Upload, Loader2,
  TrendingDown, BarChart3, PieChartIcon, Info,
} from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { getStoredCurrency, convert, type Currency } from "@/lib/currency";

const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") ?? "";

const PIECHART_COLORS = [
  "hsl(43 65% 52%)", "hsl(215 40% 55%)", "hsl(160 40% 45%)",
  "hsl(30 55% 52%)", "hsl(280 30% 55%)", "hsl(0 50% 52%)",
];

const sym: Record<Currency, string> = { USD: "$", AUD: "A$", EUR: "€", GBP: "£", CAD: "C$", SGD: "S$" };

function fmtCur(v: number, from: Currency = "AUD") {
  const disp = getStoredCurrency();
  const converted = convert(v, from, disp);
  return `${sym[disp]}${new Intl.NumberFormat("en-AU", { maximumFractionDigits: 0 }).format(Math.round(converted))}`;
}

function fmtDate(d: string) {
  return new Date(d).toLocaleDateString("en-AU", { month: "short", day: "numeric" });
}

function fmtCat(c: string) { return c.replace(/_/g, " ").replace(/\b\w/g, (x) => x.toUpperCase()); }

type WidgetId = "net-worth" | "asset-stats" | "allocation" | "cash-flow" | "recent-activity" | "vault" | "entities" | "quick-add" | "ai-assistant" | "insights";

const WIDGET_META: Record<WidgetId, { label: string; desc: string; cols: string; icon: React.ElementType }> = {
  "net-worth": { label: "Net Worth", desc: "Total portfolio value and trend", cols: "md:col-span-2", icon: TrendingUp },
  "asset-stats": { label: "Asset Stats", desc: "Holdings count and value", cols: "", icon: Wallet },
  "allocation": { label: "Allocation", desc: "Asset allocation donut chart", cols: "", icon: PieChartIcon },
  "cash-flow": { label: "Cash Flow", desc: "Income vs expenses bars", cols: "md:col-span-2", icon: BarChart3 },
  "recent-activity": { label: "Recent Activity", desc: "Latest transactions", cols: "md:col-span-2", icon: Activity },
  "vault": { label: "Vault", desc: "Document vault status", cols: "", icon: FileKey },
  "entities": { label: "Entities", desc: "Legal entity overview", cols: "", icon: Users },
  "quick-add": { label: "Quick Add", desc: "Log a transaction fast", cols: "", icon: Plus },
  "insights": { label: "AI Insights", desc: "Proactive portfolio intelligence", cols: "md:col-span-2 xl:col-span-3", icon: Sparkles },
  "ai-assistant": { label: "AI Assistant", desc: "Local + Cloud AI with zero-trust routing", cols: "md:col-span-2 xl:col-span-3", icon: Sparkles },
};

const DEFAULT_WIDGETS: WidgetId[] = [
  "insights",
  "net-worth", "asset-stats",
  "allocation", "cash-flow",
  "recent-activity", "vault",
  "entities", "quick-add",
  "ai-assistant",
];

function loadWidgets(): WidgetId[] {
  try {
    const s = localStorage.getItem("fo-widgets");
    if (s) return JSON.parse(s);
  } catch {}
  return DEFAULT_WIDGETS;
}

function saveWidgets(w: WidgetId[]) {
  localStorage.setItem("fo-widgets", JSON.stringify(w));
}

function WidgetCard({ id, children, className = "", onClick }: { id: WidgetId; children: React.ReactNode; className?: string; onClick?: () => void }) {
  return (
    <div
      onClick={onClick}
      data-parallax={id === "quick-add" ? "1.5" : id === "net-worth" ? "1.2" : "1"}
      className={`bg-card border border-border rounded-2xl overflow-hidden flex flex-col relative transition-all duration-200 effect-emboss-blind ${onClick ? "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-black/20 group" : ""} ${WIDGET_META[id].cols} ${className}`}
    >
      {children}
      {onClick && (
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
      )}
    </div>
  );
}

// ─── Individual Widgets (memoized — receive stable data props from parent) ─────

const NetWorthWidget = memo(function NetWorthWidget({ summary, history }: { summary: any; history: any[] }) {
  const [, navigate] = useLocation();
  return (
    <WidgetCard id="net-worth" onClick={() => navigate("/assets")} className="min-h-[280px]">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-start justify-between mb-2">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Net Worth</div>
          <TrendingUp className="w-4 h-4 text-primary" />
        </div>
        <div className="text-4xl font-mono text-primary tabular-nums mb-1">
          {fmtCur(summary?.totalNetWorth ?? 0)}
        </div>
        <div className="text-xs text-muted-foreground mb-4">
          {summary?.assetCount ?? 0} assets · {summary?.entityCount ?? 0} entities
        </div>
        <div className="flex-1 min-h-0">
          {history && history.length > 0 && (
            <ResponsiveContainer width="100%" height={100}>
              <LineChart data={history}>
                <Line type="monotone" dataKey="value" stroke="hsl(43 65% 52%)" strokeWidth={2} dot={false} />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
                  formatter={(v: number) => [fmtCur(v), "Net Worth"]}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </WidgetCard>
  );
});

const AssetStatsWidget = memo(function AssetStatsWidget({ summary }: { summary: any }) {
  const [, navigate] = useLocation();
  return (
    <WidgetCard id="asset-stats" onClick={() => navigate("/assets")} className="min-h-[140px]">
      <div className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Assets</div>
          <Wallet className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-3xl font-mono text-foreground">{summary?.assetCount ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">holdings tracked</div>
        </div>
        <div className="text-xs font-mono text-primary tabular-nums">{fmtCur(summary?.totalAssets ?? 0)} total</div>
      </div>
    </WidgetCard>
  );
});

const AllocationWidget = memo(function AllocationWidget({ byCategory }: { byCategory: any }) {
  const [, navigate] = useLocation();
  const safe = Array.isArray(byCategory) ? byCategory : [];
  const top = safe.slice(0, 4);
  return (
    <WidgetCard id="allocation" onClick={() => navigate("/assets")} className="min-h-[280px]">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Allocation</div>
          <PieChartIcon className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-h-0">
          {top.length > 0 ? (
            <ResponsiveContainer width="100%" height={120}>
              <PieChart>
                <Pie data={top} cx="50%" cy="50%" innerRadius={36} outerRadius={56} paddingAngle={2} dataKey="total" stroke="none">
                  {top.map((_e, i) => <Cell key={i} fill={PIECHART_COLORS[i % PIECHART_COLORS.length]} />)}
                </Pie>
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
                  formatter={(v: number, _n: any, props: any) => [fmtCur(v), fmtCat(props.payload.category)]}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : <div className="h-24 flex items-center justify-center text-xs text-muted-foreground">No data</div>}
        </div>
        <div className="space-y-1.5 mt-2">
          {top.map((c, i) => (
            <div key={c.category} className="flex items-center gap-2 text-xs">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIECHART_COLORS[i] }} />
              <span className="text-muted-foreground truncate flex-1">{fmtCat(c.category)}</span>
              <span className="font-mono text-foreground tabular-nums">{fmtCur(c.total)}</span>
            </div>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
});

const CashFlowWidget = memo(function CashFlowWidget({ cashFlow, summary }: { cashFlow: any[]; summary: any }) {
  const [, navigate] = useLocation();
  return (
    <WidgetCard id="cash-flow" onClick={() => navigate("/transactions")} className="min-h-[280px]">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cash Flow</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-emerald-500 font-mono">+{fmtCur(summary?.totalIncome ?? 0)}</span>
            <span className="text-muted-foreground font-mono">-{fmtCur(summary?.totalExpenses ?? 0)}</span>
          </div>
        </div>
        <div className="flex-1">
          {cashFlow && cashFlow.length > 0 ? (
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={cashFlow} barGap={2}>
                <XAxis dataKey="month" fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" />
                <YAxis fontSize={10} tickLine={false} axisLine={false} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} width={40} />
                <RechartsTooltip
                  contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: 6, fontSize: 11 }}
                  formatter={(v: number, n: string) => [fmtCur(v), n === "income" ? "Income" : "Expenses"]}
                />
                <Bar dataKey="income" fill="hsl(160 40% 42%)" radius={[2, 2, 0, 0]} maxBarSize={28} />
                <Bar dataKey="expenses" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} maxBarSize={28} />
              </BarChart>
            </ResponsiveContainer>
          ) : <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No cash flow data</div>}
        </div>
      </div>
    </WidgetCard>
  );
});

const RecentActivityWidget = memo(function RecentActivityWidget({ transactions }: { transactions: any[] }) {
  const [, navigate] = useLocation();
  return (
    <WidgetCard id="recent-activity" onClick={() => navigate("/transactions")} className="min-h-[280px]">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-3">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Recent Activity</div>
          <Activity className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="flex-1 divide-y divide-border overflow-auto">
          {(transactions ?? []).slice(0, 6).map((tx) => (
            <div key={tx.id} className="flex items-center gap-3 py-2.5">
              <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${tx.type === "income" ? "bg-emerald-500" : tx.type === "expense" ? "bg-red-400/70" : "bg-blue-400/70"}`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-foreground truncate">{tx.description}</p>
                <p className="text-[10px] text-muted-foreground">{fmtDate(tx.date)}</p>
              </div>
              <span className={`text-xs font-mono tabular-nums flex-shrink-0 ${tx.type === "income" ? "text-emerald-500" : "text-foreground"}`}>
                {tx.type === "expense" ? "−" : "+"}{fmtCur(tx.amount)}
              </span>
            </div>
          ))}
          {(!transactions || transactions.length === 0) && (
            <p className="text-xs text-muted-foreground text-center py-6">No transactions yet.</p>
          )}
        </div>
      </div>
    </WidgetCard>
  );
});

const VaultWidget = memo(function VaultWidget({ documents }: { documents: any[] }) {
  const [, navigate] = useLocation();
  const encrypted = (documents ?? []).filter((d) => d.encrypted).length;
  return (
    <WidgetCard id="vault" onClick={() => navigate("/vault")} className="min-h-[140px]">
      <div className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vault</div>
          <FileKey className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-3xl font-mono text-foreground">{documents?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">documents</div>
        </div>
        {encrypted > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-emerald-500">
            <Lock className="w-3 h-3" /> {encrypted} encrypted
          </div>
        )}
      </div>
    </WidgetCard>
  );
});

const EntitiesWidget = memo(function EntitiesWidget({ entities }: { entities: any[] }) {
  const [, navigate] = useLocation();
  const types = [...new Set((entities ?? []).map((e) => e.type))];
  return (
    <WidgetCard id="entities" onClick={() => navigate("/entities")} className="min-h-[140px]">
      <div className="p-5 h-full flex flex-col justify-between">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Entities</div>
          <Users className="w-4 h-4 text-muted-foreground" />
        </div>
        <div>
          <div className="text-3xl font-mono text-foreground">{entities?.length ?? 0}</div>
          <div className="text-xs text-muted-foreground mt-1">legal structures</div>
        </div>
        <div className="flex gap-1 flex-wrap">
          {types.slice(0, 3).map((t) => (
            <span key={t} className="text-[10px] bg-muted/40 px-1.5 py-0.5 rounded text-muted-foreground capitalize">{t}</span>
          ))}
        </div>
      </div>
    </WidgetCard>
  );
});

function QuickAddWidget() {
  const qc = useQueryClient();
  const createTx = useCreateTransaction();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ description: "", amount: "", type: "expense", date: new Date().toISOString().slice(0, 10) });
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    setSaving(true);
    try {
      await createTx.mutateAsync({ description: form.description, amount: parseFloat(form.amount), type: form.type as any, date: form.date } as any);
      await qc.invalidateQueries({ queryKey: getListTransactionsQueryKey() });
      toast.success("Transaction added successfully");
      setOpen(false);
      setForm({ description: "", amount: "", type: "expense", date: new Date().toISOString().slice(0, 10) });
    } catch {
      toast.error("Failed to add transaction");
    } finally { setSaving(false); }
  }

  return (
    <>
      <WidgetCard id="quick-add" onClick={() => setOpen(true)} className="min-h-[140px]">
        <div className="p-5 h-full flex flex-col items-center justify-center gap-3 text-center">
          <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/30 flex items-center justify-center">
            <Plus className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground">Quick Add</div>
            <div className="text-xs text-muted-foreground mt-0.5">Log a transaction</div>
          </div>
        </div>
      </WidgetCard>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border max-w-sm max-w-[95vw]">
          <DialogHeader><DialogTitle className="font-serif text-lg">Quick Transaction</DialogTitle></DialogHeader>
          <form onSubmit={submit} className="space-y-3 mt-2">
            <Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Description" className="bg-muted/30 border-border" required />
            <div className="grid grid-cols-2 gap-2">
              <Input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="Amount" className="bg-muted/30 border-border font-mono" required />
              <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="h-9 rounded-md border border-border bg-muted/30 px-3 text-sm text-foreground">
                <option value="expense">Expense</option>
                <option value="income">Income</option>
                <option value="transfer">Transfer</option>
              </select>
            </div>
            <Input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="bg-muted/30 border-border" required />
            <DialogFooter>
              <button type="submit" disabled={saving} className="ovi-button w-full">{saving ? "Saving…" : "Add Transaction"}</button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── AI Widget ───────────────────────────────────────────────────────────────

type AIMessage = { role: "user" | "assistant"; content: string; routing?: string; model?: string };
type AIStatus = { local: { online: boolean; configured: boolean; model: string }; cloud: { configured: boolean; model: string } } | null;
type AIMode = "auto" | "local" | "cloud";

function AIWidget() {
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<AIStatus>(null);
  const [mode, setMode] = useState<AIMode>("auto");
  const [loading, setLoading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ name: string; content: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${BASE_URL}/api/ai/status`).then((r) => r.json()).then(setStatus).catch(() => {});
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setUploadedFile({ name: file.name, content: ev.target?.result as string ?? "" });
    reader.readAsText(file);
  };

  const sendMessage = useCallback(async () => {
    if (!input.trim() || loading) return;
    const userMsg: AIMessage = { role: "user", content: input + (uploadedFile ? `\n\n[Attached: ${uploadedFile.name}]` : "") };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    let assistantContent = "";
    let routing = "";
    let model = "";
    const placeholder: AIMessage = { role: "assistant", content: "▌", routing, model };
    setMessages((prev) => [...prev, placeholder]);

    try {
      const res = await fetch(`${BASE_URL}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: input, documentText: uploadedFile?.content, history, mode }),
      });

      if (!res.ok) {
        const err = await res.json();
        setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: `Error: ${err.error}`, routing: "error" }]);
        return;
      }

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.routing) routing = data.routing;
            if (data.model) model = data.model;
            if (data.content) assistantContent += data.content;
            if (data.done || data.content) {
              setMessages((prev) => [
                ...prev.slice(0, -1),
                { role: "assistant", content: assistantContent + (data.done ? "" : "▌"), routing, model },
              ]);
            }
          } catch {}
        }
      }
      setUploadedFile(null);
    } catch (err) {
      setMessages((prev) => [...prev.slice(0, -1), { role: "assistant", content: "Connection error. Check that the API server is running.", routing: "error" }]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages, mode, uploadedFile]);

  const SUGGESTIONS = [
    "Analyze my portfolio concentration risk",
    "Which assets are underperforming?",
    "Summarize my tax-deductible expenses",
    "Research ASX lithium sector outlook",
    "What is the current RBA cash rate?",
  ];

  const localOk = status?.local.online;
  const cloudOk = status?.cloud.configured;

  return (
    <WidgetCard id="ai-assistant" className="min-h-[520px]">
      <div className="flex flex-col h-full" style={{ minHeight: 520 }}>
        <div className="p-4 border-b border-border flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-foreground">AI Assistant</span>
            <span className="text-xs text-muted-foreground ml-1">Zero-Trust Routing</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full ${localOk ? "bg-emerald-500" : "bg-muted"}`} />
              <span className={localOk ? "text-emerald-500" : "text-muted-foreground"}>
                {localOk ? `Local (${status?.local.model})` : "Local offline"}
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs">
              <div className={`w-1.5 h-1.5 rounded-full ${cloudOk ? "bg-blue-400" : "bg-muted"}`} />
              <span className={cloudOk ? "text-blue-400" : "text-muted-foreground"}>
                {cloudOk ? `Cloud (${status?.cloud.model})` : "Cloud off"}
              </span>
            </div>
            <div className="flex items-center gap-0.5 bg-muted/30 border border-border rounded p-0.5">
              {(["auto", "local", "cloud"] as AIMode[]).map((m) => (
                <button key={m} onClick={() => setMode(m)}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                  {m === "auto" ? "🤖 Auto" : m === "local" ? "🔒 Local" : "☁️ Cloud"}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!localOk && !cloudOk && (
          <div className="m-4 p-4 bg-muted/20 border border-border rounded-lg text-sm">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground mb-1">Zero-Trust AI Architecture</p>
                <p className="text-xs text-muted-foreground mb-3">Your portfolio data stays local. Two separate AI tiers:</p>
                <div className="space-y-2 text-xs">
                  <div className="flex items-start gap-2">
                    <Lock className="w-3.5 h-3.5 text-emerald-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-foreground">Local LLM (Ollama)</strong> — runs on your machine. Receives full portfolio context. Install Ollama, run a model, then set <code className="bg-muted px-1 rounded">LOCAL_LLM_URL</code> secret.
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Cloud className="w-3.5 h-3.5 text-blue-400 mt-0.5 flex-shrink-0" />
                    <div>
                      <strong className="text-foreground">Cloud AI (OpenAI/Anthropic)</strong> — research only. All financial data is stripped before sending. Set <code className="bg-muted px-1 rounded">CLOUD_AI_KEY</code> secret.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.length === 0 && (localOk || cloudOk) && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground text-center mb-4">Suggested queries</p>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  className="w-full text-left text-xs px-3 py-2 rounded-lg bg-muted/20 border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all">
                  {s}
                </button>
              ))}
            </div>
          )}
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-xl px-3.5 py-2.5 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted/40 border border-border text-foreground"}`}>
                {msg.routing && msg.role === "assistant" && (
                  <div className="flex items-center gap-1.5 mb-1.5">
                    {msg.routing === "local" ? (
                      <><Lock className="w-2.5 h-2.5 text-emerald-500" /><span className="text-[9px] text-emerald-500 uppercase tracking-wider">Local · {msg.model}</span></>
                    ) : msg.routing === "cloud" ? (
                      <><Cloud className="w-2.5 h-2.5 text-blue-400" /><span className="text-[9px] text-blue-400 uppercase tracking-wider">Cloud · {msg.model} · Sanitized</span></>
                    ) : (
                      <><span className="text-[9px] text-destructive uppercase tracking-wider">Error</span></>
                    )}
                  </div>
                )}
                <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted/40 border border-border rounded-xl px-3.5 py-2.5">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-border flex-shrink-0">
          {uploadedFile && (
            <div className="flex items-center gap-2 mb-2 text-xs bg-muted/30 rounded px-2 py-1.5 border border-border">
              <Upload className="w-3 h-3 text-muted-foreground" />
              <span className="text-muted-foreground truncate flex-1">{uploadedFile.name}</span>
              <button onClick={() => setUploadedFile(null)} className="text-muted-foreground hover:text-foreground"><X className="w-3 h-3" /></button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <input ref={fileRef} type="file" accept=".txt,.csv,.md,.json" className="hidden" onChange={handleFile} />
            <button onClick={() => fileRef.current?.click()} title="Upload document" className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-lg hover:bg-muted/30 flex-shrink-0">
              <Upload className="w-4 h-4" />
            </button>
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder={localOk || cloudOk ? "Ask anything about your portfolio…" : "Configure Local LLM or Cloud AI to start…"}
              disabled={(!localOk && !cloudOk) || loading}
              className="bg-muted/30 border-border text-sm"
            />
            <Button onClick={sendMessage} disabled={(!localOk && !cloudOk) || loading || !input.trim()} size="icon" className="bg-primary text-primary-foreground flex-shrink-0">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </WidgetCard>
  );
}

// ─── AI Insights Widget ───────────────────────────────────────────────────────

interface Insight {
  type: "warning" | "opportunity" | "info";
  category: string;
  severity: "high" | "medium" | "low";
  title: string;
  detail: string;
  action: string;
}

const InsightsWidget = memo(function InsightsWidget() {
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [, navigate] = useLocation();

  const severityColor = {
    high: "border-red-500/40 bg-red-500/5",
    medium: "border-amber-500/40 bg-amber-500/5",
    low: "border-border bg-muted/20",
  };
  const severityDot = { high: "bg-red-500", medium: "bg-amber-400", low: "bg-emerald-500" };
  async function fetchInsights() {
    setLoading(true);
    try {
      const t = JSON.parse(localStorage.getItem("fo-insight-thresholds") || "{}");
      const params = new URLSearchParams({
        concentrationHigh: String(t.concentrationHigh ?? 60),
        concentrationMedium: String(t.concentrationMedium ?? 45),
        cryptoThreshold: String(t.cryptoThreshold ?? 25),
        idleCashThreshold: String(t.idleCashThreshold ?? 30),
      });
      const res = await fetch(`${BASE_URL}/api/ai/insights?${params}`);
      if (res.ok) {
        const data = await res.json();
        setInsights(data.insights ?? []);
      }
    } catch {}
    setLoading(false);
  }

  useEffect(() => { fetchInsights(); }, []);

  function handleAction(action: string) {
    const routes: Record<string, string> = {
      "Add Assets": "/assets", "Review Allocation": "/assets", "Rebalance": "/assets",
      "View Ledger": "/transactions", "Open Vault": "/vault", "Add Entities": "/entities",
      "View Projections": "/projections", "Review Crypto": "/assets", "Review Assets": "/assets",
      "Review Strategy": "/projections", "Review Entities": "/entities",
    };
    if (routes[action]) navigate(routes[action]);
  }

  return (
    <WidgetCard id="insights" className="min-h-[120px]">
      <div className="p-5 flex flex-col h-full">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">AI Insight Engine</span>
          </div>
          <button onClick={fetchInsights} disabled={loading} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1 disabled:opacity-40">
            {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ArrowRight className="w-3 h-3 rotate-[-90deg]" />}
            {loading ? "Analysing…" : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/30 rounded-xl animate-pulse" />)}
          </div>
        ) : insights.length === 0 ? (
          <div className="flex items-center justify-center h-16 text-muted-foreground text-sm">No insights available — add assets to begin analysis.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {insights.map((ins, i) => (
              <button
                key={i}
                onClick={() => setExpanded(expanded === i ? null : i)}
                className={`text-left rounded-xl border p-3 transition-all hover:border-primary/30 ${severityColor[ins.severity]}`}
              >
                <div className="flex items-start gap-2 mb-1">
                  <div className={`w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${severityDot[ins.severity]}`} />
                  <span className="text-xs font-medium text-foreground leading-snug">{ins.title}</span>
                </div>
                {expanded === i && (
                  <div className="mt-2 pl-3.5 space-y-2">
                    <p className="text-[11px] text-muted-foreground leading-relaxed">{ins.detail}</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleAction(ins.action); }}
                      className="text-[11px] text-primary hover:underline font-medium"
                    >
                      {ins.action} →
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </WidgetCard>
  );
});

// ─── Customize Panel ──────────────────────────────────────────────────────────

const CustomizePanel = memo(function CustomizePanel({ visible, onClose, activeWidgets, onToggle, onReset }: {
  visible: boolean; onClose: () => void; activeWidgets: WidgetId[];
  onToggle: (id: WidgetId) => void; onReset: () => void;
}) {
  return (
    <>
      {visible && <div className="fixed inset-0 z-40" onClick={onClose} />}
      <div className={`fixed right-0 top-0 h-full w-72 bg-card border-l border-border z-50 flex flex-col transform transition-transform duration-300 ${visible ? "translate-x-0" : "translate-x-full"}`}>
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-foreground text-sm">Customize Widgets</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Toggle widgets on or off</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {(Object.keys(WIDGET_META) as WidgetId[]).map((id) => {
            const meta = WIDGET_META[id];
            const active = activeWidgets.includes(id);
            const Icon = meta.icon;
            return (
              <button key={id} onClick={() => onToggle(id)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${active ? "bg-primary/10 border-primary/30" : "bg-muted/20 border-border hover:border-primary/20"}`}>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${active ? "bg-primary/20" : "bg-muted/40"}`}>
                  <Icon className={`w-4 h-4 ${active ? "text-primary" : "text-muted-foreground"}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{meta.label}</div>
                  <div className="text-[10px] text-muted-foreground truncate">{meta.desc}</div>
                </div>
                <div className={`w-4 h-4 rounded border-2 flex-shrink-0 ${active ? "bg-primary border-primary" : "border-muted-foreground/40"}`}>
                  {active && <div className="w-full h-full flex items-center justify-center"><div className="w-1.5 h-1.5 bg-primary-foreground rounded-sm" /></div>}
                </div>
              </button>
            );
          })}
        </div>
        <div className="p-4 border-t border-border">
          <button onClick={onReset} className="w-full text-xs text-muted-foreground hover:text-foreground py-2 transition-colors">Reset to default layout</button>
        </div>
      </div>
    </>
  );
});

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export default function Dashboard() {
  const [activeWidgets, setActiveWidgets] = useState<WidgetId[]>(loadWidgets);
  const [customizing, setCustomizing] = useState(false);

  const { data: summary } = useGetDashboardSummary();
  const { data: history } = useGetNetWorthHistory();
  const [snapHistory, setSnapHistory] = useState<{ month: string; value: number }[]>([]);

  useEffect(() => {
    async function captureAndFetch() {
      try {
        await fetch(`${BASE_URL}/api/snapshots/record`, { method: "POST" });
        const res = await fetch(`${BASE_URL}/api/snapshots`);
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) setSnapHistory(data);
        }
      } catch {}
    }
    captureAndFetch();
  }, []);
  const { data: cashFlow } = useGetCashFlow();
  const { data: byCategory } = useGetAssetsByCategory();
  const { data: recentTx } = useGetRecentTransactions();
  const { data: documents } = useListDocuments();
  const { data: entities } = useListEntities();

  const toggleWidget = useCallback((id: WidgetId) => {
    setActiveWidgets((prev) => {
      const next = prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id];
      saveWidgets(next);
      return next;
    });
  }, []);

  const resetWidgets = useCallback(() => {
    setActiveWidgets(DEFAULT_WIDGETS);
    saveWidgets(DEFAULT_WIDGETS);
  }, []);

  const cur = getStoredCurrency();

  return (
    <div className="space-y-4 md:space-y-6 pb-8">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif text-foreground mb-1 effect-emboss-ink">Command Center</h1>
          <p className="text-muted-foreground text-xs md:text-sm">
            {activeWidgets.length} widgets · {cur} display · {entities?.length ?? 0} entities
          </p>
        </div>
        <button onClick={() => setCustomizing(true)} className="ovi-button gap-2 flex-shrink-0">
          <Settings2 className="w-4 h-4" /> <span className="hidden sm:inline">Customize</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-4">
        {activeWidgets.map((id) => {
          switch (id) {
            case "net-worth": return <NetWorthWidget key={id} summary={summary} history={snapHistory.length >= 2 ? snapHistory : (history ?? [])} />;
            case "asset-stats": return <AssetStatsWidget key={id} summary={summary} />;
            case "allocation": return <AllocationWidget key={id} byCategory={byCategory ?? []} />;
            case "cash-flow": return <CashFlowWidget key={id} cashFlow={cashFlow ?? []} summary={summary} />;
            case "recent-activity": return <RecentActivityWidget key={id} transactions={recentTx ?? []} />;
            case "vault": return <VaultWidget key={id} documents={documents ?? []} />;
            case "entities": return <EntitiesWidget key={id} entities={entities ?? []} />;
            case "quick-add": return <QuickAddWidget key={id} />;
            case "ai-assistant": return <AIWidget key={id} />;
            case "insights": return <InsightsWidget key={id} />;
            default: return null;
          }
        })}
      </div>

      <CustomizePanel
        visible={customizing}
        onClose={() => setCustomizing(false)}
        activeWidgets={activeWidgets}
        onToggle={toggleWidget}
        onReset={resetWidgets}
      />
    </div>
  );
}
