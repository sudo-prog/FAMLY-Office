import React, { Suspense, lazy, useState, useEffect } from "react";
import { initTheme } from "@/hooks/use-theme";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PinLock } from "@/components/pin-lock";
import { CommandPalette } from "@/components/command-palette";
import ErrorBoundary from "@/components/error-boundary";
import { Layout } from "@/components/layout";
import { OfflineIndicator } from "@/components/offline-indicator";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchLiveRates } from "@/lib/currency";
import {
  OnboardingWizard,
  hasSeenOnboarding,
} from "@/components/onboarding/OnboardingWizard";
import { HelpButton } from "@/components/onboarding/HelpButton";

// Eagerly loaded: critical above-the-fold routes
import Dashboard from "@/pages/dashboard";
import NotFound from "@/pages/not-found";

// Lazy loaded: routes not needed on initial load
const Assets = lazy(() => import("@/pages/assets").then(m => ({ default: m.default })));
const Transactions = lazy(() => import("@/pages/transactions").then(m => ({ default: m.default })));
const Vault = lazy(() => import("@/pages/vault").then(m => ({ default: m.default })));
const Entities = lazy(() => import("@/pages/entities").then(m => ({ default: m.default })));
const EntityDetail = lazy(() => import("@/pages/entity-detail").then(m => ({ default: m.default })));
const Settings = lazy(() => import("@/pages/settings").then(m => ({ default: m.default })));
const Report = lazy(() => import("@/pages/report").then(m => ({ default: m.default })));
const Projections = lazy(() => import("@/pages/projections").then(m => ({ default: m.default })));
const HomeOffice = lazy(() => import("@/pages/home-office").then(m => ({ default: m.default })));
const Research = lazy(() => import("@/pages/research").then(m => ({ default: m.default })));
const TaxReport = lazy(() => import("@/pages/tax-report").then(m => ({ default: m.default })));
const EntityTax = lazy(() => import("@/pages/entity-tax").then(m => ({ default: m.default })));
const AuditLog = lazy(() => import("@/pages/audit-log").then(m => ({ default: m.default })));
const Notifications = lazy(() => import("@/pages/notifications").then(m => ({ default: m.default })));
const BankFeed = lazy(() => import("@/pages/bank-feed").then(m => ({ default: m.default })));
const CashFlow = lazy(() => import("@/pages/cash-flow").then(m => ({ default: m.default })));
const NetWorthTargets = lazy(() => import("@/pages/targets").then(m => ({ default: m.default })));
const Benchmarks = lazy(() => import("@/pages/benchmarks").then(m => ({ default: m.default })));
const Watchlist = lazy(() => import("@/pages/watchlist").then(m => ({ default: m.default })));
const AssetPrices = lazy(() => import("@/pages/asset-prices").then(m => ({ default: m.default })));
const EstatePage = lazy(() => import("@/pages/estate").then(m => ({ default: m.default })));
const WhiteLabelPage = lazy(() => import("@/pages/white-label").then(m => ({ default: m.default })));
const OCRPage = lazy(() => import("@/pages/ocr").then(m => ({ default: m.default })));
const AdminUsersPage = lazy(() => import("@/pages/admin-users").then(m => ({ default: m.default })));
const ExportPdf = lazy(() => import("@/pages/export-pdf").then(m => ({ default: m.default })));

const queryClient = new QueryClient();

function PageLoader() {
  return (
    <div className="space-y-6 p-6">
      <Skeleton className="h-10 w-56 bg-muted/50 rounded" />
      <Skeleton className="h-[600px] w-full bg-muted/50 rounded-lg" />
    </div>
  );
}

function Router() {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setPaletteOpen(o => !o);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <Layout onOpenPalette={() => setPaletteOpen(true)}>
        <ErrorBoundary>
          <Suspense fallback={<PageLoader />}>
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/assets" component={Assets} />
              <Route path="/transactions" component={Transactions} />
              <Route path="/vault" component={Vault} />
              <Route path="/entities" component={Entities} />
              <Route path="/entities/:id" component={EntityDetail} />
              <Route path="/report" component={Report} />
              <Route path="/projections" component={Projections} />
              <Route path="/home-office" component={HomeOffice} />
              <Route path="/research" component={Research} />
              <Route path="/tax-report" component={TaxReport} />
              <Route path="/report/tax-year" component={TaxReport} />
              <Route path="/entities/:id/tax" component={EntityTax} />
              <Route path="/admin/audit-log" component={AuditLog} />
              <Route path="/notifications" component={Notifications} />
              <Route path="/settings/bank-feed" component={BankFeed} />
              <Route path="/projections/cash-flow" component={CashFlow} />
              <Route path="/targets" component={NetWorthTargets} />
              <Route path="/report/benchmarks" component={Benchmarks} />
              <Route path="/research/watchlist" component={Watchlist} />
              <Route path="/assets/prices" component={AssetPrices} />
              <Route path="/estate" component={EstatePage} />
              <Route path="/white-label" component={WhiteLabelPage} />
              <Route path="/admin/ocr" component={OCRPage} />
              <Route path="/admin/users" component={AdminUsersPage} />
              <Route path="/report/export-pdf" component={ExportPdf} />
              <Route path="/vault/ocr" component={OCRPage} />
              <Route path="/settings" component={Settings} />
              <Route component={NotFound} />
            </Switch>
          </Suspense>
        </ErrorBoundary>
      </Layout>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

function App() {
  const [unlocked, setUnlocked] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingDone, setOnboardingDone] = useState(() => hasSeenOnboarding());

  useEffect(() => {
    initTheme();
    fetchLiveRates();
    // Show onboarding on first visit after a brief delay for smoother UX
    if (!hasSeenOnboarding()) {
      const timer = setTimeout(() => setShowOnboarding(true), 600);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleOnboardingComplete = () => {
    setOnboardingDone(true);
    setShowOnboarding(false);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ErrorBoundary>
          {!unlocked && <PinLock onUnlock={() => setUnlocked(true)} />}
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster richColors position="top-right" />
          <OfflineIndicator />
          {/* Onboarding wizard: shows on first visit or when re-triggered */}
          <OnboardingWizard
            open={showOnboarding && !onboardingDone}
            onClose={() => setShowOnboarding(false)}
            onComplete={handleOnboardingComplete}
          />
          {/* Help button: always visible, can re-trigger tour */}
          <HelpButton />
        </ErrorBoundary>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
