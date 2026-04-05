import { Link } from "react-router-dom";
import { ArrowRight, Shirt, DollarSign, HeartHandshake } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import TiltCard from "../../components/TiltCard";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function Home() {
  const { user, profile } = useAuth();

  const [stats, setStats] = useState({
    wardrobeCount: 0,
    activeListings: 0,
    donationCount: 0,
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loadingStats, setLoadingStats]       = useState(true);
  const [loadingActivity, setLoadingActivity] = useState(true);

  useEffect(() => {
    if (!user) return;
    fetchStats();
    fetchRecentActivity();
  }, [user]);

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      // Total wardrobe items (all statuses)
      const { count: wardrobeCount } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      // Active listings only
      const { count: activeListings } = await supabase
        .from("items")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "active");

      // Total donations (one row per donated item)
      const { count: donationCount } = await supabase
        .from("donations")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

      setStats({
        wardrobeCount:  wardrobeCount  || 0,
        activeListings: activeListings || 0,
        donationCount:  donationCount  || 0,
      });
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecentActivity = async () => {
    setLoadingActivity(true);
    try {
      // Last 5 items added/updated by user
      const { data: itemsData } = await supabase
        .from("items")
        .select("id, title, image_url, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      // Last 5 donations by user
      let donationsData = null;
      let donationsError = null;

      const donationResult = await supabase
        .from("donations")
        .select("id, item_id, ngo_name, donation_method, status, created_at, items(title, image_url)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      donationsData = donationResult.data;
      donationsError = donationResult.error;

      // Fallback for older schemas that may still use ngo/method.
      if (donationsError) {
        const legacyDonationResult = await supabase
          .from("donations")
          .select("id, item_id, ngo, method, status, created_at, items(title, image_url)")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5);

        donationsData = legacyDonationResult.data;
        donationsError = legacyDonationResult.error;
      }

      if (donationsError) throw donationsError;

      // Merge and sort by created_at, take latest 5
      const itemActivities = (itemsData || []).map((item) => ({
        id:         `item-${item.id}`,
        title:      item.title,
        image_url:  item.image_url,
        status:     getItemStatus(item.status),
        created_at: item.created_at,
      }));

      const donationActivities = (donationsData || []).map((d) => ({
        id:         `donation-${d.id}`,
        title:      d.items?.title || "Unknown Item",
        image_url:  d.items?.image_url || null,
        status:     `Donated to ${d.ngo_name || d.ngo || "NGO"}`,
        created_at: d.created_at,
      }));

      const merged = [...itemActivities, ...donationActivities]
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);

      setRecentActivity(merged);
    } catch (err) {
      console.error("Error fetching activity:", err);
    } finally {
      setLoadingActivity(false);
    }
  };

  // Map item status to readable label
  const getItemStatus = (status) => {
    switch (status) {
      case "active":   return "Listed for Sale";
      case "sold":     return "Sold";
      case "donated":  return "Donated";
      default:         return "Added to Wardrobe";
    }
  };

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants}>
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl lg:text-4xl font-bold mb-2">
          Welcome back, {profile?.full_name || user?.email}
        </h1>
        <p className="text-gray-700 dark:text-gray-400">
          Here's a quick overview of your sustainable wardrobe journey.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <motion.div variants={containerVariants} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <DashboardCard
          title="Virtual Wardrobe"
          value={loadingStats ? "—" : `${stats.wardrobeCount} Item${stats.wardrobeCount !== 1 ? "s" : ""}`}
          icon={<Shirt className="w-6 h-6" />}
          link="/wardrobe"
          color="bg-primary/20 text-dark dark:text-white"
          loading={loadingStats}
        />
        <DashboardCard
          title="Active Listings"
          value={loadingStats ? "—" : `${stats.activeListings} Item${stats.activeListings !== 1 ? "s" : ""}`}
          icon={<DollarSign className="w-6 h-6" />}
          link="/sell"
          color="bg-blue-100 text-blue-800"
          loading={loadingStats}
        />
        <DashboardCard
          title="Impact Score"
          value={loadingStats ? "—" : `${stats.donationCount} Donation${stats.donationCount !== 1 ? "s" : ""}`}
          icon={<HeartHandshake className="w-6 h-6" />}
          link="/donate"
          color="bg-pink-100 text-pink-800"
          loading={loadingStats}
        />
      </motion.div>

      {/* Recent Activity */}
      <motion.div variants={itemVariants} className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">Recent Activity</h2>
          <Link
            to="/items"
            className="text-sm font-semibold text-gray-700 dark:text-gray-400 hover:text-dark dark:hover:text-white flex items-center gap-1 group"
          >
            View All
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        {loadingActivity ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 animate-pulse">
                <div className="w-16 h-16 rounded-lg bg-gray-200 dark:bg-slate-700 shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                  <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/4" />
                </div>
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-16" />
              </div>
            ))}
          </div>
        ) : recentActivity.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            <Shirt className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No activity yet. Start by adding items to your wardrobe!</p>
          </div>
        ) : (
          <motion.div variants={containerVariants} className="space-y-4">
            {recentActivity.map((activity) => (
              <ActivityItem
                key={activity.id}
                title={activity.title}
                status={activity.status}
                time={timeAgo(activity.created_at)}
                image={activity.image_url}
              />
            ))}
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ─── Time ago helper ───────────────────────────────────────────────────────────
function timeAgo(dateStr) {
  const now  = new Date();
  const date = new Date(dateStr);
  const diff = Math.floor((now - date) / 1000); // seconds

  if (diff < 60)                        return "Just now";
  if (diff < 3600)                      return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400)                     return `${Math.floor(diff / 3600)} hour${Math.floor(diff / 3600) > 1 ? "s" : ""} ago`;
  if (diff < 86400 * 7)                 return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? "s" : ""} ago`;
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

// ─── Dashboard Card ────────────────────────────────────────────────────────────
function DashboardCard({ title, value, icon, link, color, loading }) {
  return (
    <motion.div variants={itemVariants}>
      <TiltCard>
        <Link
          to={link}
          className="card flex flex-col items-start gap-4 hover:-translate-y-1 hover:shadow-lg transition-all h-full w-full"
        >
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${color}`}>
            {icon}
          </div>
          <div>
            <p className="text-gray-700 dark:text-gray-400 font-medium">{title}</p>
            {loading ? (
              <div className="h-8 w-24 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mt-1" />
            ) : (
              <h3 className="text-2xl font-bold mt-1">{value}</h3>
            )}
          </div>
        </Link>
      </TiltCard>
    </motion.div>
  );
}

// ─── Activity Item ─────────────────────────────────────────────────────────────
function ActivityItem({ title, status, time, image }) {
  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-slate-800/50 transition-colors group cursor-pointer"
    >
      <div className="overflow-hidden rounded-lg w-16 h-16 shrink-0 bg-gray-100 dark:bg-slate-700">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
        )}
      </div>
      <div className="flex-1">
        <h4 className="font-bold text-gray-900 dark:text-gray-100">{title}</h4>
        <p className="text-sm text-gray-700 dark:text-gray-400">{status}</p>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-500">{time}</div>
    </motion.div>
  );
}
