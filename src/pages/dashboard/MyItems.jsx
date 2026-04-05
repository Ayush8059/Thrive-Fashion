import { useState, useEffect } from "react";
import { Heart, Eye, Trash2, Loader, ShoppingBag, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import TiltCard from "../../components/TiltCard";
import { getUserItems, deleteItem, updateItemStatus } from "../../services/items";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const cardVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show: { opacity: 1, scale: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

export default function MyItems() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("active");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = async () => {
    if (!user) return;
    setLoading(true);
    const data = await getUserItems(user.id);
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchItems();
  }, [user]);

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`my-items-live-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "items",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setItems((prev) =>
            prev.map((item) => (item.id === payload.new.id ? { ...item, ...payload.new } : item))
          );
        }
      )
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "items",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setItems((prev) => [payload.new, ...prev.filter((item) => item.id !== payload.new.id)]);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const handleDelete = async (itemId) => {
    if (!confirm("Are you sure you want to remove this listing?")) return;
    await deleteItem(itemId);
    setItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleStatusToggle = async (itemId, currentStatus) => {
    const newStatus = currentStatus === "active" ? "sold" : "active";
    await updateItemStatus(itemId, newStatus);
    setItems(prev => prev.map(i => i.id === itemId ? { ...i, status: newStatus } : i));
  };

  const activeItems = items.filter(i => i.status === "active");
  const soldItems = items.filter(i => i.status === "sold");
  const donatedItems = items.filter(i => i.status === "donated");

  const displayItems =
    activeTab === "active" ? activeItems : activeTab === "sold" ? soldItems : donatedItems;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">My Items</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage the clothes you have listed for sale.</p>
        </div>
        <Link to="/sell">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> List New Item
          </motion.button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="mb-8 flex overflow-x-auto pb-2 border-b border-gray-200 dark:border-gray-700">
        <div className="flex space-x-8 px-1">
          <TabButton
            active={activeTab === "active"}
            onClick={() => setActiveTab("active")}
            label="Active Listings"
            count={activeItems.length}
          />
          <TabButton
            active={activeTab === "sold"}
            onClick={() => setActiveTab("sold")}
            label="Sold Items"
            count={soldItems.length}
          />
          <TabButton
            active={activeTab === "donated"}
            onClick={() => setActiveTab("donated")}
            label="Donated Items"
            count={donatedItems.length}
          />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && displayItems.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-400 mb-2">
            {activeTab === "active"
              ? "No active listings"
              : activeTab === "sold"
              ? "No sold items yet"
              : "No donated items yet"}
          </p>
          <p className="text-gray-500 mb-6">
            {activeTab === "active"
              ? "Start selling your pre-loved clothes!"
              : activeTab === "sold"
              ? "Items you mark as sold will appear here."
              : "Items you donate will move here automatically."}
          </p>
          {activeTab === "active" && (
            <Link to="/sell">
              <button className="btn-primary">List Your First Item</button>
            </Link>
          )}
        </div>
      )}

      {/* Items Grid */}
      {!loading && displayItems.length > 0 && (
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            variants={containerVariants}
            initial="hidden"
            animate="show"
            exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {displayItems.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                onDelete={handleDelete}
                onStatusToggle={handleStatusToggle}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      )}
    </motion.div>
  );
}

function TabButton({ active, onClick, label, count }) {
  return (
    <button
      onClick={onClick}
      className={`relative pb-4 font-medium transition-colors whitespace-nowrap pt-2 outline-none ${
        active ? "text-dark dark:text-white" : "text-gray-500 dark:text-gray-400 hover:text-dark dark:hover:text-white"
      }`}
    >
      <span className="flex items-center gap-2">
        {label}
        <span className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
          active ? "bg-primary/20 text-dark dark:text-dark" : "bg-gray-100 dark:bg-slate-800 text-gray-600"
        }`}>
          {count}
        </span>
      </span>
      {active && (
        <motion.span
          layoutId="activeTabIndicator"
          className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        />
      )}
    </button>
  );
}

function ItemCard({ item, onDelete, onStatusToggle }) {
  return (
    <motion.div variants={cardVariants} className="h-full">
      <TiltCard className="h-full">
        <div className="card p-0 overflow-hidden flex flex-col group h-full bg-white dark:bg-slate-900">

          {/* Image */}
          <div className="relative aspect-video overflow-hidden">
            <img
              src={item.image_url}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
             onError={(e) => { e.target.src = "https://placehold.co/400x300?text=No+Image"; }}
            />
            {/* Status Badge */}
            <div className="absolute top-3 left-3">
              <span className={`px-2 py-1 text-xs font-bold rounded-lg shadow-sm bg-white/90 backdrop-blur-sm ${
                item.status === "active" ? "text-green-600" : "text-blue-600"
              }`}>
                {item.status === "active" ? "✓ Active" : "✓ Sold"}
              </span>
            </div>
            {/* Category Badge */}
            {item.category && (
              <div className="absolute top-3 right-3">
                <span className="px-2 py-1 text-xs font-bold rounded-lg shadow-sm bg-black/50 text-white backdrop-blur-sm">
                  {item.category}
                </span>
              </div>
            )}
          </div>

          {/* Info */}
          <div className="p-5 flex-1">
            <div className="flex justify-between items-start mb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 leading-tight group-hover:text-primary transition-colors line-clamp-1">
                {item.title}
              </h3>
              <span className="font-bold text-lg text-dark dark:text-white shrink-0 ml-2">
                ₹{item.price}
              </span>
            </div>

            {/* Details row */}
            <div className="flex flex-wrap gap-2 mb-3">
              {item.condition && (
                <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
                  {item.condition}
                </span>
              )}
              {item.size && (
                <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
                  Size: {item.size}
                </span>
              )}
              {item.gender && (
                <span className="text-xs bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-lg">
                  {item.gender}
                </span>
              )}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-800 pt-3">
              <span className="flex items-center gap-1">
                <Heart className="w-4 h-4" /> {item.likes || 0} Likes
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-4 h-4" /> {item.views || 0} Views
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-gray-50 dark:bg-slate-800/50 p-4 border-t dark:border-gray-800 flex justify-between items-center gap-2">
            {item.status !== "donated" ? (
              <button
                onClick={() => onStatusToggle(item.id, item.status)}
                className={`text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                  item.status === "active"
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-green-100 text-green-700 hover:bg-green-200"
                }`}
              >
                {item.status === "active" ? "Mark as Sold" : "Relist"}
              </button>
            ) : (
              <span className="text-sm font-semibold px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700">
                Donated
              </span>
            )}

            <button
              onClick={() => onDelete(item.id)}
              className="flex items-center gap-1 text-sm font-semibold text-red-500 hover:text-red-700 px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
            >
              <Trash2 className="w-4 h-4" /> Remove
            </button>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}
