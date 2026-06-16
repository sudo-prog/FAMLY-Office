import React from "react";
import { useGetDashboardSummary, useListAssets, useListTransactions, useGetAssetsByCategory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft } from "lucide-react";
import { Link } from "wouter";

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export default function Report() {
  const { data: summary, isLoading: l1 } = useGetDashboardSummary();
  const { data: assets, isLoading: l2 } = useListAssets();
  const { data: transactions, isLoading: l3 } = useListTransactions();
  const { data: byCategory, isLoading: l4 } = useGetAssetsByCategory();

  const isLoading = l1 || l2 || l3 || l4;

  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const recentTx = (transactions ?? []).slice(0, 10);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[800px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between no-print">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <Button onClick={() => window.print()} className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
          <Printer className="w-4 h-4" /> Print / Save PDF
        </Button>
      </div>

      <div id="wealth-report" className="bg-card border border-border rounded-lg p-10 max-w-4xl mx-auto font-sans print:shadow-none print:border-none print:rounded-none print:max-w-full print:p-8">
        <div className="flex items-start justify-between mb-8 pb-6 border-b border-border">
          <div>
            <h1 className="text-3xl font-serif text-foreground">Wealth Summary Report</h1>
            <p className="text-muted-foreground text-sm mt-1">Confidential — For authorised persons only</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-foreground">Family Office</div>
            <div className="text-xs text-muted-foreground mt-0.5">As at {reportDate}</div>
          </div>
        </div>

        {summary && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Net Wealth Position</h2>
            <div className="grid grid-cols-2 gap-6">
              <div className="p-5 bg-muted/20 rounded-lg border border-border">
                <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Net Worth</div>
                <div className="text-3xl font-mono text-primary tabular-nums">{fmt(summary.totalNetWorth)}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 bg-muted/10 rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-0.5">Total Assets</div>
                  <div className="font-mono text-foreground tabular-nums">{fmt(summary.totalAssets)}</div>
                </div>
                <div className="p-4 bg-muted/10 rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-0.5">Asset Count</div>
                  <div className="font-mono text-foreground">{summary.assetCount} holdings</div>
                </div>
                <div className="p-4 bg-muted/10 rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-0.5">YTD Income</div>
                  <div className="font-mono text-emerald-500 tabular-nums">{fmt(summary.totalIncome)}</div>
                </div>
                <div className="p-4 bg-muted/10 rounded border border-border">
                  <div className="text-xs text-muted-foreground mb-0.5">YTD Expenses</div>
                  <div className="font-mono text-foreground tabular-nums">{fmt(summary.totalExpenses)}</div>
                </div>
              </div>
            </div>
            {summary.taxDeductibleYTD > 0 && (
              <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded text-sm">
                <span className="text-muted-foreground">YTD Tax-Deductible Expenses: </span>
                <span className="font-mono text-primary">{fmt(summary.taxDeductibleYTD)}</span>
              </div>
            )}
          </div>
        )}

        {byCategory && byCategory.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Asset Allocation</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Category</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Value</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Holdings</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Weight</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.sort((a, b) => b.total - a.total).map((c) => {
                  const pct = summary ? ((c.total / summary.totalAssets) * 100).toFixed(1) : "—";
                  return (
                    <tr key={c.category} className="border-b border-border/50">
                      <td className="py-2.5 text-foreground">{formatCategory(c.category)}</td>
                      <td className="py-2.5 text-right font-mono tabular-nums text-foreground">{fmt(c.total)}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{c.count}</td>
                      <td className="py-2.5 text-right text-muted-foreground">{pct}%</td>
                    </tr>
                  );
                })}
                <tr className="border-t-2 border-border">
                  <td className="py-2.5 font-semibold text-foreground">Total</td>
                  <td className="py-2.5 text-right font-mono font-semibold tabular-nums text-primary">{fmt(summary?.totalAssets ?? 0)}</td>
                  <td className="py-2.5 text-right font-semibold text-foreground">{summary?.assetCount}</td>
                  <td className="py-2.5 text-right font-semibold text-foreground">100%</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {assets && assets.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Asset Register</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Asset</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Category</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Institution</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Value</th>
                </tr>
              </thead>
              <tbody>
                {assets.map((a) => (
                  <tr key={a.id} className="border-b border-border/40">
                    <td className="py-2 text-foreground">{a.name}</td>
                    <td className="py-2 text-muted-foreground">{formatCategory(a.category)}</td>
                    <td className="py-2 text-muted-foreground">{a.institution ?? "—"}</td>
                    <td className="py-2 text-right font-mono tabular-nums text-foreground">{fmt(a.value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {recentTx.length > 0 && (
          <div className="mb-8">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Recent Transactions</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 text-muted-foreground font-medium">Date</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Description</th>
                  <th className="text-left py-2 text-muted-foreground font-medium">Type</th>
                  <th className="text-right py-2 text-muted-foreground font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {recentTx.map((t) => (
                  <tr key={t.id} className="border-b border-border/40">
                    <td className="py-2 text-muted-foreground tabular-nums">{formatDate(t.date)}</td>
                    <td className="py-2 text-foreground">{t.description}</td>
                    <td className="py-2">
                      <span className={`text-xs font-medium uppercase ${t.type === "income" ? "text-emerald-500" : "text-muted-foreground"}`}>
                        {t.type}
                      </span>
                    </td>
                    <td className={`py-2 text-right font-mono tabular-nums ${t.type === "income" ? "text-emerald-500" : "text-foreground"}`}>
                      {t.type === "expense" ? "−" : "+"}{fmt(t.amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="pt-6 border-t border-border text-xs text-muted-foreground/60 flex justify-between">
          <span>Family Office — Sovereign Wealth Management System</span>
          <span>Generated {reportDate} · Confidential</span>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside, header { display: none !important; }
          main { padding: 0 !important; }
          body { background: white !important; color: black !important; }
          #wealth-report { background: white !important; color: black !important; border: none !important; }
        }
      `}</style>
    </div>
  );
}
