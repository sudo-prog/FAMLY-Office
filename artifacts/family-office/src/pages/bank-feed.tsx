import React, { useState, useCallback } from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Clock,
  Download, Trash2, RefreshCw, Loader2, ArrowLeft, Settings,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export default function BankFeedSettings() {
  const [csvText, setCsvText] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [lastResult, setLastResult] = useState<ImportResult | null>(null);
  const queryClient = useQueryClient();

  const { data: importedTx, isLoading: loadingImported } = useQuery({
    queryKey: ["bank-feed-imported"],
    queryFn: async () => {
      const res = await fetch("/api/bank-feed/imported");
      if (!res.ok) return [];
      return res.json();
    },
  });

  const importMutation = useMutation({
    mutationFn: async (csv: string) => {
      const res = await fetch("/api/bank-feed/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv }),
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json() as Promise<ImportResult>;
    },
    onSuccess: (result) => {
      setLastResult(result);
      queryClient.invalidateQueries({ queryKey: ["bank-feed-imported"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });

  const handleFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setCsvText(text);
    };
    reader.readAsText(file);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith(".csv") || file.type === "text/csv")) {
      handleFile(file);
    }
  }, [handleFile]);

  const handleImport = () => {
    if (csvText.trim()) {
      importMutation.mutate(csvText);
    }
  };

  const downloadSample = () => {
    const sample = `date,description,amount,type,notes
2025-06-01,Salary Deposit,5000.00,income,Monthly salary
2025-06-02,Rent Payment,-1800.00,expense,Monthly rent
2025-06-03,Grocery Store,-125.50,expense,Weekly groceries
2025-06-05,Electricity Bill,-89.00,expense,Monthly utility`;
    const blob = new Blob([sample], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bank-feed-sample.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-serif font-bold">Bank Feed CSV Auto-Sync</h1>
          <p className="text-muted-foreground">Import bank statements via CSV</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Upload className="w-5 h-5 text-primary" />
              </div>
              <div>
                <div className="text-2xl font-bold">{lastResult?.imported ?? 0}</div>
                <div className="text-xs text-muted-foreground">Last Import</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{lastResult?.skipped ?? 0}</div>
                <div className="text-xs text-muted-foreground">Skipped</div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <AlertCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <div className="text-2xl font-bold">{lastResult?.errors?.length ?? 0}</div>
                <div className="text-xs text-muted-foreground">Errors</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5" />
            CSV Drop Zone
          </CardTitle>
          <CardDescription>Drop a CSV file or paste CSV content below</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border"
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <Upload className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop a CSV file here, or click to browse
            </p>
            <Input
              type="file"
              accept=".csv"
              className="max-w-xs mx-auto"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="csv-input">Or paste CSV content:</Label>
            <textarea
              id="csv-input"
              className="w-full h-40 font-mono text-sm rounded-md border border-input bg-transparent p-3"
              placeholder="date,description,amount,type,notes&#10;2025-06-01,Salary,5000,income,..."
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
            />
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleImport}
              disabled={!csvText.trim() || importMutation.isPending}
            >
              {importMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Import Transactions
            </Button>
            <Button variant="outline" onClick={downloadSample}>
              <Download className="w-4 h-4" />
              Download Sample CSV
            </Button>
          </div>

          {lastResult && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                <span className="font-medium">Import Complete</span>
              </div>
              <Progress value={lastResult.imported / (lastResult.imported + lastResult.skipped + lastResult.errors.length) * 100} />
              <div className="text-sm text-muted-foreground">
                {lastResult.imported} imported, {lastResult.skipped} skipped, {lastResult.errors.length} errors
              </div>
              {lastResult.errors.length > 0 && (
                <div className="mt-2 text-xs text-red-400 space-y-1">
                  {lastResult.errors.slice(0, 5).map((err, i) => (
                    <div key={i}>{err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Recently Imported</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingImported ? (
            <div className="text-center py-4 text-muted-foreground">Loading...</div>
          ) : importedTx?.length ? (
            <div className="space-y-2">
              {importedTx.slice(0, 10).map((tx: any) => (
                <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                  <div>
                    <div className="font-medium text-sm">{tx.description}</div>
                    <div className="text-xs text-muted-foreground">{tx.date} · {tx.category}</div>
                  </div>
                  <div className="text-right">
                    <div className={`font-mono text-sm ${tx.type === "income" ? "text-green-400" : "text-red-400"}`}>
                      {tx.type === "income" ? "+" : "-"}${Number(tx.amount).toLocaleString()}
                    </div>
                    <Badge variant="outline" className="text-xs">imported</Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No imported transactions yet
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
