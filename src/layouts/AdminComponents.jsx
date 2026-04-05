import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Menu, X, LayoutDashboard, Users, Package,
  HeartHandshake, BarChart3, Settings, LogOut, Shield, Bell, Zap
} from "lucide-react";
import { supabase } from "../supabaseClient";

/* ─── Shared space CSS injected once ─────────────────────────────── */
const SPACE_STYLE = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');

.admin-space-root * { font-family: 'Inter', 'Segoe UI', sans-serif; box-sizing: border-box; }

@keyframes float-card {
  0%,100% { transform: perspective(800px) rotateX(2deg) rotateY(-1deg) translateY(0px); }
  50%      { transform: perspective(800px) rotateX(2deg) rotateY(-1deg) translateY(-6px); }
}
@keyframes pulse-glow {
  0%,100% { box-shadow: 0 0 20px rgba(99,102,241,0.5), 0 0 40px rgba(99,102,241,0.2); }
  50%     { box-shadow: 0 0 30px rgba(99,102,241,0.8), 0 0 60px rgba(99,102,241,0.4); }
}
@keyframes orbit-spin {
  from { transform: translate(-50%,-50%) rotateX(75deg) rotate(0deg); }
  to   { transform: translate(-50%,-50%) rotateX(75deg) rotate(360deg); }
}
@keyframes orb-float {
  0%,100% { transform: translateY(0) scale(1); }
  50%     { transform: translateY(-20px) scale(1.1); }
}
@keyframes bar-grow { from { width: 0; } }
@keyframes twinkle {
  0%,100% { opacity: 0.3; }
  50%     { opacity: 1; }
}
@keyframes slide-in-up {
  from { opacity: 0; transform: translateY(30px); }
  to   { opacity: 1; transform: translateY(0); }
}
@keyframes number-count {
  from { opacity: 0; transform: scale(0.5); }
  to   { opacity: 1; transform: scale(1); }
}
@keyframes spin-slow { to { transform: rotate(360deg); } }

.float-card { animation: float-card 6s ease-in-out infinite; }
.float-card-d1 { animation: float-card 6s ease-in-out 1s infinite; }
.float-card-d2 { animation: float-card 6s ease-in-out 2s infinite; }
.float-card-d3 { animation: float-card 6s ease-in-out 3s infinite; }
.pulse-glow { animation: pulse-glow 3s ease-in-out infinite; }
.orb-float  { animation: orb-float  8s ease-in-out infinite; }
.slide-in-up { animation: slide-in-up 0.5s ease forwards; }
.number-count { animation: number-count 0.6s cubic-bezier(.17,.67,.83,.67) forwards; }

.space-card {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  position: relative;
  overflow: hidden;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.space-card::before {
  content: '';
  position: absolute; top: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(99,102,241,0.5), transparent);
}
.space-card:hover {
  transform: translateY(-4px) scale(1.01);
}
.space-input {
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 10px;
  color: white;
  transition: border-color 0.2s, box-shadow 0.2s;
  width: 100%;
  padding: 10px 14px;
  outline: none;
  font-size: 14px;
}
.space-input::placeholder { color: rgba(255,255,255,0.3); }
.space-input:focus {
  border-color: rgba(99,102,241,0.6);
  box-shadow: 0 0 20px rgba(99,102,241,0.2);
}
.space-btn-primary {
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  border: none; border-radius: 10px; color: white;
  font-weight: 600; cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}
.space-btn-primary:hover {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(99,102,241,0.5);
}
.space-btn-primary:active { transform: scale(0.98); }

