import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ImageIcon, MessageSquareHeart, Star } from "lucide-react";
import { getFeedbackSubmissions, updateFeedbackStatus } from "../../services/feedback";

const PAGE_SIZE = 8;

const statusStyles = {
  new: { background: "rgba(99,102,241,0.12)", color: "#a5b4fc" },
  reviewing: { background: "rgba(245,158,11,0.12)", color: "#fbbf24" },
  resolved: { background: "rgba(16,185,129,0.12)", color: "#34d399" },
};

export default function AdminFeedback() {
  const [feedback, setFeedback] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    void loadFeedback();
  }, [page, statusFilter]);

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const result = await getFeedbackSubmissions({ page, pageSize: PAGE_SIZE, status: statusFilter });
      setFeedback(result.feedback);
      setCount(result.count);
    } finally {
      setLoading(false);
    }
  };

  const totalPages = useMemo(() => Math.max(1, Math.ceil(count / PAGE_SIZE)), [count]);
  const quickStats = useMemo(() => {
    const stats = { new: 0, reviewing: 0, resolved: 0, screenshots: 0 };
    feedback.forEach((entry) => {
      stats[entry.status] = (stats[entry.status] || 0) + 1;
      if (entry.screenshot_url) stats.screenshots += 1;
    });
    return stats;
  }, [feedback]);

  const handleStatus = async (id, status) => {
    try {
      setSavingId(id);
      const updated = await updateFeedbackStatus(id, status);
      setFeedback((prev) => prev.map((entry) => (entry.id === id ? updated : entry)));
    } finally {
      setSavingId(null);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: "white", margin: 0 }}>User Feedback</h1>
          <p style={{ color: "rgba(255,255,255,0.42)", marginTop: 4, fontSize: 13 }}>
            Review product suggestions, complaints, and UX issues from users.
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
          <option value="all">All feedback</option>
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))", gap: 14 }}>
        {[
          { label: "New", value: quickStats.new, color: "#a5b4fc" },
          { label: "Reviewing", value: quickStats.reviewing, color: "#fbbf24" },
          { label: "Resolved", value: quickStats.resolved, color: "#34d399" },
          { label: "With Screenshot", value: quickStats.screenshots, color: "#22d3ee" },
        ].map((entry) => (
          <div key={entry.label} className="space-card" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.42)", fontWeight: 700 }}>
              {entry.label}
            </div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: entry.color }}>{entry.value}</div>
          </div>
        ))}
      </div>

      <div className="space-card" style={{ padding: 24 }}>
        {loading ? (
          <div style={{ color: "rgba(255,255,255,0.45)" }}>Loading feedback...</div>
        ) : feedback.length === 0 ? (
          <div style={{ textAlign: "center", padding: "36px 0", color: "rgba(255,255,255,0.35)" }}>
            <MessageSquareHeart size={36} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div>No feedback available for this filter.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {feedback.map((entry) => (
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
                  <div>
                    <div style={{ color: "white", fontWeight: 700 }}>{entry.full_name || "User"}</div>
                    <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 12 }}>{entry.email || "No email available"}</div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                    <span
                      style={{
                        ...statusStyles[entry.status],
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
                    <span style={{ color: "rgba(255,255,255,0.55)", fontSize: 12 }}>{new Date(entry.created_at).toLocaleString()}</span>
                  </div>
                </div>

                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                  <span style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 700 }}>{entry.category}</span>
                  <span style={{ display: "inline-flex", gap: 2 }}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={14}
                        style={{ color: index < entry.rating ? "#fbbf24" : "rgba(255,255,255,0.18)", fill: index < entry.rating ? "#fbbf24" : "transparent" }}
                      />
                    ))}
                  </span>
                </div>

                <p style={{ marginTop: 12, color: "rgba(255,255,255,0.8)", lineHeight: 1.6 }}>{entry.message}</p>

                {entry.screenshot_signed_url && (
                  <div
                    style={{
                      marginTop: 14,
                      padding: 14,
                      borderRadius: 14,
                      background: "rgba(34,211,238,0.06)",
                      border: "1px solid rgba(34,211,238,0.12)",
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <div
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 10,
                            background: "rgba(34,211,238,0.12)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#22d3ee",
                          }}
                        >
                          <ImageIcon size={16} />
                        </div>
                        <div>
                          <div style={{ color: "white", fontWeight: 600, fontSize: 13 }}>Attached Screenshot</div>
                          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 11 }}>{entry.screenshot_name || "feedback-screenshot"}</div>
                        </div>
                      </div>

                      <a
                        href={entry.screenshot_signed_url}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#22d3ee", fontSize: 12, fontWeight: 700, textDecoration: "none" }}
                      >
                        Open Full Image
                      </a>
                    </div>

                    <a href={entry.screenshot_signed_url} target="_blank" rel="noreferrer">
                      <img
                        src={entry.screenshot_signed_url}
                        alt={entry.screenshot_name || "Feedback screenshot"}
                        style={{ marginTop: 12, width: "100%", maxHeight: 300, objectFit: "cover", borderRadius: 12 }}
                      />
                    </a>
                  </div>
                )}

                <div style={{ marginTop: 16, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <button
                    type="button"
                    disabled={savingId === entry.id}
                    onClick={() => handleStatus(entry.id, "reviewing")}
                    className="space-btn-primary"
                    style={{ padding: "8px 14px", fontSize: 12 }}
                  >
                    Mark Reviewing
                  </button>
                  <button
                    type="button"
                    disabled={savingId === entry.id}
                    onClick={() => handleStatus(entry.id, "resolved")}
                    style={{
                      padding: "8px 14px",
                      borderRadius: 10,
                      border: "1px solid rgba(52,211,153,0.3)",
                      background: "rgba(16,185,129,0.1)",
                      color: "#34d399",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    Mark Resolved
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
