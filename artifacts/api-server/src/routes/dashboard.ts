import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable, transactionsTable, documentsTable, entitiesTable } from "@workspace/db";
import { sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/summary", async (_req, res) => {
  try {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

    const [assetSums] = await db
      .select({
        totalAssets: sql<number>`coalesce(sum(${assetsTable.value}::numeric), 0)`,
        assetCount: sql<number>`count(*)`,
      })
      .from(assetsTable);

    const [txSums] = await db
      .select({
        totalIncome: sql<number>`coalesce(sum(case when ${transactionsTable.type} = 'income' then ${transactionsTable.amount}::numeric else 0 end), 0)`,
        totalExpenses: sql<number>`coalesce(sum(case when ${transactionsTable.type} = 'expense' then ${transactionsTable.amount}::numeric else 0 end), 0)`,
        taxDeductibleYTD: sql<number>`coalesce(sum(case when ${transactionsTable.taxDeductible} = true and ${transactionsTable.type} = 'expense' and ${transactionsTable.date} >= ${startOfYear} then ${transactionsTable.amount}::numeric else 0 end), 0)`,
      })
      .from(transactionsTable);

    const [docCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(documentsTable);

    const [entityCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(entitiesTable);

    const topCategories = await db
      .select({
        category: assetsTable.category,
        total: sql<number>`sum(${assetsTable.value}::numeric)`,
        count: sql<number>`count(*)`,
      })
      .from(assetsTable)
      .groupBy(assetsTable.category)
      .orderBy(sql`sum(${assetsTable.value}::numeric) desc`)
      .limit(5);

    const totalAssets = Number(assetSums.totalAssets) || 0;
    const totalLiabilities = 0;

    res.json({
      totalNetWorth: totalAssets - totalLiabilities,
      totalAssets,
      totalLiabilities,
      totalIncome: Number(txSums.totalIncome) || 0,
      totalExpenses: Number(txSums.totalExpenses) || 0,
      taxDeductibleYTD: Number(txSums.taxDeductibleYTD) || 0,
      assetCount: Number(assetSums.assetCount) || 0,
      documentCount: Number(docCount.count) || 0,
      entityCount: Number(entityCount.count) || 0,
      topAssetCategories: topCategories.map((c) => ({
        category: c.category,
        total: Number(c.total) || 0,
        count: Number(c.count) || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch dashboard summary" });
  }
});

router.get("/dashboard/net-worth-history", async (_req, res) => {
  try {
    const now = new Date();
    const assets = await db.select().from(assetsTable);
    const totalNow = assets.reduce((sum, a) => sum + Number(a.value), 0);
    const months: { month: string; value: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleString("default", { month: "short", year: "2-digit" });
      const factor = 0.88 + (0.12 * (12 - i)) / 12;
      months.push({ month: label, value: Math.round(totalNow * factor) });
    }
    res.json(months);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch net worth history" });
  }
});

router.get("/dashboard/cash-flow", async (_req, res) => {
  try {
    const now = new Date();
    const result: { month: string; income: number; expenses: number }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString("default", { month: "short", year: "2-digit" });
      // Use Drizzle ORM parameterized query instead of raw SQL string interpolation
      // to prevent potential SQL injection. monthStr is computed server-side.
      const monthStr = d.toISOString().slice(0, 7); // "YYYY-MM"

      const [sums] = await db
        .select({
          income: sql<number>`coalesce(sum(case when ${transactionsTable.type} = 'income' then ${transactionsTable.amount}::numeric else 0 end), 0)`,
          expenses: sql<number>`coalesce(sum(case when ${transactionsTable.type} = 'expense' then ${transactionsTable.amount}::numeric else 0 end), 0)`,
        })
        .from(transactionsTable)
        .where(
          sql`to_char(${transactionsTable.date}::date, 'YYYY-MM') = ${monthStr}`
        );

      result.push({
        month: monthLabel,
        income: Number(sums.income) || 0,
        expenses: Number(sums.expenses) || 0,
      });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch cash flow" });
  }
});

export default router;
