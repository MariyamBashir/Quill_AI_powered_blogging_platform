import { Router } from "express";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { db } from "../db/database.js";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error("JWT_SECRET is not configured");
}

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return `${salt}:${hash}`;
}

function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(":");

  if (!salt || !originalHash) {
    return false;
  }

  const hash = crypto
    .scryptSync(password, salt, 64)
    .toString("hex");

  return crypto.timingSafeEqual(
    Buffer.from(hash, "hex"),
    Buffer.from(originalHash, "hex")
  );
}

router.post("/signup", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  if (password.length < 8) {
    return res.status(400).json({
      error: "Password must be at least 8 characters"
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const existingUser = db
    .prepare("SELECT id FROM users WHERE email = ?")
    .get(normalizedEmail);

  if (existingUser) {
    return res.status(409).json({
      error: "User already exists"
    });
  }

  const userId = crypto.randomUUID();
  const passwordHash = hashPassword(password);

  db.prepare(`
    INSERT INTO users (id, email, password_hash)
    VALUES (?, ?, ?)
  `).run(userId, normalizedEmail, passwordHash);

  const token = jwt.sign(
    {
      userId,
      email: normalizedEmail
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );

  return res.status(201).json({
    message: "User created successfully",
    token,
    user: {
      id: userId,
      email: normalizedEmail
    }
  });
});

router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      error: "Email and password are required"
    });
  }

  const normalizedEmail = String(email).trim().toLowerCase();

  const user = db
    .prepare(`
      SELECT id, email, password_hash
      FROM users
      WHERE email = ?
    `)
    .get(normalizedEmail) as
    | {
        id: string;
        email: string;
        password_hash: string;
      }
    | undefined;

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({
      error: "Invalid email or password"
    });
  }

  const token = jwt.sign(
    {
      userId: user.id,
      email: user.email
    },
    JWT_SECRET,
    {
      expiresIn: "7d"
    }
  );

  return res.json({
    message: "Login successful",
    token,
    user: {
      id: user.id,
      email: user.email
    }
  });
});

export default router;