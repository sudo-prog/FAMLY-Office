import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Trash2, RefreshCw, Sparkles, TrendingUp, TrendingDown,
  Search, Eye, Bell, Loader2, BarChart2,
} from "lucide-react";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");
const api = (path: string, init?: RequestInit) => fetch(`${BASE}/api/watchlist${path}`, init).then(r => r.json());

interface WatchlistItem {
  id: number;
  symbol: string;
  name: string;
  type: string;
  exchange?: string;
  price?: string;
  change?: string;
  changePercent?: string;
  currency: string;
  notes?: string;
  aiSummary?: string;
  alertHigh?: string;
  alertLow?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const PRESET_STOCKS = [
  { symbol: "AAPL", name: "Apple Inc.", type: "equity", exchange: "NASDAQ" },
  { symbol: "MSFT", name: "Microsoft Corp.", type: "equity", exchange: "NASDAQ" },
  { symbol: "GOOGL", name: "Alphabet Inc.", type: "equity", exchange: "NASDAQ" },
  { symbol: "AMZN", name: "Amazon.com Inc.", type: "equity", exchange: "NASDAQ" },
  { symbol: "BTC", name: "Bitcoin", type: "crypto" },
  { symbol: "ETH", name: "Ethereum", type: "crypto" },
  { symbol: "SOL", name: "Solana", type: "crypto" },
  { symbol: "CBA.AX", name: "Commonwealth Bank", type: "equity", exchange: "ASX" },
  { symbol: "BHP.AX", name: "BHP Group", type: "equity", exchange: "ASX" },
  { symbol: "SPY", name: "S&P 500 ETF", type: "etf", exchange: "NYSE" },
  { symbol: "QQQ", name: "NASDAQ 100 ETF", type: "etf", exchange: "NASDAQ" },
];

export default function Watchlist() {
  const queryClient = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ symbol: "", name: "", type: "equity", exchange: "" });
  const [researching, setResearching] = useState<number | null>(null);

  const { data: items, isLoading } = useQuery<WatchlistItem[]>({
    queryKey: ["watchlist"],
    queryFn: () => api("/"),
  });

  const addMutation = useMutation({
    mutationFn: (d: any) => api("/", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(d) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["watchlist"] }); setShowAdd(false); setForm({ symbol: "", name: "", type: "equity", exchange: "" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api(`/${id}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const researchMutation = useMutation({
    mutationFn: (id: number) => api(`/${id}/research`, { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (item: WatchlistItem) => api(`/${item.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive: !item.isActive }) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["watchlist"] }),
  });

  function handleAdd() {
    if (!form.symbol || !form.name) return;
    addMutation.mutate({ ...form, currency: "USD" });
  }

  function addPreset(preset: typeof PRESET_STOCKS[0]) {
    addMutation.mutate({ ...preset, currency: preset.type === "crypto" ? "USD" : "USD" });
  }

  function handleResearch(id: number) {
    setResearching(id);
    researchMutation.mutate(id, { onSettled: () => setResearching(null) });
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[400px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  const activeItems = items?.filter(i => i.isActive) || [];
  const inactiveItems = items?.filter(i => !i.isActive) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Investment Watchlist</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track stocks, ETFs, and crypto with AI-powered research summaries
          </p>
        </div>
        <Button onClick={() => setShowAdd(true)} className="gap-2">
          <Plus className="w-4 h-4" /> Add to Watchlist
        </Button>
      </div>

      {/* Quick add presets */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> Quick Add Popular Assets</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {PRESET_STOCKS.map(p => (
              <button key={p.symbol} onClick={() => addPreset(p)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground bg-muted/30 border border-border hover:border-primary/50 hover:text-foreground transition-colors">
                <Plus className="w-3 h-3" /> {p.symbol}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Active watchlist */}
      {activeItems.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Eye className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">Your watchlist is empty. Add assets above to start tracking.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {activeItems.map(item => (
            <Card key={item.id} className="overflow-hidden">
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-foreground">{item.symbol}</span>
                      <Badge variant="outline" className="text-[10px]">{item.type}</Badge>
                      {item.exchange && <span className="text-xs text-muted-foreground">{item.exchange}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground">{item.name}</p>

                    {item.price && (
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-lg font-bold">${Number(item.price).toFixed(2)}</span>
                        {item.changePercent && Number(item.changePercent) !== 0 && (
                          <span className={`flex items-center gap-1 text-sm ${Number(item.changePercent) >= 0 ? "text-green-500" : "text-red-400"}`}>
                            {Number(item.changePercent) >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                            {Number(item.changePercent).toFixed(2)}%
                          </span>
                        )}
                      </div>
                    )}

                    {item.aiSummary && (
                      <div className="mt-3 p-3 rounded-lg bg-muted/20 border border-border">
                        <div className="flex items-center gap-1.5 mb-1">
                          <Sparkles className="w-3 h-3 text-primary" />
                          <span className="text-xs font-medium text-primary">AI Research Summary</span>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.aiSummary}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-1.5 shrink-0">
                    <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={() => handleResearch(item.id)} disabled={researching === item.id}>
                      {researching === item.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                      Research
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => toggleMutation.mutate(item)}>
                      <Bell className="w-3 h-3" /> {item.isActive ? "Mute" : "Unmute"}
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 text-xs gap-1 text-destructive hover:text-destructive" onClick={() => deleteMutation.mutate(item.id)}>
                      <Trash2 className="w-3 h-3" /> Remove
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Inactive */}
      {inactiveItems.length > 0 && (
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-2">Inactive ({inactiveItems.length})</h3>
          <div className="grid gap-2">
            {inactiveItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 opacity-60">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.symbol}</span>
                  <span className="text-xs text-muted-foreground">{item.name}</span>
                </div>
                <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => toggleMutation.mutate(item)}>
                  Reactivate
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Dialog */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAdd(false)}>
          <Card className="w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add to Watchlist</CardTitle>
              <CardDescription>Track an asset and get AI research summaries</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Symbol *</Label>
                  <Input value={form.symbol} onChange={e => setForm(f => ({ ...f, symbol: e.target.value.toUpperCase() }))} placeholder="AAPL" className="h-9" />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Type</Label>
                  <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border border-border bg-muted/30 text-sm">
                    <option value="equity">Equity</option>
                    <option value="etf">ETF</option>
                    <option value="crypto">Crypto</option>
                    <option value="fx">FX</option>
                  </select>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Name *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Apple Inc." className="h-9" />
              </div>
              {form.type !== "crypto" && (
                <div>
                  <Label className="text-xs text-muted-foreground mb-1 block">Exchange</Label>
                  <Input value={form.exchange} onChange={e => setForm(f => ({ ...f, exchange: e.target.value }))} placeholder="NASDAQ" className="h-9" />
                </div>
              )}
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button onClick={handleAdd} disabled={!form.symbol || !form.name || addMutation.isPending}>
                  {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
