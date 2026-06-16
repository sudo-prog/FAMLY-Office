---
name: FX Currency Utility
description: Multi-currency display conversion for Family Office.
---

# FX Currency Utility

File: `artifacts/family-office/src/lib/currency.ts`

## Supported currencies
USD, AUD, EUR, GBP, CAD, SGD

## Hardcoded approximate mid-2025 rates (relative to USD)
- AUD: 0.645, EUR: 1.085, GBP: 1.27, CAD: 0.73, SGD: 0.74

## Key functions
- `getStoredCurrency()` — reads from `localStorage['fo-currency']`, defaults to AUD
- `setStoredCurrency(c)` — persists to localStorage
- `convert(value, from, to)` — converts between any two currencies
- `formatAmount(value, inCurrency, displayCurrency)` — converts + formats with symbol
- `formatAmountRaw(value, displayCurrency)` — formats without conversion (value already in display currency)

## Usage pattern in pages
```ts
const disp = getStoredCurrency();
const converted = convert(asset.value, asset.currency as Currency, disp);
```

## Currency change flow
Settings page calls `setStoredCurrency(c)` then `window.location.reload()` to re-render all components with the new currency.

**Why:** Assets are stored in their native currency (AUD, USD, etc.). Dashboard needs to aggregate them in a single display currency.
