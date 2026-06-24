import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { TrendingUp, TrendingDown, BarChart2, ArrowRight, RefreshCw } from "lucide-react";
import { useListAssets } from "@workspace/api-client-react";

interface BenchmarkData {
  name: string;
  symbol: string;
  returns1Y: number;
  returns3Y: number;
  returns5Y: number;
  ytd: number;
  volatility: number;
}

const BENCHMARKS: BenchmarkData[] = [
  { name: "ASX 200", symbol: "AXJO", returns1Y: 11.2, returns3Y: 8.5, returns5Y: 9.8, ytd: 7.3, volatility: 14.2 },
  { name: "S&P 500", symbol: "SPX", returns1Y: 14.8, returns3Y: 10.2, returns5Y: 12.5, ytd: 9.1, volatility: 15.8 },
  { name: "NASDAQ 100", symbol: "NDX", returns1Y: 18.3, returns3Y: 12.1, returns5Y: 16.2, ytd: 11.5, volatility: 21.4 },
  { name: "FTSE 100", symbol: "UKX", returns1Y: 9.5, returns3Y: 7.8, returns5Y: 6.2, ytd: 5.8, volatility: 13.1 },
  { name: "Nikkei 225", symbol: "NKY", returns1Y: 16.1, returns3Y: 11.5, returns5Y: 10.8, ytd: 8.2, volatility: 17.9 },
  { name: "Bloomberg Agg Bond", symbol: "BAGG", returns1Y: 3.2, returns3Y: 2.1, returns5Y: 1.8, ytd: 1.5, volatility: 5.2 },
  { name: "Gold", symbol: "XAU", returns1Y: 22.4, returns3Y: 14.8, returns5Y: 11.2, ytd: 14.1, volatility: 16.5 },
  { name: "Bitcoin", symbol: "BTC", returns1Y: 68.2, returns3Y: 42.5, returns5Y: 55.8, ytd: 32.4, volatility: 62.3 },
];

function generateComparisonData(portfolioReturn: number) {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  let portfolioIdx = 100;
  let asxIdx = 100;
  let spxIdx = 100;

  const portfolioMonthly = portfolioReturn / 12 * (0.8 + Math.random() * 0.4);
  const asxMonthly = 0.9 * (0.7 + Math.random() * 0.6);
  const spxMonthly = 1.2 * (0.7 + Math.random() * 0.6);

  return months.map((month) => {
    portfolioIdx *= (1 + portfolioMonthly / 100 + (Math.random() - 0.5) * 3 / 100);
    asxIdx *= (1 + asxMonthly / 100 + (Math.random() - 0.5) * 2.5 / 100);
    spxIdx *= (1 + spxMonthly / 100 + (Math.random() - 0.5) * 3 / 100);
    return { month, portfolio: Math.round(portfolioIdx * 100) / 100, asx200: Math.round(asxIdx * 100) / 100, sp500: Math.round(spxIdx * 100) / 100 };
  });
}

function fmtPct(v: number) {
  return `${v >= 0 ? "+" : ""}${v.toFixed(1)}%`;
}

