import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import {
  type Post,
  listPosts,
  createPost,
  deletePost,
  publishPost
} from "../api/posts";

export default function Posts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [creating, setCreating] = useState(false);

  async function loadPosts() {
    try {
      setLoading(true);
      const data = await listPosts();
      setPosts(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadPosts();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    try {
      setCreating(true);
      await createPost(title, content, "draft");
      setTitle("");
      setContent("");
      await loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create post");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      await loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete post");
    }
  }

  async function handlePublish(id: string) {
    try {
      await publishPost(id);
      await loadPosts();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to publish post");
    }
  }

  return (
    <Layout>
      <h1>Posts</h1>

      <div className="card" style={{ maxWidth: "100%", marginTop: "24px", marginBottom: "32px" }}>
        <h2 style={{ fontSize: "18px", marginBottom: "16px" }}>New Post</h2>
        <form onSubmit={handleCreate}>
          <input
            className="field"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="field"
            placeholder="Write your post..."
            rows={5}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <button className="btn" type="submit" disabled={creating} style={{ width: "auto", padding: "10px 20px" }}>
            {creating ? "Creating..." : "Create Draft"}
          </button>
        </form>
      </div>

      {error && <p className="error-text">{error}</p>}

      {loading ? (
        <p style={{ color: "var(--ink-muted)" }}>Loading posts...</p>
      ) : posts.length === 0 ? (
        <p style={{ color: "var(--ink-muted)" }}>No posts yet. Create your first one above.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {posts.map((post) => (
            <div key={post.id} className="card" style={{ maxWidth: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                <div>
                  <h3 style={{ fontSize: "18px" }}>{post.title}</h3>
                  <span
                    style={{
                      fontSize: "12px",
                      color: post.status === "published" ? "var(--accent)" : "var(--ink-muted)",
                      fontWeight: 600,
                      textTransform: "uppercase"
                    }}
                  >
                    {post.status}
                  </span>
                </div>
                <div style={{ display: "flex", gap: "8px" }}>
                  <Link to={`/posts/${post.id}`} className="btn-secondary" style={{ padding: "6px 12px", textDecoration: "none", fontSize: "13px" }}>
                    Edit
                  </Link>
                  {post.status === "draft" && (
                    <button
                      className="btn-secondary"
                      style={{ width: "auto", padding: "6px 12px", fontSize: "13px" }}
                      onClick={() => handlePublish(post.id)}
                    >
                      Publish
                    </button>
                  )}
                  <button
                    className="btn-secondary"
                    style={{ width: "auto", padding: "6px 12px", fontSize: "13px", color: "var(--error)" }}
                    onClick={() => handleDelete(post.id)}
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}