import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  RefreshCw, TrendingUp, TrendingDown, Search, Loader2,
  DollarSign, Bitcoin, Globe, ArrowUpDown,
} from "lucide-react";

const BASE = (import.meta.env.BASE_URL ?? "").replace(/\/$/, "");

interface EquityPrice {
  ticker: string;
  name: string;
  price: number;
  currency: string;
  exchange: string;
  source: string;
  updated: string;
}

interface CryptoPrice {
  [coinId: string]: { aud?: number; usd?: number };
}

const POPULAR_EQUITIES = [
  { ticker: "AAPL", name: "Apple" },
  { ticker: "MSFT", name: "Microsoft" },
  { ticker: "GOOGL", name: "Alphabet" },
  { ticker: "AMZN", name: "Amazon" },
  { ticker: "TSLA", name: "Tesla" },
  { ticker: "NVDA", name: "NVIDIA" },
  { ticker: "META", name: "Meta" },
  { ticker: "CBA.AX", name: "CBA" },
  { ticker: "BHP.AX", name: "BHP" },
  { ticker: "NAB.AX", name: "NAB" },
  { ticker: "SPY", name: "S&P 500 ETF" },
  { ticker: "QQQ", name: "NASDAQ ETF" },
];

const POPULAR_CRYPTO = [
  { id: "bitcoin", symbol: "BTC", name: "Bitcoin" },
  { id: "ethereum", symbol: "ETH", name: "Ethereum" },
  { id: "solana", symbol: "SOL", name: "Solana" },
  { id: "ripple", symbol: "XRP", name: "XRP" },
  { id: "cardano", symbol: "ADA", name: "Cardano" },
  { id: "dogecoin", symbol: "DOGE", name: "Dogecoin" },
  { id: "polkadot", symbol: "DOT", name: "Polkadot" },
  { id: "chainlink", symbol: "LINK", name: "Chainlink" },
];

type Tab = "equities" | "crypto";

