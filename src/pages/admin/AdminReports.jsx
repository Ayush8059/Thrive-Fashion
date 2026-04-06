import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, TrendingUp, Users, HeartHandshake, Package } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { getAdminOverview } from "../../services/adminInsights";

const CATEGORY_COLORS = {
  Outerwear: "#6366f1",
  Dresses: "#ec4899",
  Shoes: "#06b6d4",
  Pants: "#8b5cf6",
  Tops: "#10b981",
  Other: "#f59e0b",
};

export default function AdminReports() {
  const [stats, setStats] = useState({
    users: 0,
    donations: 0,
    items: 0,
    activeUsers: 0,
    blockedUsers: 0,
    inactiveUsers: 0,
    deletedUsers: 0,
    feedbackCount: 0,
    openErrorCount: 0,
  });
  const [categories, setCategories] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const userHealthCards = [
    { label: "Active Users", value: stats.activeUsers, color: "#34d399" },
    { label: "Blocked Users", value: stats.blockedUsers, color: "#fbbf24" },
    { label: "Inactive Users", value: stats.inactiveUsers, color: "#f97316" },
    { label: "Deleted Users", value: stats.deletedUsers, color: "#f87171" },
    { label: "Feedback", value: stats.feedbackCount, color: "#a78bfa" },
    { label: "Open Errors", value: stats.openErrorCount, color: "#fb7185" },
  ];
  const healthTotal = Math.max(1, stats.activeUsers + stats.blockedUsers + stats.inactiveUsers + stats.deletedUsers);

  useEffect(() => {
    void fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [{ count: donationCount }, { data: itemsData }, { data: recentActivity }, overview] = await Promise.all([
        supabase.from("donations").select("*", { count: "exact", head: true }),
        supabase.from("items").select("id,category,status,title,created_at").order("created_at", { ascending: false }),
        supabase.from("items").select("id,title,status,created_at").order("created_at", { ascending: false }).limit(5),
        getAdminOverview(),
      ]);

      setStats({
        users: overview.users,
        donations: donationCount || 0,
        items: (itemsData || []).length,
        activeUsers: overview.activeUsers,
        blockedUsers: overview.blockedUsers,
        inactiveUsers: overview.inactiveUsers,
        deletedUsers: overview.deletedUsers,
        feedbackCount: overview.feedbackCount,
        openErrorCount: overview.openErrorCount,
      });

      const catMap = {};
      (itemsData || []).forEach((item) => {
        const category = item.category || "Other";
        catMap[category] = (catMap[category] || 0) + 1;
      });
      const total = Object.values(catMap).reduce((sum, value) => sum + value, 1);
      setCategories(
        Object.entries(catMap)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([name, count]) => ({ name, count, pct: Math.round((count / total) * 100) })),
      );

      setActivity(recentActivity || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const csv = [
      ["Metric", "Value"],
      ["Total Users", stats.users],
      ["Active Users", stats.activeUsers],
      ["Blocked Users", stats.blockedUsers],
      ["Inactive Users", stats.inactiveUsers],
      ["Deleted Users", stats.deletedUsers],
      ["Total Donations", stats.donations],
      ["Total Items", stats.items],
      ["Feedback Count", stats.feedbackCount],
      ["Open Errors", stats.openErrorCount],
      ...categories.map((entry) => [`Items - ${entry.name}`, entry.count]),
    ]
      .map((row) => row.join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "thrive_report.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const metricCards = [
    { title: "New Users", value: stats.users, icon: <Users size={20} />, color: "#818cf8", glow: "rgba(99,102,241,0.3)" },
    { title: "Total Donations", value: stats.donations, icon: <HeartHandshake size={20} />, color: "#f472b6", glow: "rgba(236,72,153,0.3)" },
    { title: "Total Items", value: stats.items, icon: <Package size={20} />, color: "#22d3ee", glow: "rgba(6,182,212,0.3)" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 300 }}>
        <div
          style={{
            width: 36,
            height: 36,
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
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h1
            style={{
              fontSize: 28,
              fontWeight: 800,
              color: "white",
              margin: 0,
              background: "linear-gradient(135deg,#a5b4fc,white)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            Analytics & Reports
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 4, fontSize: 13 }}>
            Platform performance, user health, and category distribution.
          </p>
        </div>

        <button
          onClick={handleExport}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 18px",
            background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
            border: "none",
            borderRadius: 10,
            color: "white",
            fontWeight: 700,
            fontSize: 13,
            cursor: "pointer",
            boxShadow: "0 0 20px rgba(99,102,241,0.3)",
          }}
        >
          <Download size={15} /> Export CSV
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))", gap: 18 }}>
        {metricCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`space-card float-card-d${index}`}
            style={{ padding: 22, cursor: "default" }}
            whileHover={{ y: -6, boxShadow: `0 0 40px ${card.glow}`, transition: { duration: 0.2 } }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 10,
                  background: `${card.glow.replace("0.3", "0.15")}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: card.color,
                  border: `1px solid ${card.glow.replace("0.3", "0.25")}`,
                }}
              >
                {card.icon}
              </div>
              <TrendingUp size={14} color="rgba(255,255,255,0.2)" />
            </div>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.45)", fontWeight: 600, marginBottom: 4 }}>
              {card.title}
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: card.color }}>{card.value}</div>
          </motion.div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="space-card" style={{ padding: 24 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 24 }}>
            <BarChart3 size={18} color="#818cf8" />
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: "white" }}>Items by Category</h3>
          </div>

          {categories.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No items data available</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {categories.map((cat, index) => {
                const color = CATEGORY_COLORS[cat.name] || "#6366f1";
                return (
                  <div key={cat.name}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                      <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{cat.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color }}>{cat.count}</span>
                    </div>
                    <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 20, overflow: "hidden" }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${cat.pct}%` }}
                        transition={{ delay: 0.4 + index * 0.08, duration: 0.7, ease: "easeOut" }}
                        style={{ height: "100%", borderRadius: 20, background: `linear-gradient(90deg,${color},${color}88)` }}
                      />
                    </div>
                    <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginTop: 3, textAlign: "right" }}>{cat.pct}%</div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="space-card" style={{ padding: 24 }}>
          <h3 style={{ margin: "0 0 20px", fontSize: 15, fontWeight: 700, color: "white" }}>Recent Activity</h3>

          {activity.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "rgba(255,255,255,0.3)", fontSize: 13 }}>No recent activity</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
              {activity.map((item, index) => (
                <div
                  key={item.id}
                  style={{
                    display: "flex",
                    alignItems: "flex-start",
                    gap: 12,
                    paddingBottom: 16,
                    marginBottom: 16,
                    borderBottom: index < activity.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                  }}
                >
                  <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "center", marginTop: 4 }}>
                    <div style={{ width: 10, height: 10, borderRadius: "50%", background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }} />
                    {index < activity.length - 1 && <div style={{ width: 1, height: 24, background: "rgba(99,102,241,0.15)", marginTop: 4 }} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: "white", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {item.title}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 3 }}>
                      <span
                        style={{
                          fontSize: 10,
                          padding: "2px 8px",
                          borderRadius: 10,
                          fontWeight: 600,
                          textTransform: "capitalize",
                          ...(item.status === "active"
                            ? { background: "rgba(16,185,129,0.15)", color: "#34d399" }
                            : { background: "rgba(245,158,11,0.15)", color: "#fbbf24" }),
                        }}
                      >
                        {item.status}
                      </span>
                      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{timeAgo(item.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 20 }}>
        <div className="space-card" style={{ padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "white" }}>User Health Mix</h3>

          <div style={{ display: "flex", gap: 6, height: 12 }}>
            {userHealthCards.slice(0, 4).map((card) => (
              <div
                key={card.label}
                style={{
                  flex: Math.max(card.value, card.value > 0 ? 1 : 0),
                  minWidth: card.value ? 14 : 0,
                  borderRadius: 999,
                  background: `linear-gradient(90deg,${card.color},${card.color}bb)`,
                }}
              />
            ))}
          </div>

          <div style={{ marginTop: 18, display: "flex", flexDirection: "column", gap: 12 }}>
            {userHealthCards.slice(0, 4).map((card) => (
              <div key={card.label}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                  <span style={{ color: "rgba(255,255,255,0.72)", fontSize: 13 }}>{card.label}</span>
                  <span style={{ color: card.color, fontWeight: 700 }}>
                    {card.value} ({Math.round((card.value / healthTotal) * 100)}%)
                  </span>
                </div>
                <div style={{ height: 8, background: "rgba(255,255,255,0.05)", borderRadius: 999, overflow: "hidden" }}>
                  <div
                    style={{
                      width: `${(card.value / healthTotal) * 100}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: `linear-gradient(90deg,${card.color},${card.color}bb)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-card" style={{ padding: 22 }}>
          <h3 style={{ margin: "0 0 16px", fontSize: 15, fontWeight: 700, color: "white" }}>Support Pressure</h3>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            {userHealthCards.slice(4).map((card) => (
              <div
                key={card.label}
                style={{
                  borderRadius: 16,
                  padding: 16,
                  background: `${card.color}12`,
                  border: `1px solid ${card.color}22`,
                }}
              >
                <div style={{ color: "rgba(255,255,255,0.45)", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.7px" }}>
                  {card.label}
                </div>
                <div style={{ marginTop: 8, fontSize: 28, fontWeight: 800, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 16 }}>
        {userHealthCards.map((card) => (
          <div key={card.label} className="space-card" style={{ padding: 18 }}>
            <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.8px", color: "rgba(255,255,255,0.45)", fontWeight: 600 }}>
              {card.label}
            </div>
            <div style={{ marginTop: 8, fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
