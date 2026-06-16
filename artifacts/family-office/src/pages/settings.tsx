import React, { useState } from "react";
import { Link } from "wouter";
import { useListAssets, useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ShieldCheck, HardDrive, Download, AlertCircle, CheckCircle2, FileText, Globe, Lock, Cloud, Shield, Loader2, Palette, Type, RotateCcw, Github, Search, Wrench, Cpu, Wifi, WifiOff, Key, ExternalLink, Sparkles, Smartphone, MonitorSmartphone } from "lucide-react";
import { CURRENCIES, getStoredCurrency, setStoredCurrency, type Currency } from "@/lib/currency";
import { useTheme, hexToHsl, hslToHex, DEFAULT_THEME } from "@/hooks/use-theme";

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

  const { theme, updateTheme, resetTheme } = useTheme();
  const [currency, setCurrencyState] = useState<Currency>(getStoredCurrency());
  const [exportDone, setExportDone] = useState(false);
  const [fontImportInput, setFontImportInput] = useState(theme.fontImportUrl);
  const [purging, setPurging] = useState(false);
  const [purgeError, setPurgeError] = useState("");
  const [aiStatus, setAiStatus] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(true);
  const [toolsStatus, setToolsStatus] = useState<any>(null);
  const [copiedEnvVar, setCopiedEnvVar] = useState<string | null>(null);
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [installState, setInstallState] = useState<"idle" | "installing" | "done">("idle");
  const [swStatus, setSwStatus] = useState<"checking" | "active" | "inactive">("checking");

  React.useEffect(() => {
    fetch("/api/ai/status").then(r => r.json()).then(d => { setAiStatus(d); setAiLoading(false); }).catch(() => setAiLoading(false));
    fetch("/api/research/tools/status").then(r => r.json()).then(setToolsStatus).catch(() => {});

    const handler = (e: Event) => { e.preventDefault(); setInstallPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler);

    navigator.serviceWorker?.getRegistration().then((reg) => {
      setSwStatus(reg?.active ? "active" : "inactive");
    }).catch(() => setSwStatus("inactive"));

    if (window.matchMedia("(display-mode: standalone)").matches) {
      setInstallState("done");
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    setInstallState("installing");
    try {
      installPrompt.prompt();
      const result = await installPrompt.userChoice;
      if (result.outcome === "accepted") { setInstallState("done"); setInstallPrompt(null); }
      else { setInstallState("idle"); }
    } catch { setInstallState("idle"); }
  }

  function copyEnvVar(name: string) {
    navigator.clipboard.writeText(name);
    setCopiedEnvVar(name);
    setTimeout(() => setCopiedEnvVar(null), 2000);
  }

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
            <MonitorSmartphone className="w-4 h-4 text-primary" />
            Install App (PWA)
          </CardTitle>
          <CardDescription className="text-sm">Install Family Office as a standalone app on your device for a native-like experience with offline capability.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${swStatus === "active" ? "bg-emerald-500" : swStatus === "inactive" ? "bg-red-500" : "bg-amber-400 animate-pulse"}`} />
                  <span className="text-muted-foreground">Service Worker: <span className={swStatus === "active" ? "text-emerald-500" : "text-muted-foreground"}>{swStatus === "active" ? "Registered" : swStatus === "inactive" ? "Not active" : "Checking…"}</span></span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${installState === "done" ? "bg-emerald-500" : "bg-muted-foreground/40"}`} />
                  <span className="text-muted-foreground">Installed: <span className={installState === "done" ? "text-emerald-500" : "text-muted-foreground"}>{installState === "done" ? "Yes" : "No"}</span></span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                {installState === "done"
                  ? "App is installed and running in standalone mode. You can access it from your home screen."
                  : installPrompt
                  ? "Your browser supports installation. Click Install to add Family Office to your device."
                  : "To install: use your browser's menu → 'Add to Home Screen' or 'Install App'. Supported in Chrome, Edge, and Safari 16.4+."}
              </p>
            </div>
            <div className="flex-shrink-0">
              {installState === "done" ? (
                <div className="flex items-center gap-2 text-emerald-500 text-sm font-medium">
                  <CheckCircle2 className="w-4 h-4" /> Installed
                </div>
              ) : (
                <Button
                  onClick={handleInstall}
                  disabled={!installPrompt || installState === "installing"}
                  className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  {installState === "installing" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Smartphone className="w-4 h-4" />}
                  {installState === "installing" ? "Installing…" : "Install App"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <Palette className="w-4 h-4 text-primary" />
                UI Theme &amp; Appearance
              </CardTitle>
              <CardDescription className="text-sm mt-1">Customise colors, fonts, and text scale. Changes apply instantly.</CardDescription>
            </div>
            <Button onClick={() => { resetTheme(); setFontImportInput(""); }} variant="outline" size="sm" className="gap-1.5 border-border text-muted-foreground hover:text-foreground text-xs flex-shrink-0">
              <RotateCcw className="w-3 h-3" /> Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Preset themes */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Color Presets</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Dark Gold", primaryHsl: "43 65% 52%", backgroundHsl: "220 16% 7%", cardHsl: "220 18% 10%" },
                { label: "Dark Navy", primaryHsl: "213 80% 55%", backgroundHsl: "222 28% 7%", cardHsl: "222 28% 10%" },
                { label: "Dark Teal", primaryHsl: "174 60% 45%", backgroundHsl: "192 20% 7%", cardHsl: "192 20% 10%" },
                { label: "Deep Violet", primaryHsl: "262 70% 60%", backgroundHsl: "260 18% 7%", cardHsl: "260 18% 10%" },
                { label: "Rose Gold", primaryHsl: "340 55% 60%", backgroundHsl: "340 12% 8%", cardHsl: "340 12% 11%" },
                { label: "Emerald", primaryHsl: "158 60% 48%", backgroundHsl: "168 16% 7%", cardHsl: "168 16% 10%" },
              ].map((preset) => {
                const active = theme.primaryHsl === preset.primaryHsl && theme.backgroundHsl === preset.backgroundHsl;
                return (
                  <button key={preset.label}
                    onClick={() => updateTheme({ primaryHsl: preset.primaryHsl, backgroundHsl: preset.backgroundHsl, cardHsl: preset.cardHsl })}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all ${active ? "border-primary bg-primary/10 text-foreground font-medium" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>
                    <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: `hsl(${preset.primaryHsl})` }} />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Custom colors */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Custom Colors</p>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Accent / Primary", hsl: theme.primaryHsl, key: "primaryHsl" as const },
                { label: "Background", hsl: theme.backgroundHsl, key: "backgroundHsl" as const },
                { label: "Card Surface", hsl: theme.cardHsl, key: "cardHsl" as const },
              ].map((c) => (
                <div key={c.key} className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">{c.label}</p>
                  <div className="flex items-center gap-2">
                    <input type="color" value={hslToHex(c.hsl)}
                      onChange={(e) => updateTheme({ [c.key]: hexToHsl(e.target.value) })}
                      className="w-9 h-8 rounded cursor-pointer border border-border bg-transparent p-0.5" />
                    <code className="text-[10px] text-muted-foreground/70 font-mono">{hslToHex(c.hsl)}</code>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Text scale */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              <Type className="inline w-3.5 h-3.5 mr-1.5 -mt-0.5" />Text Scale — <span className="text-foreground">{Math.round(theme.textScale * 100)}%</span>
            </p>
            <div className="flex gap-2 flex-wrap">
              {[0.85, 0.90, 1.0, 1.05, 1.10, 1.15].map((scale) => (
                <button key={scale} onClick={() => updateTheme({ textScale: scale })}
                  className={`px-3 py-1 rounded-md border text-xs transition-all ${theme.textScale === scale ? "bg-primary text-primary-foreground border-primary" : "border-border text-muted-foreground bg-muted/20 hover:border-primary/40 hover:text-foreground"}`}>
                  {Math.round(scale * 100)}%
                </button>
              ))}
            </div>
          </div>

          {/* Body font */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Body Font</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Inter", family: "Inter, sans-serif", url: "" },
                { label: "DM Sans", family: "'DM Sans', sans-serif", url: "https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&display=swap" },
                { label: "Outfit", family: "'Outfit', sans-serif", url: "https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600&display=swap" },
                { label: "Source Sans 3", family: "'Source Sans 3', sans-serif", url: "https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600&display=swap" },
              ].map((f) => {
                const active = theme.fontBody === f.family;
                return (
                  <button key={f.label} onClick={() => {
                    updateTheme({ fontBody: f.family, fontImportUrl: f.url || theme.fontImportUrl });
                    if (f.url) setFontImportInput(f.url);
                  }}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${active ? "border-primary bg-primary/10 text-foreground font-medium" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                    style={{ fontFamily: f.family }}>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Heading font */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Heading / Serif Font</p>
            <div className="flex flex-wrap gap-2">
              {[
                { label: "Georgia", family: "Georgia, serif", url: "" },
                { label: "Playfair Display", family: "'Playfair Display', serif", url: "https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" },
                { label: "Lora", family: "'Lora', serif", url: "https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,700;1,400&display=swap" },
                { label: "DM Serif Display", family: "'DM Serif Display', serif", url: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&display=swap" },
                { label: "EB Garamond", family: "'EB Garamond', serif", url: "https://fonts.googleapis.com/css2?family=EB+Garamond:ital,wght@0,400;0,600;1,400&display=swap" },
              ].map((f) => {
                const active = theme.fontHeading === f.family;
                return (
                  <button key={f.label} onClick={() => {
                    updateTheme({ fontHeading: f.family, fontImportUrl: f.url || theme.fontImportUrl });
                    if (f.url) setFontImportInput(f.url);
                  }}
                    className={`px-3 py-1.5 rounded-lg border text-xs transition-all ${active ? "border-primary bg-primary/10 text-foreground font-medium" : "border-border bg-muted/20 text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}
                    style={{ fontFamily: f.family }}>
                    {f.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Google Fonts URL import */}
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Google Fonts / Custom URL Import</p>
            <div className="flex gap-2">
              <input value={fontImportInput} onChange={(e) => setFontImportInput(e.target.value)}
                placeholder="https://fonts.googleapis.com/css2?family=…&display=swap"
                className="flex-1 h-8 bg-muted/30 border border-border rounded-md px-3 text-xs text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary font-mono" />
              <Button onClick={() => updateTheme({ fontImportUrl: fontImportInput })} size="sm" variant="outline" className="text-xs border-border h-8">Apply</Button>
            </div>
            <p className="text-[10px] text-muted-foreground/60 mt-1.5">Paste any Google Fonts embed URL. The stylesheet is loaded immediately.</p>
          </div>

          {/* Live preview */}
          <div className="p-4 rounded-xl border border-border bg-muted/10 space-y-1">
            <p className="text-xs text-muted-foreground uppercase tracking-wider mb-2">Preview</p>
            <p className="font-serif text-xl text-foreground" style={{ fontFamily: theme.fontHeading }}>Family Office Wealth OS</p>
            <p className="text-sm text-muted-foreground" style={{ fontFamily: theme.fontBody }}>Total portfolio value and strategic asset overview</p>
            <p className="font-mono text-primary text-base">$12,450,000</p>
          </div>
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
            <Wrench className="w-4 h-4 text-primary" />
            Tools &amp; Integrations
          </CardTitle>
          <CardDescription className="text-sm">Configure external services and AI tools. All credentials are stored as environment secrets — never in the database.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!toolsStatus ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Checking tool status…</div>
          ) : (
            <>
              {/* Web Search */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Search className="w-3 h-3" /> Web Search</p>
                <div className="space-y-2">
                  {[
                    { key: "duckduckgo", tool: toolsStatus.webSearch?.duckduckgo, icon: Globe },
                    { key: "brave",      tool: toolsStatus.webSearch?.brave,      icon: Search },
                  ].map(({ key, tool, icon: Icon }) => tool && (
                    <div key={key} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${tool.available ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/40 border border-border"}`}>
                          <Icon className={`w-3.5 h-3.5 ${tool.available ? "text-emerald-400" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{tool.label}</p>
                          <p className="text-xs text-muted-foreground">{tool.note}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {tool.available
                          ? <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">ACTIVE</span>
                          : tool.keyRequired && tool.envVar && (
                            <button onClick={() => copyEnvVar(tool.envVar)}
                              className="flex items-center gap-1 text-[10px] font-mono bg-muted/40 text-muted-foreground px-2 py-1 rounded border border-border hover:border-primary/40 hover:text-foreground transition-colors">
                              {copiedEnvVar === tool.envVar ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Key className="w-3 h-3" />}
                              {copiedEnvVar === tool.envVar ? "Copied!" : tool.envVar}
                            </button>
                          )
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* GitHub */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Github className="w-3 h-3" /> GitHub</p>
                {toolsStatus.github && (
                  <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-md flex items-center justify-center ${toolsStatus.github.available ? "bg-emerald-500/10 border border-emerald-500/20" : "bg-muted/40 border border-border"}`}>
                        <Github className={`w-3.5 h-3.5 ${toolsStatus.github.available ? "text-emerald-400" : "text-muted-foreground"}`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">GitHub API</p>
                        <p className="text-xs text-muted-foreground">{toolsStatus.github.note}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {toolsStatus.github.available
                        ? <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20">TOKEN SET</span>
                        : (
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground/60">Public repos: 60 req/hr without token</span>
                            <button onClick={() => copyEnvVar("GITHUB_TOKEN")}
                              className="flex items-center gap-1 text-[10px] font-mono bg-muted/40 text-muted-foreground px-2 py-1 rounded border border-border hover:border-primary/40 hover:text-foreground transition-colors">
                              {copiedEnvVar === "GITHUB_TOKEN" ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Key className="w-3 h-3" />}
                              {copiedEnvVar === "GITHUB_TOKEN" ? "Copied!" : "GITHUB_TOKEN"}
                            </button>
                          </div>
                        )
                      }
                    </div>
                  </div>
                )}
              </div>

              {/* AI Models */}
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5"><Sparkles className="w-3 h-3" /> AI Models</p>
                <div className="space-y-2">
                  {[
                    { tool: toolsStatus.cloudAI, icon: Cloud, detail: toolsStatus.cloudAI?.model },
                    { tool: toolsStatus.localAI,  icon: Cpu,   detail: toolsStatus.localAI?.model, online: toolsStatus.localAI?.online },
                  ].map(({ tool, icon: Icon, detail, online }, i) => tool && (
                    <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/10">
                      <div className="flex items-center gap-3">
                        <div className={`w-7 h-7 rounded-md flex items-center justify-center ${tool.available && online !== false ? "bg-emerald-500/10 border border-emerald-500/20" : tool.available ? "bg-amber-500/10 border border-amber-500/20" : "bg-muted/40 border border-border"}`}>
                          <Icon className={`w-3.5 h-3.5 ${tool.available && online !== false ? "text-emerald-400" : tool.available ? "text-amber-400" : "text-muted-foreground"}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-foreground">{tool.label}</p>
                          <p className="text-xs text-muted-foreground">{tool.note}{detail ? ` · ${detail}` : ""}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {tool.available
                          ? online === false
                            ? <span className="text-[10px] font-mono bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1"><WifiOff className="w-2.5 h-2.5" /> OFFLINE</span>
                            : <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1"><Wifi className="w-2.5 h-2.5" /> READY</span>
                          : tool.keyRequired && tool.envVar
                            ? <button onClick={() => copyEnvVar(tool.envVar)}
                                className="flex items-center gap-1 text-[10px] font-mono bg-muted/40 text-muted-foreground px-2 py-1 rounded border border-border hover:border-primary/40 hover:text-foreground transition-colors">
                                {copiedEnvVar === tool.envVar ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <Key className="w-3 h-3" />}
                                {copiedEnvVar === tool.envVar ? "Copied!" : tool.envVar}
                              </button>
                            : <span className="text-[10px] text-muted-foreground/50">Not configured</span>
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-1 border-t border-border">
                <p className="text-xs text-muted-foreground/60 flex items-start gap-1.5">
                  <Key className="w-3 h-3 mt-0.5 shrink-0" />
                  To add a secret: open the <strong className="text-muted-foreground">Replit Secrets</strong> panel (lock icon in the sidebar), add the environment variable name shown above, and restart the API server. Keys are never stored in the database.
                </p>
              </div>
            </>
          )}
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
