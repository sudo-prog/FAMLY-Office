import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  BarChart, Bar, ReferenceLine,
} from "recharts";
import {
  TrendingUp, TrendingDown, Calendar, DollarSign, ArrowRight,
  Download, Target, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { useListTransactions } from "@workspace/api-client-react";

interface MonthlySnapshot {
  month: string;
  income: number;
  expenses: number;
  netCashFlow: number;
  cumulative: number;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function fmt(v: number) {
  if (Math.abs(v) >= 1_000_000) return `$${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

function downloadCSV(filename: string, rows: (string | number)[][], headers: string[]) {
  const content = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function CashFlowForecast() {
  const { data: transactions, isLoading } = useListTransactions();
  const [growthRate, setGrowthRate] = useState(3); // % annual income growth
  const [startBalance, setStartBalance] = useState(50000);

  const forecast = useMemo(() => {
    if (!transactions) return [];

    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate average monthly income and expenses from last 6 months
    const monthlyAvg: Record<string, { income: number; expenses: number }> = {};
    for (let i = 0; i < 6; i++) {
      const d = new Date(currentYear, currentMonth - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthlyAvg[key] = { income: 0, expenses: 0 };
    }

    transactions.forEach((t) => {
      const d = new Date(t.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (monthlyAvg[key]) {
        if (t.type === "income") monthlyAvg[key].income += Number(t.amount);
        if (t.type === "expense") monthlyAvg[key].expenses += Math.abs(Number(t.amount));
      }
    });

    const avgIncome = Object.values(monthlyAvg).reduce((s, m) => s + m.income, 0) / Math.max(1, Object.values(monthlyAvg).filter((m) => m.income > 0).length);
    const avgExpenses = Object.values(monthlyAvg).reduce((s, m) => s + m.expenses, 0) / Math.max(1, Object.values(monthlyAvg).filter((m) => m.expenses > 0).length);

    const monthlyGrowthFactor = 1 + growthRate / 100 / 12;
    const snapshots: MonthlySnapshot[] = [];
    let cumulative = startBalance;

    for (let i = 0; i < 12; i++) {
      const monthIdx = (currentMonth + i + 1) % 12;
      const yearOffset = Math.floor((currentMonth + i + 1) / 12);
      const year = currentYear + yearOffset;
      const monthLabel = `${MONTH_NAMES[monthIdx]} ${year}`;

      const projectedIncome = avgIncome * Math.pow(monthlyGrowthFactor, i);
      const projectedExpenses = avgExpenses * Math.pow(1.002, i); // slight expense inflation
      const netCashFlow = projectedIncome - projectedExpenses;
      cumulative += netCashFlow;

      snapshots.push({
        month: monthLabel,
        income: Math.round(projectedIncome),
        expenses: Math.round(projectedExpenses),
        netCashFlow: Math.round(netCashFlow),
        cumulative: Math.round(cumulative),
      });
    }

    return snapshots;
  }, [transactions, growthRate, startBalance]);

  const totalIncome12M = forecast.reduce((s, m) => s + m.income, 0);
  const totalExpenses12M = forecast.reduce((s, m) => s + m.expenses, 0);
  const totalNetCashFlow = forecast.reduce((s, m) => s + m.netCashFlow, 0);
  const avgMonthlyIncome = totalIncome12M / 12;
  const avgMonthlyExpenses = totalExpenses12M / 12;
  const burnRate = avgMonthlyExpenses;
  const runwayMonths = startBalance > 0 && totalNetCashFlow < 0 ? Math.floor(startBalance / Math.abs(totalNetCashFlow / 12)) : Infinity;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[600px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Cash Flow Forecasting</h1>
          <p className="text-sm text-muted-foreground mt-1">
            12-month cash flow projection based on recurring transaction patterns
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => downloadCSV("cash-flow-forecast.csv", forecast.map((f) => [f.month, f.income, f.expenses, f.netCashFlow, f.cumulative]), ["Month", "Income", "Expenses", "Net Cash Flow", "Cumulative"])}
        >
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4 text-green-500" />
              Avg Monthly Income
            </div>
            <p className="text-2xl font-bold text-foreground">{fmt(avgMonthlyIncome)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingDown className="h-4 w-4 text-red-500" />
              Avg Monthly Expenses
            </div>
            <p className="text-2xl font-bold text-foreground">{fmt(avgMonthlyExpenses)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4 text-blue-500" />
              Net Cash Flow (12M)
            </div>
            <p className={`text-2xl font-bold ${totalNetCashFlow >= 0 ? "text-green-500" : "text-red-500"}`}>
              {fmt(totalNetCashFlow)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Target className="h-4 w-4 text-purple-500" />
              Runway (months)
            </div>
            <p className="text-2xl font-bold text-foreground">
              {runwayMonths === Infinity ? "∞" : `${runwayMonths} mo`}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              12-Month Cash Flow Projection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Legend />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar dataKey="income" name="Income" fill="hsl(142 70% 45%)" radius={[2, 2, 0, 0]} />
                <Bar dataKey="expenses" name="Expenses" fill="hsl(0 70% 50%)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cumulative Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecast}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" height={60} />
                <YAxis tickFormatter={(v) => fmt(v)} tick={{ fontSize: 11 }} />
                <Tooltip formatter={(value: number) => fmt(value)} />
                <Area type="monotone" dataKey="cumulative" name="Balance" stroke="hsl(215 60% 55%)" fill="hsl(215 60% 55%)" fillOpacity={0.2} />
                <ReferenceLine y={startBalance} stroke="hsl(var(--border))" strokeDasharray="5 5" label={{ value: "Current", position: "right", fontSize: 10 }} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Forecast Parameters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <Label htmlFor="start-balance">Starting Balance</Label>
              <Input
                id="start-balance"
                type="number"
                value={startBalance}
                onChange={(e) => setStartBalance(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Current cash balance to project from</p>
            </div>
            <div>
              <Label htmlFor="growth-rate">Annual Income Growth (%)</Label>
              <Input
                id="growth-rate"
                type="number"
                value={growthRate}
                onChange={(e) => setGrowthRate(Number(e.target.value))}
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">Expected year-over-year income increase</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Monthly Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 font-medium">Month</th>
                  <th className="text-right py-2 px-3 font-medium">Income</th>
                  <th className="text-right py-2 px-3 font-medium">Expenses</th>
                  <th className="text-right py-2 px-3 font-medium">Net</th>
                  <th className="text-right py-2 px-3 font-medium">Cumulative</th>
                </tr>
              </thead>
              <tbody>
                {forecast.map((row) => (
                  <tr key={row.month} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-2 px-3">{row.month}</td>
                    <td className="py-2 px-3 text-right text-green-500">{fmt(row.income)}</td>
                    <td className="py-2 px-3 text-right text-red-400">{fmt(row.expenses)}</td>
                    <td className={`py-2 px-3 text-right font-medium ${row.netCashFlow >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {fmt(row.netCashFlow)}
                    </td>
                    <td className="py-2 px-3 text-right font-medium">{fmt(row.cumulative)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {runwayMonths < 12 && runwayMonths !== Infinity && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="pt-6 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
            <div>
              <p className="font-medium text-foreground">Cash Runway Warning</p>
              <p className="text-sm text-muted-foreground mt-1">
                At current burn rate, your projected runway is {runwayMonths} months. Consider reducing expenses or increasing income.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
