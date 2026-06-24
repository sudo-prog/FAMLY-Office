import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Shield, Filter, ChevronLeft, ChevronRight, Eye,
} from "lucide-react";

interface AuditLog {
  id: number;
  userId: number | null;
  action: string;
  entityType: string;
  entityId: number | null;
  oldValues: unknown;
  newValues: unknown;
  timestamp: string;
}

async function fetchAuditLogs(params: { action?: string; entityType?: string; limit?: number; offset?: number }): Promise<AuditLog[]> {
  const q = new URLSearchParams();
  if (params.action) q.set("action", params.action);
  if (params.entityType) q.set("entityType", params.entityType);
  q.set("limit", String(params.limit ?? 50));
  q.set("offset", String(params.offset ?? 0));
  const res = await fetch(`/api/audit-logs?${q}`);
  if (!res.ok) throw new Error("Failed to fetch");
  return res.json();
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
  UPDATE: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  DELETE: "text-red-400 bg-red-500/10 border-red-500/30",
};

export default function AuditLogPage() {
  const [action, setAction] = useState<string>("");
  const [entityType, setEntityType] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const limit = 50;

  const { data: logs, isLoading } = useQuery({
    queryKey: ["audit-logs", action, entityType, offset],
    queryFn: () => fetchAuditLogs({ action: action || undefined, entityType: entityType || undefined, limit, offset }),
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="w-6 h-6 text-primary" />
            Audit Log
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Immutable record of all system mutations</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="w-4 h-4" /> Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Action:</span>
              <Select value={action} onValueChange={(v) => { setAction(v); setOffset(0); }}>
                <SelectTrigger className="w-32"><SelectValue placeholder="All" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">All</SelectItem>
                  <SelectItem value="CREATE">CREATE</SelectItem>
                  <SelectItem value="UPDATE">UPDATE</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Entity:</span>
              <Input
                placeholder="Entity type..."
                value={entityType}
                onChange={(e) => { setEntityType(e.target.value); setOffset(0); }}
                className="w-40"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="sticky top-0 bg-card z-10">
                  <TableRow>
                    <TableHead className="w-20">ID</TableHead>
                    <TableHead className="w-24">Action</TableHead>
                    <TableHead className="w-32">Entity Type</TableHead>
                    <TableHead className="w-20">Entity ID</TableHead>
                    <TableHead className="w-48">Changes</TableHead>
                    <TableHead className="w-40">Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(logs ?? []).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">#{log.id}</TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${ACTION_COLORS[log.action] ?? "text-muted-foreground border-border"}`}>
                          {log.action}
                        </span>
                      </TableCell>
                      <TableCell className="text-sm font-mono">{log.entityType}</TableCell>
                      <TableCell className="text-sm font-mono text-muted-foreground">{log.entityId ?? "—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground max-w-xs truncate">
                        {log.newValues ? JSON.stringify(log.newValues).slice(0, 80) : "—"}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                  {(logs ?? []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                        No audit log entries found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
        <div className="flex items-center justify-between p-4 border-t border-border">
          <Button variant="outline" size="sm" onClick={() => setOffset(Math.max(0, offset - limit))} disabled={offset === 0}>
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <span className="text-xs text-muted-foreground">Showing {offset + 1}–{offset + limit}</span>
          <Button variant="outline" size="sm" onClick={() => setOffset(offset + limit)} disabled={(logs ?? []).length < limit}>
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
