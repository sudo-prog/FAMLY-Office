/**
 * MCP Server for Family Office
 * 
 * Exposes Family Office data as tools via Model Context Protocol.
 * This module provides the MCP protocol layer that wraps the existing API routes.
 */

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, { type: string; description?: string; default?: unknown }>;
  };
}

export interface MCPToolResult {
  content: Array<{ type: string; text: string }>;
}

export const MCP_TOOLS: MCPTool[] = [
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
];

/**
 * Handle MCP JSON-RPC protocol requests
 */
export async function handleMCPRequest(body: {
  jsonrpc?: string;
  method?: string;
  id?: string | number;
  params?: Record<string, unknown>;
}): Promise<unknown> {
  const { method, id, params } = body;

  switch (method) {
    case "tools/list":
      return {
        jsonrpc: "2.0",
        id,
        result: { tools: MCP_TOOLS },
      };

    case "tools/call": {
      const toolName = params?.name as string;
      const toolArgs = (params?.arguments || {}) as Record<string, unknown>;

      // Tool execution is delegated to the API route handler
      // This function provides the protocol framing
      return {
        jsonrpc: "2.0",
        id,
        result: {
          content: [
            {
              type: "text",
              text: JSON.stringify({ tool: toolName, args: toolArgs, status: "use_http_endpoint" }),
            },
          ],
        },
      };
    }

    case "initialize":
      return {
        jsonrpc: "2.0",
        id,
        result: {
          protocolVersion: "2024-11-05",
          capabilities: { tools: {} },
          serverInfo: { name: "family-office-mcp", version: "1.0.0" },
        },
      };

    default:
      return {
        jsonrpc: "2.0",
        id,
        error: { code: -32601, message: `Method not found: ${method}` },
      };
  }
}

export default { handleMCPRequest, MCP_TOOLS };
