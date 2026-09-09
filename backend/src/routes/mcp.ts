import { Router, Request, Response } from "express";
import crypto from "node:crypto";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { db } from "../db/database.js";
import { createQuillMcpServer } from "../mcp/server.js";

const router = Router();

function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

router.post("/:apiKey", async (req: Request, res: Response) => {
  const apiKey = String(req.params.apiKey);
  const keyHash = hashApiKey(apiKey);

  const keyRecord = db
    .prepare(`
      SELECT user_id FROM api_keys
      WHERE key_hash = ? AND revoked_at IS NULL
    `)
    .get(keyHash) as { user_id: string } | undefined;

  if (!keyRecord) {
    return res.status(401).json({
      jsonrpc: "2.0",
      error: { code: -32001, message: "Invalid or revoked API key" },
      id: null
    });
  }

  try {
    const server = createQuillMcpServer(keyRecord.user_id);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined
    });

    res.on("close", () => {
      transport.close();
      server.close();
    });

    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("Error handling MCP request:", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null
      });
    }
  }
});

export default router;