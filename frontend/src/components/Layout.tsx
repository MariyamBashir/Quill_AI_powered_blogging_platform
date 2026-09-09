import { type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div>
      <div className="topbar">
        <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
          <span className="brand">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path
                d="M20 4C13 5 6 11 4 20C4 20 12 19 16 14C19.5 9.5 20 4 20 4Z"
                fill="var(--accent)"
              />
              <path d="M4 20L9 15" stroke="var(--ink)" strokeWidth="1.2" strokeLinecap="round" />
            </svg>
            Quill
          </span>
          <nav style={{ display: "flex", gap: "20px" }}>
            <NavLink
              to="/dashboard"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              style={{ color: "var(--ink)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}
            >
              Dashboard
            </NavLink>
            <NavLink
              to="/posts"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              style={{ color: "var(--ink)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}
            >
              Posts
            </NavLink>
            <NavLink
              to="/analytics"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              style={{ color: "var(--ink)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}
            >
              Analytics
            </NavLink>
            <NavLink
              to="/api-keys"
              className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
              style={{ color: "var(--ink)", textDecoration: "none", fontSize: "14px", fontWeight: 500 }}
            >
              API Keys
            </NavLink>
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