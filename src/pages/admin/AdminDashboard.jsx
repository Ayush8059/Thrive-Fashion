import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Package,
  HeartHandshake,
  MessageSquareHeart,
  AlertTriangle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getAdminOverview } from "../../services/adminInsights";

const statCards = [
  { key: "users", title: "Total Users", icon: Users, color: "#818cf8" },
  { key: "activeListings", title: "Active Listings", icon: Package, color: "#a78bfa" },
  { key: "donations", title: "Donations", icon: HeartHandshake, color: "#22d3ee" },
  { key: "feedbackCount", title: "Feedback Inbox", icon: MessageSquareHeart, color: "#f472b6" },
  { key: "openErrorCount", title: "Open Errors", icon: AlertTriangle, color: "#f97316" },
];

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState({
    users: 0,
    activeUsers: 0,
    blockedUsers: 0,
    inactiveUsers: 0,
    deletedUsers: 0,
    activeListings: 0,
    donations: 0,
    feedbackCount: 0,
    openErrorCount: 0,
    recentUsers: [],
    recentFeedback: [],
    recentErrors: [],
  });

  useEffect(() => {
    void loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await getAdminOverview();
      setOverview(data);
    } catch (error) {
      console.error("Admin overview error:", error);
    } finally {
      setLoading(false);
    }
  };

  const userSegments = [
    { label: "Active", value: overview.activeUsers, color: "#34d399" },
    { label: "Blocked", value: overview.blockedUsers, color: "#fbbf24" },
    { label: "Inactive", value: overview.inactiveUsers, color: "#f97316" },
    { label: "Deleted", value: overview.deletedUsers, color: "#f87171" },
  ];
  const totalSegmentUsers = Math.max(1, userSegments.reduce((sum, entry) => sum + entry.value, 0));
  const workHealthTotal = Math.max(1, overview.feedbackCount + overview.openErrorCount);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 320 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: "2px solid transparent",
            borderTopColor: "#6366f1",
            borderRightColor: "#8b5cf6",
            animation: "spin-dash 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin-dash{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h1
          style={{
            fontSize: 30,
            fontWeight: 800,
            color: "white",
            margin: 0,
            background: "linear-gradient(135deg,#a5b4fc,white)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
          }}
        >
          Platform Overview
        </h1>
        <p style={{ color: "rgba(255,255,255,0.42)", marginTop: 4, fontSize: 14 }}>
          Monitor user health, incoming feedback, and runtime issues from one premium control surface.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 18 }}>
        {statCards.map((card, index) => {
          const Icon = card.icon;
          return (
            <motion.div
              key={card.key}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`space-card float-card-d${index % 4}`}
              style={{ padding: 22 }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div
                  style={{
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: `${card.color}22`,
                    border: `1px solid ${card.color}33`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: card.color,
                  }}
                >
                  <Icon size={20} />
                </div>
                <span style={{ fontSize: 11, color: "rgba(255,255,255,0.38)" }}>live</span>
              </div>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
                {card.title}
              </div>
              <div style={{ marginTop: 8, fontSize: 32, fontWeight: 700, color: card.color }}>
                {overview[card.key]}
              </div>
            </motion.div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        {[
          { label: "Active Users", value: overview.activeUsers, color: "#34d399" },
          { label: "Blocked Users", value: overview.blockedUsers, color: "#fbbf24" },
          { label: "Inactive Users", value: overview.inactiveUsers, color: "#f97316" },
          { label: "Deleted Users", value: overview.deletedUsers, color: "#f87171" },
        ].map((row) => (
          <div key={row.label} className="space-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
              {row.label}
            </div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: row.color }}>{row.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 }}>
        <div className="space-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ color: "white", margin: 0, fontSize: 16, fontWeight: 700 }}>User Status Distribution</h3>
            <span style={{ color: "rgba(255,255,255,0.36)", fontSize: 12 }}>{overview.users} total users</span>
          </div>

          <div style={{ display: "flex", gap: 6, height: 14 }}>
            {userSegments.map((entry) => (
              <div
                key={entry.label}
                style={{
                  flex: Math.max(entry.value, entry.value > 0 ? 1 : 0),
                  minWidth: entry.value ? 18 : 0,
                  borderRadius: 999,
                  background: `linear-gradient(90deg,${entry.color},${entry.color}bb)`,
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {userSegments.map((entry) => (
              <div key={entry.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>{entry.label}</span>
                  <span style={{ color: entry.color, fontSize: 13, fontWeight: 700 }}>
                    {entry.value} ({Math.round((entry.value / totalSegmentUsers) * 100)}%)
                  </span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(entry.value / totalSegmentUsers) * 100}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg,${entry.color},${entry.color}aa)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ color: "white", margin: 0, fontSize: 16, fontWeight: 700 }}>Experience Health</h3>
            <span style={{ color: "rgba(255,255,255,0.36)", fontSize: 12 }}>Support load snapshot</span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
            <div
              style={{
                borderRadius: 18,
                padding: 18,
                background: "linear-gradient(135deg,rgba(244,114,182,0.12),rgba(99,102,241,0.06))",
                border: "1px solid rgba(244,114,182,0.12)",
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                Feedback Share
              </div>
              <div style={{ marginTop: 10, color: "#f472b6", fontSize: 30, fontWeight: 800 }}>
                {Math.round((overview.feedbackCount / workHealthTotal) * 100)}%
              </div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                {overview.feedbackCount} reports waiting for product review.
              </div>
            </div>

            <div
              style={{
                borderRadius: 18,
                padding: 18,
                background: "linear-gradient(135deg,rgba(249,115,22,0.12),rgba(248,113,113,0.06))",
                border: "1px solid rgba(249,115,22,0.14)",
              }}
            >
              <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                Error Share
              </div>
              <div style={{ marginTop: 10, color: "#f97316", fontSize: 30, fontWeight: 800 }}>
                {Math.round((overview.openErrorCount / workHealthTotal) * 100)}%
              </div>
              <div style={{ marginTop: 6, color: "rgba(255,255,255,0.6)", fontSize: 12 }}>
                {overview.openErrorCount} runtime issues still unresolved.
              </div>
            </div>
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {[
              { label: "Feedback Inbox", value: overview.feedbackCount, color: "#f472b6" },
              { label: "Open Errors", value: overview.openErrorCount, color: "#f97316" },
            ].map((entry) => (
              <div key={entry.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 13 }}>{entry.label}</span>
                  <span style={{ color: entry.color, fontWeight: 700 }}>{entry.value}</span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(entry.value / workHealthTotal) * 100}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg,${entry.color},${entry.color}bb)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))", gap: 20 }}>
        <div className="space-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ color: "white", margin: 0, fontSize: 16, fontWeight: 700 }}>Recent Feedback</h3>
            <button
              type="button"
              onClick={() => navigate("/admin/feedback")}
              style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 12 }}
            >
              View All →
            </button>
          </div>

          {overview.recentFeedback.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.35)", padding: "24px 0" }}>No feedback submitted yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {overview.recentFeedback.map((entry) => (
                <div key={entry.id} style={{ padding: 12, borderRadius: 12, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
                    <div style={{ color: "white", fontWeight: 600 }}>{entry.full_name || "User"}</div>
                    <div style={{ color: "#a5b4fc", fontSize: 12, fontWeight: 700 }}>{entry.category}</div>
                  </div>
                  <div style={{ marginTop: 6, color: "rgba(255,255,255,0.7)", fontSize: 13, lineHeight: 1.5 }}>
                    {entry.message}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
            <h3 style={{ color: "white", margin: 0, fontSize: 16, fontWeight: 700 }}>Recent Errors</h3>
            <button
              type="button"
              onClick={() => navigate("/admin/errors")}
              style={{ background: "none", border: "none", color: "#818cf8", cursor: "pointer", fontSize: 12 }}
            >
              View All →
            </button>
          </div>

          {overview.recentErrors.length === 0 ? (
            <div style={{ color: "rgba(255,255,255,0.35)", padding: "24px 0" }}>No runtime errors logged right now.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {overview.recentErrors.map((entry) => (
                <div key={entry.id} style={{ padding: 12, borderRadius: 12, background: "rgba(248,113,113,0.08)", border: "1px solid rgba(248,113,113,0.15)" }}>
                  <div style={{ color: "white", fontWeight: 600 }}>{entry.message}</div>
                  <div style={{ marginTop: 6, color: "rgba(255,255,255,0.45)", fontSize: 12 }}>
                    {entry.source} • {timeAgo(entry.created_at)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
