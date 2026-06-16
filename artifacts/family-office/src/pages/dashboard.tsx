import React from "react";
import { useGetDashboardSummary, useGetNetWorthHistory, useGetCashFlow, useGetAssetsByCategory } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

const COLORS = [
  "hsl(43 65% 52%)",
  "hsl(215 40% 55%)",
  "hsl(160 40% 45%)",
  "hsl(30 55% 52%)",
  "hsl(280 30% 55%)",
  "hsl(0 50% 52%)",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

const CustomPieLegend = ({ data }: { data: { category: string; total: number }[] }) => (
  <div className="flex flex-col gap-2 justify-center pl-4">
    {data.map((entry, index) => (
      <div key={entry.category} className="flex items-center gap-2 text-xs">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[index % COLORS.length] }} />
        <span className="text-muted-foreground truncate max-w-[120px]">{formatCategory(entry.category)}</span>
        <span className="text-foreground font-mono ml-auto pl-2 tabular-nums">{formatCurrency(entry.total)}</span>
      </div>
    ))}
  </div>
);

export default function Dashboard() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: netWorthHistory, isLoading: isLoadingHistory } = useGetNetWorthHistory();
  const { data: cashFlow, isLoading: isLoadingCashFlow } = useGetCashFlow();
  const { data: assetsByCategory, isLoading: isLoadingAssets } = useGetAssetsByCategory();

  const anyLoading = isLoadingSummary || isLoadingHistory || isLoadingCashFlow || isLoadingAssets;

  if (anyLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-56 bg-muted/50 rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-28 w-full bg-muted/50 rounded-lg" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Skeleton className="h-[320px] w-full bg-muted/50 rounded-lg" />
          <Skeleton className="h-[320px] w-full bg-muted/50 rounded-lg" />
        </div>
        <Skeleton className="h-[280px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div>
        <h1 className="text-3xl font-serif text-foreground mb-1">Command Center</h1>
        <p className="text-muted-foreground text-sm">Real-time global wealth overview.</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Net Worth</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-mono text-primary tabular-nums">{formatCurrency(summary.totalNetWorth)}</div>
              <div className="text-xs text-muted-foreground mt-1">{summary.assetCount} assets tracked</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Assets</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-mono text-foreground tabular-nums">{formatCurrency(summary.totalAssets)}</div>
              <div className="text-xs text-muted-foreground mt-1">{summary.entityCount} entities</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">YTD Income</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-mono text-emerald-500 tabular-nums">{formatCurrency(summary.totalIncome)}</div>
              <div className="text-xs text-muted-foreground mt-1">This calendar year</div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">YTD Expenses</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <div className="text-2xl font-mono text-foreground tabular-nums">{formatCurrency(summary.totalExpenses)}</div>
              <div className="text-xs text-emerald-600 mt-1 tabular-nums">
                {summary.taxDeductibleYTD > 0 ? `${formatCurrency(summary.taxDeductibleYTD)} deductible` : "—"}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif">Net Worth History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {netWorthHistory && netWorthHistory.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={netWorthHistory} margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${(v / 1000000).toFixed(1)}M`}
                      width={52}
                    />
                    <RechartsTooltip
                      contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }}
                      formatter={(value: number) => [formatCurrency(value), "Net Worth"]}
                    />
                    <Line type="monotone" dataKey="value" stroke="hsl(43 65% 52%)" strokeWidth={2} dot={false} activeDot={{ r: 4, fill: "hsl(43 65% 52%)" }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif">Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              {assetsByCategory && assetsByCategory.length > 0 ? (
                <div className="flex items-center h-full gap-2">
                  <ResponsiveContainer width="55%" height="100%">
                    <PieChart>
                      <Pie
                        data={assetsByCategory}
                        cx="50%"
                        cy="50%"
                        innerRadius={72}
                        outerRadius={108}
                        paddingAngle={2}
                        dataKey="total"
                        nameKey="category"
                        stroke="none"
                      >
                        {assetsByCategory.map((_entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }}
                        formatter={(value: number, _name: string, props: any) => [formatCurrency(value), formatCategory(props.payload.category)]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 min-w-0">
                    <CustomPieLegend data={assetsByCategory as { category: string; total: number }[]} />
                  </div>
                </div>
              ) : (
                <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No asset data</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif">Cash Flow — Last 6 Months</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[240px]">
            {cashFlow && cashFlow.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cashFlow} margin={{ top: 4, right: 8, left: 8, bottom: 0 }} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <RechartsTooltip
                    contentStyle={{ backgroundColor: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "6px", fontSize: 12 }}
                    formatter={(value: number, name: string) => [formatCurrency(value), name === "income" ? "Income" : "Expenses"]}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: 12, color: "hsl(var(--muted-foreground))" }}
                    formatter={(value) => value === "income" ? "Income" : "Expenses"}
                  />
                  <Bar dataKey="income" fill="hsl(160 40% 42%)" radius={[2, 2, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" fill="hsl(var(--muted))" radius={[2, 2, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">No cash flow data</div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
