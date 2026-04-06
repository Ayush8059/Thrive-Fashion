import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Shirt, DollarSign, HeartHandshake,
  Package, UserCircle, Store, Heart, LogOut, ShoppingCart, ReceiptText, MessagesSquare, Info, MessageSquareHeart
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "../context/AuthContext";

export default function Sidebar() {
  const { profile, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const avatarLetter = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase();

  return (
    <aside className="fixed hidden md:flex flex-col w-64 h-[calc(100vh-4rem)] bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-r border-gray-100 dark:border-gray-800 p-4 shrink-0 overflow-y-auto z-40">

      {/* User info at top */}
      <div className="flex items-center gap-3 px-4 py-3 mb-6 rounded-xl bg-gray-50 dark:bg-slate-800/50">
        <div className="w-10 h-10 rounded-full bg-dark dark:bg-primary text-white dark:text-dark flex items-center justify-center font-bold text-sm shrink-0">
          {avatarLetter}
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-dark dark:text-white text-sm truncate">
            {profile?.full_name || "User"}
          </p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>
      </div>

      {/* Menu */}
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider mb-2 px-4">
          Menu
        </p>
        <SidebarLink to="/dashboard" icon={<LayoutDashboard />}>Dashboard</SidebarLink>
        <SidebarLink to="/wardrobe" icon={<Shirt />}>Virtual Wardrobe</SidebarLink>
        <SidebarLink to="/marketplace" icon={<Store />}>Marketplace</SidebarLink>
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-2 mb-8">
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-500 uppercase tracking-wider mb-2 px-4">
          Actions
        </p>
        <SidebarLink to="/sell" icon={<DollarSign />}>Sell Clothes</SidebarLink>
        <SidebarLink to="/donate" icon={<HeartHandshake />}>Donate</SidebarLink>
        <SidebarLink to="/donations/history" icon={<HeartHandshake />}>Donation Tracking</SidebarLink>
        <SidebarLink to="/wishlist" icon={<Heart />}>Wishlist</SidebarLink>
        <SidebarLink to="/cart" icon={<ShoppingCart />}>Cart</SidebarLink>
        <SidebarLink to="/orders" icon={<ReceiptText />}>My Orders</SidebarLink>
        <SidebarLink to="/sales" icon={<ReceiptText />}>Sales History</SidebarLink>
        <SidebarLink to="/messages" icon={<MessagesSquare />}>Messages</SidebarLink>
        <SidebarLink to="/items" icon={<Package />}>My Items</SidebarLink>
        <SidebarLink to="/feedback" icon={<MessageSquareHeart />}>Feedback</SidebarLink>
        <SidebarLink to="/about" icon={<Info />}>About Us</SidebarLink>
      </div>

      {/* Bottom */}
      <div className="mt-auto flex flex-col gap-2">
        <SidebarLink to="/profile" icon={<UserCircle />}>Profile</SidebarLink>

        {/* Logout */}
        <motion.button
          whileHover={{ x: 5 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-xl font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors w-full"
        >
          <div className="w-5 h-5">
            <LogOut />
          </div>
          <span>Logout</span>
        </motion.button>
      </div>
    </aside>
  );
}

function SidebarLink({ to, icon, children }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link to={to} className="relative block">
      <motion.div
        whileHover={{ x: 5 }}
        whileTap={{ scale: 0.98 }}
        className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors ${
          isActive
            ? "text-white z-10 relative"
            : "text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-white"
        }`}
      >
        {isActive && (
          <motion.div
            layoutId="sidebarActive"
            className="absolute inset-0 bg-dark dark:bg-indigo-600 rounded-xl shadow-md -z-10"
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        )}
        <div className={`w-5 h-5 ${isActive ? "text-primary dark:text-white" : "opacity-80"}`}>
          {icon}
        </div>
        <span className="relative z-10">{children}</span>
      </motion.div>
    </Link>
  );
}
