import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { type Post, getPost, updatePost, publishPost, deletePost } from "../api/posts";

export default function PostEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!id) return;
    getPost(id)
      .then((data) => {
        setPost(data);
        setTitle(data.title);
        setContent(data.content_md);
      })
      .catch((err) => setError(err.response?.data?.error || "Failed to load post"))
      .finally(() => setLoading(false));
  }, [id]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;
    try {
      setSaving(true);
      setSaved(false);
      const updated = await updatePost(id, { title, content });
      setPost(updated);
      setSaved(true);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to save post");
    } finally {
      setSaving(false);
    }
  }

  async function handlePublish() {
    if (!id) return;
    try {
      const updated = await publishPost(id);
      setPost(updated);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to publish post");
    }
  }

  async function handleDelete() {
    if (!id) return;
    if (!confirm("Delete this post?")) return;
    try {
      await deletePost(id);
      navigate("/posts");
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to delete post");
    }
  }

  if (loading) {
    return (
      <Layout>
        <p style={{ color: "var(--ink-muted)" }}>Loading...</p>
      </Layout>
    );
  }

  if (!post) {
    return (
      <Layout>
        <p className="error-text">{error || "Post not found"}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
        <h1>Edit Post</h1>
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

      <div className="card" style={{ maxWidth: "100%" }}>
        <form onSubmit={handleSave}>
          <input
            className="field"
            type="text"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="field"
            rows={10}
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div style={{ display: "flex", gap: "10px" }}>
            <button className="btn" type="submit" disabled={saving} style={{ width: "auto", padding: "10px 20px" }}>
              {saving ? "Saving..." : "Save Changes"}
            </button>
            {post.status === "draft" && (
              <button
                type="button"
                className="btn-secondary"
                style={{ width: "auto", padding: "10px 20px" }}
                onClick={handlePublish}
              >
                Publish
              </button>
            )}
            <button
              type="button"
              className="btn-secondary"
              style={{ width: "auto", padding: "10px 20px", color: "var(--error)" }}
              onClick={handleDelete}
            >
              Delete
            </button>
          </div>
          {saved && <p style={{ color: "var(--accent)", fontSize: "13px", marginTop: "10px" }}>Saved.</p>}
          {error && <p className="error-text">{error}</p>}
        </form>
      </div>
    </Layout>
  );
}