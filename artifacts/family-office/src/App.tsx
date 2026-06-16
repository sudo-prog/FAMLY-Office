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
import { Layout } from "@/components/layout";

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
  useEffect(() => { initTheme(); }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {!unlocked && <PinLock onUnlock={() => setUnlocked(true)} />}
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
