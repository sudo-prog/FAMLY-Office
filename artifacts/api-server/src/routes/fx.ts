import { Router } from "express";

const router = Router();

let fxCache: { rates: Record<string, number>; date: string; fetchedAt: number } | null = null;
const CACHE_TTL = 3600 * 1000;

router.get("/fx/rates", async (_req, res) => {
  try {
    if (fxCache && Date.now() - fxCache.fetchedAt < CACHE_TTL) {
      return res.json({ rates: fxCache.rates, date: fxCache.date, source: "ecb/frankfurter", cached: true });
    }

    const url = "https://api.frankfurter.app/latest?base=USD&symbols=AUD,EUR,GBP,CAD,SGD";
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) throw new Error(`Frankfurter error: ${response.status}`);
    const data = (await response.json()) as { rates: Record<string, number>; date: string };

    const toUsd: Record<string, number> = { USD: 1 };
    for (const [currency, rate] of Object.entries(data.rates)) {
      toUsd[currency] = 1 / rate;
    }

    fxCache = { rates: toUsd, date: data.date, fetchedAt: Date.now() };
    res.json({ rates: toUsd, date: data.date, source: "ecb/frankfurter", cached: false });
  } catch (err: any) {
    if (fxCache) {
      return res.json({ rates: fxCache.rates, date: fxCache.date, source: "ecb/frankfurter", cached: true, stale: true });
    }
    res.status(502).json({ error: "Failed to fetch FX rates", detail: err.message });
  }
});

export default router;
