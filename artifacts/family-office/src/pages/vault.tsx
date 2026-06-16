import React from "react";
import { useListDocuments } from "@workspace/api-client-react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";

export default function Vault() {
  const { data: documents, isLoading } = useListDocuments();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-serif text-foreground">Document Vault</h1>
        <Skeleton className="h-[600px] w-full bg-muted/50 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-foreground mb-1">Document Vault</h1>
          <p className="text-muted-foreground">Encrypted secure storage.</p>
        </div>
      </div>

      <Card className="bg-card border-border overflow-hidden">
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
              {documents?.map((doc) => (
                <TableRow key={doc.id} className="border-border hover:bg-muted/30">
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{doc.title}</span>
                      {doc.description && <span className="text-xs text-muted-foreground mt-0.5">{doc.description}</span>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border rounded-sm capitalize text-xs">
                      {doc.fileType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">{doc.year || '—'}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {doc.encrypted && (
                        <div className="flex items-center gap-1 text-emerald-500 text-xs font-medium">
                          <Lock className="w-3 h-3" /> Encrypted
                        </div>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {documents?.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="h-32 text-center text-muted-foreground">
                    No documents found.
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
