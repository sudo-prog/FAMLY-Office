import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, Wallet, Bitcoin, Coins, Image, ArrowUpRight, ArrowDownRight, RefreshCw } from "lucide-react";

const WALLETS = [
  { name: "Bitcoin Cold Storage", symbol: "BTC", balance: 12.4521, price: 67234.50, change24h: 2.34, value: 837124.50, type: "Wallet" },
  { name: "Ethereum Vault", symbol: "ETH", balance: 184.32, price: 3456.78, change24h: -1.12, value: 637156.30, type: "Wallet" },
  { name: "Solana Treasury", symbol: "SOL", balance: 2450.00, price: 178.45, change24h: 5.67, value: 437202.50, type: "Wallet" },
  { name: "USDC Stable Reserve", symbol: "USDC", balance: 250000.00, price: 1.00, change24h: 0.01, value: 250000.00, type: "Stablecoin" },
  { name: "USDT Liquidity", symbol: "USDT", balance: 180000.00, price: 1.00, change24h: -0.02, value: 180000.00, type: "Stablecoin" },
];

const DEFI_POSITIONS = [
  { protocol: "Aave V3", chain: "Ethereum", asset: "ETH", apy: 4.8, tvl: 125000, type: "Lending" },
  { protocol: "Lido", chain: "Ethereum", asset: "ETH", apy: 3.5, tvl: 89000, type: "Staking" },
  { protocol: "Uniswap V3", chain: "Ethereum", asset: "ETH/USDC", apy: 12.3, tvl: 45000, type: "LP" },
  { protocol: "Curve Finance", chain: "Ethereum", asset: "3pool", apy: 7.1, tvl: 67000, type: "LP" },
  { protocol: "Compound V3", chain: "Ethereum", asset: "USDC", apy: 5.2, tvl: 34000, type: "Lending" },
  { protocol: "Marinade Finance", chain: "Solana", asset: "SOL", apy: 7.8, tvl: 28000, type: "Staking" },
];

const NFT_HOLDINGS = [
  { collection: "CryptoPunks", tokenId: "#3749", floorPrice: 42.5, estValue: 48.2, pnl: 5.7, quantity: 1 },
  { collection: "Bored Ape Yacht Club", tokenId: "#8812", floorPrice: 28.3, estValue: 31.1, pnl: 2.8, quantity: 1 },
  { collection: "Azuki", tokenId: "#2214", floorPrice: 8.7, estValue: 9.2, pnl: 0.5, quantity: 1 },
  { collection: "Art Blocks", tokenId: "#7841", floorPrice: 1.8, estValue: 2.1, pnl: 0.3, quantity: 1 },
  { collection: "CloneX", tokenId: "#5523", floorPrice: 3.2, estValue: 3.8, pnl: 0.6, quantity: 1 },
];

const totalValue = WALLETS.reduce((s, w) => s + w.value, 0);

export default function Crypto() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Crypto Portfolio</h1>
          <p className="text-sm text-muted-foreground mt-1">Wallet tracking, DeFi positions & NFT holdings</p>
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
              <Wallet className="w-3.5 h-3.5" /> Total Portfolio Value
            </div>
            <p className="text-2xl font-bold">${(totalValue / 1000000).toFixed(2)}M</p>
            <p className="text-xs text-green-500 flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +3.2% today
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Bitcoin className="w-3.5 h-3.5" /> BTC Dominance
            </div>
            <p className="text-2xl font-bold">52.4%</p>
            <p className="text-xs text-muted-foreground mt-1">1 of 5 wallets</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Coins className="w-3.5 h-3.5" /> DeFi TVL
            </div>
            <p className="text-2xl font-bold">$388K</p>
            <p className="text-xs text-green-500 flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> Avg APY 6.5%
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Image className="w-3.5 h-3.5" /> NFT Holdings
            </div>
            <p className="text-2xl font-bold">5</p>
            <p className="text-xs text-green-500 flex items-center gap-0.5 mt-1">
              <ArrowUpRight className="w-3 h-3" /> +$10K unrealized
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Wallet Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-primary" /> Wallet Holdings
          </CardTitle>
          <CardDescription>Cryptocurrency balances across all wallets</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Asset</th>
                  <th className="text-right py-2 font-medium">Balance</th>
                  <th className="text-right py-2 font-medium">Price</th>
                  <th className="text-right py-2 font-medium">24h Change</th>
                  <th className="text-right py-2 font-medium">Value</th>
                  <th className="text-right py-2 font-medium">% of Portfolio</th>
                </tr>
              </thead>
              <tbody>
                {WALLETS.map((w) => (
                  <tr key={w.symbol} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">{w.symbol.slice(0, 2)}</span>
                        </div>
                        <div>
                          <p className="font-medium">{w.name}</p>
                          <p className="text-xs text-muted-foreground">{w.symbol} · {w.type}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-right py-3 font-mono">{w.balance.toLocaleString()}</td>
                    <td className="text-right py-3 font-mono">${w.price.toLocaleString()}</td>
                    <td className="text-right py-3">
                      <span className={`flex items-center justify-end gap-0.5 ${w.change24h >= 0 ? "text-green-500" : "text-red-500"}`}>
                        {w.change24h >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {Math.abs(w.change24h)}%
                      </span>
                    </td>
                    <td className="text-right py-3 font-mono font-semibold">${w.value.toLocaleString()}</td>
                    <td className="text-right py-3">
                      <Badge variant="outline">{((w.value / totalValue) * 100).toFixed(1)}%</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* DeFi Positions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Coins className="w-5 h-5 text-primary" /> DeFi Positions
          </CardTitle>
          <CardDescription>Active yield-generating positions across protocols</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Protocol</th>
                  <th className="text-left py-2 font-medium">Chain</th>
                  <th className="text-left py-2 font-medium">Asset</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-right py-2 font-medium">APY</th>
                  <th className="text-right py-2 font-medium">TVL</th>
                </tr>
              </thead>
              <tbody>
                {DEFI_POSITIONS.map((p, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 font-medium">{p.protocol}</td>
                    <td className="py-3"><Badge variant="outline" className="text-xs">{p.chain}</Badge></td>
                    <td className="py-3 font-mono text-xs">{p.asset}</td>
                    <td className="py-3"><Badge variant={p.type === "Staking" ? "default" : "secondary"} className="text-xs">{p.type}</Badge></td>
                    <td className="text-right py-3 font-mono text-green-500 font-semibold">{p.apy}%</td>
                    <td className="text-right py-3 font-mono">${p.tvl.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* NFT Holdings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Image className="w-5 h-5 text-primary" /> NFT Holdings
          </CardTitle>
          <CardDescription>Digital collectibles and art holdings</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Collection</th>
                  <th className="text-left py-2 font-medium">Token ID</th>
                  <th className="text-right py-2 font-medium">Floor Price</th>
                  <th className="text-right py-2 font-medium">Est. Value</th>
                  <th className="text-right py-2 font-medium">P&L</th>
                </tr>
              </thead>
              <tbody>
                {NFT_HOLDINGS.map((n, i) => (
                  <tr key={i} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 font-medium">{n.collection}</td>
                    <td className="py-3 font-mono text-xs">{n.tokenId}</td>
                    <td className="text-right py-3 font-mono">{n.floorPrice} ETH</td>
                    <td className="text-right py-3 font-mono">{n.estValue} ETH</td>
                    <td className="text-right py-3">
                      <span className="text-green-500 flex items-center justify-end gap-0.5">
                        <ArrowUpRight className="w-3 h-3" /> +{n.pnl} ETH
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
