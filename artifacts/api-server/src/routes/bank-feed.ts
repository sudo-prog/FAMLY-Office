import { Router } from "express";
import { db } from "@workspace/db";
import { transactionsTable } from "@workspace/db";
import { desc } from "drizzle-orm";
import { z } from "zod/v4";

const router = Router();

const csvRowSchema = z.object({
  date: z.string(),
  description: z.string(),
  amount: z.union([z.string(), z.number()]),
  type: z.enum(["income", "expense", "transfer"]).optional(),
  category: z.string().optional(),
  notes: z.string().optional(),
});

type CSVRow = z.infer<typeof csvRowSchema>;

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

function parseCSV(text: string): string[][] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  return lines.map((line) => {
    const cells: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === "," && !inQuotes) {
        cells.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    cells.push(current.trim());
    return cells;
  });
}

function mapRow(headers: string[], values: string[]): CSVRow | null {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => {
    const key = h.toLowerCase().replace(/[^a-z0-9]/g, "_");
    obj[key] = values[i] || "";
  });

  const date = obj["date"] || obj["transaction_date"] || obj["posted"] || obj["timestamp"] || "";
  const description = obj["description"] || obj["narration"] || obj["details"] || obj["payee"] || obj["merchant"] || "";
  const amount = obj["amount"] || obj["value"] || obj["debit"] || obj["credit"] || "";
  const type = obj["type"] || obj["transaction_type"] || "";
  const category = obj["category"] || obj["tag"] || "";
  const notes = obj["notes"] || obj["reference"] || obj["memo"] || "";

  if (!date && !description && !amount) return null;

  return csvRowSchema.parse({
    date,
    description,
    amount,
    type: type as CSVRow["type"] | undefined,
    category: category || undefined,
    notes: notes || undefined,
  });
}

function detectType(row: CSVRow): "income" | "expense" | "transfer" {
  if (row.type) return row.type;
  const amt = typeof row.amount === "string" ? parseFloat(row.amount) : row.amount;
  if (!isNaN(amt)) return amt >= 0 ? "income" : "expense";
  return "expense";
}

function detectCategory(description: string): string {
  const d = description.toLowerCase();
  if (/salary|wage|payroll|income|deposit/.test(d)) return "income";
  if (/rent|mortgage|housing/.test(d)) return "housing";
  if (/utilit|electric|gas|water|internet|phone/.test(d)) return "utilities";
  if (/grocery|supermarket|food|restaurant/.test(d)) return "food";
  if (/fuel|petrol|uber|transport/.test(d)) return "transport";
  if (/insurance/.test(d)) return "insurance";
  if (/investment|dividend|interest/.test(d)) return "investment";
  if (/medical|health|doctor|pharmacy/.test(d)) return "health";
  if (/education|school|university/.test(d)) return "education";
  if (/subscription|netflix|spotify/.test(d)) return "subscriptions";
  return "other";
}

router.post("/bank-feed/import", async (req, res) => {
  try {
    const { csv } = req.body;
    if (typeof csv !== "string") {
      return res.status(400).json({ error: "csv field required" });
    }

    const rows = parseCSV(csv);
    if (rows.length < 2) {
      return res.status(400).json({ error: "CSV must have header + at least 1 data row" });
    }

    const headers = rows[0];
    const result: ImportResult = { imported: 0, skipped: 0, errors: [] };

    for (let i = 1; i < rows.length; i++) {
      try {
        const row = mapRow(headers, rows[i]);
        if (!row) {
          result.skipped++;
          continue;
        }

        const amt = typeof row.amount === "string" ? parseFloat(row.amount) : row.amount;
        if (isNaN(amt)) {
          result.errors.push(`Row ${i}: invalid amount`);
          result.skipped++;
          continue;
        }

        const type = detectType(row);
        const category = row.category || detectCategory(row.description);
        const absAmt = Math.abs(amt);

        await db.insert(transactionsTable).values({
          description: row.description,
          amount: absAmt.toFixed(2),
          type,
          category,
          date: row.date,
          notes: row.notes || `Imported from bank feed`,
        });

        result.imported++;
      } catch (err: any) {
        result.errors.push(`Row ${i}: ${err.message}`);
        result.skipped++;
      }
    }

    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: "Import failed", detail: err.message });
  }
});

router.get("/bank-feed/imported", async (_req, res) => {
  try {
    const rows = await db
      .select()
      .from(transactionsTable)
      .orderBy(desc(transactionsTable.createdAt))
      .limit(50);
    const imported = rows.filter((r) => r.notes?.includes("Imported from bank feed"));
    res.json(imported);
  } catch (err: any) {
    res.status(500).json({ error: "Failed to fetch imported transactions" });
  }
});

export default router;
