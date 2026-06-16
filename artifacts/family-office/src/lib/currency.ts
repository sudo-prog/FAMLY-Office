export const CURRENCIES = ['USD', 'AUD', 'EUR', 'GBP', 'CAD', 'SGD'] as const;
export type Currency = typeof CURRENCIES[number];

const TO_USD: Record<Currency, number> = {
  USD: 1,
  AUD: 0.645,
  EUR: 1.085,
  GBP: 1.27,
  CAD: 0.73,
  SGD: 0.74,
};

const SYMBOLS: Record<Currency, string> = {
  USD: '$',
  AUD: 'A$',
  EUR: '€',
  GBP: '£',
  CAD: 'C$',
  SGD: 'S$',
};

export function convert(value: number, from: Currency, to: Currency): number {
  if (from === to) return value;
  const usd = value * TO_USD[from];
  return usd / TO_USD[to];
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
