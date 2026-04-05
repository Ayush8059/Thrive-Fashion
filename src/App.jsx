import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { useAuth } from "./context/AuthContext";

const AuthLayout = lazy(() => import("./layouts/AuthLayout"));
const DashboardLayout = lazy(() => import("./layouts/DashboardLayout"));
const AdminLayout = lazy(() => import("./layouts/AdminLayout"));

const Login = lazy(() => import("./pages/auth/Login"));
const Signup = lazy(() => import("./pages/auth/Signup"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

const Home = lazy(() => import("./pages/dashboard/Home"));
const Wardrobe = lazy(() => import("./pages/dashboard/Wardrobe"));
const Sell = lazy(() => import("./pages/dashboard/Sell"));
const Donate = lazy(() => import("./pages/dashboard/Donate"));
const Profile = lazy(() => import("./pages/dashboard/Profile"));
const MyItems = lazy(() => import("./pages/dashboard/MyItems"));
const Marketplace = lazy(() => import("./pages/dashboard/Marketplace"));
const ItemDetails = lazy(() => import("./pages/dashboard/ItemDetails"));
const Wishlist = lazy(() => import("./pages/dashboard/Wishlist"));
const Cart = lazy(() => import("./pages/dashboard/Cart"));
const Orders = lazy(() => import("./pages/dashboard/Orders"));
const Sales = lazy(() => import("./pages/dashboard/Sales"));
const Messages = lazy(() => import("./pages/dashboard/Messages"));
const DonationHistory = lazy(() => import("./pages/dashboard/DonationHistory"));
const About = lazy(() => import("./pages/dashboard/About"));

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminItems = lazy(() => import("./pages/admin/AdminItems"));
const AdminDonations = lazy(() => import("./pages/admin/AdminDonations"));
const AdminReports = lazy(() => import("./pages/admin/AdminReports"));
const AdminSettings = lazy(() => import("./pages/admin/AdminSettings"));

function isAccessRevoked(profile) {
  return Boolean(profile?.is_blocked) || (profile?.status && profile.status !== "active");
}

function ProtectedRoute() {
  const { user, profile, loading, logout } = useAuth();

  useEffect(() => {
    if (user && isAccessRevoked(profile)) {
      void logout();
    }
  }, [user, profile, logout]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user && isAccessRevoked(profile)) {
    return <div className="min-h-screen flex items-center justify-center">Access revoked. Signing out...</div>;
  }
  return user ? <Outlet /> : <Navigate to="/" replace />;
}

function PublicRoute() {
  const { user, profile, loading, logout } = useAuth();

  useEffect(() => {
    if (user && isAccessRevoked(profile)) {
      void logout();
    }
  }, [user, profile, logout]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user && isAccessRevoked(profile)) return <div className="min-h-screen flex items-center justify-center">Access revoked. Signing out...</div>;
  if (!user) return <Outlet />;
  return profile?.is_admin
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/dashboard" replace />;
}

function AdminEntryRoute() {
  const { user, profile, loading, logout } = useAuth();

  useEffect(() => {
    if (user && isAccessRevoked(profile)) {
      void logout();
    }
  }, [user, profile, logout]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (user && isAccessRevoked(profile)) return <div className="min-h-screen flex items-center justify-center">Access revoked. Signing out...</div>;
  if (!user) return <AdminLogin />;
  return profile?.is_admin
    ? <Navigate to="/admin/dashboard" replace />
    : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
        <Routes>

        {/* AUTH */}
        <Route element={<PublicRoute />}>
          <Route element={<AuthLayout />}>
            <Route path="/" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
          </Route>
        </Route>

        {/* DASHBOARD */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Home />} />
            <Route path="/wardrobe" element={<Wardrobe />} />
            <Route path="/sell" element={<Sell />} />
            <Route path="/donate" element={<Donate />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/items" element={<MyItems />} />
            <Route path="/marketplace" element={<Marketplace />} />
            <Route path="/item/:id" element={<ItemDetails />} />
            <Route path="/wishlist" element={<Wishlist />} />
            <Route path="/cart" element={<Cart />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/sales" element={<Sales />} />
            <Route path="/messages" element={<Messages />} />
            <Route path="/donations/history" element={<DonationHistory />} />
            <Route path="/about" element={<About />} />
          </Route>
        </Route>

        {/* ADMIN */}
        <Route path="/admin" element={<AdminEntryRoute />} />
        <Route element={<AdminLayout />}>
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin/users" element={<AdminUsers />} />
          <Route path="/admin/items" element={<AdminItems />} />
          <Route path="/admin/donations" element={<AdminDonations />} />
          <Route path="/admin/reports" element={<AdminReports />} />
          <Route path="/admin/settings" element={<AdminSettings />} />
        </Route>

        {/* FALLBACK */}
        <Route path="*" element={<Navigate to="/" replace />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
