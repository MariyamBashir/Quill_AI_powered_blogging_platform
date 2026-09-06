import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import { db } from "../db/database.js";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured");
  }

  return secret;
}

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export function authenticateJWT(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      error: "Authentication required"
    });
  }

  const token = authHeader.substring(7);

  try {
    const payload = jwt.verify(token, getJwtSecret());

    if (typeof payload === "string") {
      return res.status(401).json({
        error: "Invalid authentication token"
      });
    }

    const userId = payload.userId;
    const email = payload.email;

    if (!userId || !email) {
      return res.status(401).json({
        error: "Invalid authentication token"
      });
    }

    req.user = {
      userId: String(userId),
      email: String(email)
    };

    next();
  } catch {
    return res.status(401).json({
      error: "Invalid or expired authentication token"
    });
  }
  
}
export function authenticateApiKey(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey || typeof apiKey !== "string") {
    return res.status(401).json({
      error: "API key required"
    });
  }

  const keyHash = crypto
    .createHash("sha256")
    .update(apiKey)
    .digest("hex");

  const key = db
    .prepare(`
      SELECT
        api_keys.user_id,
        users.email
      FROM api_keys
      JOIN users ON users.id = api_keys.user_id
      WHERE api_keys.key_hash = ?
        AND api_keys.revoked_at IS NULL
    `)
    .get(keyHash) as
    | {
        user_id: string;
        email: string;
      }
    | undefined;

  if (!key) {
    return res.status(401).json({
      error: "Invalid or revoked API key"
    });
  }

  req.user = {
    userId: key.user_id,
    email: key.email
  };

  next();
  
}
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (req.headers["x-api-key"]) {
    return authenticateApiKey(req, res, next);
  }

  return authenticateJWT(req, res, next);
}