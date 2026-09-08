import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <span className="brand">Quill</span>
          <nav style={{ display: "flex", gap: "16px" }}>
            <Link to="/dashboard" style={{ color: "var(--ink)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              Dashboard
            </Link>
            <Link to="/posts" style={{ color: "var(--ink)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              Posts
            </Link>
            <Link to="/analytics" style={{ color: "var(--ink)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              Analytics
            </Link>
            <Link to="/api-keys" style={{ color: "var(--ink)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}>
              API Keys
            </Link>
          </nav>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ color: "var(--ink-muted)", fontSize: "14px" }}>
            {user?.email}
          </span>
          <button className="btn-secondary" style={{ width: "auto", padding: "6px 14px" }} onClick={logout}>
            Log Out
          </button>
        </div>
      </div>
      <div className="container">{children}</div>
    </div>
  );
}