import React, { useState, useMemo } from "react";
import { useListAssets, useGetDashboardSummary } from "@workspace/api-client-react";
import { AIPanel } from "@/components/ai-panel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, Info, Sparkles } from "lucide-react";

const SCENARIOS = {
  conservative: { label: "Conservative", color: "text-blue-400", rates: { bank_account: 0.045, property: 0.04, investment: 0.06, crypto: 0.05, superannuation: 0.06, business: 0.05, bond: 0.04, other: 0.04 } },
  moderate: { label: "Moderate", color: "text-primary", rates: { bank_account: 0.05, property: 0.07, investment: 0.09, crypto: 0.15, superannuation: 0.08, business: 0.10, bond: 0.045, other: 0.06 } },
  aggressive: { label: "Aggressive", color: "text-emerald-400", rates: { bank_account: 0.055, property: 0.10, investment: 0.14, crypto: 0.30, superannuation: 0.11, business: 0.18, bond: 0.05, other: 0.08 } },
} as const;

type ScenarioKey = keyof typeof SCENARIOS;

const CATEGORY_COLORS: Record<string, string> = {
  bank_account: "hsl(215 60% 55%)",
  property: "hsl(43 65% 52%)",
  investment: "hsl(160 55% 45%)",
  crypto: "hsl(280 60% 60%)",
  superannuation: "hsl(30 70% 55%)",
  business: "hsl(0 60% 55%)",
  bond: "hsl(200 50% 55%)",
  other: "hsl(var(--muted-foreground))",
};

