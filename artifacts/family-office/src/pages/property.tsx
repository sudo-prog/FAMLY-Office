import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Home, MapPin, BarChart3, Percent, ArrowUpRight, RefreshCw } from "lucide-react";

const PROPERTIES = [
  { address: "12 Harbour View Dr", suburb: "Vaucluse", state: "NSW", value: 8500000, estimate: 8200000, yield: 2.8, growth12m: 12.4, type: "Residential", bedrooms: 5, bathrooms: 4 },
  { address: "45 Ocean Street", suburb: "Bondi", state: "NSW", value: 4200000, estimate: 4350000, yield: 3.2, growth12m: 8.7, type: "Residential", bedrooms: 3, bathrooms: 2 },
  { address: "8 The Crescent", suburb: "Mosman", state: "NSW", value: 12000000, estimate: 11800000, yield: 2.1, growth12m: 15.2, type: "Residential", bedrooms: 6, bathrooms: 5 },
  { address: "23 Collins Street", suburb: "Melbourne CBD", state: "VIC", value: 2800000, estimate: 2750000, yield: 4.5, growth12m: 5.3, type: "Commercial", bedrooms: 0, bathrooms: 2 },
  { address: "78 Kingsford Smith Dr", suburb: "Surry Hills", state: "NSW", value: 1900000, estimate: 1850000, yield: 3.8, growth12m: 9.1, type: "Apartment", bedrooms: 2, bathrooms: 2 },
  { address: "5 The Esplanade", suburb: "Perth", state: "WA", value: 3600000, estimate: 3700000, yield: 3.5, growth12m: 6.8, type: "Residential", bedrooms: 4, bathrooms: 3 },
];

const SUBURB_BENCHMARKS = [
  { suburb: "Vaucluse", median: 6800000, highest: 22000000, lowest: 3200000, yield: 2.4, growth: 14.2 },
  { suburb: "Bondi", median: 3100000, highest: 8500000, lowest: 1200000, yield: 3.0, growth: 9.5 },
  { suburb: "Mosman", median: 9200000, highest: 35000000, lowest: 4500000, yield: 1.9, growth: 16.1 },
  { suburb: "Surry Hills", median: 1650000, highest: 4200000, lowest: 850000, yield: 3.6, growth: 8.3 },
  { suburb: "Toorak", median: 7400000, highest: 28000000, lowest: 2800000, yield: 2.2, growth: 11.8 },
  { suburb: "Manly", median: 3800000, highest: 9800000, lowest: 1500000, yield: 2.8, growth: 10.4 },
];

const totalValue = PROPERTIES.reduce((s, p) => s + p.value, 0);
const totalEstimate = PROPERTIES.reduce((s, p) => s + p.estimate, 0);
const avgYield = PROPERTIES.reduce((s, p) => s + p.yield, 0) / PROPERTIES.length;
const avgGrowth = PROPERTIES.reduce((s, p) => s + p.growth12m, 0) / PROPERTIES.length;

export default function Property() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Property Valuations</h1>
          <p className="text-sm text-muted-foreground mt-1">Real estate portfolio with suburb benchmarks and yield tracking</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Home className="w-3.5 h-3.5" /> Portfolio Value
            </div>
            <p className="text-2xl font-bold">${(totalValue / 1000000).toFixed(1)}M</p>
            <p className="text-xs text-muted-foreground mt-1">{PROPERTIES.length} properties</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <TrendingUp className="w-3.5 h-3.5" /> vs Estimate
            </div>
            <p className="text-2xl font-bold text-green-500">+${((totalValue - totalEstimate) / 1000).toFixed(0)}K</p>
            <p className="text-xs text-muted-foreground mt-1">Above market estimate</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Percent className="w-3.5 h-3.5" /> Avg Yield
            </div>
            <p className="text-2xl font-bold">{avgYield.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Rental yield</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <BarChart3 className="w-3.5 h-3.5" /> Avg Growth (12m)
            </div>
            <p className="text-2xl font-bold text-green-500">{avgGrowth.toFixed(1)}%</p>
            <p className="text-xs text-muted-foreground mt-1">Capital appreciation</p>
          </CardContent>
        </Card>
      </div>

      {/* Property Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Home className="w-5 h-5 text-primary" /> Property Holdings
          </CardTitle>
          <CardDescription>Current real estate portfolio with valuations</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Property</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-right py-2 font-medium">Valuation</th>
                  <th className="text-right py-2 font-medium">Estimate</th>
                  <th className="text-right py-2 font-medium">Variance</th>
                  <th className="text-right py-2 font-medium">Yield</th>
                  <th className="text-right py-2 font-medium">12m Growth</th>
                </tr>
              </thead>
              <tbody>
                {PROPERTIES.map((p) => {
                  const variance = ((p.value - p.estimate) / p.estimate) * 100;
                  return (
                    <tr key={p.address} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                            <MapPin className="w-3.5 h-3.5 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{p.address}</p>
                            <p className="text-xs text-muted-foreground">{p.suburb}, {p.state} · {p.bedrooms}bd/{p.bathrooms}ba</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3"><Badge variant="outline" className="text-xs">{p.type}</Badge></td>
                      <td className="text-right py-3 font-mono font-semibold">${(p.value / 1000000).toFixed(2)}M</td>
                      <td className="text-right py-3 font-mono">${(p.estimate / 1000000).toFixed(2)}M</td>
                      <td className="text-right py-3">
                        <span className={`flex items-center justify-end gap-0.5 ${variance >= 0 ? "text-green-500" : "text-red-500"}`}>
                          {variance >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          {variance >= 0 ? "+" : ""}{variance.toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 font-mono text-green-500">{p.yield}%</td>
                      <td className="text-right py-3">
                        <span className="text-green-500 flex items-center justify-end gap-0.5">
                          <ArrowUpRight className="w-3 h-3" /> {p.growth12m}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Suburb Benchmarks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Suburb Benchmarks
          </CardTitle>
          <CardDescription>Market comparison data for key suburbs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Suburb</th>
                  <th className="text-right py-2 font-medium">Median</th>
                  <th className="text-right py-2 font-medium">Highest Sale</th>
                  <th className="text-right py-2 font-medium">Lowest Sale</th>
                  <th className="text-right py-2 font-medium">Avg Yield</th>
                  <th className="text-right py-2 font-medium">12m Growth</th>
                </tr>
              </thead>
              <tbody>
                {SUBURB_BENCHMARKS.map((s) => (
                  <tr key={s.suburb} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 font-medium flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> {s.suburb}
                    </td>
                    <td className="text-right py-3 font-mono">${(s.median / 1000000).toFixed(1)}M</td>
                    <td className="text-right py-3 font-mono">${(s.highest / 1000000).toFixed(1)}M</td>
                    <td className="text-right py-3 font-mono">${(s.lowest / 1000000).toFixed(1)}M</td>
                    <td className="text-right py-3 font-mono text-green-500">{s.yield}%</td>
                    <td className="text-right py-3">
                      <span className="text-green-500 flex items-center justify-end gap-0.5">
                        <ArrowUpRight className="w-3 h-3" /> {s.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
