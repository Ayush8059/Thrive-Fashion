import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, Bug } from "lucide-react";
import { getAppErrors, updateAppErrorStatus } from "../../services/appErrors";

const PAGE_SIZE = 8;

export default function AdminErrors() {
  const [errors, setErrors] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    void loadErrors();
  }, [page, statusFilter]);

  const loadErrors = async () => {
    setLoading(true);
    try {
      const result = await getAppErrors({ page, pageSize: PAGE_SIZE, status: statusFilter });
      setErrors(result.errors);
      setCount(result.count);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);

  const handleResolve = async (id, status) => {
    try {
      setSavingId(id);
      const updated = await updateAppErrorStatus(id, status);
      setErrors((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: 0 }}>Website Errors</h1>
          <p style={{ color: "rgba(255,255,255,0.42)", marginTop: 4, fontSize: 13 }}>
            Monitor runtime issues reported by the web app and mark them resolved after fixing.
          </p>
        </div>

        <select
          value={statusFilter}
          onChange={(event) => {
            setPage(1);
            setStatusFilter(event.target.value);
          }}
          className="space-input"
          style={{ width: 180 }}
        >
          <option value="all">All errors</option>
          <option value="open">Open</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div className="space-card" style={{ padding: 24 }}>
        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.45)" }}>Loading errors...</div>
        ) : errors.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 0", color: "rgba(255,255,255,0.35)" }}>
            <Bug size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>No errors available for this filter.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {errors.map((entry) => (
              <div
                key={entry.id}
                style={{
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 14,
                  padding: 18,
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ color: "#f87171" }}>
                      <AlertTriangle size={18} />
                    </div>
                    <div>
                      <div style={{ color: "white", fontWeight: 700 }}>{entry.source || "app"}</div>
                      <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{new Date(entry.created_at).toLocaleString()}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span
                      style={{
                        background: entry.status === "resolved" ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
                        color: entry.status === "resolved" ? "#34d399" : "#f87171",
                        fontSize: 11,
                        fontWeight: 700,
                        padding: "5px 10px",
                        borderRadius: 999,
                        textTransform: "uppercase",
                        letterSpacing: "0.8px",
                      }}
                    >
                      {entry.status}
                    </span>
                  </div>
                </div>

                <div style={{ marginTop: 14, color: "rgba(255,255,255,0.9)", fontWeight: 600 }}>{entry.message}</div>

                {entry.url && (
                  <div style={{ marginTop: 8, color: "rgba(255,255,255,0.45)", fontSize: 12, wordBreak: "break-all" }}>
                    URL: {entry.url}
                  </div>
                )}

                {entry.stack && (
                  <pre
                    style={{
                      marginTop: 12,
                      padding: 14,
                      borderRadius: 12,
                      background: "rgba(3,7,18,0.7)",
                      border: "1px solid rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.72)",
                      fontSize: 11,
                      overflowX: "auto",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {entry.stack}
                  </pre>
                )}

                <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={savingId === entry.id}
                    onClick={() => handleResolve(entry.id, "resolved")}
                    className="space-btn-primary"
                    style={{ padding: "8px 14px", fontSize: 12 }}
                  >
                    Mark Resolved
                  </button>
                  <button
                    type="button"
                    disabled={savingId === entry.id}
                    onClick={() => handleResolve(entry.id, "open")}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(248,113,113,0.3)",
                      background: "rgba(239,68,68,0.08)",
                      color: "#f87171",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Reopen
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {count > PAGE_SIZE && (
          <div style={{ marginTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", color: "rgba(255,255,255,0.5)" }}>
            <button
              type="button"
              disabled={page === 1}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              className="space-btn-primary"
              style={{ padding: "8px 14px", opacity: page === 1 ? 0.45 : 1 }}
            >
              Prev
            </button>
            <span>
              Page {page} of {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages}
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              className="space-btn-primary"
              style={{ padding: "8px 14px", opacity: page >= totalPages ? 0.45 : 1 }}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