export default function AssetPrices() {
  const [tab, setTab] = useState<Tab>("equities");
  const [equityTicker, setEquityTicker] = useState("");
  const [cryptoIds, setCryptoIds] = useState("");
  const [equityResult, setEquityResult] = useState<EquityPrice | null>(null);
  const [cryptoResults, setCryptoResults] = useState<CryptoPrice>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchEquity(ticker: string) {
    if (!ticker.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/prices/equity?ticker=${encodeURIComponent(ticker.trim())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to fetch price");
      }
      const data = await res.json();
      setEquityResult(data);
    } catch (e: any) {
      setError(e.message);
      setEquityResult(null);
    } finally {
      setLoading(false);
    }
  }

  async function fetchCrypto(ids: string) {
    if (!ids.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/prices/crypto?ids=${encodeURIComponent(ids.trim())}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        throw new Error(err.error || "Failed to fetch prices");
      }
      const data = await res.json();
      setCryptoResults(data.prices || {});
    } catch (e: any) {
      setError(e.message);
      setCryptoResults({});
    } finally {
      setLoading(false);
    }
  }

  async function fetchPopularEquities() {
    setLoading(true);
    setError(null);
    const results: EquityPrice[] = [];
    for (const eq of POPULAR_EQUITIES.slice(0, 6)) {
      try {
        const res = await fetch(`${BASE}/api/prices/equity?ticker=${eq.ticker}`);
        if (res.ok) {
          const data = await res.json();
          results.push(data);
        }
      } catch {}
    }
    setLoading(false);
    return results;
  }

  async function fetchPopularCrypto() {
    setLoading(true);
    setError(null);
    try {
      const ids = POPULAR_CRYPTO.slice(0, 6).map(c => c.id).join(",");
      const res = await fetch(`${BASE}/api/prices/crypto?ids=${ids}`);
      if (res.ok) {
        const data = await res.json();
        setCryptoResults(data.prices || {});
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const { data: popularEquities, isLoading: popEquitiesLoading } = useQuery({
    queryKey: ["prices", "popular-equities"],
    queryFn: fetchPopularEquities,
    enabled: false,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-serif font-bold text-foreground">Asset Price Feeds</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Live prices from Yahoo Finance (equities) and CoinGecko (crypto)
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/30 border border-border rounded-xl p-1 w-fit">
        <button
          onClick={() => setTab("equities")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "equities" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Globe className="w-3.5 h-3.5" /> Equities
        </button>
        <button
          onClick={() => setTab("crypto")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${tab === "crypto" ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Bitcoin className="w-3.5 h-3.5" /> Crypto
        </button>
      </div>

      {/* Equity Tab */}
      {tab === "equities" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Look Up Equity Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={equityTicker}
                  onChange={e => setEquityTicker(e.target.value.toUpperCase())}
                  onKeyDown={e => { if (e.key === "Enter") fetchEquity(equityTicker); }}
                  placeholder="Enter ticker (e.g. AAPL, MSFT, CBA.AX)"
                  className="flex-1 h-9"
                />
                <Button onClick={() => fetchEquity(equityTicker)} disabled={loading || !equityTicker.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Fetch
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Result */}
          {equityResult && (
            <Card className="border-primary/20">
              <CardContent className="py-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xl font-bold">{equityResult.ticker}</span>
                      <Badge variant="outline" className="text-xs">{equityResult.exchange}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{equityResult.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${equityResult.price.toFixed(2)}</p>
                    <p className="text-xs text-muted-foreground">{equityResult.currency} · {equityResult.source}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {error && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Popular equities */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Popular Equities
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => fetchPopularEquities()}>
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_EQUITIES.map(eq => (
                  <button key={eq.ticker} onClick={() => { setEquityTicker(eq.ticker); fetchEquity(eq.ticker); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground bg-muted/30 border border-border hover:border-primary/50 hover:text-foreground transition-colors">
                    <DollarSign className="w-3 h-3" /> {eq.ticker}
                  </button>
                ))}
              </div>
              {popEquitiesLoading && <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-4 h-4 animate-spin" /> Fetching prices...</div>}
              {popularEquities && popularEquities.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mt-3">
                  {popularEquities.map(eq => (
                    <div key={eq.ticker} className="p-2 rounded-lg border border-border bg-muted/10">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">{eq.ticker}</span>
                        <span className="text-xs font-bold">${eq.price.toFixed(2)}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground truncate">{eq.name}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Crypto Tab */}
      {tab === "crypto" && (
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Search className="w-4 h-4 text-primary" /> Look Up Crypto Price
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2">
                <Input
                  value={cryptoIds}
                  onChange={e => setCryptoIds(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") fetchCrypto(cryptoIds); }}
                  placeholder="Enter coin IDs (e.g. bitcoin,ethereum,solana)"
                  className="flex-1 h-9"
                />
                <Button onClick={() => fetchCrypto(cryptoIds)} disabled={loading || !cryptoIds.trim()}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                  Fetch
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Use CoinGecko coin IDs (e.g. bitcoin, ethereum, solana)</p>
            </CardContent>
          </Card>

          {/* Crypto results */}
          {Object.keys(cryptoResults).length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(cryptoResults).map(([coinId, prices]) => (
                <Card key={coinId}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-semibold capitalize">{coinId}</span>
                        <p className="text-[10px] text-muted-foreground">via CoinGecko</p>
                      </div>
                      <div className="text-right">
                        {prices.aud && <p className="text-lg font-bold">A${prices.aud.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>}
                        {prices.usd && <p className="text-xs text-muted-foreground">${prices.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {error && (
            <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Popular crypto */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Bitcoin className="w-4 h-4 text-primary" /> Popular Cryptocurrencies
                </CardTitle>
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => fetchPopularCrypto()}>
                  <RefreshCw className="w-3 h-3" /> Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2 mb-3">
                {POPULAR_CRYPTO.map(c => (
                  <button key={c.id} onClick={() => { setCryptoIds(c.id); fetchCrypto(c.id); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs text-muted-foreground bg-muted/30 border border-border hover:border-primary/50 hover:text-foreground transition-colors">
                    <Bitcoin className="w-3 h-3" /> {c.symbol}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
