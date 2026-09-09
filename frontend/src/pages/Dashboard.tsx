import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../context/AuthContext";
import { type Post, type Analytics, listPosts, getAnalytics } from "../api/posts";

export default function Dashboard() {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recentPosts, setRecentPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([getAnalytics(), listPosts()])
      .then(([analyticsData, posts]) => {
        setAnalytics(analyticsData);
        setRecentPosts(posts.slice(0, 5));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>Welcome back{user?.email ? `, ${user.email}` : ""}</h1>
        <Link to="/posts" className="btn" style={{ width: "auto", padding: "10px 20px", textDecoration: "none" }}>
          New Post
        </Link>
      </div>

      {!loading && analytics && (
        <div style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
          <div className="card" style={{ maxWidth: "160px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 700 }}>
              {analytics.total_posts}
            </div>
            <div style={{ color: "var(--ink-muted)", fontSize: "13px", marginTop: "6px" }}>
              Total Posts
            </div>
          </div>
          <div className="card" style={{ maxWidth: "160px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 700 }}>
              {analytics.draft_posts}
            </div>
            <div style={{ color: "var(--ink-muted)", fontSize: "13px", marginTop: "6px" }}>
              Drafts
            </div>
          </div>
          <div className="card" style={{ maxWidth: "160px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "30px", fontWeight: 700, color: "var(--accent)" }}>
              {analytics.published_posts}
            </div>
            <div style={{ color: "var(--ink-muted)", fontSize: "13px", marginTop: "6px" }}>
              Published
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "40px", marginBottom: "16px" }}>
        <h2 style={{ fontSize: "18px" }}>Recent Posts</h2>
        <Link to="/posts" style={{ color: "var(--accent)", fontSize: "14px", fontWeight: 600, textDecoration: "none" }}>
          View all
        </Link>
      </div>

      {loading ? (
        <p style={{ color: "var(--ink-muted)" }}>Loading...</p>
      ) : recentPosts.length === 0 ? (
        <div className="card" style={{ maxWidth: "100%" }}>
          <p style={{ color: "var(--ink-muted)", marginBottom: "16px" }}>
            You haven't written anything yet.
          </p>
          <Link to="/posts" className="btn" style={{ display: "inline-block", width: "auto", padding: "10px 20px", textDecoration: "none" }}>
            Write your first post
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {recentPosts.map((post) => (
            <Link
              key={post.id}
              to={`/posts/${post.id}`}
              className="card"
              style={{
                maxWidth: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                textDecoration: "none",
                color: "var(--ink)",
                padding: "16px 24px"
              }}
            >
              <span style={{ fontWeight: 600 }}>{post.title}</span>
              <span
                style={{
                  fontSize: "12px",
                  fontWeight: 600,
                  textTransform: "uppercase",
                  color: post.status === "published" ? "var(--accent)" : "var(--ink-muted)"
                }}
              >
                {post.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </Layout>
  );
}