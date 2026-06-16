import React from "react";
import { useListEntities } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function Entities() {
  const { data: entities, isLoading } = useListEntities();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif text-foreground">Entities</h1>
        <Skeleton className="h-[600px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Legal Entities</h1>
          <p className="text-muted-foreground">Corporate structures and trusts.</p>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow className="border-border hover:bg-transparent">
                <TableHead className="font-medium text-muted-foreground">Name</TableHead>
                <TableHead className="font-medium text-muted-foreground">Type</TableHead>
                <TableHead className="font-medium text-muted-foreground">Jurisdiction</TableHead>
                <TableHead className="font-medium text-muted-foreground">ABN / ACN</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {entities?.map((entity) => (
                <TableRow key={entity.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-medium">{entity.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border rounded-sm capitalize text-xs">
                      {entity.type.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{entity.jurisdiction || '—'}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {entity.abn ? `ABN: ${entity.abn}` : entity.acn ? `ACN: ${entity.acn}` : '—'}
                  </TableCell>
                </TableRow>
              ))}
              {entities?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No entities found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
