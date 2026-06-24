import React, { useState } from "react";
import { useGetDashboardSummary, useListAssets, useListTransactions, useGetAssetsByCategory, useListDocuments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, Scale, Calculator, TrendingUp, FileText } from "lucide-react";
import { Link } from "wouter";

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}
function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}
function formatDateShort(d: string) {
  return new Date(d).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

type ReportTab = "general" | "lawyer" | "tax" | "advisor";

const TABS: { id: ReportTab; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "general", label: "General Summary", icon: FileText, desc: "Full wealth overview" },
  { id: "lawyer", label: "Legal Counsel", icon: Scale, desc: "Entities, deeds & obligations" },
  { id: "tax", label: "Tax Accountant", icon: Calculator, desc: "Tax positions & deductibles" },
  { id: "advisor", label: "Financial Advisor", icon: TrendingUp, desc: "Portfolio composition" },
];

export default function Report() {
  const { data: summary, isLoading: l1 } = useGetDashboardSummary();
  const { data: assets, isLoading: l2 } = useListAssets();
  const { data: transactions, isLoading: l3 } = useListTransactions();
  const { data: byCategory, isLoading: l4 } = useGetAssetsByCategory();
  const { data: documents } = useListDocuments();
  const [tab, setTab] = useState<ReportTab>("general");

  const isLoading = l1 || l2 || l3 || l4;
  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const recentTx = (transactions ?? []).slice(0, 15);
  const taxDedTx = (transactions ?? []).filter((t) => t.taxDeductible);
  const incomeTx = (transactions ?? []).filter((t) => t.type === "income");
  const expenseTx = (transactions ?? []).filter((t) => t.type === "expense");

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[800px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  const reportBase = (
    <div className="flex items-start justify-between mb-8 pb-6 border-b border-border">
      <div>
        <h1 className="text-3xl font-serif text-foreground">
          {tab === "general" && "Wealth Summary Report"}
          {tab === "lawyer" && "Legal Counsel Briefing"}
          {tab === "tax" && "Tax Position Statement"}
          {tab === "advisor" && "Financial Advisor Portfolio Brief"}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">Confidential — For authorised persons only</p>
      </div>
      <div className="text-right">
        <div className="text-sm font-medium text-foreground">Family Office</div>
        <div className="text-xs text-muted-foreground mt-0.5">As at {reportDate}</div>
        <div className="text-xs text-muted-foreground mt-0.5 capitalize">{tab === "general" ? "General Purpose" : tab === "lawyer" ? "Prepared for Legal Counsel" : tab === "tax" ? "Prepared for Tax Accountant" : "Prepared for Financial Advisor"}</div>
      </div>
    </div>
  );

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

      <div className="flex gap-2 no-print overflow-x-auto">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm transition-all flex-shrink-0 ${
              tab === t.id
                ? "bg-primary text-primary-foreground border-primary"
                : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 bg-card"
            }`}>
            <t.icon className="w-4 h-4" />
            <div className="text-left">
              <div className="font-medium">{t.label}</div>
              <div className={`text-[10px] ${tab === t.id ? "text-primary-foreground/70" : "text-muted-foreground/60"}`}>{t.desc}</div>
            </div>
          </button>
        ))}
      </div>

      <div id="wealth-report" className="bg-card border border-border rounded-lg p-10 max-w-4xl mx-auto font-sans print:shadow-none print:border-none print:rounded-none print:max-w-full print:p-8">
        {reportBase}

        {tab === "general" && (
          <>
            {summary && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Net Wealth Position</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Net Worth</div>
                    <div className="text-3xl font-mono text-primary tabular-nums">{fmt(summary.totalNetWorth)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-0.5">Total Assets</div><div className="font-mono text-foreground tabular-nums">{fmt(summary.totalAssets)}</div></div>
                    <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-0.5">Holdings</div><div className="font-mono text-foreground">{summary.assetCount}</div></div>
                    <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-0.5">YTD Income</div><div className="font-mono text-emerald-500 tabular-nums">{fmt(summary.totalIncome)}</div></div>
                    <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-0.5">YTD Expenses</div><div className="font-mono text-foreground tabular-nums">{fmt(summary.totalExpenses)}</div></div>
                  </div>
                </div>
              </div>
            )}
            {byCategory && byCategory.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Asset Allocation</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Category</th><th className="text-right py-2 text-muted-foreground font-medium">Value</th><th className="text-right py-2 text-muted-foreground font-medium">Holdings</th><th className="text-right py-2 text-muted-foreground font-medium">Weight</th></tr></thead>
                  <tbody>
                    {byCategory.sort((a, b) => b.total - a.total).map((c) => (
                      <tr key={c.category} className="border-b border-border/50">
                        <td className="py-2.5 text-foreground">{formatCategory(c.category)}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums text-foreground">{fmt(c.total)}</td>
                        <td className="py-2.5 text-right text-muted-foreground">{c.count}</td>
                        <td className="py-2.5 text-right text-muted-foreground">{summary ? ((c.total / summary.totalAssets) * 100).toFixed(1) : "—"}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {assets && assets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Asset Register</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Asset</th><th className="text-left py-2 text-muted-foreground font-medium">Category</th><th className="text-left py-2 text-muted-foreground font-medium">Institution</th><th className="text-right py-2 text-muted-foreground font-medium">Value</th></tr></thead>
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
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Date</th><th className="text-left py-2 text-muted-foreground font-medium">Description</th><th className="text-left py-2 text-muted-foreground font-medium">Type</th><th className="text-right py-2 text-muted-foreground font-medium">Amount</th></tr></thead>
                  <tbody>
                    {recentTx.map((t) => (
                      <tr key={t.id} className="border-b border-border/40">
                        <td className="py-2 text-muted-foreground tabular-nums">{formatDateShort(t.date)}</td>
                        <td className="py-2 text-foreground">{t.description}</td>
                        <td className="py-2"><span className={`text-xs font-medium uppercase ${t.type === "income" ? "text-emerald-500" : "text-muted-foreground"}`}>{t.type}</span></td>
                        <td className={`py-2 text-right font-mono tabular-nums ${t.type === "income" ? "text-emerald-500" : "text-foreground"}`}>{t.type === "expense" ? "−" : "+"}{fmt(t.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {tab === "lawyer" && (
          <>
            <div className="mb-6 p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground">
              <strong className="text-foreground">Legal Counsel Briefing</strong> — This document provides a summary of the client's asset structure, legal entities, and document holdings for the purpose of legal advice, estate planning, and compliance review.
            </div>
            {summary && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Financial Position Overview</h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Total Estate Value</div><div className="font-mono font-semibold text-foreground">{fmt(summary.totalAssets)}</div></div>
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Number of Holdings</div><div className="font-mono text-foreground">{summary.assetCount} assets</div></div>
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Legal Documents on File</div><div className="font-mono text-foreground">{summary.documentCount} documents</div></div>
                </div>
              </div>
            )}
            {assets && assets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Asset Holdings — Legal Summary</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Asset / Property</th><th className="text-left py-2 text-muted-foreground font-medium">Classification</th><th className="text-left py-2 text-muted-foreground font-medium">Custodian / Institution</th><th className="text-right py-2 text-muted-foreground font-medium">Recorded Value</th></tr></thead>
                  <tbody>
                    {assets.map((a) => (
                      <tr key={a.id} className="border-b border-border/40">
                        <td className="py-2.5 text-foreground font-medium">{a.name}</td>
                        <td className="py-2.5 text-muted-foreground">{formatCategory(a.category)}</td>
                        <td className="py-2.5 text-muted-foreground">{a.institution ?? "Not specified"}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums">{fmt(a.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {documents && documents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Document Register</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Document Title</th><th className="text-left py-2 text-muted-foreground font-medium">Type</th><th className="text-left py-2 text-muted-foreground font-medium">Folder</th><th className="text-right py-2 text-muted-foreground font-medium">Year</th></tr></thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id} className="border-b border-border/40">
                        <td className="py-2 text-foreground">{d.title}</td>
                        <td className="py-2 text-muted-foreground capitalize">{d.fileType}</td>
                        <td className="py-2 text-muted-foreground">{(d as any).folder ?? "—"}</td>
                        <td className="py-2 text-right text-muted-foreground font-mono">{d.year ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground mt-6">
              <p><strong className="text-foreground">Note to Counsel:</strong> The above asset register reflects client-maintained records as at the report date. Valuation figures are client-reported estimates and should be verified by independent appraisal where required for legal proceedings or estate administration. Document records indicate items held in the client's digital vault — originals should be confirmed prior to any legal action.</p>
            </div>
          </>
        )}

        {tab === "tax" && (
          <>
            <div className="mb-6 p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground">
              <strong className="text-foreground">Tax Accountant Briefing</strong> — This document provides income, expense, and tax-deductible transaction data for the preparation of tax returns and financial statements. All figures are client-reported and should be reconciled against source documents.
            </div>
            {summary && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Year-to-Date Tax Position</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-5 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gross Income (YTD)</div>
                    <div className="text-2xl font-mono text-emerald-500 tabular-nums">{fmt(summary.totalIncome)}</div>
                  </div>
                  <div className="p-5 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Expenses (YTD)</div>
                    <div className="text-2xl font-mono text-foreground tabular-nums">{fmt(summary.totalExpenses)}</div>
                  </div>
                  <div className="p-5 bg-primary/5 rounded-lg border border-primary/20">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Tax-Deductible Expenses</div>
                    <div className="text-2xl font-mono text-primary tabular-nums">{fmt(summary.taxDeductibleYTD ?? 0)}</div>
                  </div>
                  <div className="p-5 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Net Taxable Income (Est.)</div>
                    <div className="text-2xl font-mono text-foreground tabular-nums">{fmt(summary.totalIncome - summary.taxDeductibleYTD)}</div>
                  </div>
                </div>
              </div>
            )}
            {incomeTx.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Income Transactions</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Date</th><th className="text-left py-2 text-muted-foreground font-medium">Description</th><th className="text-left py-2 text-muted-foreground font-medium">Category</th><th className="text-right py-2 text-muted-foreground font-medium">Amount</th></tr></thead>
                  <tbody>
                    {incomeTx.map((t) => (
                      <tr key={t.id} className="border-b border-border/40">
                        <td className="py-2 text-muted-foreground tabular-nums">{formatDateShort(t.date)}</td>
                        <td className="py-2 text-foreground">{t.description}</td>
                        <td className="py-2 text-muted-foreground">{t.category ? formatCategory(t.category) : "—"}</td>
                        <td className="py-2 text-right font-mono text-emerald-500 tabular-nums">+{fmt(t.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={3} className="py-2 text-foreground">Total Income</td>
                      <td className="py-2 text-right font-mono text-emerald-500 tabular-nums">{fmt(incomeTx.reduce((s, t) => s + t.amount, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {taxDedTx.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Tax-Deductible Expenses</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Date</th><th className="text-left py-2 text-muted-foreground font-medium">Description</th><th className="text-left py-2 text-muted-foreground font-medium">Category</th><th className="text-right py-2 text-muted-foreground font-medium">Amount</th></tr></thead>
                  <tbody>
                    {taxDedTx.map((t) => (
                      <tr key={t.id} className="border-b border-border/40">
                        <td className="py-2 text-muted-foreground tabular-nums">{formatDateShort(t.date)}</td>
                        <td className="py-2 text-foreground">{t.description}</td>
                        <td className="py-2 text-muted-foreground">{t.category ? formatCategory(t.category) : "—"}</td>
                        <td className="py-2 text-right font-mono tabular-nums">−{fmt(t.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={3} className="py-2 text-primary">Total Deductibles</td>
                      <td className="py-2 text-right font-mono text-primary tabular-nums">{fmt(taxDedTx.reduce((s, t) => s + t.amount, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {assets && assets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Capital Assets (for CGT reference)</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Asset</th><th className="text-left py-2 text-muted-foreground font-medium">Category</th><th className="text-right py-2 text-muted-foreground font-medium">Current Value</th></tr></thead>
                  <tbody>
                    {assets.filter((a) => ["property", "investment", "crypto", "business"].includes(a.category)).map((a) => (
                      <tr key={a.id} className="border-b border-border/40">
                        <td className="py-2 text-foreground">{a.name}</td>
                        <td className="py-2 text-muted-foreground">{formatCategory(a.category)}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{fmt(a.value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground mt-4">
              <p><strong className="text-foreground">Note to Accountant:</strong> Income, expense, and deductibility classifications above reflect client-assigned categories. Please verify all deductions against receipts and applicable tax legislation. Capital gains events are not recorded here and should be separately identified. Superannuation contributions may qualify for additional tax concessions — review contribution records separately.</p>
            </div>
          </>
        )}

        {tab === "advisor" && (
          <>
            <div className="mb-6 p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground">
              <strong className="text-foreground">Financial Advisor Brief</strong> — This document presents the client's current portfolio composition, asset allocation, and cash flow position for the purpose of investment advice, rebalancing recommendations, and financial planning.
            </div>
            {summary && byCategory && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Portfolio Overview</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Total Portfolio Value</div><div className="font-mono font-bold text-primary text-lg">{fmt(summary.totalNetWorth)}</div></div>
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Number of Holdings</div><div className="font-mono text-foreground">{summary.assetCount} positions</div></div>
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Net Cash Flow (YTD)</div><div className={`font-mono ${(summary.totalIncome - summary.totalExpenses) >= 0 ? "text-emerald-500" : "text-destructive"}`}>{fmt(summary.totalIncome - summary.totalExpenses)}</div></div>
                </div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Allocation by Asset Class</h3>
                <table className="w-full text-sm mb-4">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Asset Class</th><th className="text-right py-2 text-muted-foreground font-medium">Value</th><th className="text-right py-2 text-muted-foreground font-medium">Holdings</th><th className="text-right py-2 text-muted-foreground font-medium">Weight</th><th className="text-right py-2 text-muted-foreground font-medium">vs. Benchmark*</th></tr></thead>
                  <tbody>
                    {byCategory.sort((a, b) => b.total - a.total).map((c) => {
                      const pct = summary ? (c.total / summary.totalAssets) * 100 : 0;
                      const benchmarks: Record<string, number> = { property: 30, investment: 30, superannuation: 15, cash: 5, bank_account: 5, crypto: 5, bond: 10, business: 5, other: 0 };
                      const bench = benchmarks[c.category] ?? 5;
                      const diff = pct - bench;
                      return (
                        <tr key={c.category} className="border-b border-border/50">
                          <td className="py-2.5 text-foreground">{formatCategory(c.category)}</td>
                          <td className="py-2.5 text-right font-mono tabular-nums">{fmt(c.total)}</td>
                          <td className="py-2.5 text-right text-muted-foreground">{c.count}</td>
                          <td className="py-2.5 text-right font-mono">{pct.toFixed(1)}%</td>
                          <td className={`py-2.5 text-right font-mono text-xs ${Math.abs(diff) < 2 ? "text-muted-foreground" : diff > 0 ? "text-amber-400" : "text-blue-400"}`}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                <p className="text-xs text-muted-foreground/60">* Benchmark based on typical balanced Australian family office allocation. Deviations ±2% highlighted for review.</p>
              </div>
            )}
            {assets && assets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Full Holdings Register</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Position</th><th className="text-left py-2 text-muted-foreground font-medium">Asset Class</th><th className="text-left py-2 text-muted-foreground font-medium">Custodian</th><th className="text-right py-2 text-muted-foreground font-medium">Value</th><th className="text-right py-2 text-muted-foreground font-medium">Portfolio %</th></tr></thead>
                  <tbody>
                    {assets.sort((a, b) => b.value - a.value).map((a) => (
                      <tr key={a.id} className="border-b border-border/40">
                        <td className="py-2 text-foreground">{a.name}</td>
                        <td className="py-2 text-muted-foreground">{formatCategory(a.category)}</td>
                        <td className="py-2 text-muted-foreground">{a.institution ?? "—"}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{fmt(a.value)}</td>
                        <td className="py-2 text-right font-mono text-muted-foreground">{summary ? ((a.value / summary.totalAssets) * 100).toFixed(1) : "—"}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div className="p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground mt-4">
              <p><strong className="text-foreground">Note to Advisor:</strong> Asset values are client-reported and may not reflect mark-to-market valuations. Property values are estimated by the client and may require independent appraisal. Cryptocurrency and unlisted business values are particularly subject to volatility. Superannuation fund balance is as reported by the fund and may not reflect current investment returns. This brief is for planning purposes only and does not constitute an independently audited financial statement.</p>
            </div>
          </>
        )}

        <div className="pt-6 border-t border-border text-xs text-muted-foreground/60 flex justify-between">
          <span>Family Office — Sovereign Wealth Management System</span>
          <span>Generated {reportDate} · Confidential · {TABS.find(t => t.id === tab)?.label}</span>
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
