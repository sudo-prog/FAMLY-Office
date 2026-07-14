import React, { useState, useEffect, useRef, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Search, LayoutDashboard, Wallet, ArrowLeftRight, FileKey, Users,
  TrendingUp, FileText, Settings as SettingsIcon, X, Briefcase,
  ScrollText, User2, Receipt, Clock, Sparkles, Shield, Bell, Landmark,
  BarChart3, Target, Eye, DollarSign, Building2, Printer,
} from "lucide-react";
import { useListAssets, useListDocuments, useListTransactions } from "@workspace/api-client-react";
import { useBusinessClients, useBusinessInvoices } from "@/hooks/use-business-api";

type Result = { id: string; label: string; sublabel?: string; group: string; groupIcon: React.ElementType; href: string; icon: React.ElementType };

const NAV_RESULTS: Result[] = [
  { id: "nav-/", label: "Dashboard", sublabel: "Overview", group: "Navigate", groupIcon: LayoutDashboard, href: "/", icon: LayoutDashboard },
  { id: "nav-/assets", label: "Assets", sublabel: "Portfolio holdings", group: "Navigate", groupIcon: LayoutDashboard, href: "/assets", icon: Wallet },
  { id: "nav-/transactions", label: "Ledger", sublabel: "Transactions", group: "Navigate", groupIcon: LayoutDashboard, href: "/transactions", icon: ArrowLeftRight },
  { id: "nav-/vault", label: "Document Vault", sublabel: "Encrypted files", group: "Navigate", groupIcon: LayoutDashboard, href: "/vault", icon: FileKey },
  { id: "nav-/entities", label: "Entities", sublabel: "Trusts & companies", group: "Navigate", groupIcon: LayoutDashboard, href: "/entities", icon: Users },
  { id: "nav-/projections", label: "Projections", sublabel: "Forecasts", group: "Navigate", groupIcon: LayoutDashboard, href: "/projections", icon: TrendingUp },
  { id: "nav-/report", label: "Wealth Report", sublabel: "Professional summaries", group: "Navigate", groupIcon: LayoutDashboard, href: "/report", icon: FileText },
  { id: "nav-/tax-report", label: "Tax Report", sublabel: "Tax year summary", group: "Navigate", groupIcon: LayoutDashboard, href: "/tax-report", icon: Receipt },
  // Business
  { id: "nav-/home-office", label: "Home Office", sublabel: "Business management", group: "Navigate", groupIcon: LayoutDashboard, href: "/home-office", icon: Briefcase },
  { id: "nav-/research", label: "AI Research", sublabel: "Deep financial analysis", group: "Navigate", groupIcon: LayoutDashboard, href: "/research", icon: Sparkles },
  { id: "nav-/projections/cash-flow", label: "Cash Flow", sublabel: "Cash flow forecast", group: "Navigate", groupIcon: LayoutDashboard, href: "/projections/cash-flow", icon: BarChart3 },
  { id: "nav-/targets", label: "Net Worth Targets", sublabel: "Goal tracking", group: "Navigate", groupIcon: LayoutDashboard, href: "/targets", icon: Target },
  { id: "nav-/report/benchmarks", label: "Benchmarks", sublabel: "Performance comparison", group: "Navigate", groupIcon: LayoutDashboard, href: "/report/benchmarks", icon: BarChart3 },
  { id: "nav-/research/watchlist", label: "Watchlist", sublabel: "Tracked assets", group: "Navigate", groupIcon: LayoutDashboard, href: "/research/watchlist", icon: Eye },
  { id: "nav-/assets/prices", label: "Price Feeds", sublabel: "Live market prices", group: "Navigate", groupIcon: LayoutDashboard, href: "/assets/prices", icon: DollarSign },
  { id: "nav-/estate", label: "Estate Planning", sublabel: "Succession & estate", group: "Navigate", groupIcon: LayoutDashboard, href: "/estate", icon: Landmark },
  { id: "nav-/notifications", label: "Notifications", sublabel: "Alerts & reminders", group: "Navigate", groupIcon: LayoutDashboard, href: "/notifications", icon: Bell },
  { id: "nav-/admin/audit-log", label: "Audit Log", sublabel: "Activity history", group: "Navigate", groupIcon: LayoutDashboard, href: "/admin/audit-log", icon: Shield },
  { id: "nav-/admin/users", label: "Users & Roles", sublabel: "Admin access control", group: "Navigate", groupIcon: LayoutDashboard, href: "/admin/users", icon: Users },
  { id: "nav-/report/export-pdf", label: "PDF Export", sublabel: "Export reports", group: "Navigate", groupIcon: LayoutDashboard, href: "/report/export-pdf", icon: Printer },
  { id: "nav-/white-label", label: "Multi-Office", sublabel: "White-label offices", group: "Navigate", groupIcon: LayoutDashboard, href: "/white-label", icon: Building2 },
  { id: "nav-/admin/ocr", label: "Document OCR", sublabel: "Scan & extract", group: "Navigate", groupIcon: LayoutDashboard, href: "/admin/ocr", icon: FileText },
  { id: "nav-/settings/bank-feed", label: "Bank Feed", sublabel: "Connected accounts", group: "Navigate", groupIcon: LayoutDashboard, href: "/settings/bank-feed", icon: Landmark },
  { id: "nav-/settings", label: "Settings", sublabel: "Theme & preferences", group: "Navigate", groupIcon: LayoutDashboard, href: "/settings", icon: SettingsIcon },
];

