import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { type Analytics, getAnalytics } from "../api/posts";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getAnalytics()
      .then(setAnalytics)
      .catch((err) => setError(err.response?.data?.error || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <h1>Analytics</h1>

      {loading && <p style={{ color: "var(--ink-muted)", marginTop: "16px" }}>Loading...</p>}
      {error && <p className="error-text">{error}</p>}

      {analytics && (
        <div style={{ display: "flex", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
          <div className="card" style={{ maxWidth: "200px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "36px", fontWeight: 700 }}>
              {analytics.total_posts}
            </div>
            <div style={{ color: "var(--ink-muted)", fontSize: "14px", marginTop: "8px" }}>
              Total Posts
            </div>
          </div>
          <div className="card" style={{ maxWidth: "200px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "36px", fontWeight: 700 }}>
              {analytics.draft_posts}
            </div>
            <div style={{ color: "var(--ink-muted)", fontSize: "14px", marginTop: "8px" }}>
              Drafts
            </div>
          </div>
          <div className="card" style={{ maxWidth: "200px", textAlign: "center" }}>
            <div style={{ fontFamily: "var(--font-serif)", fontSize: "36px", fontWeight: 700, color: "var(--accent)" }}>
              {analytics.published_posts}
            </div>
            <div style={{ color: "var(--ink-muted)", fontSize: "14px", marginTop: "8px" }}>
              Published
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}