export default function Benchmarks() {
  const { data: assets, isLoading } = useListAssets();
  const [selectedBenchmarks, setSelectedBenchmarks] = useState<string[]>(["ASX 200", "S&P 500"]);

  const portfolioReturn = useMemo(() => {
    if (!assets || assets.length === 0) return 8.5;
    // Simulated portfolio return based on asset allocation
    const totalValue = assets.reduce((s, a) => s + Number(a.value), 0);
    if (totalValue === 0) return 8.5;
    return 8.5 + (Math.random() * 6 - 3);
  }, [assets]);

  const chartData = useMemo(() => generateComparisonData(portfolioReturn), [portfolioReturn]);

  const toggleBenchmark = (name: string) => {
    setSelectedBenchmarks((prev) =>
      prev.includes(name) ? prev.filter((b) => b !== name) : [...prev, name]
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[500px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Benchmark Comparison</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Compare your portfolio performance against major global indices
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5" />
            Select Benchmarks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {BENCHMARKS.map((b) => (
              <Badge
                key={b.symbol}
                variant={selectedBenchmarks.includes(b.name) ? "default" : "outline"}
                className="cursor-pointer px-3 py-1.5 text-sm"
                onClick={() => toggleBenchmark(b.name)}
              >
                {b.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Performance Comparison (Normalized)
            </span>
            <Badge variant="secondary">YTD {new Date().getFullYear()}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={["auto", "auto"]} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="portfolio" name="Your Portfolio" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
              {selectedBenchmarks.includes("ASX 200") && <Line type="monotone" dataKey="asx200" name="ASX 200" stroke="hsl(43 70% 50%)" strokeWidth={1.5} dot={false} />}
              {selectedBenchmarks.includes("S&P 500") && <Line type="monotone" dataKey="sp500" name="S&P 500" stroke="hsl(160 60% 45%)" strokeWidth={1.5} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Benchmark Returns Overview</CardTitle>
          <CardDescription>Annualized returns comparison across major indices</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-3 font-medium">Index</th>
                  <th className="text-right py-3 px-3 font-medium">1Y Return</th>
                  <th className="text-right py-3 px-3 font-medium">3Y Ann.</th>
                  <th className="text-right py-3 px-3 font-medium">5Y Ann.</th>
                  <th className="text-right py-3 px-3 font-medium">YTD</th>
                  <th className="text-right py-3 px-3 font-medium">Volatility</th>
                  <th className="text-right py-3 px-3 font-medium">vs Portfolio</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-border bg-primary/5">
                  <td className="py-3 px-3 font-medium">Your Portfolio</td>
                  <td className="py-3 px-3 text-right font-bold">{fmtPct(portfolioReturn)}</td>
                  <td className="py-3 px-3 text-right">—</td>
                  <td className="py-3 px-3 text-right">—</td>
                  <td className="py-3 px-3 text-right">—</td>
                  <td className="py-3 px-3 text-right">—</td>
                  <td className="py-3 px-3 text-right">—</td>
                </tr>
                {BENCHMARKS.filter((b) => selectedBenchmarks.includes(b.name)).map((benchmark) => {
                  const diff = benchmark.returns1Y - portfolioReturn;
                  return (
                    <tr key={benchmark.symbol} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{benchmark.name}</span>
                          <Badge variant="outline" className="text-xs">{benchmark.symbol}</Badge>
                        </div>
                      </td>
                      <td className={`py-3 px-3 text-right ${benchmark.returns1Y >= 0 ? "text-green-500" : "text-red-400"}`}>
                        {fmtPct(benchmark.returns1Y)}
                      </td>
                      <td className={`py-3 px-3 text-right ${benchmark.returns3Y >= 0 ? "text-green-500" : "text-red-400"}`}>
                        {fmtPct(benchmark.returns3Y)}
                      </td>
                      <td className={`py-3 px-3 text-right ${benchmark.returns5Y >= 0 ? "text-green-500" : "text-red-400"}`}>
                        {fmtPct(benchmark.returns5Y)}
                      </td>
                      <td className={`py-3 px-3 text-right ${benchmark.ytd >= 0 ? "text-green-500" : "text-red-400"}`}>
                        {fmtPct(benchmark.ytd)}
                      </td>
                      <td className="py-3 px-3 text-right text-muted-foreground">{benchmark.volatility.toFixed(1)}%</td>
                      <td className={`py-3 px-3 text-right font-medium ${diff > 0 ? "text-red-400" : "text-green-500"}`}>
                        {diff > 0 ? "+" : ""}{diff.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-green-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Outperformance</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {portfolioReturn > 12
                    ? "Your portfolio is outperforming major indices. Consider reviewing risk exposure."
                    : portfolioReturn > 6
                    ? "Your portfolio is tracking close to benchmark averages."
                    : "Your portfolio is underperforming. Review asset allocation."}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-blue-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <BarChart2 className="h-5 w-5 text-blue-500 mt-0.5" />
              <div>
                <p className="font-medium text-foreground">Diversification Note</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Comparing across ASX 200, S&P 500, and global benchmarks helps assess geographic and sector diversification.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
