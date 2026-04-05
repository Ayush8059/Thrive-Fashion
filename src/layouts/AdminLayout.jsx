import { Outlet, Navigate } from "react-router-dom";
import { useState } from "react";
import { AdminSidebar, AdminNavbar, SpaceBackground } from "./AdminComponents";
import { useAuth } from "../context/AuthContext";

export default function AdminLayout() {
  const { user, profile, loading } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  if (loading) {
    return (
      <div style={{
        minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center",
        background:"linear-gradient(135deg, #050818 0%, #0a0f2e 50%, #060d1f 100%)",
      }}>
        <div style={{ textAlign:"center" }}>
          <div style={{
            width:50, height:50, borderRadius:"50%",
            border:"2px solid transparent",
            borderTopColor:"#6366f1",
            borderRightColor:"#8b5cf6",
            animation:"spin-slow 1s linear infinite",
            margin:"0 auto 16px",
          }} />
          <div style={{ color:"rgba(255,255,255,0.4)", fontSize:13, letterSpacing:"1px" }}>
            VERIFYING ACCESS…
          </div>
        </div>
        <style>{`@keyframes spin-slow { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const isBlocked = profile?.is_blocked || profile?.status === "blocked";
  const isInactive = profile?.status && profile.status !== "active" && profile.status !== "blocked";

  if (!user) return <Navigate to="/admin" replace />;
  if (!profile?.is_admin || isBlocked || isInactive) return <Navigate to="/" replace />;
  return (
    <div className="admin-space-root" style={{
      display:"flex", minHeight:"100vh",
      background:"linear-gradient(135deg, #050818 0%, #0a0f2e 50%, #060d1f 100%)",
      position:"relative",
      fontFamily:"'Inter', 'Segoe UI', sans-serif",
    }}>
      <SpaceBackground />

      <AdminSidebar
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        adminProfile={profile}
      />

      <div style={{ flex:1, display:"flex", flexDirection:"column", minWidth:0, position:"relative", zIndex:1 }}>
        <AdminNavbar
          isOpen={isSidebarOpen}
          setIsOpen={setIsSidebarOpen}
          adminProfile={profile}
        />
        <main style={{ flex:1, overflowX:"hidden", overflowY:"auto", padding:"28px 28px 40px" }}>
          <div style={{ maxWidth:1400, margin:"0 auto" }}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
