import React, { useState, useMemo } from "react";
import { useRoute, Link } from "wouter";
import { useGetEntity, useListAssets, useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft, Building2, User, Shield, Calculator, TrendingUp, TrendingDown,
  DollarSign, Percent, PieChart, BarChart3, AlertCircle,
} from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  trust: Shield,
  company: Building2,
  individual: User,
  partnership: Building2,
};

const TRUST_RATES = [
  { min: 0, max: 18200, rate: 0, label: "Nil" },
  { min: 18201, max: 45000, rate: 0.19, label: "19c per $1" },
  { min: 45001, max: 120000, rate: 0.325, label: "32.5c per $1" },
  { min: 120001, max: 180000, rate: 0.37, label: "37c per $1" },
  { min: 180001, max: Infinity, rate: 0.45, label: "45c per $1" },
];

function calcTax(income: number): number {
  let tax = 0;
  for (const bracket of TRUST_RATES) {
    if (income > bracket.min) {
      const taxable = Math.min(income, bracket.max) - bracket.min;
      tax += taxable * bracket.rate;
    }
  }
  return tax;
}

function fmtAUD(v: number) {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(v);
}

function fmtK(v: number) {
  return `$${(v / 1000).toFixed(0)}k`;
}

export default function EntityTax() {
  const [_match, params] = useRoute("/entities/:id/tax");
  const entityId = params?.id ? parseInt(params.id) : 0;

  const { data: entity, isLoading: l1 } = useGetEntity(entityId, { query: { enabled: entityId > 0 } });
  const { data: allAssets, isLoading: l2 } = useListAssets();
  const { data: transactions, isLoading: l3 } = useListTransactions();

  const [distributionPct, setDistributionPct] = useState(50);
  const [companyProfit, setCompanyProfit] = useState(250000);
  const [smsfBalance, setSmsfBalance] = useState(1800000);
  const [smsfEarnings, setSmsfEarnings] = useState(85000);

  const assets = useMemo(() => (allAssets ?? []).filter((a) => a.entityId === entityId), [allAssets, entityId]);
  const entityTx = useMemo(() => (transactions ?? []).filter((t) => t.entityId === entityId), [transactions, entityId]);

  const totalValue = assets.reduce((s, a) => s + a.value, 0);
  const totalIncome = entityTx.filter((t) => t.type === "income").reduce((s, t) => s + Number(t.amount), 0);
  const totalExpenses = entityTx.filter((t) => t.type === "expense").reduce((s, t) => s + Number(t.amount), 0);
  const netIncome = totalIncome - totalExpenses;

  // Trust distribution calc
  const retainedIncome = netIncome * (1 - distributionPct / 100);
  const distributedIncome = netIncome * (distributionPct / 100);
  const retainedTax = calcTax(retainedIncome);
  const corpTaxRate = 0.25;
  const companyTax = companyProfit * corpTaxRate;
  const companyAfterTax = companyProfit - companyTax;
  const frankingCredits = companyTax;

  // SMSF calc
  const smsfConcessional = Math.min(smsfEarnings, 27500);
  const smsfTax = smsfConcessional * 0.15;
  const smsfNonConcessional = Math.max(0, smsfEarnings - 27500);
  const smsfNonConcessionalTax = smsfNonConcessional > 0 ? smsfNonConcessional * 0.15 : 0;
  const smsfTotalTax = smsfTax + smsfNonConcessionalTax;
  const smsfEffectiveRate = smsfEarnings > 0 ? (smsfTotalTax / smsfEarnings * 100) : 0;

  const isLoading = l1 || l2 || l3;

  if (isLoading || !entity) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <div className="grid grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 bg-muted/50 rounded-lg" />)}
        </div>
        <Skeleton className="h-[400px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  const Icon = TYPE_ICONS[entity.type] ?? Building2;

  return (
    <div className="space-y-6 pb-8 max-w-5xl">
      <div>
        <Link href={`/entities/${entityId}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Entity
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-foreground">Tax Optimisation</h1>
            <p className="text-muted-foreground text-sm">{entity.name} · {entity.type} · Tax modelling &amp; comparison</p>
          </div>
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
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="w-4 h-4 text-red-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Expenses</span>
            </div>
            <div className="text-xl font-mono text-red-400 font-semibold">{fmtAUD(totalExpenses)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Net Income</span>
            </div>
            <div className="text-xl font-mono text-primary font-semibold">{fmtAUD(netIncome)}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <Percent className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Effective Rate</span>
            </div>
            <div className="text-xl font-mono text-amber-400 font-semibold">
              {netIncome > 0 ? `${((calcTax(netIncome) / netIncome) * 100).toFixed(1)}%` : "—"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="trust" className="space-y-4">
        <TabsList className="bg-muted/30 border border-border">
          <TabsTrigger value="trust">Trust Distribution</TabsTrigger>
          <TabsTrigger value="company">Company Comparison</TabsTrigger>
          <TabsTrigger value="smsf">SMSF Tracker</TabsTrigger>
        </TabsList>

        <TabsContent value="trust">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <PieChart className="w-4 h-4 text-primary" />
                Trust Distribution Calculator
              </CardTitle>
              <CardDescription>
                Distribute net income to beneficiaries (taxed at individual rates) vs retain in trust (taxed at 45%).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Distribution Percentage</Label>
                  <span className="text-sm font-mono text-primary">{distributionPct}%</span>
                </div>
                <input
                  type="range" min={0} max={100} step={5}
                  value={distributionPct}
                  onChange={(e) => setDistributionPct(Number(e.target.value))}
                  className="w-full h-1.5 accent-primary rounded cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0% (All Retained)</span>
                  <span>50%</span>
                  <span>100% (All Distributed)</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-border bg-muted/10">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Retained in Trust</div>
                  <div className="text-2xl font-mono text-amber-400">{fmtAUD(retainedIncome)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Tax: <span className="text-foreground font-mono">{fmtAUD(retainedTax)}</span></div>
                  <div className="text-xs text-muted-foreground">Effective: <span className="font-mono">{retainedIncome > 0 ? (retainedTax / retainedIncome * 100).toFixed(1) : 0}%</span></div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/10">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Distributed to Beneficiaries</div>
                  <div className="text-2xl font-mono text-emerald-400">{fmtAUD(distributedIncome)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Taxed at individual marginal rates</div>
                  <div className="text-xs text-muted-foreground">Est. tax: <span className="font-mono">{fmtAUD(calcTax(distributedIncome))}</span></div>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-primary/20 bg-primary/5">
                <div className="flex items-center gap-2 mb-2">
                  <Calculator className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium">Optimal Distribution Recommendation</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {distributionPct < 30
                    ? "Low distribution — consider distributing more to utilise lower beneficiary marginal rates."
                    : distributionPct > 70
                    ? "High distribution — retaining more may be optimal if beneficiaries have other income."
                    : "Balanced distribution — current split is tax-efficient for most family structures."}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="company">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BarChart3 className="w-4 h-4 text-primary" />
                Company vs Trust Tax Comparison
              </CardTitle>
              <CardDescription>
                Compare tax outcomes across entity structures. Company tax rate: 25% (small business) / 30% (base rate).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Annual Profit / Net Income</Label>
                  <Input
                    type="number"
                    value={companyProfit}
                    onChange={(e) => setCompanyProfit(Number(e.target.value))}
                    className="w-40 h-8 text-sm font-mono text-right"
                  />
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="text-xs text-muted-foreground font-medium">Metric</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium text-right">Company (25%)</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium text-right">Trust (Top Rate)</TableHead>
                    <TableHead className="text-xs text-muted-foreground font-medium text-right">SMSF</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow className="border-border/50">
                    <TableCell className="text-sm font-medium">Gross Income</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmtAUD(companyProfit)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmtAUD(companyProfit)}</TableCell>
                    <TableCell className="text-right font-mono text-sm">{fmtAUD(companyProfit)}</TableCell>
                  </TableRow>
                  <TableRow className="border-border/50">
                    <TableCell className="text-sm font-medium">Tax Payable</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-400">{fmtAUD(companyTax)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-400">{fmtAUD(calcTax(companyProfit))}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-red-400">{fmtAUD(companyProfit * 0.15)}</TableCell>
                  </TableRow>
                  <TableRow className="border-border/50">
                    <TableCell className="text-sm font-medium">After Tax</TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-400">{fmtAUD(companyAfterTax)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-400">{fmtAUD(companyProfit - calcTax(companyProfit))}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-emerald-400">{fmtAUD(companyProfit * 0.85)}</TableCell>
                  </TableRow>
                  <TableRow className="border-border/50">
                    <TableCell className="text-sm font-medium">Effective Rate</TableCell>
                    <TableCell className="text-right font-mono text-sm">25.0%</TableCell>
                    <TableCell className="text-right font-mono text-sm">{(calcTax(companyProfit) / companyProfit * 100).toFixed(1)}%</TableCell>
                    <TableCell className="text-right font-mono text-sm">15.0%</TableCell>
                  </TableRow>
                  <TableRow className="border-border/50">
                    <TableCell className="text-sm font-medium">Franking Credits</TableCell>
                    <TableCell className="text-right font-mono text-sm text-blue-400">{fmtAUD(frankingCredits)}</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">N/A</TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">N/A</TableCell>
                  </TableRow>
                </TableBody>
              </Table>

              <div className="p-3 rounded-lg border border-amber-500/20 bg-amber-500/5">
                <div className="flex items-center gap-2 text-xs text-amber-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Companies provide franking credits but lack 50% CGT discount. SMSF offers lowest tax rate but strict compliance. Trusts offer flexibility but top rate is 45%.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="smsf">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="w-4 h-4 text-primary" />
                SMSF Tax Tracker
              </CardTitle>
              <CardDescription>
                Track super balance, contributions, and tax position. Concessional cap: $27,500/year. Non-concessional cap: $110,000/year.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Total SMSF Balance</Label>
                  <Input
                    type="number"
                    value={smsfBalance}
                    onChange={(e) => setSmsfBalance(Number(e.target.value))}
                    className="h-9 text-sm font-mono"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Annual Earnings / Contributions</Label>
                  <Input
                    type="number"
                    value={smsfEarnings}
                    onChange={(e) => setSmsfEarnings(Number(e.target.value))}
                    className="h-9 text-sm font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="p-4 rounded-lg border border-border bg-muted/10">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Concessional</div>
                  <div className="text-lg font-mono text-foreground">{fmtAUD(smsfConcessional)}</div>
                  <div className="text-xs text-muted-foreground mt-1">15% contributions tax</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/10">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Non-Concessional</div>
                  <div className="text-lg font-mono text-foreground">{fmtAUD(smsfNonConcessional)}</div>
                  <div className="text-xs text-muted-foreground mt-1">No additional tax</div>
                </div>
                <div className="p-4 rounded-lg border border-border bg-muted/10">
                  <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Tax</div>
                  <div className="text-lg font-mono text-red-400">{fmtAUD(smsfTotalTax)}</div>
                  <div className="text-xs text-muted-foreground mt-1">Effective: {smsfEffectiveRate.toFixed(1)}%</div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-medium">Balance Breakdown</h3>
                <div className="space-y-2">
                  {[
                    { label: "Tax-Free Component", pct: 30, value: smsfBalance * 0.3 },
                    { label: "Taxable Component (Concessional)", pct: 50, value: smsfBalance * 0.5 },
                    { label: "Taxable Component (Non-Concessional)", pct: 20, value: smsfBalance * 0.2 },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between p-3 rounded-md border border-border bg-muted/10">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <span className="text-sm">{item.label}</span>
                      </div>
                      <div className="text-right">
                        <div className="font-mono text-sm">{fmtAUD(item.value)}</div>
                        <div className="text-xs text-muted-foreground">{item.pct}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
                <div className="flex items-center gap-2 text-xs text-emerald-400">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>SMSF earnings taxed at 15% — significantly lower than individual marginal rates. Ensure fund is complying with SIS Act regulations.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
