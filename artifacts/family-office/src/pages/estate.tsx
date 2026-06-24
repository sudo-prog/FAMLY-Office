import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Users, Shield, Calendar, AlertCircle, CheckCircle2, Clock, Scale } from "lucide-react";

const WILLS = [
  { id: 1, name: "Primary Will - John Smith", status: "Active", lastUpdated: "2024-03-15", executor: "Sarah Smith", beneficiaries: 4, assets: "All tangible & digital" },
  { id: 2, name: "Trust Will - Family Trust", status: "Active", lastUpdated: "2024-01-22", executor: "Legal Firm XYZ", beneficiaries: 6, assets: "Trust property only" },
  { id: 3, name: "Digital Assets Will", status: "Draft", lastUpdated: "2024-06-01", executor: "Michael Chen", beneficiaries: 3, assets: "Crypto, NFTs, accounts" },
];

const BENEFICIARIES = [
  { name: "Sarah Smith", relationship: "Spouse", share: 45, status: "Verified", lastContact: "2024-06-10", documents: 4 },
  { name: "James Smith", relationship: "Son", share: 20, status: "Verified", lastContact: "2024-05-28", documents: 3 },
  { name: "Emily Smith", relationship: "Daughter", share: 20, status: "Verified", lastContact: "2024-06-05", documents: 3 },
  { name: "Family Trust", relationship: "Trust", share: 10, status: "Active", lastContact: "2024-04-15", documents: 5 },
  { name: "Charity Foundation", relationship: "Charity", share: 5, status: "Pending", lastContact: "2024-03-20", documents: 2 },
];

const TASKS = [
  { id: 1, title: "Review trust beneficiaries", dueDate: "2024-07-15", priority: "High", status: "Pending" },
  { id: 2, title: "Update digital asset inventory", dueDate: "2024-07-01", priority: "Medium", status: "In Progress" },
  { id: 3, title: "Annual estate attorney review", dueDate: "2024-08-01", priority: "Low", status: "Scheduled" },
  { id: 4, title: "Notarize amended documents", dueDate: "2024-06-30", priority: "High", status: "Completed" },
];

export default function Estate() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Estate Planning</h1>
          <p className="text-sm text-muted-foreground mt-1">Will register, beneficiary tracker & document management</p>
        </div>
        <Button variant="outline" size="sm" className="gap-1">
          <FileText className="w-3.5 h-3.5" /> New Document
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <FileText className="w-3.5 h-3.5" /> Active Wills
            </div>
            <p className="text-2xl font-bold">{WILLS.filter(w => w.status === "Active").length}</p>
            <p className="text-xs text-muted-foreground mt-1">{WILLS.length} total documents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Users className="w-3.5 h-3.5" /> Beneficiaries
            </div>
            <p className="text-2xl font-bold">{BENEFICIARIES.length}</p>
            <p className="text-xs text-green-500 mt-1">{BENEFICIARIES.filter(b => b.status === "Verified").length} verified</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Shield className="w-3.5 h-3.5" /> Documents
            </div>
            <p className="text-2xl font-bold">{BENEFICIARIES.reduce((s, b) => s + b.documents, 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">Across all beneficiaries</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
              <Calendar className="w-3.5 h-3.5" /> Pending Tasks
            </div>
            <p className="text-2xl font-bold">{TASKS.filter(t => t.status !== "Completed").length}</p>
            <p className="text-xs text-amber-500 mt-1">{TASKS.filter(t => t.priority === "High" && t.status !== "Completed").length} high priority</p>
          </CardContent>
        </Card>
      </div>

      {/* Will Register */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" /> Will Register
          </CardTitle>
          <CardDescription>All estate planning documents and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Document</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Executor</th>
                  <th className="text-right py-2 font-medium">Beneficiaries</th>
                  <th className="text-right py-2 font-medium">Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {WILLS.map((w) => (
                  <tr key={w.id} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded bg-primary/10 flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium">{w.name}</p>
                          <p className="text-xs text-muted-foreground">{w.assets}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3">
                      <Badge variant={w.status === "Active" ? "default" : "outline"} className="text-xs">
                        {w.status}
                      </Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{w.executor}</td>
                    <td className="text-right py-3 font-mono">{w.beneficiaries}</td>
                    <td className="text-right py-3 text-muted-foreground">{w.lastUpdated}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Beneficiary Tracker */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" /> Beneficiary Tracker
          </CardTitle>
          <CardDescription>Beneficiary details, share allocation & verification status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted-foreground text-xs">
                  <th className="text-left py-2 font-medium">Name</th>
                  <th className="text-left py-2 font-medium">Relationship</th>
                  <th className="text-right py-2 font-medium">Share</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-right py-2 font-medium">Documents</th>
                  <th className="text-right py-2 font-medium">Last Contact</th>
                </tr>
              </thead>
              <tbody>
                {BENEFICIARIES.map((b) => (
                  <tr key={b.name} className="border-b border-border/50 hover:bg-muted/30">
                    <td className="py-3 font-medium">{b.name}</td>
                    <td className="py-3">
                      <Badge variant="outline" className="text-xs">{b.relationship}</Badge>
                    </td>
                    <td className="text-right py-3 font-mono font-semibold">{b.share}%</td>
                    <td className="py-3">
                      <span className={`flex items-center gap-1 text-xs ${
                        b.status === "Verified" ? "text-green-500" :
                        b.status === "Active" ? "text-blue-500" : "text-amber-500"
                      }`}>
                        {b.status === "Verified" ? <CheckCircle2 className="w-3 h-3" /> :
                         b.status === "Active" ? <CheckCircle2 className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {b.status}
                      </span>
                    </td>
                    <td className="text-right py-3 font-mono">{b.documents}</td>
                    <td className="text-right py-3 text-muted-foreground">{b.lastContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Tasks & Action Items */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" /> Tasks & Action Items
          </CardTitle>
          <CardDescription>Upcoming estate planning tasks and deadlines</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {TASKS.map((t) => (
              <div key={t.id} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/20">
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    t.status === "Completed" ? "bg-green-500" :
                    t.status === "In Progress" ? "bg-blue-500" : "bg-amber-500"
                  }`} />
                  <div>
                    <p className="font-medium text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground">Due: {t.dueDate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={
                    t.priority === "High" ? "destructive" :
                    t.priority === "Medium" ? "default" : "secondary"
                  } className="text-xs">{t.priority}</Badge>
                  <Badge variant="outline" className="text-xs">{t.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
