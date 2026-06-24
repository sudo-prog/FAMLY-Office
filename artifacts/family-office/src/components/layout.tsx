import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, FileKey, Users,
  Settings as SettingsIcon, FileText, TrendingUp, Menu, X, ChevronRight,
  Briefcase, Search, Sparkles, Receipt, Shield, Bell, Target, TrendingUp as TrendingUpIcon,
  Bitcoin, Home as HomeIcon, FileBarChart, Users as UsersIcon, Globe, Wallet as WalletIcon,
  BarChart3, PieChartIcon, Settings as SettingsIcon, Menu, X, ChevronRight, Eye, Landmark, Printer,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/assets", label: "Assets", icon: Wallet },
  { href: "/transactions", label: "Ledger", icon: ArrowLeftRight },
  { href: "/vault", label: "Vault", icon: FileKey },
  { href: "/entities", label: "Entities", icon: Users },
  { href: "/projections", label: "Projections", icon: TrendingUp },
  { href: "/report", label: "Report", icon: FileText },
  { href: "/tax-report", label: "Tax Report", icon: Receipt },
];

const BUSINESS_ITEMS = [
  { href: "/home-office", label: "Home Office", icon: Briefcase },
  { href: "/research",    label: "AI Research",  icon: Sparkles },
  { href: "/projections/cash-flow", label: "Cash Flow", icon: BarChart3 },
  { href: "/targets", label: "Net Worth Targets", icon: Target },
  { href: "/report/benchmarks", label: "Benchmarks", icon: BarChart3 },
  { href: "/research/watchlist", label: "Watchlist", icon: Eye },
  { href: "/assets/prices", label: "Price Feeds", icon: DollarSign },
  { href: "/estate", label: "Estate Planning", icon: Landmark },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/admin/audit-log", label: "Audit Log", icon: Shield },
  { href: "/report/export-pdf", label: "PDF Export", icon: Printer },
  { href: "/white-label", label: "Multi-Office", icon: Building2 },
  { href: "/admin/ocr", label: "Document OCR", icon: FileText },
];

interface LayoutProps { children: React.ReactNode; onOpenPalette?: () => void }

export function Layout({ children, onOpenPalette }: LayoutProps) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  }

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [location]);

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col flex-shrink-0">
        <div className="h-16 flex items-center px-6 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
              <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
            </div>
            <span className="font-serif font-bold text-lg tracking-wide text-foreground">Family Office</span>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Command Center</div>
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                <item.icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}

          <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3 px-2">Business</div>
          {BUSINESS_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                  active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}>
                <item.icon className={`w-4 h-4 ${active ? "text-primary" : ""}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-border space-y-1">
          {onOpenPalette && (
            <button onClick={onOpenPalette}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground">
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left text-sm">Search</span>
              <span className="text-[10px] font-mono bg-muted border border-border rounded px-1 py-0.5 text-muted-foreground/70">⌘K</span>
            </button>
          )}
          <Link href="/settings"
            className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
              location === "/settings" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}>
            <SettingsIcon className="w-4 h-4" />
            Settings
          </Link>
        </div>
      </aside>

      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 border-b border-border bg-background flex items-center justify-between px-8 flex-shrink-0 relative z-30">
          <div className="flex items-center gap-4">
            <span className="text-sm font-mono text-muted-foreground">STATUS: <span className="text-emerald-500">ENCRYPTED</span></span>
          </div>
          <div className="flex items-center gap-3">
            {onOpenPalette && (
              <button onClick={onOpenPalette}
                className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors text-xs">
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
                <span className="font-mono text-[10px] bg-muted border border-border rounded px-1 ml-1">⌘K</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
              <span className="text-xs font-medium">CFO</span>
            </div>
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
                  menuOpen ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/40"
                }`}
                aria-label="Navigation menu"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>

              {menuOpen && (
                <div className="absolute right-0 top-full mt-2 w-64 bg-card border border-border rounded-xl shadow-2xl overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Navigate</p>
                  </div>
                  <div className="p-2 space-y-0.5">
                    {[...NAV_ITEMS, ...BUSINESS_ITEMS].map((item) => {
                      const active = isActive(item.href);
                      return (
                        <Link key={item.href} href={item.href}
                          className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors group ${
                            active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                          }`}>
                          <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
                          <span className="flex-1">{item.label}</span>
                          {active && <ChevronRight className="w-3 h-3 opacity-50" />}
                        </Link>
                      );
                    })}
                  </div>
                  <div className="p-2 border-t border-border">
                    <Link href="/settings"
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        location === "/settings" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}>
                      <SettingsIcon className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
          <div className="max-w-7xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
