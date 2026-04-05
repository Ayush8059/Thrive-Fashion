import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, ChevronDown, Heart, Eye, ArrowRight, Loader } from "lucide-react";
import { Link } from "react-router-dom";
import TiltCard from "../../components/TiltCard";
import { getItems, toggleWishlistWithLiveCounts } from "../../services/items";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
};

export default function Marketplace() {
  const { user } = useAuth();
  const PAGE_SIZE = 12;

  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortBy, setSortBy] = useState("Newest");
  const [category, setCategory] = useState("All Categories");
  const [condition, setCondition] = useState("Any Condition");
  const [priceRange, setPriceRange] = useState("Any Price");
  const [items, setItems] = useState([]);
  const [totalItems, setTotalItems] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [wishlistedIds, setWishlistedIds] = useState(new Set());
  const [loadError, setLoadError] = useState("");

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setLoadError("");

    const result = await getItems({ search, category, condition, priceRange, sortBy, page, pageSize: PAGE_SIZE });

    setItems(Array.isArray(result?.items) ? result.items : []);
    setTotalItems(Number(result?.count || 0));

    if (!Array.isArray(result?.items)) {
      setLoadError("Unable to load marketplace items right now.");
    }

    setLoading(false);
  }, [search, category, condition, priceRange, sortBy, page]);

  useEffect(() => {
    const timer = setTimeout(fetchItems, 300);
    return () => clearTimeout(timer);
  }, [fetchItems]);

  useEffect(() => {
    setPage(1);
  }, [search, category, condition, sortBy, priceRange]);

  const visibleItems = items;

  useEffect(() => {
    if (!user) return;
    if (visibleItems.length === 0) {
      setWishlistedIds(new Set());
      return;
    }

    (async () => {
      const { data } = await supabase
        .from("wishlist")
        .select("item_id")
        .eq("user_id", user.id)
        .in("item_id", visibleItems.map((item) => item.id));

      if (data) {
        setWishlistedIds(new Set(data.map((row) => row.item_id)));
      }
    })();
  }, [user, visibleItems]);

  useEffect(() => {
    const handleClickOutside = () => setShowSortMenu(false);
    if (showSortMenu) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showSortMenu]);

  useEffect(() => {
    const channel = supabase
      .channel("marketplace-items-live")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "items" },
        (payload) => {
          setItems((prev) =>
            prev.map((item) =>
              item.id === payload.new.id
                ? {
                    ...item,
                    likes: payload.new.likes,
                    views: payload.new.views,
                    status: payload.new.status,
                  }
                : item
            )
          );
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, []);

  const handleWishlist = async (event, itemId) => {
    event.preventDefault();
    if (!user) return;

    const added = await toggleWishlistWithLiveCounts(itemId, user.id);
    setWishlistedIds((prev) => {
      const next = new Set(prev);
      if (added) next.add(itemId);
      else next.delete(itemId);
      return next;
    });
  };

  const handleSortSelect = (option) => {
    setSortBy(option);
    setShowSortMenu(false);
  };

  const clearFilters = () => {
    setCategory("All Categories");
    setCondition("Any Condition");
    setPriceRange("Any Price");
    setSearch("");
    setSortBy("Newest");
    setPage(1);
  };

  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="pb-10">
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Marketplace</h1>
        <p className="text-gray-700 dark:text-gray-400">
          Discover sustainable fashion from our community.
          {!loading && (
            <span className="ml-2 text-primary font-semibold">{totalItems} items found</span>
          )}
        </p>
      </motion.div>

      {loadError && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-600 dark:border-red-700 dark:bg-red-900/20 dark:text-red-400">
          {loadError}
        </div>
      )}

      <motion.div variants={itemVariants} className="bg-white dark:bg-slate-900 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-800 mb-8 z-20 relative">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="text-gray-400 w-5 h-5" />
            </div>
            <input
              type="text"
              placeholder="Search items, brands, or categories..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full text-center px-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-primary transition-all text-gray-900 dark:text-white"
            />
          </div>

          <div className="flex gap-4">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`px-4 py-3 rounded-xl border font-medium flex items-center gap-2 transition-colors ${
                showFilters
                  ? "bg-primary text-dark border-primary"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white hover:bg-gray-50"
              }`}
            >
              <Filter className="w-5 h-5" /> Filters
            </button>

            <div className="relative">
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  setShowSortMenu(!showSortMenu);
                }}
                className="px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-medium flex items-center gap-2 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
              >
                Sort: {sortBy}
                <ChevronDown className={`w-4 h-4 transition-transform ${showSortMenu ? "rotate-180" : ""}`} />
              </button>

              <AnimatePresence>
                {showSortMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-xl shadow-xl z-50"
                  >
                    {["Newest", "Price: Low to High", "Price: High to Low", "Popular"].map((option) => (
                      <button
                        key={option}
                        onClick={() => handleSortSelect(option)}
                        className={`block w-full text-left px-4 py-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                          sortBy === option
                            ? "bg-primary/10 text-primary font-semibold"
                            : "hover:bg-primary/10 hover:text-primary text-gray-900 dark:text-white"
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-gray-100 dark:border-gray-800 mt-4 pt-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2 block">Category</label>
                  <select
                    value={category}
                    onChange={(event) => setCategory(event.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>All Categories</option>
                    <option>Tops</option>
                    <option>Outerwear</option>
                    <option>Pants</option>
                    <option>Dresses</option>
                    <option>Shoes</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2 block">Price Range</label>
                  <select
                    value={priceRange}
                    onChange={(event) => setPriceRange(event.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>Any Price</option>
                    <option>Under Rs 50</option>
                    <option>Rs 50 - Rs 100</option>
                    <option>Rs 100 - Rs 200</option>
                    <option>Over Rs 200</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-semibold text-gray-800 dark:text-gray-300 mb-2 block">Condition</label>
                  <select
                    value={condition}
                    onChange={(event) => setCondition(event.target.value)}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-slate-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-1 focus:ring-primary"
                  >
                    <option>Any Condition</option>
                    <option>New with tags</option>
                    <option>Like New</option>
                    <option>Excellent</option>
                    <option>Good</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    onClick={clearFilters}
                    className="w-full px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {!loading && visibleItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-2xl font-bold text-gray-400 mb-2">No items found</p>
          <p className="text-gray-500 mb-4">Try adjusting your filters or search term</p>
          <button onClick={clearFilters} className="btn-primary">Clear Filters</button>
        </div>
      )}

      {!loading && visibleItems.length > 0 && (
        <>
          <motion.div variants={containerVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {visibleItems.map((item) => (
              <motion.div variants={itemVariants} key={item.id} className="h-full">
                <TiltCard className="h-full">
                  <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all duration-300">
                    <div className="relative aspect-[4/5] overflow-hidden">
                      <img
                        src={item.image_url}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        onError={(event) => {
                          event.target.src = "https://placehold.co/400x500?text=No+Image";
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      <div className="absolute top-4 right-4 translate-x-8 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={(event) => handleWishlist(event, item.id)}
                          className="w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-lg"
                        >
                          <Heart className={`w-5 h-5 ${wishlistedIds.has(item.id) ? "fill-red-500 text-red-500" : "text-gray-800"}`} />
                        </button>
                      </div>

                      <div className="absolute top-4 left-4">
                        <div className="flex flex-col gap-2">
                          <span className="bg-white/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-gray-900 rounded-full shadow-sm">
                            {item.condition}
                          </span>
                          {item.user_id === user?.id && (
                            <span className="bg-primary/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-dark rounded-full shadow-sm">
                              Uploaded by you
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="absolute bottom-4 left-4 right-4 flex justify-between items-center translate-y-8 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300 text-white">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Heart className="w-4 h-4 fill-white" /> {item.likes || 0}
                        </div>
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Eye className="w-4 h-4" /> {item.views || 0}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1 mr-2">
                          <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{item.category}</p>
                          <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">{item.title}</h3>
                          {item.profiles?.full_name && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.user_id === user?.id ? "Your listing" : `by ${item.profiles.full_name}`}
                            </p>
                          )}
                        </div>
                        <span className="font-bold text-lg text-gray-900 dark:text-white shrink-0">Rs {item.price}</span>
                      </div>

                      <div className="mt-auto pt-4">
                        <Link
                          to={`/item/${item.id}`}
                          className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white text-center py-2.5 rounded-xl font-semibold text-sm hover:bg-primary hover:text-dark dark:hover:bg-primary dark:hover:text-dark transition-colors flex items-center justify-center gap-2"
                        >
                          View Details <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-sm dark:border-gray-800 dark:bg-slate-900 sm:flex-row">
            <p className="text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                disabled={page >= totalPages}
                className="rounded-xl border border-gray-200 px-4 py-2 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </motion.div>
  );
}
