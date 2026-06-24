import { Router, type IRouter, Request, Response } from "express";
import { randomUUID } from "crypto";

const router: IRouter = Router();

// In-memory OCR jobs store (mock implementation)
const ocrJobs = new Map<string, {
  id: string;
  fileName: string;
  status: "pending" | "processing" | "completed" | "failed";
  extractedText: string;
  confidence: number;
  createdAt: string;
  completedAt?: string;
}>();

// Mock OCR text extraction
function mockExtractText(fileName: string): { text: string; confidence: number } {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mockTexts: Record<string, { text: string; confidence: number }> = {
    pdf: {
      text: `PDF Document Extract: ${fileName}\n\nThis is a mock OCR extraction. In production, this would use Tesseract.js or a cloud OCR service.\n\nDetected content:\n- Account Statement Q4 2024\n- Balance: $1,245,678.90\n- Transaction count: 342\n- Reference: INV-2024-${Math.floor(Math.random() * 1000)}`,
      confidence: 0.94,
    },
    png: {
      text: `Image OCR Result: ${fileName}\n\nScanned document detected.\n\nExtracted text:\n- Document type: Invoice\n- Date: ${new Date().toISOString().split("T")[0]}\n- Amount: $${(Math.random() * 10000).toFixed(2)}\n- Vendor: Sample Corp Ltd\n\n[Mock OCR - 92% confidence]`,
      confidence: 0.92,
    },
    jpg: {
      text: `Photo OCR: ${fileName}\n\nHandwriting detected (simulated).\n\nExtracted:\n- Meeting notes from ${new Date().toLocaleDateString()}\n- Action items: 3\n- Follow-up required: Yes\n\n[Mock OCR - 87% confidence]`,
      confidence: 0.87,
    },
  };

  return mockTexts[ext || ""] || {
    text: `OCR Extract: ${fileName}\n\nGeneric document text extraction.\nFile type: ${ext || "unknown"}\nProcessed at: ${new Date().toISOString()}\n\nThis is a mock implementation. Production would integrate Tesseract.js, AWS Textract, or Google Vision API.`,
    confidence: 0.85,
  };
}

// List all OCR jobs
router.get("/", (_req: Request, res: Response) => {
  const jobs = Array.from(ocrJobs.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  res.json(jobs);
});

// Get OCR job by ID
router.get("/:id", (req: Request, res: Response) => {
  const job = ocrJobs.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: "OCR job not found" });
    return;
  }
  res.json(job);
});

// Submit document for OCR processing
router.post("/", (req: Request, res: Response) => {
  const { fileName, fileType } = req.body;

  if (!fileName) {
    res.status(400).json({ error: "fileName is required" });
    return;
  }

  const id = randomUUID();
  const job = {
    id,
    fileName: fileName || "document",
    status: "processing" as const,
    extractedText: "",
    confidence: 0,
    createdAt: new Date().toISOString(),
  };

  ocrJobs.set(id, job);

  // Simulate async OCR processing
  setTimeout(() => {
    const current = ocrJobs.get(id);
    if (!current) return;

    const result = mockExtractText(fileName);
    ocrJobs.set(id, {
      ...current,
      status: "completed",
      extractedText: result.text,
      confidence: result.confidence,
      completedAt: new Date().toISOString(),
    });
  }, 1500 + Math.random() * 2000);

  res.status(202).json({ id, status: "processing", message: "Document submitted for OCR processing" });
});

// Delete OCR job
router.delete("/:id", (req: Request, res: Response) => {
  const { id } = req.params;
  if (!ocrJobs.has(id)) {
    res.status(404).json({ error: "OCR job not found" });
    return;
  }
  ocrJobs.delete(id);
  res.json({ success: true });
});

// Re-process an existing job
router.post("/:id/reprocess", (req: Request, res: Response) => {
  const job = ocrJobs.get(req.params.id);
  if (!job) {
    res.status(404).json({ error: "OCR job not found" });
    return;
  }

  // Reset and reprocess
  ocrJobs.set(req.params.id, {
    ...job,
    status: "processing",
    extractedText: "",
    confidence: 0,
  });

  setTimeout(() => {
    const current = ocrJobs.get(req.params.id);
    if (!current) return;
    const result = mockExtractText(current.fileName);
    ocrJobs.set(req.params.id, {
      ...current,
      status: "completed",
      extractedText: result.text,
      confidence: result.confidence,
      completedAt: new Date().toISOString(),
    });
  }, 1500 + Math.random() * 2000);

  res.json({ id: req.params.id, status: "processing", message: "Re-processing started" });
});

export default router;
