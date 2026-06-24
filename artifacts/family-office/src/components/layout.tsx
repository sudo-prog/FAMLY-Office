import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Wallet, ArrowLeftRight, FileKey, Users,
  Settings as SettingsIcon, FileText, TrendingUp, Menu, X, ChevronRight,
  Briefcase, Search, Sparkles, Receipt, Shield, Bell, Target,
  Eye, Landmark, Printer, DollarSign, Building2,
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  function isActive(href: string) {
    if (href === "/") return location === "/";
    return location.startsWith(href);
  }

  // Close mobile menu on navigation
  useEffect(() => { setMenuOpen(false); }, [location]);

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [menuOpen]);

  // Close mobile menu on Escape
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    if (menuOpen) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [menuOpen]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  function NavItems({ onClick }: { onClick?: () => void }) {
    return (
      <>
        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 px-2">Command Center</div>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              onClick={onClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
              <span className="lg:hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}

        <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mt-6 mb-3 px-2">Business</div>
        {BUSINESS_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href}
              onClick={onClick}
              className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}>
              <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? "text-primary" : ""}`} />
              <span className="lg:hidden xl:inline">{item.label}</span>
            </Link>
          );
        })}
      </>
    );
  }

  function BottomActions({ onClick }: { onClick?: () => void }) {
    return (
      <div className="p-4 border-t border-border space-y-1">
        {onOpenPalette && (
          <button onClick={() => { onClick?.(); onOpenPalette(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground">
            <Search className="w-4 h-4" />
            <span className="lg:hidden xl:inline flex-1 text-left text-sm">Search</span>
            <span className="lg:hidden xl:inline text-[10px] font-mono bg-muted border border-border rounded px-1 py-0.5 text-muted-foreground/70">⌘K</span>
          </button>
        )}
        <Link href="/settings"
          onClick={onClick}
          className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
            location === "/settings" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
          }`}>
          <SettingsIcon className="w-4 h-4" />
          <span className="lg:hidden xl:inline">Settings</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex h-[100dvh] w-full bg-background text-foreground overflow-hidden">
      {/* Mobile overlay backdrop */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - Desktop: always visible, Tablet: collapsed, Mobile: slide-out */}
      <aside
        className={`
          fixed md:relative z-50 h-full
          bg-sidebar border-r border-border
          flex flex-col flex-shrink-0
          transition-transform duration-300 ease-out
          md:transition-[width] md:duration-200
          w-64 md:w-16 xl:w-64
          ${menuOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
        ref={menuRef}
      >
        {/* Logo area */}
        <div className="h-16 flex items-center px-4 md:px-3 xl:px-6 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 overflow-hidden">
            <div className="w-6 h-6 rounded bg-primary flex items-center justify-center flex-shrink-0">
              <div className="w-3 h-3 bg-primary-foreground rounded-sm" />
            </div>
            <span className="font-serif font-bold text-lg tracking-wide text-foreground whitespace-nowrap md:hidden xl:block">Family Office</span>
          </div>
          {/* Mobile close button */}
          <button
            onClick={() => setMenuOpen(false)}
            className="md:hidden ml-auto p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 md:px-2 xl:px-4 py-4 space-y-1 overflow-y-auto">
          <NavItems />
        </nav>

        {/* Bottom actions */}
        <div className="md:hidden xl:block">
          <BottomActions />
        </div>
        {/* Tablet collapsed: icon-only bottom */}
        <div className="hidden md:block xl:hidden p-2 border-t border-border space-y-1">
          {onOpenPalette && (
            <button onClick={onOpenPalette}
              className="w-full flex items-center justify-center p-2 rounded-md transition-colors text-muted-foreground hover:bg-muted hover:text-foreground">
              <Search className="w-4 h-4" />
            </button>
          )}
          <Link href="/settings"
            className={`w-full flex items-center justify-center p-2 rounded-md transition-colors ${
              location === "/settings" ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted hover:text-foreground"
            }`}>
            <SettingsIcon className="w-4 h-4" />
          </Link>
        </div>
      </aside>

      {/* Main content area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden min-w-0">
        {/* Top header bar */}
        <header className="h-14 md:h-16 border-b border-border bg-background flex items-center justify-between px-4 md:px-8 flex-shrink-0 relative z-30">
          <div className="flex items-center gap-3">
            {/* Mobile hamburger */}
            <button
              onClick={() => setMenuOpen(true)}
              className="md:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Tablet collapse toggle */}
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="hidden md:flex xl:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-5 h-5" />
            </button>
            <span className="hidden sm:inline text-sm font-mono text-muted-foreground">STATUS: <span className="text-emerald-500">ENCRYPTED</span></span>
          </div>
          <div className="flex items-center gap-2 md:gap-3">
            {onOpenPalette && (
              <button onClick={onOpenPalette}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md border border-border bg-muted/20 text-muted-foreground hover:text-foreground hover:border-border/80 transition-colors text-xs">
                <Search className="w-3.5 h-3.5" />
                <span>Search</span>
                <span className="font-mono text-[10px] bg-muted border border-border rounded px-1 ml-1">⌘K</span>
              </button>
            )}
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center border border-border">
              <span className="text-xs font-medium">CFO</span>
            </div>
            {/* Mobile dropdown menu button */}
            <div ref={menuRef} className="relative md:hidden">
              <button
                onClick={() => setMenuOpen((o) => !o)}
                className={`flex items-center justify-center w-8 h-8 rounded-md border transition-colors ${
                  menuOpen ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-border/80 hover:bg-muted/40"
                }`}
                aria-label="Navigation menu"
              >
                {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
