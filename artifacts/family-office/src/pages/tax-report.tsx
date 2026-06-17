import React, { useState, useMemo } from "react";
import { useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Receipt, TrendingUp, TrendingDown, Download, ChevronDown, FileBarChart,
  DollarSign, Percent, AlertCircle, CheckCircle2,
} from "lucide-react";

const TAX_TAG_LABELS: Record<string, string> = {
  assessable_income: "Assessable Income",
  exempt_income: "Exempt Income",
  capital_gain: "Capital Gain (CGT Event)",
  capital_loss: "Capital Loss",
  deductible: "Tax Deductible Expense",
  non_deductible: "Non-Deductible Expense",
  gst_included: "GST Included",
  gst_free: "GST Free",
  super_contribution: "Super Contribution (Concessional)",
  super_non_concessional: "Super Contribution (Non-Concessional)",
  franked_dividend: "Franked Dividend",
  unfranked_dividend: "Unfranked Dividend",
  foreign_income: "Foreign Source Income",
  private_use: "Private Use / FBT",
};

const TAX_TAG_COLORS: Record<string, string> = {
  assessable_income: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10",
  exempt_income: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5",
  capital_gain: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  capital_loss: "text-red-400 border-red-500/40 bg-red-500/10",
  deductible: "text-blue-400 border-blue-500/40 bg-blue-500/10",
  non_deductible: "text-muted-foreground border-border bg-muted/20",
  gst_included: "text-purple-400 border-purple-500/40 bg-purple-500/10",
  gst_free: "text-purple-300 border-purple-400/30 bg-purple-400/5",
  super_contribution: "text-primary border-primary/40 bg-primary/10",
  super_non_concessional: "text-primary border-primary/30 bg-primary/5",
  franked_dividend: "text-emerald-500 border-emerald-600/40 bg-emerald-600/10",
  unfranked_dividend: "text-emerald-300 border-emerald-400/30 bg-emerald-400/5",
  foreign_income: "text-orange-400 border-orange-500/40 bg-orange-500/10",
  private_use: "text-red-300 border-red-400/30 bg-red-400/5",
};

function getFYBounds(fy: string): { start: Date; end: Date } {
  const year = parseInt(fy.split("-")[0]);
  return {
    start: new Date(year, 6, 1),
    end: new Date(year + 1, 5, 30, 23, 59, 59),
  };
}

function getAvailableFYs(): string[] {
  const now = new Date();
  const currentFYStart = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
  return Array.from({ length: 4 }, (_, i) => `${currentFYStart - i}-${(currentFYStart - i + 1).toString().slice(-2)}`);
}

function fmtAUD(v: number) {
  return `A$${new Intl.NumberFormat("en-AU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(v)}`;
}

