import React, { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Target, TrendingUp, Calendar, DollarSign, Plus, Trash2,
  CheckCircle2, ArrowRight, Sparkles,
} from "lucide-react";
import { useListAssets, useGetDashboardSummary } from "@workspace/api-client-react";

interface NetWorthTarget {
  id: string;
  name: string;
  targetAmount: number;
  targetDate: string;
  currentAmount: number;
  createdAt: string;
}

const STORAGE_KEY = "fo-networth-targets";

function loadTargets(): NetWorthTarget[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch { return []; }
}

function saveTargets(targets: NetWorthTarget[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(targets));
}

function fmt(v: number) {
  if (v >= 1_000_000) return `$${(v / 1_000_000).toFixed(2)}M`;
  if (v >= 1_000) return `$${(v / 1_000).toFixed(0)}k`;
  return `$${v.toFixed(0)}`;
}

function daysUntil(dateStr: string) {
  const now = new Date();
  const target = new Date(dateStr);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function requiredMonthlySavings(target: NetWorthTarget): number {
  const days = daysUntil(target.targetDate);
  if (days <= 0) return 0;
  const remaining = target.targetAmount - target.currentAmount;
  if (remaining <= 0) return 0;
  return remaining / (days / 30.44);
}

export default function NetWorthTargets() {
  const { data: assets, isLoading } = useListAssets();
  const { data: summary } = useGetDashboardSummary();
  const [targets, setTargets] = useState<NetWorthTarget[]>(loadTargets);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", targetAmount: "", targetDate: "", currentAmount: "" });

  const totalNetWorth = useMemo(() => {
    if (summary) return (summary as any).totalNetWorth || (summary as any).netWorth || 0;
    if (assets) return assets.reduce((s, a) => s + Number(a.value), 0);
    return 0;
  }, [summary, assets]);

  const handleAdd = () => {
    if (!form.name || !form.targetAmount || !form.targetDate) return;
    const newTarget: NetWorthTarget = {
      id: Date.now().toString(),
      name: form.name,
      targetAmount: Number(form.targetAmount),
      targetDate: form.targetDate,
      currentAmount: Number(form.currentAmount) || totalNetWorth,
      createdAt: new Date().toISOString(),
    };
    const updated = [...targets, newTarget];
    setTargets(updated);
    saveTargets(updated);
    setForm({ name: "", targetAmount: "", targetDate: "", currentAmount: "" });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    const updated = targets.filter((t) => t.id !== id);
    setTargets(updated);
    saveTargets(updated);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-[400px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif font-bold text-foreground">Net Worth Targets</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Set financial goals, track progress, and calculate required savings rates
          </p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          New Target
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              Current Net Worth
            </div>
            <p className="text-2xl font-bold text-foreground">{fmt(totalNetWorth)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Target className="h-4 w-4 text-blue-500" />
              Active Targets
            </div>
            <p className="text-2xl font-bold text-foreground">{targets.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <TrendingUp className="h-4 w-4 text-purple-500" />
              Avg Progress
            </div>
            <p className="text-2xl font-bold text-foreground">
              {targets.length > 0
                ? `${Math.round(targets.reduce((s, t) => s + Math.min(100, (t.currentAmount / t.targetAmount) * 100), 0) / targets.length)}%`
                : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Target</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="target-name">Target Name</Label>
                <Input id="target-name" placeholder="e.g. $1M Net Worth" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="target-amount">Target Amount ($)</Label>
                <Input id="target-amount" type="number" placeholder="1000000" value={form.targetAmount} onChange={(e) => setForm({ ...form, targetAmount: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="target-date">Target Date</Label>
                <Input id="target-date" type="date" value={form.targetDate} onChange={(e) => setForm({ ...form, targetDate: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="current-amount">Current Amount ($)</Label>
                <Input id="current-amount" type="number" placeholder={String(Math.round(totalNetWorth))} value={form.currentAmount} onChange={(e) => setForm({ ...form, currentAmount: e.target.value })} className="mt-1" />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAdd}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Create Target
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {targets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">No targets set yet. Create your first net worth target to start tracking progress.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {targets.map((target) => {
            const progress = Math.min(100, (target.currentAmount / target.targetAmount) * 100);
            const days = daysUntil(target.targetDate);
            const monthlySavings = requiredMonthlySavings(target);
            const isComplete = progress >= 100;
            const isOverdue = days < 0 && !isComplete;

            return (
              <Card key={target.id} className={isComplete ? "border-green-500/50" : isOverdue ? "border-red-500/50" : ""}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{target.name}</CardTitle>
                      <CardDescription className="flex items-center gap-1 mt-1">
                        <Calendar className="h-3 w-3" />
                        {isOverdue ? "Overdue" : `${days} days remaining`} · Target: {new Date(target.targetDate).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-1">
                      {isComplete && <Badge className="bg-green-500">Achieved</Badge>}
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(target.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{fmt(target.currentAmount)}</span>
                      <span className="font-medium">{fmt(target.targetAmount)}</span>
                    </div>
                    <Progress value={progress} className="h-3" />
                    <div className="flex justify-between text-xs text-muted-foreground mt-1">
                      <span>{progress.toFixed(1)}% complete</span>
                      <span>Remaining: {fmt(Math.max(0, target.targetAmount - target.currentAmount))}</span>
                    </div>
                  </div>

                  {!isComplete && (
                    <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Required Monthly Savings</span>
                        <span className="font-bold text-foreground">{fmt(monthlySavings)}/mo</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Savings Rate Needed</span>
                        <span className="font-medium text-foreground">
                          {totalNetWorth > 0 ? `${((monthlySavings / (totalNetWorth / 12)) * 100).toFixed(0)}%` : "—"} of income
                        </span>
                      </div>
                    </div>
                  )}

                  {isComplete && (
                    <div className="bg-green-500/10 rounded-lg p-3 flex items-center gap-2 text-green-500">
                      <Sparkles className="h-4 w-4" />
                      <span className="text-sm font-medium">Congratulations! Target achieved.</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
