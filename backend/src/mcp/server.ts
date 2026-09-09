import crypto from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { db } from "../db/database.js";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function createQuillMcpServer(userId: string): McpServer {
  const server = new McpServer({
    name: "quill",
    version: "1.0.0"
  });

  server.tool(
    "create_post",
    "Create a new blog post on Quill. Saves as a draft unless told to publish immediately.",
    {
      title: z.string().describe("The title of the blog post"),
      content: z.string().describe("The body content of the post, in Markdown"),
      status: z
        .enum(["draft", "published"])
        .optional()
        .describe("Post status; defaults to 'draft'")
    },
    async ({ title, content, status }) => {
      const id = crypto.randomUUID();
      const slug = slugify(title);
      const postStatus = status || "draft";

      db.prepare(`
        INSERT INTO posts (id, user_id, title, slug, content_md, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(id, userId, title.trim(), slug, content, postStatus);

      const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);

      return {
        content: [
          {
            type: "text",
            text: `Created post "${title}" (id: ${id}, status: ${postStatus}).\n\n${JSON.stringify(post, null, 2)}`
          }
        ]
      };
    }
  );

  server.tool(
    "list_posts",
    "List blog posts belonging to the authenticated user, most recent first.",
    {
      status: z
        .enum(["draft", "published"])
        .optional()
        .describe("Filter by status; omit to list all posts")
    },
    async ({ status }) => {
      const posts = status
        ? db
            .prepare(`SELECT * FROM posts WHERE user_id = ? AND status = ? ORDER BY created_at DESC`)
            .all(userId, status)
        : db
            .prepare(`SELECT * FROM posts WHERE user_id = ? ORDER BY created_at DESC`)
            .all(userId);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(posts, null, 2)
          }
        ]
      };
    }
  );

  server.tool(
    "publish_post",
    "Publish a draft post, or the most recently created post if no ID is given.",
    {
      post_id: z
        .string()
        .optional()
        .describe("The ID of the post to publish. If omitted, publishes the most recently created post.")
    },
    async ({ post_id }) => {
      let id = post_id;

      if (!id) {
        const latest = db
          .prepare(`SELECT id FROM posts WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`)
          .get(userId) as { id: string } | undefined;

        if (!latest) {
          return {
            content: [{ type: "text", text: "No posts found to publish." }],
            isError: true
          };
        }

        id = latest.id;
      }

      const existing = db
        .prepare(`SELECT id FROM posts WHERE id = ? AND user_id = ?`)
        .get(id, userId);

      if (!existing) {
        return {
          content: [{ type: "text", text: `Post not found: ${id}` }],
          isError: true
        };
      }

      db.prepare(`
        UPDATE posts
        SET status = 'published', published_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
      `).run(id, userId);

      const post = db.prepare(`SELECT * FROM posts WHERE id = ?`).get(id);

      return {
        content: [
          {
            type: "text",
            text: `Published post ${id}.\n\n${JSON.stringify(post, null, 2)}`
          }
        ]
      };
    }
  );

  server.tool(
    "get_analytics",
    "Get a summary of the authenticated user's blog: total posts, drafts, and published counts.",
    {},
    async () => {
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

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(totals, null, 2)
          }
        ]
      };
    }
  );

  return server;
}