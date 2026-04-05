import { Outlet, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import AnimatedBackground from "../components/AnimatedBackground";
import ChatbotLauncher from "../components/ChatbotLauncher";
import { useAuth } from "../context/AuthContext";

export default function DashboardLayout() {
  const { user, profile, loading, logout } = useAuth();
  const isBlocked = profile?.is_blocked || profile?.status === "blocked" || profile?.status === "deleted";
  const isInactive = profile?.status && !["active", "blocked", "deleted"].includes(profile.status);

  useEffect(() => {
    if (user && (isBlocked || isInactive)) {
      void logout();
    }
  }, [user, isBlocked, isInactive, logout]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060b22] text-white">
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-white/20 border-t-primary" />
          <p className="text-sm tracking-wide text-white/70">Restoring your session...</p>
        </div>
      </div>
    );
  }

  if (!user) return <Navigate to="/" />;
  if (isBlocked || isInactive) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#060b22] text-white">
        <p className="text-sm tracking-wide text-white/70">Access revoked. Signing out...</p>
      </div>
    );
  }

  if (profile?.is_admin) return <Navigate to="/admin" />;

  return (
    <div className="min-h-screen flex flex-col relative overflow-hidden">
      <AnimatedBackground />
      <Navbar />
      <ChatbotLauncher />

      <div className="flex flex-1 pt-16">
        <Sidebar />

        <main className="flex-1 p-6 lg:p-10 ml-0 md:ml-64 overflow-y-auto w-full">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
