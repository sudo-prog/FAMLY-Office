import { useState, useEffect } from "react";

export interface AppTheme {
  primaryHsl: string;
  backgroundHsl: string;
  cardHsl: string;
  textScale: number;
  fontBody: string;
  fontHeading: string;
  fontImportUrl: string;
}

export const DEFAULT_THEME: AppTheme = {
  primaryHsl: "145 33% 27%",
  backgroundHsl: "220 16% 7%",
  cardHsl: "220 18% 10%",
  textScale: 1.0,
  fontBody: "Inter, sans-serif",
  fontHeading: "Georgia, serif",
  fontImportUrl: "",
};

const STORAGE_KEY = "fo-app-theme";

export function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export function hslToHex(hsl: string): string {
  const parts = hsl.match(/(\d+\.?\d*)/g);
  if (!parts || parts.length < 3) return "#2F5D42";
  const h = parseInt(parts[0]) / 360;
  const s = parseInt(parts[1]) / 100;
  const l = parseInt(parts[2]) / 100;
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r, g, b;
  if (s === 0) { r = g = b = l; } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return "#" + [r, g, b].map((x) => Math.round(x * 255).toString(16).padStart(2, "0")).join("");
}

export function applyTheme(theme: AppTheme) {
  const root = document.documentElement;
  root.style.setProperty("--primary", theme.primaryHsl);
  root.style.setProperty("--accent", theme.primaryHsl);
  root.style.setProperty("--ring", theme.primaryHsl);
  root.style.setProperty("--sidebar-primary", theme.primaryHsl);
  root.style.setProperty("--sidebar-ring", theme.primaryHsl);
  root.style.setProperty("--background", theme.backgroundHsl);
  root.style.setProperty("--card", theme.cardHsl);
  root.style.setProperty("--sidebar", theme.cardHsl);
  root.style.setProperty("--app-font-sans", theme.fontBody);
  root.style.setProperty("--app-font-serif", theme.fontHeading);
  if (theme.textScale !== 1.0) {
    root.style.setProperty("font-size", `${theme.textScale * 100}%`);
  } else {
    root.style.removeProperty("font-size");
  }
  const existing = document.getElementById("fo-font-import");
  if (theme.fontImportUrl) {
    const link = (existing as HTMLLinkElement) ?? document.createElement("link");
    link.id = "fo-font-import";
    link.rel = "stylesheet";
    link.href = theme.fontImportUrl;
    if (!existing) document.head.appendChild(link);
  } else if (existing) {
    existing.remove();
  }
}

export function initTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) applyTheme({ ...DEFAULT_THEME, ...JSON.parse(stored) });
  } catch {}
}

export function useTheme() {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) return { ...DEFAULT_THEME, ...JSON.parse(stored) };
    } catch {}
    return DEFAULT_THEME;
  });

  useEffect(() => { applyTheme(theme); }, [theme]);

  function updateTheme(updates: Partial<AppTheme>) {
    setThemeState((prev) => {
      const next = { ...prev, ...updates };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      applyTheme(next);
      return next;
    });
  }

  function resetTheme() {
    localStorage.removeItem(STORAGE_KEY);
    setThemeState(DEFAULT_THEME);
    applyTheme(DEFAULT_THEME);
    document.documentElement.style.removeProperty("font-size");
  }

  return { theme, updateTheme, resetTheme };
}
