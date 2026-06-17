export const CURRENCIES = ['USD', 'AUD', 'EUR', 'GBP', 'CAD', 'SGD'] as const;
export type Currency = typeof CURRENCIES[number];

const FALLBACK_TO_USD: Record<Currency, number> = {
  USD: 1,
  AUD: 0.645,
  EUR: 1.085,
  GBP: 1.27,
  CAD: 0.73,
  SGD: 0.74,
};

const SYMBOLS: Record<Currency, string> = {
  USD: '$', AUD: 'A$', EUR: '€', GBP: '£', CAD: 'C$', SGD: 'S$',
};

const FX_CACHE_KEY = 'fo-fx-rates-v2';
const FX_CACHE_TTL = 3600 * 1000;

interface FxCache { rates: Record<string, number>; date: string; fetchedAt: number }

let memCache: Record<Currency, number> | null = null;

function readLocalCache(): FxCache | null {
  try {
    const s = localStorage.getItem(FX_CACHE_KEY);
    if (!s) return null;
    const c: FxCache = JSON.parse(s);
    if (Date.now() - c.fetchedAt > FX_CACHE_TTL) return null;
    return c;
  } catch { return null; }
}

function getToUsd(): Record<Currency, number> {
  if (memCache) return memCache;
  const cached = readLocalCache();
  if (cached) { memCache = cached.rates as Record<Currency, number>; return memCache; }
  return FALLBACK_TO_USD;
}

export async function fetchLiveRates(): Promise<{ date: string; source: string } | null> {
  try {
    const BASE = (import.meta.env.BASE_URL ?? '').replace(/\/$/, '');
    const res = await fetch(`${BASE}/api/fx/rates`);
    if (!res.ok) return null;
    const data = await res.json() as { rates: Record<string, number>; date: string; source: string };
    const cache: FxCache = { rates: data.rates, date: data.date, fetchedAt: Date.now() };
    localStorage.setItem(FX_CACHE_KEY, JSON.stringify(cache));
    memCache = data.rates as Record<Currency, number>;
    return { date: data.date, source: data.source };
  } catch { return null; }
}

export function getRateStatus(): { live: boolean; date?: string } {
  const c = readLocalCache();
  return c ? { live: true, date: c.date } : { live: false };
}

export function convert(value: number, from: Currency, to: Currency): number {
  if (from === to) return value;
  const toUsd = getToUsd();
  const usd = value * (toUsd[from] ?? FALLBACK_TO_USD[from]);
  return usd / (toUsd[to] ?? FALLBACK_TO_USD[to]);
}

export function getStoredCurrency(): Currency {
  const stored = localStorage.getItem('fo-currency');
  if (stored && CURRENCIES.includes(stored as Currency)) return stored as Currency;
  return 'AUD';
}

export function setStoredCurrency(c: Currency) {
  localStorage.setItem('fo-currency', c);
}

export function formatAmount(value: number, inCurrency: Currency, displayCurrency: Currency): string {
  const converted = convert(value, inCurrency, displayCurrency);
  const symbol = SYMBOLS[displayCurrency];
  return `${symbol}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(converted))}`;
}

export function formatAmountRaw(value: number, displayCurrency: Currency): string {
  const symbol = SYMBOLS[displayCurrency];
  return `${symbol}${new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 }).format(Math.round(value))}`;
}
