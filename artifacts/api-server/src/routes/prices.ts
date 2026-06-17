import { Router } from "express";

const router = Router();

export const CRYPTO_ID_MAP: Record<string, string> = {
  bitcoin: "bitcoin", btc: "bitcoin",
  ethereum: "ethereum", eth: "ethereum",
  solana: "solana", sol: "solana",
  ripple: "ripple", xrp: "ripple",
  cardano: "cardano", ada: "cardano",
  polkadot: "polkadot", dot: "polkadot",
  dogecoin: "dogecoin", doge: "dogecoin",
  litecoin: "litecoin", ltc: "litecoin",
  chainlink: "chainlink", link: "chainlink",
  "binance coin": "binancecoin", bnb: "binancecoin",
  avalanche: "avalanche-2", avax: "avalanche-2",
  uniswap: "uniswap", uni: "uniswap",
  "shiba inu": "shiba-inu", shib: "shiba-inu",
  polygon: "matic-network", matic: "matic-network",
  "bitcoin cash": "bitcoin-cash", bch: "bitcoin-cash",
  stellar: "stellar", xlm: "stellar",
  cosmos: "cosmos", atom: "cosmos",
  tron: "tron", trx: "tron",
  monero: "monero", xmr: "monero",
};

router.get("/prices/detect-crypto", (req, res) => {
  const name = String(req.query.name || "").toLowerCase().trim();
  const match = Object.entries(CRYPTO_ID_MAP).find(([key]) => name.includes(key));
  res.json({ coinId: match ? match[1] : null });
});

router.get("/prices/crypto", async (req, res) => {
  try {
    const ids = String(req.query.ids || "").split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length === 0) return res.json({ prices: {}, source: "coingecko" });

    const url = `https://api.coingecko.com/api/v3/simple/price?ids=${ids.join(",")}&vs_currencies=aud,usd`;
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": "FamilyOfficeApp/1.0" },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) throw new Error(`CoinGecko error: ${response.status}`);
    const data = (await response.json()) as Record<string, { aud?: number; usd?: number }>;
    res.json({ prices: data, source: "coingecko", updated: new Date().toISOString() });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch crypto prices", detail: err.message });
  }
});

router.get("/prices/equity", async (req, res) => {
  try {
    const ticker = String(req.query.ticker || "").trim().toUpperCase();
    if (!ticker) return res.status(400).json({ error: "ticker required" });

    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
    const response = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible)", Accept: "application/json" },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const fallbackUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=1d`;
      const fallback = await fetch(fallbackUrl, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible)", Accept: "application/json" },
        signal: AbortSignal.timeout(12000),
      });
      if (!fallback.ok) throw new Error(`Yahoo Finance error: ${response.status}`);
      const data = (await fallback.json()) as any;
      const result = data?.chart?.result?.[0];
      if (!result) return res.status(404).json({ error: "Ticker not found" });
      const meta = result.meta;
      return res.json({ ticker, name: meta.longName || meta.shortName || ticker, price: meta.regularMarketPrice, currency: meta.currency || "USD", exchange: meta.exchangeName, source: "yahoo", updated: new Date().toISOString() });
    }

    const data = (await response.json()) as any;
    const result = data?.chart?.result?.[0];
    if (!result) return res.status(404).json({ error: "Ticker not found" });
    const meta = result.meta;
    res.json({ ticker, name: meta.longName || meta.shortName || ticker, price: meta.regularMarketPrice, currency: meta.currency || "USD", exchange: meta.exchangeName, source: "yahoo", updated: new Date().toISOString() });
  } catch (err: any) {
    res.status(502).json({ error: "Failed to fetch equity price", detail: err.message });
  }
});

export default router;
