import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Package, HeartHandshake, TrendingUp } from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useNavigate } from "react-router-dom";

const S = {
  label: { fontSize:11, textTransform:"uppercase", letterSpacing:"0.8px", color:"rgba(255,255,255,0.45)", fontWeight:600, marginBottom:4 },
  value: { fontSize:26, fontWeight:700, color:"white" },
};

const timeAgo = (dateStr) => {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
  if (diff < 60)    return `${diff}s ago`;
  if (diff < 3600)  return `${Math.floor(diff/60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`;
  return `${Math.floor(diff/86400)}d ago`;
};

const cardGlow = {
  indigo: "0 8px 40px rgba(99,102,241,0.25)",
  purple: "0 8px 40px rgba(139,92,246,0.25)",
  cyan:   "0 8px 40px rgba(6,182,212,0.25)",
  green:  "0 8px 40px rgba(16,185,129,0.25)",
};

const STAT_CFG = [
  { key:"users",     title:"Total Users",     icon:<Users size={22}/>,         color:"#818cf8", glow:"indigo", emoji:"👥", trend:"+active" },
  { key:"items",     title:"Active Listings",  icon:<Package size={22}/>,       color:"#a78bfa", glow:"purple", emoji:"📦", trend:"live now" },
  { key:"donations", title:"Total Donations",  icon:<HeartHandshake size={22}/>,color:"#22d3ee", glow:"cyan",   emoji:"💎", trend:"all time" },
  { key:"health",    title:"Platform Health",  icon:<TrendingUp size={22}/>,    color:"#34d399", glow:"green",  emoji:"✅", trend:"all systems up" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]           = useState({ users:0, items:0, donations:0, health:"Good" });
  const [recentUsers, setRecentUsers] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [loading, setLoading]       = useState(true);

  useEffect(() => { fetchStats(); }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const [
        { count: userCount },
        { count: itemCount },
        { count: donationCount },
        { data: recentUsersData },
        { data: recentItemsData },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count:"exact", head:true }),
        supabase.from("items").select("*", { count:"exact", head:true }).eq("status","active"),
        supabase.from("donations").select("*", { count:"exact", head:true }),
        supabase.from("profiles").select("full_name,email,created_at").order("created_at",{ascending:false}).limit(5),
        supabase.from("items").select("id,title,price,status,created_at").order("created_at",{ascending:false}).limit(5),
      ]);
      setStats({ users: userCount||0, items: itemCount||0, donations: donationCount||0, health:"Good" });
      setRecentUsers(recentUsersData || []);
      setRecentItems(recentItemsData || []);
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const statValues = {
    users: stats.users,
    items: stats.items,
    donations: stats.donations,
    health: "Good ✓",
  };

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:300 }}>
        <div style={{
          width:44, height:44, borderRadius:"50%",
          border:"2px solid transparent",
          borderTopColor:"#6366f1", borderRightColor:"#8b5cf6",
          animation:"spin-dash 1s linear infinite",
        }}/>
        <style>{`@keyframes spin-dash{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} style={{ display:"flex", flexDirection:"column", gap:28 }}>

      {/* Header */}
      <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.05 }}>
        <h1 style={{ fontSize:30, fontWeight:800, color:"white", margin:0,
          background:"linear-gradient(135deg,#a5b4fc,white)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Platform Overview
        </h1>
        <p style={{ color:"rgba(255,255,255,0.4)", marginTop:4, fontSize:14 }}>
          Track key metrics and recent activity across Thrive
        </p>
      </motion.div>

      {/* Stat Cards */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))", gap:20 }}>
        {STAT_CFG.map((cfg, i) => {
          const delay = i * 0.08;
          const floatClass = ["float-card","float-card-d1","float-card-d2","float-card-d3"][i];
          return (
            <motion.div
              key={cfg.key}
              initial={{ opacity:0, y:30 }}
              animate={{ opacity:1, y:0 }}
              transition={{ delay: 0.1 + delay, duration:0.5 }}
              className={`space-card ${floatClass}`}
              style={{ padding:24, cursor:"default" }}
              whileHover={{
                y: -8, scale:1.02,
                boxShadow: cardGlow[cfg.glow],
                transition:{ duration:0.2 }
              }}
            >
              <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:16 }}>
                <div style={{
                  width:48, height:48, borderRadius:12,
                  background:`rgba(${cfg.glow==="indigo"?"99,102,241":cfg.glow==="purple"?"139,92,246":cfg.glow==="cyan"?"6,182,212":"16,185,129"},0.15)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  color: cfg.color,
                  border:`1px solid rgba(${cfg.glow==="indigo"?"99,102,241":cfg.glow==="purple"?"139,92,246":cfg.glow==="cyan"?"6,182,212":"16,185,129"},0.2)`,
                }}>
                  {cfg.icon}
                </div>
                <span style={{
                  fontSize:11, color:"rgba(255,255,255,0.4)",
                  background:"rgba(255,255,255,0.06)",
                  border:"1px solid rgba(255,255,255,0.08)",
                  borderRadius:20, padding:"3px 10px",
                }}>
                  {cfg.trend}
                </span>
              </div>
              <div style={S.label}>{cfg.title}</div>
              <div style={{ ...S.value, fontSize:32, color: cfg.color,
                textShadow:`0 0 30px ${cfg.color}60` }}>
                {statValues[cfg.key]}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Bottom panels */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* Platform Summary */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.45 }}
          className="space-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <h3 style={{ color:"white", fontSize:16, fontWeight:700, margin:0 }}>Platform Summary</h3>
            <button onClick={() => navigate("/admin/reports")}
              style={{ background:"none", border:"none", color:"#818cf8", fontSize:12,
                cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
              View Reports →
            </button>
          </div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {[
              { label:"Total Registered Users",   value:stats.users,     color:"#818cf8", accentBg:"rgba(99,102,241,0.1)" },
              { label:"Active Marketplace Items",  value:stats.items,     color:"#a78bfa", accentBg:"rgba(139,92,246,0.1)" },
              { label:"Total Donations Submitted", value:stats.donations, color:"#22d3ee", accentBg:"rgba(6,182,212,0.1)" },
            ].map(row => (
              <div key={row.label} style={{
                display:"flex", alignItems:"center", justifyContent:"space-between",
                padding:"14px 16px", borderRadius:10,
                background:row.accentBg,
                border:`1px solid ${row.color}30`,
                position:"relative", overflow:"hidden",
              }}>
                <div style={{ position:"absolute", left:0, top:0, bottom:0, width:3, background:row.color, borderRadius:"4px 0 0 4px" }}/>
                <span style={{ fontSize:13, color:"rgba(255,255,255,0.65)", marginLeft:8 }}>{row.label}</span>
                <span style={{ fontSize:20, fontWeight:700, color:row.color }}>{row.value}</span>
              </div>
            ))}
          </div>

          {/* Recent items */}
          {recentItems.length > 0 && (
            <div style={{ marginTop:24 }}>
              <div style={{ fontSize:11, textTransform:"uppercase", letterSpacing:"0.8px",
                color:"rgba(255,255,255,0.35)", fontWeight:600, marginBottom:12 }}>
                Recent Listings
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
                {recentItems.map(item => (
                  <div key={item.id} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 12px", borderRadius:8,
                    background:"rgba(255,255,255,0.03)",
                    border:"1px solid rgba(255,255,255,0.05)",
                  }}>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <Package size={14} color="rgba(255,255,255,0.3)"/>
                      <span style={{ fontSize:13, color:"rgba(255,255,255,0.75)",
                        maxWidth:140, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
                        {item.title}
                      </span>
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                      <span style={{ fontSize:13, fontWeight:600, color:"white" }}>Rs.{item.price}</span>
                      <span style={{
                        fontSize:10, fontWeight:700, padding:"2px 8px", borderRadius:12,
                        ...(item.status==="active"
                          ? { background:"rgba(16,185,129,0.15)", color:"#34d399" }
                          : { background:"rgba(245,158,11,0.15)", color:"#fbbf24" }),
                      }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* Recent Signups */}
        <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.55 }}
          className="space-card" style={{ padding:24 }}>
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20 }}>
            <h3 style={{ color:"white", fontSize:16, fontWeight:700, margin:0 }}>Recent Signups</h3>
            <button onClick={() => navigate("/admin/users")}
              style={{ background:"none", border:"none", color:"#818cf8", fontSize:12,
                cursor:"pointer", fontFamily:"'Inter',sans-serif" }}>
              View All →
            </button>
          </div>

          {recentUsers.length === 0 ? (
            <div style={{ textAlign:"center", padding:"40px 0", color:"rgba(255,255,255,0.3)" }}>
              <Users size={36} style={{ marginBottom:12, opacity:0.2 }}/>
              <p style={{ margin:0, fontSize:14 }}>No users yet</p>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
              {recentUsers.map((u,i) => {
                const GRAD_COLORS = ["#6366f1,#8b5cf6","#8b5cf6,#ec4899","#06b6d4,#6366f1","#10b981,#06b6d4","#f59e0b,#ef4444"];
                return (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", gap:12,
                    padding:"10px 12px", borderRadius:10,
                    transition:"background 0.2s",
                    border:"1px solid rgba(255,255,255,0.04)",
                  }}
                  onMouseEnter={e => e.currentTarget.style.background="rgba(99,102,241,0.06)"}
                  onMouseLeave={e => e.currentTarget.style.background="transparent"}
                  >
                    <div style={{
                      width:36, height:36, borderRadius:"50%",
                      background:`linear-gradient(135deg,${GRAD_COLORS[i%GRAD_COLORS.length]})`,
                      display:"flex", alignItems:"center", justifyContent:"center",
                      fontSize:14, fontWeight:700, color:"white", flexShrink:0,
                    }}>
                      {u.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ fontSize:13, fontWeight:600, color:"white",
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {u.full_name || "Unknown"}
                      </div>
                      <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)",
                        whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
                        {u.email}
                      </div>
                    </div>
                    <span style={{ fontSize:11, color:"rgba(255,255,255,0.3)", flexShrink:0 }}>
                      {timeAgo(u.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}