function downloadCSV(rows: string[][], headers: string[], filename: string) {
  const content = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function TaxReport() {
  const { data: transactions, isLoading } = useListTransactions();
  const fys = getAvailableFYs();
  const [selectedFY, setSelectedFY] = useState(fys[0]);
  const [expandedTag, setExpandedTag] = useState<string | null>(null);

  const { start, end } = getFYBounds(selectedFY);

  const fyTransactions = useMemo(() => {
    return (transactions ?? []).filter((t) => {
      if (!t.date) return false;
      const d = new Date(t.date);
      return d >= start && d <= end;
    });
  }, [transactions, selectedFY]);

  const tagged = fyTransactions.filter((t) => t.taxTag);
  const untagged = fyTransactions.filter((t) => !t.taxTag);

  const byTag = useMemo(() => {
    const map: Record<string, { txs: typeof fyTransactions; total: number }> = {};
    tagged.forEach((t) => {
      const tag = t.taxTag!;
      if (!map[tag]) map[tag] = { txs: [], total: 0 };
      map[tag].txs.push(t);
      map[tag].total += Number(t.amount);
    });
    return map;
  }, [tagged]);

  const totalIncome = fyTransactions.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = fyTransactions.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const totalDeductible = (byTag["deductible"]?.total ?? 0) + (byTag["super_contribution"]?.total ?? 0) + (byTag["super_non_concessional"]?.total ?? 0);
  const netCGT = (byTag["capital_gain"]?.total ?? 0) - (byTag["capital_loss"]?.total ?? 0);
  const gstPayable = (byTag["gst_included"]?.total ?? 0) * (1 / 11);
  const assessableIncome = (byTag["assessable_income"]?.total ?? 0) + (byTag["franked_dividend"]?.total ?? 0) + (byTag["unfranked_dividend"]?.total ?? 0) + (byTag["foreign_income"]?.total ?? 0);

  function handleExport() {
    const rows = fyTransactions.map((t) => [
      t.date ?? "", t.description, t.type, String(t.amount), t.category ?? "",
      t.taxTag ? (TAX_TAG_LABELS[t.taxTag] ?? t.taxTag) : "",
      t.taxDeductible ? "Yes" : "No",
    ]);
    downloadCSV(rows, ["Date", "Description", "Type", "Amount (AUD)", "Category", "ATO Tax Tag", "Tax Deductible"], `family-office-tax-report-FY${selectedFY}.csv`);
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 bg-muted/50 rounded-lg" />)}
        </div>
        <Skeleton className="h-[400px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Tax Year Summary</h1>
          <p className="text-muted-foreground text-sm">
            ATO-aligned tax breakdown for FY{selectedFY} · {fyTransactions.length} transactions · {tagged.length} tagged
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedFY}
              onChange={(e) => setSelectedFY(e.target.value)}
              className="h-9 pl-3 pr-8 rounded-md border border-border bg-muted/30 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary appearance-none cursor-pointer"
            >
              {fys.map((fy) => <option key={fy} value={fy}>FY {fy}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          </div>
          <Button onClick={handleExport} variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground text-sm">
            <Download className="w-4 h-4" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Income</span>
            </div>
            <div className="text-xl font-mono text-emerald-400 font-semibold">{fmtAUD(totalIncome)}</div>
            <div className="text-xs text-muted-foreground mt-1">{fyTransactions.filter((t) => t.type === "income").length} transactions</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Expenses</span>
            </div>
            <div className="text-xl font-mono text-red-400 font-semibold">{fmtAUD(totalExpenses)}</div>
            <div className="text-xs text-muted-foreground mt-1">{fyTransactions.filter((t) => t.type === "expense").length} transactions</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-blue-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Deductible</span>
            </div>
            <div className="text-xl font-mono text-blue-400 font-semibold">{fmtAUD(totalDeductible)}</div>
            <div className="text-xs text-muted-foreground mt-1">tax deductible items</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className={`w-4 h-4 ${netCGT >= 0 ? "text-amber-400" : "text-emerald-400"}`} />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Net CGT</span>
            </div>
            <div className={`text-xl font-mono font-semibold ${netCGT >= 0 ? "text-amber-400" : "text-emerald-400"}`}>{fmtAUD(Math.abs(netCGT))}</div>
            <div className="text-xs text-muted-foreground mt-1">{netCGT >= 0 ? "net gain" : "net loss"} this FY</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">Assessable Income</div>
            <div className="text-lg font-mono text-foreground">{fmtAUD(assessableIncome)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">incl. dividends, foreign income</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide mb-1">GST Payable (est.)</div>
            <div className="text-lg font-mono text-foreground">{fmtAUD(gstPayable)}</div>
            <div className="text-xs text-muted-foreground mt-0.5">1/11 of GST-included transactions</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              {untagged.length > 0
                ? <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                : <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
              <div>
                <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Untagged</div>
                <div className="text-lg font-mono text-foreground">{untagged.length}</div>
                <div className="text-xs text-muted-foreground">{untagged.length > 0 ? "transactions need ATO tags" : "all transactions tagged"}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="bg-muted/30 border-b border-border pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileBarChart className="w-4 h-4 text-primary" />
            ATO Tax Category Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {Object.keys(byTag).length === 0 ? (
            <div className="py-12 text-center text-muted-foreground text-sm">
              No tagged transactions for FY{selectedFY}. Tag transactions in the Ledger to see your ATO breakdown.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {Object.entries(byTag).sort((a, b) => b[1].total - a[1].total).map(([tag, { txs, total }]) => {
                const isExpanded = expandedTag === tag;
                return (
                  <div key={tag}>
                    <button
                      onClick={() => setExpandedTag(isExpanded ? null : tag)}
                      className="w-full flex items-center gap-4 px-5 py-3.5 hover:bg-muted/20 transition-colors text-left"
                    >
                      <Badge variant="outline" className={`text-xs shrink-0 ${TAX_TAG_COLORS[tag] ?? "text-muted-foreground border-border"}`}>
                        {TAX_TAG_LABELS[tag] ?? tag}
                      </Badge>
                      <span className="flex-1 text-xs text-muted-foreground">{txs.length} transaction{txs.length !== 1 ? "s" : ""}</span>
                      <span className="font-mono text-sm font-medium text-foreground">{fmtAUD(total)}</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </button>
                    {isExpanded && (
                      <div className="bg-muted/10 border-t border-border/50">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-border hover:bg-transparent">
                              <TableHead className="text-xs text-muted-foreground font-medium pl-5">Date</TableHead>
                              <TableHead className="text-xs text-muted-foreground font-medium">Description</TableHead>
                              <TableHead className="text-xs text-muted-foreground font-medium">Type</TableHead>
                              <TableHead className="text-xs text-muted-foreground font-medium text-right pr-5">Amount</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {txs.map((t) => (
                              <TableRow key={t.id} className="border-border/50 hover:bg-muted/20">
                                <TableCell className="text-xs font-mono text-muted-foreground pl-5">{t.date}</TableCell>
                                <TableCell className="text-xs">{t.description}</TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={`text-xs rounded-sm border-border ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>{t.type}</Badge>
                                </TableCell>
                                <TableCell className="text-right font-mono text-xs pr-5">{fmtAUD(Number(t.amount))}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {untagged.length > 0 && (
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="bg-amber-500/5 border-b border-amber-500/20 pb-3">
            <CardTitle className="text-base flex items-center gap-2 text-amber-400">
              <AlertCircle className="w-4 h-4" />
              {untagged.length} Untagged Transaction{untagged.length !== 1 ? "s" : ""} — Need ATO Tax Tags
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-medium">Date</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Description</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium">Type</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {untagged.slice(0, 20).map((t) => (
                    <TableRow key={t.id} className="border-border/50 hover:bg-muted/20">
                      <TableCell className="text-xs font-mono text-muted-foreground">{t.date}</TableCell>
                      <TableCell className="text-xs">{t.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-xs rounded-sm border-border ${t.type === "income" ? "text-emerald-400" : "text-red-400"}`}>{t.type}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono text-xs">{fmtAUD(Number(t.amount))}</TableCell>
                    </TableRow>
                  ))}
                  {untagged.length > 20 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-xs text-muted-foreground py-3">
                        +{untagged.length - 20} more — tag in Ledger to see full breakdown
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="text-xs text-muted-foreground bg-muted/20 border border-border rounded-lg px-4 py-3">
        <strong className="text-foreground">Disclaimer:</strong> This report is for informational purposes only and does not constitute tax advice. Consult a qualified tax adviser or accountant before lodging your return. Amounts are in AUD and based on transactions recorded in Family Office. FY runs 1 July – 30 June.
      </div>
    </div>
  );
}
