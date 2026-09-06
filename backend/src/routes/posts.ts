import { Router, Response } from "express";
import crypto from "node:crypto";
import { db } from "../db/database.js";
import { authenticate, AuthenticatedRequest } from "../middleware/auth.js";

const router = Router();

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

router.post("/", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const { title, content, status } = req.body;

  if (!title || typeof title !== "string" || !title.trim()) {
    return res.status(400).json({ error: "Title is required" });
  }

  if (!content || typeof content !== "string" || !content.trim()) {
    return res.status(400).json({ error: "Content is required" });
  }

  const allowedStatuses = ["draft", "published"];
  const postStatus =
    status && allowedStatuses.includes(status) ? status : "draft";

  const id = crypto.randomUUID();
  const slug = slugify(title);
  const userId = req.user!.userId;

  db.prepare(`
    INSERT INTO posts (id, user_id, title, slug, content_md, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, userId, title.trim(), slug, content, postStatus);

  const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);

  res.status(201).json({ post });
});

router.get("/", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const posts = db
    .prepare(`
      SELECT * FROM posts
      WHERE user_id = ?
      ORDER BY created_at DESC
    `)
    .all(userId);

  res.json({ posts });
});

router.get("/analytics/summary", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;

  const totals = db
    .prepare(`
      SELECT
        COUNT(*) as total_posts,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft_posts,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published_posts
      FROM posts
      WHERE user_id = ?
    `)
    .get(userId);

  res.json({ analytics: totals });
});

router.get("/:id", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  const post = db
    .prepare(`SELECT * FROM posts WHERE id = ? AND user_id = ?`)
    .get(id, userId);

  if (!post) {
    return res.status(404).json({ error: "Post not found" });
  }

  res.json({ post });
});

router.put("/:id", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);
  const { title, content, status } = req.body;

  const existing = db
    .prepare(`SELECT * FROM posts WHERE id = ? AND user_id = ?`)
    .get(id, userId);

  if (!existing) {
    return res.status(404).json({ error: "Post not found" });
  }

  const allowedStatuses = ["draft", "published"];

  const newTitle =
    title && typeof title === "string" && title.trim()
      ? title.trim()
      : (existing as any).title;

  const newContent =
    content && typeof content === "string" && content.trim()
      ? content
      : (existing as any).content_md;

  const newStatus =
    status && allowedStatuses.includes(status)
      ? status
      : (existing as any).status;

  const newSlug =
    title && typeof title === "string" && title.trim()
      ? slugify(title)
      : (existing as any).slug;

  db.prepare(`
    UPDATE posts
    SET title = ?, slug = ?, content_md = ?, status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(newTitle, newSlug, newContent, newStatus, id, userId);

  const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);

  res.json({ post });
});


router.delete("/:id", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  const existing = db
    .prepare(`SELECT id FROM posts WHERE id = ? AND user_id = ?`)
    .get(id, userId);

  if (!existing) {
    return res.status(404).json({ error: "Post not found" });
  }

  db.prepare(`DELETE FROM posts WHERE id = ? AND user_id = ?`).run(id, userId);

  res.status(204).send();
});

router.post("/:id/publish", authenticate, (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.userId;
  const id = String(req.params.id);

  const existing = db
    .prepare(`SELECT id FROM posts WHERE id = ? AND user_id = ?`)
    .get(id, userId);

  if (!existing) {
    return res.status(404).json({ error: "Post not found" });
  }

  db.prepare(`
    UPDATE posts
    SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
    WHERE id = ? AND user_id = ?
  `).run(id, userId);

  const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);

  res.json({ post });
});

export default router;