.badge-active  { background:rgba(16,185,129,0.15);  color:#34d399; border:1px solid rgba(16,185,129,0.2); }
.badge-blocked { background:rgba(239,68,68,0.15);   color:#f87171; border:1px solid rgba(239,68,68,0.2); }
.badge-pending { background:rgba(245,158,11,0.15);  color:#fbbf24; border:1px solid rgba(245,158,11,0.2); }
.badge-admin   { background:rgba(99,102,241,0.15);  color:#818cf8; border:1px solid rgba(99,102,241,0.2); }
.badge-sold    { background:rgba(6,182,212,0.15);   color:#22d3ee; border:1px solid rgba(6,182,212,0.2); }

.space-table th {
  background: rgba(255,255,255,0.03);
  color: rgba(255,255,255,0.4);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.06);
}
.space-table td {
  padding: 14px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.04);
  color: rgba(255,255,255,0.85);
  font-size: 14px;
  vertical-align: middle;
}
.space-table tr { transition: background 0.2s; }
.space-table tr:hover td { background: rgba(99,102,241,0.05); }
.space-table tr:hover .row-actions { opacity: 1; }
.row-actions { opacity: 0; transition: opacity 0.2s; }

.label-tag {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.8px;
  color: rgba(255,255,255,0.45);
  font-weight: 500;
}
.value-glow {
  font-size: 26px;
  font-weight: 700;
  color: white;
}
`;

let styleInjected = false;
function injectStyles() {
  if (styleInjected) return;
  styleInjected = true;
  const el = document.createElement("style");
  el.textContent = SPACE_STYLE;
  document.head.appendChild(el);
}

/* ─── Space Background (shared) ──────────────────────────────────── */
export function SpaceBackground() {
  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
      {/* Deep space gradient */}
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(135deg, #050818 0%, #0a0f2e 50%, #060d1f 100%)"
      }} />

      {/* Star field */}
      {[...Array(80)].map((_, i) => (
        <div key={i} style={{
          position: "absolute",
          width: i % 5 === 0 ? 2.5 : 1.5,
          height: i % 5 === 0 ? 2.5 : 1.5,
          background: "white",
          borderRadius: "50%",
          left: `${(i * 137.5) % 100}%`,
          top: `${(i * 93.7) % 100}%`,
          opacity: 0.3 + (i % 4) * 0.15,
          animation: `twinkle ${2 + (i % 4)}s ease-in-out ${(i * 0.3) % 3}s infinite`,
        }} />
      ))}

      {/* Perspective grid */}
      <div style={{
        position: "absolute", bottom: -100, left: "50%",
        transform: "translateX(-50%) rotateX(65deg)",
        width: 1400, height: 600,
        backgroundImage: `
          linear-gradient(rgba(99,102,241,0.15) 1px, transparent 1px),
          linear-gradient(90deg, rgba(99,102,241,0.15) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
        transformOrigin: "bottom center",
        opacity: 0.6,
      }} />

      {/* Floating orbs */}
      <div className="orb-float" style={{
        position:"absolute", top:"15%", right:"10%",
        width:400, height:400,
        background:"radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)",
        borderRadius:"50%", filter:"blur(40px)",
        animationDuration:"10s",
      }} />
      <div className="orb-float" style={{
        position:"absolute", bottom:"20%", left:"5%",
        width:350, height:350,
        background:"radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)",
        borderRadius:"50%", filter:"blur(40px)",
        animationDuration:"13s", animationDelay:"2s",
      }} />
      <div className="orb-float" style={{
        position:"absolute", top:"50%", left:"50%",
        width:300, height:300,
        background:"radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
        borderRadius:"50%", filter:"blur(40px)",
        animationDuration:"15s", animationDelay:"5s",
      }} />

      {/* Orbit rings */}
      {[350, 550].map((size, i) => (
        <div key={i} style={{
          position:"absolute", top:"30%", left:"75%",
          width:size, height:size,
          border:"1px solid rgba(99,102,241,0.15)",
          borderRadius:"50%",
          transform:`translate(-50%,-50%) rotateX(75deg) rotate(${i*45}deg)`,
          animation:`orbit-spin ${20+i*10}s linear infinite`,
          animationDirection: i % 2 === 0 ? "normal" : "reverse",
        }} />
      ))}
    </div>
  );
}

/* ─── Admin Sidebar ───────────────────────────────────────────────── */
const links = [
  { name:"Dashboard", path:"/admin/dashboard", icon:<LayoutDashboard size={18}/>, emoji:"🚀" },
  { name:"Users",     path:"/admin/users",     icon:<Users size={18}/>,           emoji:"👥" },
  { name:"Items",     path:"/admin/items",     icon:<Package size={18}/>,         emoji:"📦" },
  { name:"Donations", path:"/admin/donations", icon:<HeartHandshake size={18}/>,  emoji:"💎" },
  { name:"Reports",   path:"/admin/reports",   icon:<BarChart3 size={18}/>,       emoji:"📊" },
  { name:"Settings",  path:"/admin/settings",  icon:<Settings size={18}/>,        emoji:"⚙️" },
];