function fmt(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

function fmtFull(v: number) {
  return `$${Math.round(v).toLocaleString("en-AU")}`;
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const YEARS = 10;

export default function Projections() {
  const { data: assets, isLoading } = useListAssets();
  const { data: summary } = useGetDashboardSummary();
  const [scenario, setScenario] = useState<ScenarioKey>("moderate");
  const [customRates, setCustomRates] = useState<Record<string, number>>({});
  const [aiOpen, setAiOpen] = useState(false);

  const categories = useMemo(() => {
    const cats: Record<string, number> = {};
    (assets ?? []).forEach((a) => {
      cats[a.category] = (cats[a.category] ?? 0) + a.value;
    });
    return cats;
  }, [assets]);

  const rates = useMemo(() => {
    const base = SCENARIOS[scenario].rates as Record<string, number>;
    return { ...base, ...customRates };
  }, [scenario, customRates]);

  const projectionData = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: YEARS + 1 }, (_, i) => {
      const year = currentYear + i;
      const catValues: Record<string, number> = {};
      let total = 0;
      Object.entries(categories).forEach(([cat, baseVal]) => {
        const rate = rates[cat] ?? 0.06;
        const val = baseVal * Math.pow(1 + rate, i);
        catValues[cat] = val;
        total += val;
      });
      return { year, total, ...catValues };
    });
  }, [categories, rates]);

  const currentTotal = projectionData[0]?.total ?? 0;
  const finalTotal = projectionData[YEARS]?.total ?? 0;
  const totalGrowth = currentTotal > 0 ? ((finalTotal - currentTotal) / currentTotal) * 100 : 0;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56 bg-muted/50 rounded" />
        <Skeleton className="h-[400px] w-full bg-muted/50 rounded-lg" />
        <Skeleton className="h-[300px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  if (!assets?.length) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-muted-foreground">
        <TrendingUp className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm">Add assets first to generate financial projections.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Financial Projections</h1>
          <p className="text-muted-foreground text-sm">
            10-year compound growth model across {Object.keys(categories).length} asset categories.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setAiOpen(true)} variant="outline" size="sm" className="gap-2 border-border text-muted-foreground hover:text-foreground">
            <Sparkles className="w-4 h-4" /> AI Analyze
          </Button>
          <div className="flex items-center gap-1 bg-muted/30 border border-border rounded-md p-1">
          {(Object.keys(SCENARIOS) as ScenarioKey[]).map((s) => (
            <button key={s} onClick={() => setScenario(s)}
              className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                scenario === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}>
              {SCENARIOS[s].label}
            </button>
          ))}
          </div>
        </div>
      </div>

      <AIPanel
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        title="Projections Analysis"
        suggestions={[
          `Analyze my ${SCENARIOS[scenario].label.toLowerCase()} scenario — are the growth rates realistic?`,
          "What are the key risks to my 10-year projections?",
          "Which asset category is driving the most growth and is it sustainable?",
          "How should I adjust my portfolio to reach a specific net worth target?",
          "What inflation and tax drag should I apply to my real return estimates?",
          "Compare my projected growth to typical Australian family office benchmarks",
        ]}
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Current Net Worth</div>
            <div className="text-2xl font-mono text-foreground tabular-nums">{fmtFull(currentTotal)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Projected in 10 Years</div>
            <div className={`text-2xl font-mono tabular-nums ${SCENARIOS[scenario].color}`}>{fmtFull(finalTotal)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Growth</div>
            <div className="text-2xl font-mono text-emerald-500 tabular-nums">+{totalGrowth.toFixed(1)}%</div>
            <div className="text-xs text-muted-foreground mt-1">+{fmtFull(finalTotal - currentTotal)}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif">Portfolio Growth — {SCENARIOS[scenario].label} Scenario</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={projectionData} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false}
                  tickFormatter={fmt} width={60} />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }}
                  formatter={(value: number, name: string) => [fmtFull(value), name === "total" ? "Total" : formatCategory(name)]}
                />
                <Legend wrapperStyle={{ fontSize: 11, color: "hsl(var(--muted-foreground))" }}
                  formatter={(v) => v === "total" ? "Portfolio Total" : formatCategory(v)} />
                {Object.keys(categories).map((cat) => (
                  <Area key={cat} type="monotone" dataKey={cat} stackId="a"
                    stroke={CATEGORY_COLORS[cat] ?? "hsl(var(--muted-foreground))"}
                    fill={CATEGORY_COLORS[cat] ?? "hsl(var(--muted-foreground))"}
                    fillOpacity={0.6} strokeWidth={1} dot={false} />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base font-serif">Growth Rate Assumptions</CardTitle>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              <span>Edit to create custom scenario</span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.entries(categories).map(([cat, baseVal]) => {
              const rate = rates[cat] ?? 0.06;
              return (
                <div key={cat} className="p-3 bg-muted/20 rounded-lg border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-foreground">{formatCategory(cat)}</span>
                    <div className="w-2 h-2 rounded-full" style={{ background: CATEGORY_COLORS[cat] ?? "gray" }} />
                  </div>
                  <div className="text-xs text-muted-foreground mb-1.5">{fmtFull(baseVal)} base</div>
                  <div className="flex items-center gap-1.5">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={(rate * 100).toFixed(1)}
                      onChange={(e) => {
                        setCustomRates((prev) => ({ ...prev, [cat]: parseFloat(e.target.value) / 100 }));
                        setScenario("conservative"); // trigger custom effectively
                      }}
                      className="w-full h-7 rounded border border-border bg-muted/30 px-2 text-xs font-mono text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">%/yr</span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif">Year-by-Year Projections</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr className="border-b border-border">
                <th className="text-left py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Year</th>
                {Object.keys(categories).map((cat) => (
                  <th key={cat} className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider whitespace-nowrap">
                    {formatCategory(cat)}
                  </th>
                ))}
                <th className="text-right py-2.5 px-4 text-xs font-medium text-primary uppercase tracking-wider">Total</th>
                <th className="text-right py-2.5 px-4 text-xs font-medium text-muted-foreground uppercase tracking-wider">Growth</th>
              </tr>
            </thead>
            <tbody>
              {projectionData.map((row, i) => {
                const growthPct = i === 0 ? 0 : ((row.total - projectionData[0].total) / projectionData[0].total) * 100;
                return (
                  <tr key={row.year} className={`border-b border-border/50 ${i === 0 ? "bg-muted/10" : "hover:bg-muted/20"}`}>
                    <td className="py-2.5 px-4 font-mono font-medium text-foreground">
                      {row.year}
                      {i === 0 && <span className="ml-2 text-xs text-muted-foreground">(now)</span>}
                    </td>
                    {Object.keys(categories).map((cat) => (
                      <td key={cat} className="py-2.5 px-4 text-right font-mono tabular-nums text-muted-foreground text-xs">
                        {fmt(row[cat as keyof typeof row] as number ?? 0)}
                      </td>
                    ))}
                    <td className="py-2.5 px-4 text-right font-mono tabular-nums font-medium text-primary">
                      {fmtFull(row.total)}
                    </td>
                    <td className="py-2.5 px-4 text-right text-xs tabular-nums">
                      {i === 0 ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="text-emerald-500">+{growthPct.toFixed(1)}%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="p-4 bg-muted/10 border border-border rounded-lg text-xs text-muted-foreground">
        <strong className="text-foreground">Disclaimer:</strong> These projections are for planning purposes only. 
        Actual returns will vary based on market conditions, economic factors, and individual asset performance. 
        Past performance is not indicative of future results. Consult your financial advisor before making investment decisions.
      </div>
    </div>
  );
}
