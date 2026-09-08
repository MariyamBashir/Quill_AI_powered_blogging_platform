import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { type ApiKeyRecord, listApiKeys, createApiKey, revokeApiKey } from "../api/apiKeys";

export default function ApiKeys() {
  const [keys, setKeys] = useState<ApiKeyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [newKey, setNewKey] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [copied, setCopied] = useState(false);

  async function loadKeys() {
    try {
      setLoading(true);
      const data = await listApiKeys();
      setKeys(data);
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadKeys();
  }, []);

  async function handleCreate() {
    try {
      setCreating(true);
      setError("");
      const key = await createApiKey();
      setNewKey(key);
      setCopied(false);
      await loadKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to create API key");
    } finally {
      setCreating(false);
    }
  }

  async function handleRevoke(id: string) {
    if (!confirm("Revoke this API key? Any MCP connection using it will stop working.")) return;
    try {
      await revokeApiKey(id);
      await loadKeys();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to revoke key");
    }
  }

  function handleCopy() {
    if (!newKey) return;
    navigator.clipboard.writeText(newKey);
    setCopied(true);
  }

  return (
    <Layout>
      <h1>MCP API Keys</h1>
      <p style={{ color: "var(--ink-muted)", marginTop: "8px", maxWidth: "560px" }}>
        Use an API key to connect an AI agent (like Claude Code, Cursor, or MCP Inspector)
        to your Quill account. The agent will authenticate as you and can manage your posts.
      </p>

      {newKey && (
        <div className="card" style={{ maxWidth: "100%", marginTop: "24px", borderColor: "var(--accent)" }}>
          <h2 style={{ fontSize: "16px", marginBottom: "8px" }}>Your new API key</h2>
          <p style={{ color: "var(--error)", fontSize: "13px", marginBottom: "12px" }}>
            Copy it now — you won't be able to see it again.
          </p>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <code
              style={{
                background: "var(--paper)",
                padding: "10px 12px",
                borderRadius: "4px",
                fontSize: "13px",
                flex: 1,
                overflowX: "auto",
                whiteSpace: "nowrap"
              }}
            >
              {newKey}
            </code>
            <button
              className="btn-secondary"
              style={{ width: "auto", padding: "8px 16px" }}
              onClick={handleCopy}
            >
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <button
        className="btn"
        style={{ width: "auto", padding: "10px 20px", marginTop: "24px" }}
        onClick={handleCreate}
        disabled={creating}
      >
        {creating ? "Generating..." : "Generate New API Key"}
      </button>

      {error && <p className="error-text">{error}</p>}

      <h2 style={{ fontSize: "18px", marginTop: "32px", marginBottom: "12px" }}>Your Keys</h2>

      {loading ? (
        <p style={{ color: "var(--ink-muted)" }}>Loading...</p>
      ) : keys.length === 0 ? (
        <p style={{ color: "var(--ink-muted)" }}>No API keys yet.</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {keys.map((key) => (
            <div
              key={key.id}
              className="card"
              style={{
                maxWidth: "100%",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 24px"
              }}
            >
              <div>
                <div style={{ fontSize: "13px", color: "var(--ink-muted)" }}>
                  Created {new Date(key.created_at).toLocaleString()}
                </div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    color: key.revoked_at ? "var(--error)" : "var(--accent)",
                    marginTop: "4px"
                  }}
                >
                  {key.revoked_at ? "Revoked" : "Active"}
                </div>
              </div>
              {!key.revoked_at && (
                <button
                  className="btn-secondary"
                  style={{ width: "auto", padding: "6px 14px", fontSize: "13px", color: "var(--error)" }}
                  onClick={() => handleRevoke(key.id)}
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </Layout>
  );
}