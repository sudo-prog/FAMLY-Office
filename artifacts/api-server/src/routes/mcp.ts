import { Router } from "express";
import { db } from "@workspace/db";
import { assetsTable, transactionsTable } from "@workspace/db";
import { sql, desc } from "drizzle-orm";

const router = Router();

// MCP tool definitions - exposed as a standard JSON API
router.get("/mcp/tools", (_req, res) => {
  res.json({
    tools: [
      {
        name: "get_net_worth",
        description: "Calculate total net worth from assets and liabilities",
        inputSchema: { type: "object", properties: {} },
      },
      {
        name: "list_assets",
        description: "List all assets with optional category filter",
        inputSchema: {
          type: "object",
          properties: {
            category: { type: "string", description: "Filter by asset category" },
          },
        },
      },
      {
        name: "list_transactions",
        description: "List recent transactions",
        inputSchema: {
          type: "object",
          properties: {
            limit: { type: "number", description: "Number of transactions to return", default: 20 },
            type: { type: "string", description: "Filter: income, expense, transfer" },
          },
        },
      },
      {
        name: "get_asset_summary_by_category",
        description: "Get total asset values grouped by category",
        inputSchema: { type: "object", properties: {} },
      },
    ],
  });
});

// MCP tool execution endpoint
router.post("/mcp/call", async (req, res) => {
  try {
    const { name, arguments: args } = req.body;
    const params = args || {};

    switch (name) {
      case "get_net_worth": {
        const [assetSums] = await db
          .select({
            totalAssets: sql<number>`coalesce(sum(${assetsTable.value}::numeric), 0)`,
          })
          .from(assetsTable);

        const totalAssets = Number(assetSums.totalAssets) || 0;
        res.json({
          content: [
            {
              type: "text",
              text: JSON.stringify({
                totalNetWorth: totalAssets,
                totalAssets,
                totalLiabilities: 0,
                asOf: new Date().toISOString(),
              }),
            },
          ],
        });
        break;
      }

      case "list_assets": {
        let assets = await db.select().from(assetsTable);
        if (params.category) {
          assets = assets.filter((a) => a.category === params.category);
        }
        res.json({
          content: [{ type: "text", text: JSON.stringify(assets) }],
        });
        break;
      }

      case "list_transactions": {
        const limit = Number(params.limit) || 20;
        let rows = await db
          .select()
          .from(transactionsTable)
          .orderBy(desc(transactionsTable.createdAt))
          .limit(limit);
        if (params.type) {
          rows = rows.filter((t) => t.type === params.type);
        }
        res.json({
          content: [{ type: "text", text: JSON.stringify(rows) }],
        });
        break;
      }

      case "get_asset_summary_by_category": {
        const categories = await db
          .select({
            category: assetsTable.category,
            total: sql<number>`sum(${assetsTable.value}::numeric)`,
            count: sql<number>`count(*)`,
          })
          .from(assetsTable)
          .groupBy(assetsTable.category)
          .orderBy(sql`sum(${assetsTable.value}::numeric) desc`);
        res.json({
          content: [
            {
              type: "text",
              text: JSON.stringify(
                categories.map((c) => ({
                  category: c.category,
                  total: Number(c.total) || 0,
                  count: Number(c.count) || 0,
                })),
              ),
            },
          ],
        });
        break;
      }

      default:
        res.status(404).json({ error: `Unknown tool: ${name}` });
    }
  } catch (err: any) {
    // Don't leak internal error details to clients
    res.status(500).json({
      content: [{ type: "text", text: JSON.stringify({ error: "Internal server error" }) }],
    });
  }
});

export default router;
