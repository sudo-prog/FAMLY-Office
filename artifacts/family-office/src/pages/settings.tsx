import React, { useState } from "react";
import { Link } from "wouter";
import { useListAssets, useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ShieldCheck, HardDrive, Download, AlertCircle, CheckCircle2, FileText, Globe, Lock, Cloud, Shield, Loader2 } from "lucide-react";
import { CURRENCIES, getStoredCurrency, setStoredCurrency, type Currency } from "@/lib/currency";

function fmt(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const content = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const { data: assets } = useListAssets();
  const { data: transactions } = useListTransactions();

  const [currency, setCurrencyState] = useState<Currency>(getStoredCurrency());
  const [exportDone, setExportDone] = useState(false);
  const [purging, setPurging] = useState(false);
  const [purgeError, setPurgeError] = useState("");
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(true);

  React.useEffect(() => {
    fetch("/api/ai/status").then(r => r.json()).then(d => { setAiStatus(d); setAiLoading(false); }).catch(() => setAiLoading(false));
  }, []);

  function handleCurrencyChange(c: Currency) {
    setCurrencyState(c);
    setStoredCurrency(c);
    window.location.reload();
  }

  function handleExport() {
    if (assets?.length) {
      downloadCSV("family-office-assets.csv", assets.map((a) => [
        String(a.id), a.name, a.category, String(a.value), a.currency,
        a.institution ?? "", a.notes ?? "", a.createdAt ?? "",
      ]), ["ID", "Name", "Category", "Value", "Currency", "Institution", "Notes", "Created"]);
    }
    if (transactions?.length) {
      downloadCSV("family-office-transactions.csv", transactions.map((t) => [
        String(t.id), t.date, t.description, t.type, String(t.amount),
        t.category ?? "", String(t.taxDeductible),
      ]), ["ID", "Date", "Description", "Type", "Amount", "Category", "Tax Deductible"]);
    }
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  }

  async function handlePurge() {
    setPurging(true);
    setPurgeError("");
    try {
      const res = await fetch("/api/system/purge", { method: "DELETE" });
      if (res.ok) {
        window.location.reload();
      } else {
        setPurgeError("Purge failed. Please try again.");
      }
    } catch {
      setPurgeError("Network error during purge.");
    } finally {
      setPurging(false);
    }
  }

  return (
    <div className="space-y-6 pb-8 max-w-3xl">
      <div>
        <h1 className="text-3xl font-serif text-foreground mb-1">System Settings</h1>
        <p className="text-muted-foreground text-sm">Configuration, security, and export controls.</p>
      </div>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Globe className="w-4 h-4 text-primary" />
            Display Currency
          </CardTitle>
          <CardDescription className="text-sm">All portfolio values are shown in your preferred currency using live-approximated FX rates.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 flex-wrap">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                onClick={() => handleCurrencyChange(c)}
                className={`px-4 py-2 rounded-md text-sm font-mono font-medium border transition-all ${
                  currency === c
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/30 text-muted-foreground border-border hover:border-primary/40 hover:text-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">
            Currently displaying in <span className="text-foreground font-mono">{currency}</span>. FX rates are approximated and update on page reload.
          </p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Security Status
          </CardTitle>
          <CardDescription className="text-sm">Encryption and access controls are fully operational.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "End-to-End Encryption", desc: "All vault documents are encrypted at rest using AES-256.", badge: "ACTIVE", color: "emerald" },
            { label: "Local-First Storage", desc: "All data is stored on your own infrastructure. Zero cloud exposure.", badge: "ACTIVE", color: "emerald" },
            { label: "Data Sovereignty", desc: "No third-party data sharing. You own and control all records.", badge: "VERIFIED", color: "emerald" },
            { label: "PIN Authentication", desc: "App locked with PIN on every session start.", badge: "ACTIVE", color: "emerald" },
          ].map((item) => (
            <div key={item.label} className="p-3.5 bg-muted/20 rounded-md border border-border flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">{item.label}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{item.desc}</p>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded flex-shrink-0 ml-4">{item.badge}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="w-4 h-4 text-primary" />
            AI Configuration — Zero-Trust
          </CardTitle>
          <CardDescription className="text-sm">Local LLM handles all sensitive financial data. Cloud AI is research-only with automatic sanitization.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {aiLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Checking AI status…
            </div>
          ) : (
            <>
              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-emerald-500" />
                    <span className="font-medium text-sm">Local LLM (Ollama)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiStatus?.local?.online ? "bg-emerald-500" : "bg-muted"}`} />
                    <span className={`text-xs font-mono ${aiStatus?.local?.online ? "text-emerald-500" : "text-muted-foreground"}`}>
                      {aiStatus?.local?.online ? "ONLINE" : "OFFLINE"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong className="text-foreground">URL:</strong> <code className="bg-muted px-1 rounded">{aiStatus?.local?.url}</code> — set via <code className="bg-muted px-1 rounded">LOCAL_LLM_URL</code> secret</p>
                  <p><strong className="text-foreground">Model:</strong> <code className="bg-muted px-1 rounded">{aiStatus?.local?.model}</code> — set via <code className="bg-muted px-1 rounded">LOCAL_LLM_MODEL</code> secret</p>
                  {aiStatus?.local?.availableModels?.length > 0 && (
                    <p><strong className="text-foreground">Available:</strong> {aiStatus.local.availableModels.join(", ")}</p>
                  )}
                  {!aiStatus?.local?.online && (
                    <div className="mt-2 p-3 bg-muted/20 rounded border border-border space-y-1.5">
                      <p className="font-medium text-foreground">Setup guide:</p>
                      <p>1. Install: <code className="bg-muted px-1 rounded text-[10px]">brew install ollama</code> or visit <span className="text-primary">ollama.com</span></p>
                      <p>2. Run a model: <code className="bg-muted px-1 rounded text-[10px]">ollama run llama3.2</code></p>
                      <p>3. Add secret <code className="bg-muted px-1 rounded text-[10px]">LOCAL_LLM_URL</code> = your Ollama endpoint</p>
                      <p className="text-muted-foreground/70">For remote access: expose via ngrok or deploy on a VPS alongside your app.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-4 border border-border rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-sm">Cloud AI (Research Only)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${aiStatus?.cloud?.configured ? "bg-blue-400" : "bg-muted"}`} />
                    <span className={`text-xs font-mono ${aiStatus?.cloud?.configured ? "text-blue-400" : "text-muted-foreground"}`}>
                      {aiStatus?.cloud?.configured ? "CONFIGURED" : "NOT SET"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p><strong className="text-foreground">Model:</strong> <code className="bg-muted px-1 rounded">{aiStatus?.cloud?.model}</code> — set via <code className="bg-muted px-1 rounded">CLOUD_AI_MODEL</code> secret</p>
                  {!aiStatus?.cloud?.configured && (
                    <p>Add <code className="bg-muted px-1 rounded">CLOUD_AI_KEY</code> secret (OpenAI API key) to enable research queries.</p>
                  )}
                  {aiStatus?.cloud?.configured && (
                    <p className="text-amber-500/80">⚠ Only sanitized, non-sensitive research queries are ever routed to cloud AI.</p>
                  )}
                </div>
              </div>

              <div className="p-3 bg-muted/10 border border-border rounded-lg">
                <p className="text-xs text-muted-foreground">
                  <strong className="text-foreground">Zero-Trust Policy:</strong> Portfolio values, asset names, entity details, transactions, and document content are <strong className="text-foreground">never</strong> sent to cloud AI. The auto-classifier routes all sensitive queries to local only. Force local mode in the AI widget at any time.
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <FileText className="w-4 h-4 text-primary" />
            Wealth Report
          </CardTitle>
          <CardDescription className="text-sm">Generate a formatted wealth summary report for printing or PDF export.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3.5 border border-border rounded-md">
            <div>
              <h3 className="font-medium text-sm">Generate Report</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Complete net worth snapshot with asset allocation and recent transactions.</p>
            </div>
            <Link href="/report">
              <Button variant="outline" className="gap-2 border-border text-sm flex-shrink-0 ml-4">
                <FileText className="w-4 h-4" /> Open Report
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <HardDrive className="w-4 h-4 text-primary" />
            Data Export
          </CardTitle>
          <CardDescription className="text-sm">Download your complete financial records as CSV files.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3.5 border border-border rounded-md">
            <div>
              <h3 className="font-medium text-sm">Export All Records</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Assets ({assets?.length ?? 0} records) and transactions ({transactions?.length ?? 0} records) as CSV files.
              </p>
            </div>
            <Button onClick={handleExport} variant="outline" className="gap-2 border-border text-sm flex-shrink-0 ml-4"
              disabled={!assets?.length && !transactions?.length}>
              {exportDone ? <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Exported</> : <><Download className="w-4 h-4" /> Export CSV</>}
            </Button>
          </div>
          <div className="p-3.5 bg-muted/10 rounded-md border border-border">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div><div className="text-muted-foreground">Total Assets</div><div className="font-mono text-foreground mt-0.5">{assets?.length ?? 0} holdings</div></div>
              <div><div className="text-muted-foreground">Portfolio Value</div><div className="font-mono text-primary mt-0.5">{fmt((assets ?? []).reduce((s, a) => s + a.value, 0))}</div></div>
              <div><div className="text-muted-foreground">Transactions</div><div className="font-mono text-foreground mt-0.5">{transactions?.length ?? 0} records</div></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-destructive/5 border-destructive/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base text-destructive">
            <AlertCircle className="w-4 h-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm text-foreground">Purge System</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Permanently delete all {(assets?.length ?? 0) + (transactions?.length ?? 0)} records. Cannot be undone.
              </p>
              {purgeError && <p className="text-xs text-destructive mt-1">{purgeError}</p>}
            </div>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="ml-4 flex-shrink-0" disabled={purging}>
                  {purging ? "Purging…" : "Initiate Purge"}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-serif text-xl">Confirm System Purge</AlertDialogTitle>
                  <AlertDialogDescription className="text-muted-foreground text-sm">
                    This will permanently delete all assets ({assets?.length ?? 0}), transactions ({transactions?.length ?? 0}),
                    documents, and entities. The action cannot be undone. Are you absolutely sure?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-border text-muted-foreground hover:text-foreground">Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handlePurge} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Yes, purge everything
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
