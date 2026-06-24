import { useState, useEffect } from "react";
import { initTheme } from "@/hooks/use-theme";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { PinLock } from "@/components/pin-lock";
import { CommandPalette } from "@/components/command-palette";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Assets from "@/pages/assets";
import Transactions from "@/pages/transactions";
import Vault from "@/pages/vault";
import Entities from "@/pages/entities";
import EntityDetail from "@/pages/entity-detail";
import Settings from "@/pages/settings";
import Report from "@/pages/report";
import Projections from "@/pages/projections";
import HomeOffice from "@/pages/home-office";
import Research from "@/pages/research";
import TaxReport from "@/pages/tax-report";
import EntityTax from "@/pages/entity-tax";
import AuditLog from "@/pages/audit-log";
import Notifications from "@/pages/notifications";
import BankFeed from "@/pages/bank-feed";
import CashFlow from "@/pages/cash-flow";
import NetWorthTargets from "@/pages/targets";
import Benchmarks from "@/pages/benchmarks";
import Watchlist from "@/pages/watchlist";
import AssetPrices from "@/pages/asset-prices";
import EstatePage from "@/pages/estate";
import WhiteLabelPage from '@/pages/white-label';
import OCRPage from '@/pages/ocr';
import AdminUsersPage from '@/pages/admin-users';
import ExportPdf from "@/pages/export-pdf";
import OcrPage from "@/pages/ocr";
import { Layout } from "@/components/layout";
import { OfflineIndicator } from "@/components/offline-indicator";
import { fetchLiveRates } from "@/lib/currency";

const queryClient = new QueryClient();

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
          <Route path="/estate" element={<EstatePage />} />
          <Route path="/white-label" component={WhiteLabelPage} />
<Route path="/admin/ocr" component={OCRPage} />
<Route path="/admin/users" component={AdminUsersPage} />
          <Route path="/report/export-pdf" component={ExportPdf} />
          <Route path="/vault/ocr" component={OcrPage} />
          <Route path="/settings" component={Settings} />
          <Route component={NotFound} />
        </Switch>
      </Layout>
      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  );
}

function App() {
  const [unlocked, setUnlocked] = useState(false);
  useEffect(() => {
    initTheme();
    fetchLiveRates();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!unlocked && <PinLock onUnlock={() => setUnlocked(true)} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
        <OfflineIndicator />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
