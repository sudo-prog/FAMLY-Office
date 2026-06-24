import React, { useState } from "react";
import { useGetDashboardSummary, useListAssets, useListTransactions, useGetAssetsByCategory, useListDocuments } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Printer, ArrowLeft, FileText, Download, Calendar, CheckCircle } from "lucide-react";
import { Link } from "wouter";

type ReportType = "wealth" | "tax" | "advisor" | "legal" | "estate";

interface ReportOption {
  id: ReportType;
  title: string;
  description: string;
  icon: React.ElementType;
  sections: string[];
}

const REPORT_OPTIONS: ReportOption[] = [
  {
    id: "wealth",
    title: "Wealth Summary",
    description: "Complete net worth statement with asset allocation and holdings",
    icon: FileText,
    sections: ["Net Worth Position", "Asset Allocation", "Asset Register", "Recent Transactions"],
  },
  {
    id: "tax",
    title: "Tax Position Report",
    description: "Income, expenses, and deductible transactions for tax preparation",
    icon: Calendar,
    sections: ["Tax Position Summary", "Income Transactions", "Deductible Expenses", "Capital Assets"],
  },
  {
    id: "advisor",
    title: "Portfolio Brief",
    description: "Portfolio composition with benchmark comparison for financial advisors",
    icon: Download,
    sections: ["Portfolio Overview", "Allocation vs Benchmark", "Full Holdings Register"],
  },
  {
    id: "legal",
    title: "Legal Counsel Briefing",
    description: "Asset structure and document register for legal review",
    icon: CheckCircle,
    sections: ["Financial Position", "Asset Holdings", "Document Register"],
  },
  {
    id: "estate",
    title: "Estate Planning Summary",
    description: "Comprehensive estate overview including entities and holdings",
    icon: Printer,
    sections: ["Entity Structure", "Asset Summary", "Document Inventory"],
  },
];

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

