import { Router } from "express";
import crypto from "node:crypto";
import {
  authenticateJWT,
  AuthenticatedRequest
} from "../middleware/auth.js";
import { db } from "../db/database.js";

const router = Router();

function hashApiKey(apiKey: string): string {
  return crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");
}

router.post(
  "/",
  authenticateJWT,
  (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const apiKey = `ql_live_${crypto.randomBytes(32).toString("hex")}`;
    const keyHash = hashApiKey(apiKey);
    const keyId = crypto.randomUUID();

    db.prepare(`
      INSERT INTO api_keys (id, user_id, key_hash)
      VALUES (?, ?, ?)
    `).run(
      keyId,
      req.user.userId,
      keyHash
    );

    return res.status(201).json({
      message: "API key created successfully",
      api_key: apiKey
    });
  }
);

router.get(
  "/",
  authenticateJWT,
  (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const keys = db
      .prepare(`
        SELECT id, created_at, revoked_at
        FROM api_keys
        WHERE user_id = ?
        ORDER BY created_at DESC
      `)
      .all(req.user.userId);

    return res.json({
      api_keys: keys
    });
  }
);

router.delete(
  "/:id",
  authenticateJWT,
  (req: AuthenticatedRequest, res) => {
    if (!req.user) {
      return res.status(401).json({
        error: "Authentication required"
      });
    }

    const result = db
      .prepare(`
        UPDATE api_keys
        SET revoked_at = CURRENT_TIMESTAMP
        WHERE id = ?
          AND user_id = ?
          AND revoked_at IS NULL
      `)
      .run(
        String(req.params.id),
        req.user.userId
        );
    if (result.changes === 0) {
      return res.status(404).json({
        error: "API key not found"
      });
    }

    return res.json({
      message: "API key revoked successfully"
    });
  }
);

export default router;