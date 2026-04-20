import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Menu,
  X,
  ShoppingBag,
  Bell,
  Heart,
  Store,
  LogOut,
  User,
  CheckCheck,
  Trash2,
  ShoppingCart,
  MessageCircle,
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import { useAuth } from "../context/AuthContext";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
} from "../services/notifications";
import { getCartCount } from "../services/cart";

export default function Navbar() {
  const NOTIFICATIONS_PAGE_SIZE = 10;
  const [isOpen, setIsOpen] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [notificationsPage, setNotificationsPage] = useState(1);
  const [totalNotifications, setTotalNotifications] = useState(0);
  const notifRef = useRef(null);

  const { user, profile, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    setNotificationsPage(1);
    void fetchCartCount();
    void fetchNotifications(1);

    // Polling is quieter and more stable than a constantly mounted realtime socket here.
    const pollId = window.setInterval(() => {
      void fetchNotifications(1);
      void fetchCartCount();
    }, 30000);

    return () => {
      window.clearInterval(pollId);
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    void fetchNotifications(notificationsPage);
  }, [notificationsPage, user]);

  const fetchNotifications = async (page = notificationsPage) => {
    const { notifications: nextNotifications, count } = await getNotifications(user.id, {
      page,
      pageSize: NOTIFICATIONS_PAGE_SIZE,
    });
    setNotifications(nextNotifications);
    setTotalNotifications(count);
    setUnreadCount(nextNotifications.filter((notification) => !notification.is_read).length);
  };

  const fetchCartCount = async () => {
    try {
      const count = await getCartCount();
      setCartCount(count);
    } catch {
      setCartCount(0);
    }
  };

  const handleMarkRead = async (id) => {
    await markNotificationRead(id);
    setNotifications((prev) =>
      prev.map((notification) =>
        notification.id === id ? { ...notification, is_read: true } : notification
      )
    );
    setUnreadCount((prev) => {
      const target = notifications.find((notification) => notification.id === id);
      return target && !target.is_read ? Math.max(0, prev - 1) : prev;
    });
  };

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead(user.id);
    setNotifications((prev) => prev.map((notification) => ({ ...notification, is_read: true })));
    setUnreadCount(0);
  };

  const handleDelete = async (event, id) => {
    event.stopPropagation();
    await deleteNotification(id);
    setNotifications((prev) => prev.filter((notification) => notification.id !== id));
    setTotalNotifications((prev) => Math.max(0, prev - 1));
    setUnreadCount((prev) => {
      const notification = notifications.find((entry) => entry.id === id);
      return notification && !notification.is_read ? Math.max(0, prev - 1) : prev;
    });
  };

  useEffect(() => {
    const handleClick = (event) => {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const avatarLetter = profile?.full_name
    ? profile.full_name.charAt(0).toUpperCase()
    : user?.email?.charAt(0).toUpperCase();

  const timeAgo = (dateStr) => {
    const diff = Math.floor((new Date() - new Date(dateStr)) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const notifIcon = (type) => {
    switch (type) {
      case "wishlist":
        return "❤️";
      case "view":
        return "👁️";
      case "sale":
        return "💰";
      case "success":
        return "✅";
      case "warning":
        return "⚠️";
      default:
        return "🔔";
    }
  };

  const notificationPages = Math.max(1, Math.ceil(totalNotifications / NOTIFICATIONS_PAGE_SIZE));

  return (
    <nav className="fixed top-0 z-[90] h-16 w-full border-b border-gray-100 bg-white/90 shadow-sm backdrop-blur-xl dark:border-gray-800 dark:bg-slate-950/90">
      <div className="flex h-full items-center justify-between px-4 lg:px-8">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-dark transition-colors hover:bg-lightgray dark:text-white dark:hover:bg-gray-800 md:hidden"
            onClick={() => {
              setIsOpen((current) => !current);
              setShowDropdown(false);
              setShowNotifications(false);
            }}
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <Link to="/dashboard" className="group flex items-center gap-2">
            <motion.div
              whileHover={{ rotate: -10, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-dark text-white transition-colors group-hover:bg-primary group-hover:text-dark dark:bg-primary dark:text-dark dark:group-hover:bg-white"
            >
              <ShoppingBag className="h-5 w-5" />
            </motion.div>
            <span className="text-xl font-bold tracking-tight text-dark dark:text-white">Thrive</span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <Link to="/marketplace" className="hidden p-2 text-gray-600 transition-colors hover:text-primary dark:text-gray-300 md:flex">
            <Store className="h-5 w-5" />
          </Link>

          <Link to="/wishlist" className="p-2 text-gray-600 transition-colors hover:text-primary dark:text-gray-300">
            <Heart className="h-5 w-5" />
          </Link>

          <Link to="/messages" className="p-2 text-gray-600 transition-colors hover:text-primary dark:text-gray-300">
            <MessageCircle className="h-5 w-5" />
          </Link>

          <Link to="/cart" className="relative p-2 text-gray-600 transition-colors hover:text-primary dark:text-gray-300">
            <ShoppingCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-dark">
                {cartCount > 9 ? "9+" : cartCount}
              </span>
            )}
          </Link>

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowDropdown(false);
              }}
              className="relative p-2 text-gray-600 transition-colors hover:text-primary dark:text-gray-300"
            >
              <Bell className="h-5 w-5" />
              {unreadCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full border border-white bg-red-500 px-0.5 text-[10px] font-bold text-white dark:border-slate-900"
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </motion.span>
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 z-50 w-80 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">Notifications</h3>
                      {unreadCount > 0 && (
                        <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-600 dark:bg-red-900/30 dark:text-red-400">
                          {unreadCount} new
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllRead}
                        className="flex items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary/70"
                      >
                        <CheckCheck className="h-3.5 w-3.5" />
                        Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-10 text-gray-400">
                        <Bell className="mb-2 h-8 w-8 opacity-30" />
                        <p className="text-sm">No notifications yet</p>
                        <p className="mt-1 text-xs text-gray-300">We&apos;ll notify you when something happens!</p>
                      </div>
                    ) : (
                      notifications.map((notification) => (
                        <motion.div
                          key={notification.id}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          className={`group/notif flex cursor-pointer items-start gap-3 border-b border-gray-50 px-4 py-3 transition-colors last:border-none hover:bg-gray-50 dark:border-gray-800/50 dark:hover:bg-slate-800/50 ${
                            !notification.is_read ? "bg-blue-50/50 dark:bg-blue-900/10" : ""
                          }`}
                          onClick={() => !notification.is_read && handleMarkRead(notification.id)}
                        >
                          <span className="mt-0.5 shrink-0 text-lg">{notifIcon(notification.type)}</span>
                          <div className="min-w-0 flex-1">
                            <p
                              className={`truncate text-sm font-semibold ${
                                !notification.is_read
                                  ? "text-gray-900 dark:text-white"
                                  : "text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {notification.title}
                            </p>
                            <p className="mt-0.5 line-clamp-2 text-xs text-gray-500 dark:text-gray-400">
                              {notification.message}
                            </p>
                            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                              {timeAgo(notification.created_at)}
                            </p>
                          </div>
                          <div className="flex shrink-0 flex-col items-center gap-2">
                            {!notification.is_read && <div className="h-2 w-2 rounded-full bg-blue-500" />}
                            <button
                              onClick={(event) => handleDelete(event, notification.id)}
                              className="rounded p-1 text-gray-400 opacity-0 transition-all hover:text-red-500 group-hover/notif:opacity-100"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))
                    )}
                  </div>

                  {notifications.length > 0 && (
                    <div className="border-t border-gray-100 px-4 py-3 dark:border-gray-800">
                      <div className="flex items-center justify-between text-xs text-gray-400">
                        <p>
                          Page {notificationsPage} of {notificationPages}
                        </p>
                        <p>{totalNotifications} total notifications</p>
                      </div>
                      {totalNotifications > NOTIFICATIONS_PAGE_SIZE && (
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <button
                            onClick={() => setNotificationsPage((current) => Math.max(1, current - 1))}
                            disabled={notificationsPage === 1}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                          >
                            Previous
                          </button>
                          <button
                            onClick={() => setNotificationsPage((current) => Math.min(notificationPages, current + 1))}
                            disabled={notificationsPage >= notificationPages}
                            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 font-semibold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-slate-800"
                          >
                            Next
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => {
                setShowDropdown(!showDropdown);
                setShowNotifications(false);
              }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-dark text-sm font-bold text-white transition-opacity hover:opacity-90 dark:bg-primary dark:text-dark"
            >
              {avatarLetter}
            </motion.button>

            <AnimatePresence>
              {showDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-12 z-50 w-52 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-xl dark:border-gray-800 dark:bg-slate-900"
                >
                  <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-800">
                    <p className="truncate text-sm font-semibold text-dark dark:text-white">
                      {profile?.full_name || "User"}
                    </p>
                    <p className="truncate text-xs text-gray-500">{user?.email}</p>
                  </div>
                  <Link
                    to="/profile"
                    onClick={() => setShowDropdown(false)}
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-700 transition-colors hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-slate-800"
                  >
                    <User className="h-4 w-4" />
                    My Profile
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="md:hidden"
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                top: 64,
                bottom: 0,
                zIndex: 9998,
                background: "rgba(0,0,0,0.55)",
                backdropFilter: "blur(2px)",
              }}
              aria-label="Close navigation menu"
            />

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.22 }}
              className="md:hidden"
              style={{
                position: "fixed",
                left: 0,
                right: 0,
                top: 64,
                bottom: 0,
                zIndex: 9999,
                display: "flex",
                flexDirection: "column",
                overflow: "hidden",
              }}
            >
              <div className="flex-1 overflow-y-auto bg-white px-4 py-4 pb-28 text-gray-900 dark:bg-slate-950 dark:text-white">
                <div className="flex flex-col gap-2">
                  <MobileLink to="/marketplace" onClick={() => setIsOpen(false)}>Marketplace</MobileLink>
                  <MobileLink to="/dashboard" onClick={() => setIsOpen(false)}>Dashboard</MobileLink>
                  <MobileLink to="/wardrobe" onClick={() => setIsOpen(false)}>Wardrobe</MobileLink>
                  <MobileLink to="/sell" onClick={() => setIsOpen(false)}>Sell</MobileLink>
                  <MobileLink to="/donate" onClick={() => setIsOpen(false)}>Donate</MobileLink>
                  <MobileLink to="/donations/history" onClick={() => setIsOpen(false)}>Donation Tracking</MobileLink>
                  <MobileLink to="/items" onClick={() => setIsOpen(false)}>My Items</MobileLink>
                  <MobileLink to="/wishlist" onClick={() => setIsOpen(false)}>Wishlist</MobileLink>
                  <MobileLink to="/cart" onClick={() => setIsOpen(false)}>Cart</MobileLink>
                  <MobileLink to="/orders" onClick={() => setIsOpen(false)}>Orders</MobileLink>
                  <MobileLink to="/sales" onClick={() => setIsOpen(false)}>Sales</MobileLink>
                  <MobileLink to="/messages" onClick={() => setIsOpen(false)}>Messages</MobileLink>
                  <MobileLink to="/feedback" onClick={() => setIsOpen(false)}>Feedback</MobileLink>
                  <MobileLink to="/about" onClick={() => setIsOpen(false)}>About Us</MobileLink>
                  <MobileLink to="/profile" onClick={() => setIsOpen(false)}>Profile</MobileLink>
                </div>

                <button
                  onClick={handleLogout}
                  className="mt-4 flex w-full items-center gap-3 rounded-xl px-4 py-3 font-medium text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-500/10"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}

function MobileLink({ to, children, onClick }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      onClick={onClick}
      className={`rounded-lg px-4 py-3 font-medium transition-colors ${
        isActive
          ? "bg-primary font-bold text-dark shadow-sm"
          : "text-gray-900 hover:bg-gray-100 hover:text-dark dark:text-gray-100 dark:hover:bg-slate-800 dark:hover:text-white"
      }`}
    >
      <motion.div whileHover={{ x: 10 }}>{children}</motion.div>
    </Link>
  );
}
