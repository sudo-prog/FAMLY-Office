import React, { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Upload, Trash2, RefreshCw, CheckCircle2, Clock, AlertCircle, Loader2, FileSearch, Download } from "lucide-react";

interface OcrJob {
  id: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  extractedText: string;
  confidence: number;
  createdAt: string;
  completedAt?: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3001/api";

export default function OcrPage() {
  const [jobs, setJobs] = useState<OcrJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/ocr`);
      if (res.ok) {
        const data = await res.json();
        setJobs(data);
      }
    } catch {
      // Use mock data when API is unavailable
      setJobs([
        {
          id: "mock-1",
          fileName: "invoice_q4_2024.pdf",
          status: "completed",
          extractedText: "Invoice #INV-2024-001\nDate: 2024-12-15\nAmount: $12,450.00\nVendor: Acme Corp\nDue Date: 2025-01-15",
          confidence: 0.96,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
          completedAt: new Date(Date.now() - 3500000).toISOString(),
        },
        {
          id: "mock-2",
          fileName: "bank_statement_nov.png",
          status: "completed",
          extractedText: "Bank Statement - November 2024\nAccount: ****4589\nOpening Balance: $245,000.00\nClosing Balance: $267,890.45\nTransactions: 42",
          confidence: 0.91,
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          completedAt: new Date(Date.now() - 86000000).toISOString(),
        },
      ]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [fetchJobs]);

  const handleUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    try {
      const res = await fetch(`${API_BASE}/ocr`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fileName: selectedFile.name,
          fileType: selectedFile.type,
        }),
      });

      if (res.ok) {
        setSelectedFile(null);
        fetchJobs();
      }
    } catch {
      // Mock: add a job locally
      const newJob: OcrJob = {
        id: `local-${Date.now()}`,
        fileName: selectedFile.name,
        status: "processing",
        extractedText: "",
        confidence: 0,
        createdAt: new Date().toISOString(),
      };
      setJobs((prev) => [newJob, ...prev]);
      setSelectedFile(null);

      // Simulate completion
      setTimeout(() => {
        setJobs((prev) =>
          prev.map((j) =>
            j.id === newJob.id
              ? {
                  ...j,
                  status: "completed",
                  extractedText: `Mock OCR result for ${selectedFile.name}\n\nThis document has been processed with mock OCR.\nConfidence: ${(85 + Math.random() * 12).toFixed(1)}%`,
                  confidence: 0.85 + Math.random() * 0.12,
                  completedAt: new Date().toISOString(),
                }
              : j
          )
        );
      }, 2000);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`${API_BASE}/ocr/${id}`, { method: "DELETE" });
    } catch { /* ignore */ }
    setJobs((prev) => prev.filter((j) => j.id !== id));
  };

  const handleReprocess = async (id: string) => {
    try {
      await fetch(`${API_BASE}/ocr/${id}/reprocess`, { method: "POST" });
    } catch { /* ignore */ }
    setJobs((prev) =>
      prev.map((j) =>
        j.id === id ? { ...j, status: "processing", extractedText: "", confidence: 0 } : j
      )
    );
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) setSelectedFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const statusIcon = (status: string) => {
    switch (status) {
      case "completed": return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
      case "processing": return <Loader2 className="w-4 h-4 animate-spin text-blue-500" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed": return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return null;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
      case "processing": return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "pending": return "bg-yellow-500/10 text-yellow-500 border-yellow-500/20";
      case "failed": return "bg-red-500/10 text-red-500 border-red-500/20";
      default: return "";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Document OCR</h1>
        <p className="text-muted-foreground mt-1">Extract text from documents using optical character recognition</p>
      </div>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Document
          </CardTitle>
          <CardDescription>Upload PDFs, images, or scanned documents for text extraction</CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragOver ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"
            }`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <FileSearch className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground mb-4">
              Drag & drop a file here, or select below
            </p>
            <div className="flex items-center gap-3 justify-center">
              <Label htmlFor="ocr-file" className="cursor-pointer">
                <Input
                  id="ocr-file"
                  type="file"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg,.tiff,.bmp,.webp"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                />
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 transition-colors text-sm">
                  <Upload className="w-4 h-4" />
                  Choose File
                </div>
              </Label>
              {selectedFile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-foreground">{selectedFile.name}</span>
                  <Button onClick={handleUpload} disabled={uploading} size="sm">
                    {uploading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    {uploading ? "Processing..." : "Process OCR"}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* OCR Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Processing History
          </CardTitle>
          <CardDescription>{jobs.length} document{jobs.length !== 1 ? "s" : ""} processed</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSearch className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No documents processed yet</p>
              <p className="text-sm">Upload a document to get started</p>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {statusIcon(job.status)}
                      <div>
                        <p className="font-medium text-sm">{job.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(job.createdAt).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={statusColor(job.status)}>
                        {job.status}
                      </Badge>
                      {job.confidence > 0 && (
                        <Badge variant="outline" className="text-xs">
                          {(job.confidence * 100).toFixed(0)}%
                        </Badge>
                      )}
                    </div>
                  </div>

                  {job.status === "processing" && (
                    <Progress value={65} className="h-1.5 mb-3" />
                  )}

                  {job.extractedText && (
                    <div className="bg-muted/50 rounded-md p-3 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium text-muted-foreground">Extracted Text</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 text-xs"
                          onClick={() => navigator.clipboard.writeText(job.extractedText)}
                        >
                          <Download className="w-3 h-3 mr-1" />
                          Copy
                        </Button>
                      </div>
                      <pre className="text-xs text-foreground whitespace-pre-wrap font-mono leading-relaxed">
                        {job.extractedText}
                      </pre>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => handleReprocess(job.id)} disabled={job.status === "processing"}>
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Reprocess
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(job.id)}>
                      <Trash2 className="w-3 h-3 mr-1" />
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
