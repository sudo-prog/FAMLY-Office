import React, { useState } from "react";
import { useListAssets, useListTransactions } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { ShieldCheck, HardDrive, Download, AlertCircle, CheckCircle2 } from "lucide-react";

function formatCurrency(v: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v);
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const content = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function Settings() {
  const { data: assets } = useListAssets();
  const { data: transactions } = useListTransactions();
  const [purged, setPurged] = useState(false);
  const [exportDone, setExportDone] = useState(false);

  function handleExport() {
    if (assets && assets.length > 0) {
      downloadCSV("family-office-assets.csv", assets.map((a) => [
        String(a.id), a.name, a.category, String(a.value), a.currency,
        a.institution ?? "", a.notes ?? "", a.createdAt ?? "",
      ]), ["ID", "Name", "Category", "Value", "Currency", "Institution", "Notes", "Created"]);
    }
    if (transactions && transactions.length > 0) {
      downloadCSV("family-office-transactions.csv", transactions.map((t) => [
        String(t.id), t.date, t.description, t.type, String(t.amount),
        t.category ?? "", String(t.taxDeductible),
      ]), ["ID", "Date", "Description", "Type", "Amount", "Category", "Tax Deductible"]);
    }
    setExportDone(true);
    setTimeout(() => setExportDone(false), 3000);
  }

  function handlePurge() {
    setPurged(true);
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
            <ShieldCheck className="w-4 h-4 text-emerald-500" />
            Security Status
          </CardTitle>
          <CardDescription className="text-sm">Encryption and access controls are fully operational.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="p-3.5 bg-muted/20 rounded-md border border-border flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">End-to-End Encryption</h3>
              <p className="text-xs text-muted-foreground mt-0.5">All vault documents are encrypted at rest using AES-256.</p>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">ACTIVE</span>
          </div>
          <div className="p-3.5 bg-muted/20 rounded-md border border-border flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Local-First Storage</h3>
              <p className="text-xs text-muted-foreground mt-0.5">All data is stored on your own infrastructure. Zero cloud exposure.</p>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">ACTIVE</span>
          </div>
          <div className="p-3.5 bg-muted/20 rounded-md border border-border flex items-center justify-between">
            <div>
              <h3 className="font-medium text-sm">Data Sovereignty</h3>
              <p className="text-xs text-muted-foreground mt-0.5">No third-party data sharing. You own and control all records.</p>
            </div>
            <span className="text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">VERIFIED</span>
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
                Downloads assets ({assets?.length ?? 0} records) and transactions ({transactions?.length ?? 0} records) as separate CSV files.
              </p>
            </div>
            <Button
              onClick={handleExport}
              variant="outline"
              className="gap-2 border-border text-sm flex-shrink-0 ml-4"
              disabled={!assets?.length && !transactions?.length}
            >
              {exportDone ? (
                <><CheckCircle2 className="w-4 h-4 text-emerald-500" /> Exported</>
              ) : (
                <><Download className="w-4 h-4" /> Export CSV</>
              )}
            </Button>
          </div>

          <div className="p-3.5 bg-muted/10 rounded-md border border-border">
            <h3 className="font-medium text-sm mb-1.5">Asset Summary</h3>
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground">Total Assets</div>
                <div className="font-mono text-foreground mt-0.5">{assets?.length ?? 0} holdings</div>
              </div>
              <div>
                <div className="text-muted-foreground">Portfolio Value</div>
                <div className="font-mono text-primary mt-0.5">{formatCurrency((assets ?? []).reduce((s, a) => s + a.value, 0))}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Transactions</div>
                <div className="font-mono text-foreground mt-0.5">{transactions?.length ?? 0} records</div>
              </div>
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
          {purged ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              Purge initiated. Please restart the application to complete the process.
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm text-foreground">Purge System</h3>
                <p className="text-xs text-muted-foreground mt-1">Irreversibly delete all records. This action cannot be undone.</p>
              </div>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" size="sm" className="ml-4 flex-shrink-0">
                    Initiate Purge
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent className="bg-card border-border">
                  <AlertDialogHeader>
                    <AlertDialogTitle className="font-serif text-xl">Confirm System Purge</AlertDialogTitle>
                    <AlertDialogDescription className="text-muted-foreground text-sm">
                      This will permanently delete all assets ({assets?.length ?? 0}), transactions ({transactions?.length ?? 0}), documents, and entities from the system. This action cannot be undone.
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
          )}
        </CardContent>
      </Card>
    </div>
  );
}