export default function ExportPdf() {
  const { data: summary, isLoading: l1 } = useGetDashboardSummary();
  const { data: assets, isLoading: l2 } = useListAssets();
  const { data: transactions, isLoading: l3 } = useListTransactions();
  const { data: byCategory, isLoading: l4 } = useGetAssetsByCategory();
  const { data: documents } = useListDocuments();
  const [selectedReport, setSelectedReport] = useState<ReportType>("wealth");
  const [exporting, setExporting] = useState(false);

  const isLoading = l1 || l2 || l3 || l4;
  const reportDate = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const handleExport = (reportId: ReportType) => {
    setExporting(true);
    setSelectedReport(reportId);
    // Small delay to allow render, then trigger print
    setTimeout(() => {
      window.print();
      setExporting(false);
    }, 300);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[600px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  const selectedOption = REPORT_OPTIONS.find((r) => r.id === selectedReport)!;
  const recentTx = (transactions ?? []).slice(0, 15);
  const taxDedTx = (transactions ?? []).filter((t) => t.taxDeductible);
  const incomeTx = (transactions ?? []).filter((t) => t.type === "income");

  return (
    <div className="space-y-6 pb-8">
      {/* Header - hidden in print */}
      <div className="flex items-center justify-between no-print">
        <Link href="/" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex gap-2">
          <Button
            onClick={() => handleExport(selectedReport)}
            className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            disabled={exporting}
          >
            <Printer className="w-4 h-4" />
            {exporting ? "Preparing..." : "Print / Save PDF"}
          </Button>
        </div>
      </div>

      {/* Report selector - hidden in print */}
      <div className="no-print">
        <h1 className="text-2xl font-serif text-foreground mb-2">PDF Report Export</h1>
        <p className="text-sm text-muted-foreground mb-6">Select a report type to generate and export as PDF. Use your browser's "Save as PDF" option in the print dialog.</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_OPTIONS.map((option) => (
            <button
              key={option.id}
              onClick={() => setSelectedReport(option.id)}
              className={`text-left p-4 rounded-lg border transition-all ${
                selectedReport === option.id
                  ? "border-primary bg-primary/5 ring-1 ring-primary/20"
                  : "border-border bg-card hover:border-border/80 hover:bg-muted/20"
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <option.icon className={`w-5 h-5 ${selectedReport === option.id ? "text-primary" : "text-muted-foreground"}`} />
                <span className="font-medium text-foreground">{option.title}</span>
              </div>
              <p className="text-xs text-muted-foreground mb-3">{option.description}</p>
              <div className="flex flex-wrap gap-1">
                {option.sections.map((s) => (
                  <span key={s} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{s}</span>
                ))}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Printable report content */}
      <div id="pdf-report" className="bg-card border border-border rounded-lg p-10 max-w-4xl mx-auto font-sans print:shadow-none print:border-none print:rounded-none print:max-w-full print:p-8">
        {/* Report Header */}
        <div className="flex items-start justify-between mb-8 pb-6 border-b-2 border-border">
          <div>
            <h1 className="text-3xl font-serif text-foreground">
              {selectedOption.title}
            </h1>
            <p className="text-muted-foreground text-sm mt-1">Confidential — For authorised persons only</p>
          </div>
          <div className="text-right">
            <div className="text-sm font-semibold text-foreground">Family Office</div>
            <div className="text-xs text-muted-foreground mt-0.5">As at {reportDate}</div>
            <div className="text-xs text-muted-foreground mt-0.5">Report Type: {selectedOption.title}</div>
          </div>
        </div>

        {/* Wealth Summary Report */}
        {selectedReport === "wealth" && (
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

        {/* Tax Position Report */}
        {selectedReport === "tax" && (
          <>
            <div className="mb-6 p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground">
              <strong className="text-foreground">Tax Accountant Briefing</strong> — This document provides income, expense, and tax-deductible transaction data for the preparation of tax returns.
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
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Date</th><th className="text-left py-2 text-muted-foreground font-medium">Description</th><th className="text-right py-2 text-muted-foreground font-medium">Amount</th></tr></thead>
                  <tbody>
                    {taxDedTx.map((t) => (
                      <tr key={t.id} className="border-b border-border/40">
                        <td className="py-2 text-muted-foreground tabular-nums">{formatDateShort(t.date)}</td>
                        <td className="py-2 text-foreground">{t.description}</td>
                        <td className="py-2 text-right font-mono tabular-nums">−{fmt(t.amount)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={2} className="py-2 text-primary">Total Deductibles</td>
                      <td className="py-2 text-right font-mono text-primary tabular-nums">{fmt(taxDedTx.reduce((s, t) => s + t.amount, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {assets && assets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Capital Assets (CGT reference)</h2>
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
          </>
        )}

        {/* Advisor Portfolio Report */}
        {selectedReport === "advisor" && (
          <>
            <div className="mb-6 p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground">
              <strong className="text-foreground">Financial Advisor Brief</strong> — Portfolio composition, allocation, and cash flow position for investment advice and rebalancing.
            </div>
            {summary && byCategory && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Portfolio Overview</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Total Portfolio Value</div><div className="font-mono font-bold text-primary text-lg">{fmt(summary.totalNetWorth)}</div></div>
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Number of Holdings</div><div className="font-mono text-foreground">{summary.assetCount} positions</div></div>
                  <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-1">Net Cash Flow (YTD)</div><div className={`font-mono ${(summary.totalIncome - summary.totalExpenses) >= 0 ? "text-emerald-500" : "text-destructive"}`}>{fmt(summary.totalIncome - summary.totalExpenses)}</div></div>
                </div>
                <table className="w-full text-sm mb-4">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Asset Class</th><th className="text-right py-2 text-muted-foreground font-medium">Value</th><th className="text-right py-2 text-muted-foreground font-medium">Weight</th><th className="text-right py-2 text-muted-foreground font-medium">vs. Benchmark</th></tr></thead>
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
                          <td className="py-2.5 text-right font-mono">{pct.toFixed(1)}%</td>
                          <td className={`py-2.5 text-right font-mono text-xs ${Math.abs(diff) < 2 ? "text-muted-foreground" : diff > 0 ? "text-amber-400" : "text-blue-400"}`}>
                            {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
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
          </>
        )}

        {/* Legal Counsel Report */}
        {selectedReport === "legal" && (
          <>
            <div className="mb-6 p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground">
              <strong className="text-foreground">Legal Counsel Briefing</strong> — Asset structure, legal entities, and document holdings for legal advice and estate planning.
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
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Asset / Property</th><th className="text-left py-2 text-muted-foreground font-medium">Classification</th><th className="text-left py-2 text-muted-foreground font-medium">Custodian</th><th className="text-right py-2 text-muted-foreground font-medium">Recorded Value</th></tr></thead>
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
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Document Title</th><th className="text-left py-2 text-muted-foreground font-medium">Type</th><th className="text-right py-2 text-muted-foreground font-medium">Year</th></tr></thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id} className="border-b border-border/40">
                        <td className="py-2 text-foreground">{d.title}</td>
                        <td className="py-2 text-muted-foreground capitalize">{d.fileType}</td>
                        <td className="py-2 text-right text-muted-foreground font-mono">{d.year ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Estate Planning Report */}
        {selectedReport === "estate" && (
          <>
            <div className="mb-6 p-4 bg-muted/10 border border-border rounded-lg text-sm text-muted-foreground">
              <strong className="text-foreground">Estate Planning Summary</strong> — Comprehensive estate overview including entities, holdings, and document inventory.
            </div>
            {summary && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Estate Summary</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div className="p-5 bg-muted/20 rounded-lg border border-border">
                    <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Gross Estate Value</div>
                    <div className="text-3xl font-mono text-primary tabular-nums">{fmt(summary.totalAssets)}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-0.5">Total Holdings</div><div className="font-mono text-foreground">{summary.assetCount}</div></div>
                    <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-0.5">Documents</div><div className="font-mono text-foreground">{summary.documentCount}</div></div>
                    <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-0.5">YTD Income</div><div className="font-mono text-emerald-500">{fmt(summary.totalIncome)}</div></div>
                    <div className="p-4 bg-muted/10 rounded border border-border"><div className="text-xs text-muted-foreground mb-0.5">YTD Expenses</div><div className="font-mono text-foreground">{fmt(summary.totalExpenses)}</div></div>
                  </div>
                </div>
              </div>
            )}
            {byCategory && byCategory.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Asset Distribution</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Asset Category</th><th className="text-right py-2 text-muted-foreground font-medium">Value</th><th className="text-right py-2 text-muted-foreground font-medium">% of Estate</th></tr></thead>
                  <tbody>
                    {byCategory.sort((a, b) => b.total - a.total).map((c) => (
                      <tr key={c.category} className="border-b border-border/50">
                        <td className="py-2.5 text-foreground">{formatCategory(c.category)}</td>
                        <td className="py-2.5 text-right font-mono tabular-nums">{fmt(c.total)}</td>
                        <td className="py-2.5 text-right font-mono">{summary ? ((c.total / summary.totalAssets) * 100).toFixed(1) : "—"}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {assets && assets.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Complete Asset Inventory</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">#</th><th className="text-left py-2 text-muted-foreground font-medium">Asset</th><th className="text-left py-2 text-muted-foreground font-medium">Category</th><th className="text-left py-2 text-muted-foreground font-medium">Institution</th><th className="text-right py-2 text-muted-foreground font-medium">Value</th></tr></thead>
                  <tbody>
                    {assets.sort((a, b) => b.value - a.value).map((a, i) => (
                      <tr key={a.id} className="border-b border-border/40">
                        <td className="py-2 text-muted-foreground">{i + 1}</td>
                        <td className="py-2 text-foreground">{a.name}</td>
                        <td className="py-2 text-muted-foreground">{formatCategory(a.category)}</td>
                        <td className="py-2 text-muted-foreground">{a.institution ?? "—"}</td>
                        <td className="py-2 text-right font-mono tabular-nums">{fmt(a.value)}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-border font-semibold">
                      <td colSpan={4} className="py-2 text-foreground">Total Estate Value</td>
                      <td className="py-2 text-right font-mono text-primary tabular-nums">{fmt(assets.reduce((s, a) => s + a.value, 0))}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
            {documents && documents.length > 0 && (
              <div className="mb-8">
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-4">Estate Document Inventory</h2>
                <table className="w-full text-sm">
                  <thead><tr className="border-b border-border"><th className="text-left py-2 text-muted-foreground font-medium">Document</th><th className="text-left py-2 text-muted-foreground font-medium">Type</th><th className="text-right py-2 text-muted-foreground font-medium">Year</th></tr></thead>
                  <tbody>
                    {documents.map((d) => (
                      <tr key={d.id} className="border-b border-border/40">
                        <td className="py-2 text-foreground">{d.title}</td>
                        <td className="py-2 text-muted-foreground capitalize">{d.fileType}</td>
                        <td className="py-2 text-right text-muted-foreground font-mono">{d.year ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Footer */}
        <div className="pt-6 mt-8 border-t border-border text-xs text-muted-foreground/60 flex justify-between">
          <span>Family Office — Sovereign Wealth Management System</span>
          <span>Generated {reportDate} · Confidential · {selectedOption.title}</span>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          .no-print { display: none !important; }
          aside, header { display: none !important; }
          main { padding: 0 !important; }
          body { background: white !important; color: black !important; }
          #pdf-report { background: white !important; color: black !important; border: none !important; box-shadow: none !important; }
        }
      `}</style>
    </div>
  );
}