function match(haystack: string, query: string) {
  return haystack.toLowerCase().includes(query.toLowerCase());
}

interface CommandPaletteProps { open: boolean; onClose: () => void; }

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState("");
  const [cursor, setCursor] = useState(0);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: assets } = useListAssets();
  const { data: documents } = useListDocuments();
  const { data: transactions } = useListTransactions();
  const { data: clients } = useBusinessClients();
  const { data: invoices } = useBusinessInvoices();

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 50); setQuery(""); setCursor(0); }
  }, [open]);

  const results = useMemo<Result[]>(() => {
    const q = query.trim();
    if (!q) return NAV_RESULTS;
    const all: Result[] = [];

    NAV_RESULTS.forEach(n => { if (match(n.label, q) || match(n.sublabel ?? "", q)) all.push(n); });

    (assets ?? []).filter(a => match(a.name, q) || match(a.category, q)).slice(0, 5).forEach(a => all.push({
      id: `asset-${a.id}`, label: a.name,
      sublabel: `${a.category} · $${Number(a.value).toLocaleString()}`,
      group: "Assets", groupIcon: Wallet, href: "/assets", icon: Wallet,
    }));

    (documents ?? []).filter(d => match(d.title, q) || match(d.fileType, q)).slice(0, 5).forEach(d => all.push({
      id: `doc-${d.id}`, label: d.title, sublabel: `${d.fileType} · ${d.year ?? ""}`,
      group: "Documents", groupIcon: FileKey, href: "/vault", icon: FileKey,
    }));

    (transactions ?? []).filter(t => match(t.description, q)).slice(0, 4).forEach(t => all.push({
      id: `tx-${t.id}`, label: t.description, sublabel: `${t.type} · $${Number(t.amount).toLocaleString()}`,
      group: "Transactions", groupIcon: ArrowLeftRight, href: "/transactions", icon: ArrowLeftRight,
    }));

    (clients ?? []).filter(c => match(c.name, q) || match(c.company ?? "", q) || match(c.email ?? "", q)).slice(0, 4).forEach(c => all.push({
      id: `client-${c.id}`, label: c.name, sublabel: c.company ?? c.email ?? "Client",
      group: "Clients", groupIcon: User2, href: "/home-office", icon: User2,
    }));

    (invoices ?? []).filter(i => match(i.invoiceNumber, q) || match(i.clientName, q)).slice(0, 4).forEach(i => all.push({
      id: `inv-${i.id}`, label: `Invoice ${i.invoiceNumber}`, sublabel: `${i.clientName} · $${i.total.toLocaleString()}`,
      group: "Invoices", groupIcon: ScrollText, href: "/home-office", icon: ScrollText,
    }));

    return all;
  }, [query, assets, documents, transactions, clients, invoices]);

  const groups = useMemo(() => {
    const map: Record<string, Result[]> = {};
    results.forEach(r => { (map[r.group] ??= []).push(r); });
    return map;
  }, [results]);

  const flat = useMemo(() => results, [results]);

  useEffect(() => { setCursor(0); }, [query]);

  function handleKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setCursor(c => Math.min(c + 1, flat.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    else if (e.key === "Enter" && flat[cursor]) { navigate(flat[cursor].href); onClose(); }
    else if (e.key === "Escape") onClose();
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]" onClick={onClose}>
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-xl bg-card border border-border rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Search anything — pages, assets, documents, clients…"
            className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <div className="flex items-center gap-1.5">
            <kbd className="text-[10px] text-muted-foreground bg-muted/60 border border-border rounded px-1.5 py-0.5 font-mono">ESC</kbd>
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <div className="max-h-[420px] overflow-y-auto py-2">
          {flat.length === 0 && (
            <div className="text-center py-10 text-muted-foreground text-sm">No results for "{query}"</div>
          )}
          {Object.entries(groups).map(([group, items]) => (
            <div key={group}>
              <div className="px-4 py-1.5 text-[10px] font-semibold text-muted-foreground/60 uppercase tracking-wider">{group}</div>
              {items.map(item => {
                const globalIdx = flat.indexOf(item);
                const active = cursor === globalIdx;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => { navigate(item.href); onClose(); }}
                    onMouseEnter={() => setCursor(globalIdx)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 transition-colors text-left ${active ? "bg-primary/10 text-foreground" : "text-muted-foreground hover:bg-muted/30 hover:text-foreground"}`}
                  >
                    <div className={`w-7 h-7 rounded-md flex items-center justify-center flex-shrink-0 ${active ? "bg-primary text-primary-foreground" : "bg-muted/50 text-muted-foreground"}`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-foreground truncate">{item.label}</div>
                      {item.sublabel && <div className="text-xs text-muted-foreground/70 truncate">{item.sublabel}</div>}
                    </div>
                    {active && <kbd className="text-[10px] text-muted-foreground bg-muted/60 border border-border rounded px-1.5 py-0.5 font-mono flex-shrink-0">↵</kbd>}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[10px] text-muted-foreground/50">
          <span><kbd className="font-mono">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono">↵</kbd> open</span>
          <span><kbd className="font-mono">ESC</kbd> close</span>
          <span className="ml-auto">{flat.length} result{flat.length !== 1 ? "s" : ""}</span>
        </div>
      </div>
    </div>
  );
}