export function AdminSidebar({ isOpen, setIsOpen, adminProfile }) {
  injectStyles();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin");
  };

  const initials = adminProfile?.full_name
    ?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) || "SA";

  const sidebarContent = (
    <div style={{
      width: 260,
      height: "100%",
      background: "rgba(5,8,24,0.97)",
      backdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(255,255,255,0.06)",
      display: "flex",
      flexDirection: "column",
      fontFamily: "'Inter', sans-serif",
    }}>
      {/* Logo */}
      <div style={{ padding:"20px 20px 16px", borderBottom:"1px solid rgba(255,255,255,0.06)" }}>
        <Link to="/admin/dashboard" style={{ display:"flex", alignItems:"center", gap:12, textDecoration:"none" }}>
          <div style={{
            width:38, height:38,
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center",
            boxShadow:"0 0 20px rgba(99,102,241,0.4)",
          }}>
            <Shield size={18} color="white" />
          </div>
          <div>
            <span style={{ fontSize:18, fontWeight:800, color:"white", letterSpacing:"-0.5px" }}>
              Thrive<span style={{ color:"#818cf8" }}>Admin</span>
            </span>
            <div style={{ fontSize:10, color:"rgba(255,255,255,0.4)", letterSpacing:"1.5px", textTransform:"uppercase" }}>
              Control Center
            </div>
          </div>
        </Link>
      </div>

      {/* Nav label */}
      <div style={{ padding:"16px 20px 8px" }}>
        <span style={{ fontSize:10, color:"rgba(255,255,255,0.3)", letterSpacing:"1.5px", textTransform:"uppercase", fontWeight:600 }}>
          Management
        </span>
      </div>

      {/* Links */}
      <div style={{ flex:1, overflowY:"auto", padding:"0 12px" }}>
        {links.map((link) => {
          const isActive = location.pathname === link.path || location.pathname.startsWith(link.path + "/");
          return (
            <Link key={link.path} to={link.path} style={{ textDecoration:"none", display:"block", marginBottom:4 }}
              onClick={() => setIsOpen && setIsOpen(false)}>
              <motion.div
                whileHover={{ x: 5 }}
                whileTap={{ scale: 0.97 }}
                style={{
                  display:"flex", alignItems:"center", gap:10,
                  padding:"10px 14px", borderRadius:10,
                  background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                  borderLeft: isActive ? "3px solid #6366f1" : "3px solid transparent",
                  boxShadow: isActive ? "inset 0 0 20px rgba(99,102,241,0.1)" : "none",
                  color: isActive ? "white" : "rgba(255,255,255,0.5)",
                  fontWeight: isActive ? 600 : 400,
                  fontSize: 14,
                  cursor:"pointer",
                  transition:"background 0.2s, color 0.2s",
                }}
              >
                <span style={{ opacity: isActive ? 1 : 0.7 }}>{link.icon}</span>
                <span>{link.name}</span>
                {isActive && (
                  <div style={{
                    marginLeft:"auto", width:6, height:6,
                    borderRadius:"50%", background:"#818cf8",
                    boxShadow:"0 0 8px rgba(129,140,248,0.8)",
                  }} />
                )}
              </motion.div>
            </Link>
          );
        })}
      </div>

      {/* Logout */}
      <div style={{ padding:"12px 12px", borderTop:"1px solid rgba(255,255,255,0.06)" }}>
        <motion.button
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.97 }}
          onClick={handleLogout}
          style={{
            display:"flex", alignItems:"center", gap:10,
            padding:"10px 14px", borderRadius:10, width:"100%",
            background:"transparent", border:"none",
            color:"rgba(255,255,255,0.4)", fontSize:14, cursor:"pointer",
            fontFamily:"'Inter',sans-serif",
            transition:"color 0.2s",
          }}
          onMouseEnter={e => {
            e.currentTarget.style.color = "#f87171";
            e.currentTarget.style.background = "rgba(239,68,68,0.08)";
          }}
          onMouseLeave={e => {
            e.currentTarget.style.color = "rgba(255,255,255,0.4)";
            e.currentTarget.style.background = "transparent";
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </motion.button>
      </div>

      {/* Admin profile footer */}
      {adminProfile && (
        <div style={{
          padding:"12px 16px",
          borderTop:"1px solid rgba(255,255,255,0.06)",
          display:"flex", alignItems:"center", gap:10,
        }}>
          <div style={{
            width:34, height:34, borderRadius:"50%",
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontSize:12, fontWeight:700, color:"white",
            flexShrink:0,
            boxShadow:"0 0 12px rgba(99,102,241,0.4)",
          }}>{initials}</div>
          <div style={{ minWidth:0 }}>
            <div style={{ fontSize:13, fontWeight:600, color:"white", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {adminProfile.full_name || "Admin"}
            </div>
            <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>
              {adminProfile.email}
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            style={{
              position:"fixed", inset:0, background:"rgba(0,0,0,0.7)",
              zIndex:40, backdropFilter:"blur(4px)",
              display: "none",
            }}
            className="lg-hide-overlay"
          />
        )}
      </AnimatePresence>

      {/* Desktop sidebar */}
      <div style={{ display:"none" }} className="desktop-sidebar-wrapper">
        <div style={{ width:260, flexShrink:0, position:"sticky", top:0, height:"100vh" }}>
          {sidebarContent}
        </div>
      </div>

      {/* Mobile sidebar */}
      <motion.div
        initial={false}
        animate={{ x: isOpen ? 0 : -280 }}
        transition={{ type:"spring", stiffness:300, damping:30 }}
        style={{
          position:"fixed", top:0, left:0, height:"100vh",
          zIndex:50,
          display: "none",
        }}
        className="mobile-sidebar"
      >
        {sidebarContent}
      </motion.div>

      {/* Always-visible sidebar for larger screens via inline flex */}
      <style>{`
        @media (min-width:1024px) {
          .desktop-sidebar-wrapper { display:block !important; }
          .mobile-sidebar { display:none !important; }
          .lg-hide-overlay { display:none !important; }
        }
        @media (max-width:1023px) {
          .desktop-sidebar-wrapper { display:none !important; }
          .mobile-sidebar { display:block !important; }
        }
      `}</style>
    </>
  );
}

/* ─── Admin Navbar ────────────────────────────────────────────────── */
export function AdminNavbar({ isOpen, setIsOpen, adminProfile }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState([]);
  const notifRef = useRef(null);

  const initials = adminProfile?.full_name
    ?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0,2) || "SA";

  useEffect(() => {
    if (!adminProfile?.id) return;

    let isMounted = true;

    const loadAdminNotifications = async () => {
      try {
        const [profilesResult, itemsResult, donationsResult] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, email, created_at")
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("items")
            .select("id, title, status, created_at")
            .order("created_at", { ascending: false })
            .limit(3),
          supabase
            .from("donations")
            .select("id, status, ngo_name, created_at")
            .order("created_at", { ascending: false })
            .limit(3),
        ]);

        const nextNotifications = [
          ...(profilesResult.data || []).map((profile) => ({
            id: `profile-${profile.id}`,
            type: "user",
            title: profile.full_name || profile.email || "New user",
            message: "New user registered on the platform.",
            created_at: profile.created_at,
          })),
          ...(itemsResult.data || []).map((item) => ({
            id: `item-${item.id}`,
            type: "item",
            title: item.title || "New listing",
            message: `Listing is now ${item.status || "active"}.`,
            created_at: item.created_at,
          })),
          ...(donationsResult.data || []).map((donation) => ({
            id: `donation-${donation.id}`,
            type: "donation",
            title: donation.ngo_name || "Donation update",
            message: `Donation marked ${String(donation.status || "pending").replace("_", " ")}.`,
            created_at: donation.created_at,
          })),
        ]
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 8);

        if (isMounted) {
          setAdminNotifications(nextNotifications);
        }
      } catch (error) {
        console.error("Admin notification load error:", error.message);
      }
    };

    loadAdminNotifications();

    const profilesChannel = supabase
      .channel("admin-profiles-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "profiles" }, loadAdminNotifications)
      .subscribe();

    const itemsChannel = supabase
      .channel("admin-items-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "items" }, loadAdminNotifications)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "items" }, loadAdminNotifications)
      .subscribe();

    const donationsChannel = supabase
      .channel("admin-donations-feed")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "donations" }, loadAdminNotifications)
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "donations" }, loadAdminNotifications)
      .subscribe();

    return () => {
      isMounted = false;
      profilesChannel.unsubscribe();
      itemsChannel.unsubscribe();
      donationsChannel.unsubscribe();
      supabase.removeChannel(profilesChannel);
      supabase.removeChannel(itemsChannel);
      supabase.removeChannel(donationsChannel);
    };
  }, [adminProfile?.id]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setNotifOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const timeAgo = (dateStr) => {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const notificationDotColor = (type) => {
    switch (type) {
      case "user":
        return "#22d3ee";
      case "item":
        return "#818cf8";
      case "donation":
        return "#34d399";
      default:
        return "#6366f1";
    }
  };

  return (
    <nav style={{
      position:"sticky", top:0, zIndex:30, height:64,
      background:"rgba(5,8,24,0.85)", backdropFilter:"blur(20px)",
      borderBottom:"1px solid rgba(255,255,255,0.06)",
      display:"flex", alignItems:"center", justifyContent:"space-between",
      padding:"0 24px",
      fontFamily:"'Inter', sans-serif",
    }}>
      {/* Left */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          style={{
            background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
            borderRadius:8, padding:"6px 8px", color:"rgba(255,255,255,0.7)",
            cursor:"pointer", display:"flex", alignItems:"center",
          }}
          className="lg-hamburger"
        >
          {isOpen ? <X size={18}/> : <Menu size={18}/>}
        </button>
        <style>{`.lg-hamburger { display:none; } @media(max-width:1023px){.lg-hamburger{display:flex!important;}}`}</style>

        <div>
          <div style={{ fontSize:15, fontWeight:700, color:"white", letterSpacing:"-0.3px" }}>
            Admin Dashboard
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", letterSpacing:"0.5px" }}>
            Welcome back, {adminProfile?.full_name?.split(" ")[0] || "Admin"}
          </div>
        </div>
      </div>

      {/* Right */}
      <div style={{ display:"flex", alignItems:"center", gap:12 }}>
        {/* Live indicator */}
        <div style={{ display:"flex", alignItems:"center", gap:6,
          background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.2)",
          borderRadius:20, padding:"4px 10px" }}>
          <div style={{ width:6, height:6, borderRadius:"50%", background:"#34d399",
            boxShadow:"0 0 8px rgba(52,211,153,0.8)", animation:"pulse-glow 2s infinite" }} />
          <span style={{ fontSize:11, color:"#34d399", fontWeight:600, letterSpacing:"0.5px" }}>LIVE</span>
        </div>

        {/* Notification bell */}
        <div style={{ position:"relative" }} ref={notifRef}>
          <button
            onClick={() => setNotifOpen(v => !v)}
            style={{
              background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.08)",
              borderRadius:8, padding:"8px", color:"rgba(255,255,255,0.6)",
              cursor:"pointer", position:"relative",
            }}
          >
            <Bell size={16}/>
            {adminNotifications.length > 0 && (
              <div style={{
                position:"absolute", top:4, right:4, minWidth:16, height:16,
                background:"#6366f1", borderRadius:"999px",
                boxShadow:"0 0 8px rgba(99,102,241,0.8)",
                display:"flex", alignItems:"center", justifyContent:"center",
                color:"white", fontSize:10, fontWeight:700, padding:"0 4px",
              }}>
                {adminNotifications.length > 9 ? "9+" : adminNotifications.length}
              </div>
            )}
          </button>
          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity:0, y:8, scale:0.95 }}
                animate={{ opacity:1, y:0, scale:1 }}
                exit={{ opacity:0, y:8, scale:0.95 }}
                style={{
                  position:"absolute", right:0, top:"calc(100% + 8px)",
                  width:260, background:"rgba(10,15,46,0.98)",
                  border:"1px solid rgba(255,255,255,0.1)",
                  borderRadius:12, padding:16,
                  boxShadow:"0 20px 60px rgba(0,0,0,0.5)",
                  zIndex:100,
                }}
              >
                <div style={{ fontSize:12, color:"rgba(255,255,255,0.4)", marginBottom:12,
                  textTransform:"uppercase", letterSpacing:"0.8px" }}>Notifications</div>
                {adminNotifications.length === 0 ? (
                  <div style={{ color:"rgba(255,255,255,0.45)", fontSize:13, padding:"8px 0" }}>
                    No recent platform alerts
                  </div>
                ) : (
                  adminNotifications.map((notification, index) => (
                    <div key={notification.id} style={{
                      padding:"10px 0",
                      borderBottom: index < adminNotifications.length - 1 ? "1px solid rgba(255,255,255,0.05)" : "none",
                      display:"flex",
                      alignItems:"flex-start",
                      gap:10,
                    }}>
                      <div style={{
                        width:6,
                        height:6,
                        borderRadius:"50%",
                        background: notificationDotColor(notification.type),
                        flexShrink:0,
                        marginTop:7,
                        boxShadow:`0 0 10px ${notificationDotColor(notification.type)}80`,
                      }}/>
                      <div style={{ minWidth:0 }}>
                        <div style={{ fontSize:13, color:"rgba(255,255,255,0.88)", fontWeight:600 }}>
                          {notification.title}
                        </div>
                        <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", marginTop:2 }}>
                          {notification.message}
                        </div>
                        <div style={{ fontSize:11, color:"rgba(255,255,255,0.3)", marginTop:4 }}>
                          {timeAgo(notification.created_at)}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Avatar */}
        <div style={{
          width:36, height:36, borderRadius:"50%",
          background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:13, fontWeight:700, color:"white",
          border:"2px solid rgba(99,102,241,0.4)",
          boxShadow:"0 0 15px rgba(99,102,241,0.4)",
          animation:"pulse-glow 3s infinite",
          cursor:"pointer",
        }}>
          {initials}
        </div>
      </div>
    </nav>
  );
}
