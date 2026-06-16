import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ShieldCheck, HardDrive, Download, AlertCircle } from "lucide-react";

export default function Settings() {
  return (
    <div className="space-y-6 pb-8 max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">System Settings</h1>
          <p className="text-muted-foreground">Configuration, security, and export controls.</p>
        </div>
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              Security Status
            </CardTitle>
            <CardDescription>Encryption and access controls are fully operational.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-md border border-border flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm">End-to-End Encryption</h3>
                <p className="text-xs text-muted-foreground mt-1">All vault documents are encrypted at rest using AES-256.</p>
              </div>
              <span className="text-xs font-mono bg-emerald-500/10 text-emerald-500 px-2 py-1 rounded">ACTIVE</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HardDrive className="w-5 h-5 text-primary" />
              Data Sovereignty
            </CardTitle>
            <CardDescription>Manage your data footprint.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-md">
              <div>
                <h3 className="font-medium text-sm">Export Complete Archive</h3>
                <p className="text-xs text-muted-foreground mt-1">Download all ledgers, documents, and system state.</p>
              </div>
              <button className="flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground text-sm font-medium rounded-md hover:bg-secondary/80 transition-colors">
                <Download className="w-4 h-4" />
                Export CSV/PDF
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg text-destructive">
              <AlertCircle className="w-5 h-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-sm text-foreground">Purge System</h3>
                <p className="text-xs text-muted-foreground mt-1">Irreversibly delete all records. This action cannot be undone.</p>
              </div>
              <button className="px-4 py-2 bg-destructive text-destructive-foreground text-sm font-medium rounded-md hover:bg-destructive/90 transition-colors">
                Initiate Purge
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
