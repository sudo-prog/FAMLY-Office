import React from "react";
import { useRoute, Link } from "wouter";
import { useGetEntity, useListAssets, useListDocuments } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Building2, User, Shield, Lock, Calculator } from "lucide-react";

const TYPE_ICONS: Record<string, React.ElementType> = {
  trust: Shield,
  company: Building2,
  individual: User,
  partnership: Building2,
};

function formatCurrency(v: number, cur = "AUD") {
  const sym: Record<string, string> = { AUD: "A$", USD: "$", EUR: "€", GBP: "£", CAD: "C$", SGD: "S$" };
  return `${sym[cur] ?? "$"}${new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(v)}`;
}

function formatCategory(cat: string) {
  return cat.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function EntityDetail() {
  const [_match, params] = useRoute("/entities/:id");
  const entityId = params?.id ? parseInt(params.id) : 0;

  const { data: entity, isLoading: loadingEntity } = useGetEntity(entityId, { query: { enabled: entityId > 0 } });
  const { data: allAssets, isLoading: loadingAssets } = useListAssets();
  const { data: allDocs, isLoading: loadingDocs } = useListDocuments();

  const assets = (allAssets ?? []).filter((a) => a.entityId === entityId);
  const docs = (allDocs ?? []).filter((d) => (d as any).entityId === entityId);
  const totalValue = assets.reduce((s, a) => s + a.value, 0);

  const isLoading = loadingEntity || loadingAssets || loadingDocs;

  if (isLoading || !entity) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-48 bg-muted/50 rounded" />
        <Skeleton className="h-32 w-full bg-muted/50 rounded-lg" />
        <Skeleton className="h-64 w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  const Icon = TYPE_ICONS[entity.type] ?? Building2;

  return (
    <div className="space-y-6 pb-8">
      <div>
        <Link href="/entities" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4 w-fit">
          <ArrowLeft className="w-4 h-4" /> Back to Entities
        </Link>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center border border-border">
            <Icon className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-serif text-foreground">{entity.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm text-xs capitalize">
                {entity.type}
              </Badge>
              {entity.jurisdiction && <span className="text-sm text-muted-foreground">{entity.jurisdiction}</span>}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Total Holdings Value</div>
            <div className="text-2xl font-mono text-primary tabular-nums">{formatCurrency(totalValue, "AUD")}</div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">ABN / ACN</div>
            <div className="font-mono text-foreground text-sm">
              {entity.abn ? `ABN: ${entity.abn}` : entity.acn ? `ACN: ${entity.acn}` : "—"}
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1">Assets Held</div>
            <div className="text-2xl font-mono text-foreground">{assets.length}</div>
          </CardContent>
        </Card>
      </div>

      {entity.notes && (
        <Card className="bg-card border-border">
          <CardContent className="pt-4">
            <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1.5">Notes</div>
            <p className="text-sm text-foreground">{entity.notes}</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-card border-border overflow-hidden">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-serif">Assets Held by {entity.name}</CardTitle>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground">Name</TableHead>
                <TableHead className="font-medium text-muted-foreground">Category</TableHead>
                <TableHead className="font-medium text-muted-foreground">Institution</TableHead>
                <TableHead className="text-right font-medium text-muted-foreground">Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assets.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-muted-foreground text-sm">
                    No assets linked to this entity.
                  </TableCell>
                </TableRow>
              ) : assets.map((a) => (
                <TableRow key={a.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-medium">{a.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm text-xs">
                      {formatCategory(a.category)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{a.institution ?? "—"}</TableCell>
                  <TableCell className="text-right font-mono text-foreground tabular-nums">
                    {formatCurrency(a.value, a.currency)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {docs.length > 0 && (
        <Card className="bg-card border-border overflow-hidden">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-serif">Documents</CardTitle>
          </CardHeader>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-medium text-muted-foreground">Title</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Type</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Year</TableHead>
                  <TableHead className="font-medium text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {docs.map((doc) => (
                  <TableRow key={doc.id} className="border-border hover:bg-muted/30">
                    <TableCell className="font-medium">{doc.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted/50 text-muted-foreground border-border rounded-sm capitalize text-xs">{doc.fileType}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{doc.year ?? "—"}</TableCell>
                    <TableCell>
                      {doc.encrypted && (
                        <div className="flex items-center gap-1.5 text-emerald-500 text-xs font-medium">
                          <Lock className="w-3 h-3" /> Encrypted
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}

      <Link href={`/entities/${entityId}/tax`}>
        <Button variant="outline" className="gap-2 border-border text-muted-foreground hover:text-foreground text-sm">
          <Calculator className="w-4 h-4" /> Tax Optimisation
        </Button>
      </Link>
    </div>
  );
}
