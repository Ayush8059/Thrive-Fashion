import { useState, useEffect, useContext } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartOff, ArrowRight, Loader2, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import TiltCard from "../../components/TiltCard";
import { AuthContext } from "../../context/AuthContext";
import { getWishlist, toggleWishlistWithLiveCounts } from "../../services/items";
import { addToCart } from "../../services/cart";

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 10 },
  show:   { opacity: 1, scale: 1,    y: 0,  transition: { type: "spring", stiffness: 300, damping: 24 } },
  exit:   { opacity: 0, scale: 0.9,         transition: { duration: 0.2 } },
};

export default function Wishlist() {
  const PAGE_SIZE = 8;
  const { user } = useContext(AuthContext);

  const [wishlist, setWishlist] = useState([]);
  const [page, setPage] = useState(1);
  const [totalWishlist, setTotalWishlist] = useState(0);
  const [loading,  setLoading]  = useState(true);
  const [removing, setRemoving] = useState(null);
  const [adding, setAdding] = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const { items, count } = await getWishlist(user.id, { page, pageSize: PAGE_SIZE });
        setWishlist(items || []);
        setTotalWishlist(count || 0);
      } catch (err) {
        console.error("Error fetching wishlist:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [user, page]);

  const totalPages = Math.max(1, Math.ceil(totalWishlist / PAGE_SIZE));

  const handleRemove = async (itemId) => {
    setRemoving(itemId);
    try {
      await toggleWishlistWithLiveCounts(itemId, user.id);
      setWishlist((prev) => prev.filter((w) => w.item_id !== itemId));
      setTotalWishlist((prev) => Math.max(0, prev - 1));
      if (wishlist.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      }
    } catch (err) {
      console.error("Error removing from wishlist:", err);
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = async (item) => {
    setAdding(item.id);
    try {
      await addToCart(item);
    } catch (err) {
      console.error("Error adding to cart:", err);
    } finally {
      setAdding(null);
    }
  };

  if (loading) {
    return (
      <motion.div initial="hidden" animate="show" variants={containerVariants} className="pb-10">
        <motion.div variants={itemVariants} className="mb-8">
          <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
          <p className="text-gray-700 dark:text-gray-400">Keep track of the items you love and want to buy later.</p>
        </motion.div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden animate-pulse">
              <div className="aspect-[4/5] bg-gray-200 dark:bg-slate-700" />
              <div className="p-5 space-y-3">
                <div className="h-3 bg-gray-200 dark:bg-slate-700 rounded w-1/3" />
                <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-2/3" />
                <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-xl mt-4" />
                <div className="h-10 bg-gray-200 dark:bg-slate-700 rounded-xl" />
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial="hidden" animate="show" variants={containerVariants} className="pb-10">
      {/* Header */}
      <motion.div variants={itemVariants} className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Wishlist</h1>
        <p className="text-gray-700 dark:text-gray-400">
          Keep track of the items you love and want to buy later.
          {totalWishlist > 0 && (
            <span className="ml-2 text-sm font-semibold text-primary">
              {totalWishlist} item{totalWishlist !== 1 ? "s" : ""}
            </span>
          )}
        </p>
      </motion.div>

      {/* Empty state */}
      {wishlist.length === 0 ? (
        <motion.div
          variants={itemVariants}
          className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-3xl"
        >
          <div className="w-24 h-24 bg-red-50 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-6">
            <HeartOff className="w-12 h-12 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your wishlist is empty</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md">
            Looks like you haven't saved any items yet. Explore the marketplace to find sustainable fashion you'll love!
          </p>
          <Link to="/marketplace" className="btn-primary flex items-center gap-2">
            Explore Marketplace <ArrowRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <>
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {wishlist.map((wishlistEntry) => {
                const item = wishlistEntry.items;
                if (!item) return null;

                return (
                  <motion.div
                    key={wishlistEntry.id}
                    variants={itemVariants}
                    initial="hidden"
                    animate="show"
                    exit="exit"
                    layoutId={`wishlist-item-${wishlistEntry.id}`}
                    className="h-full"
                  >
                    <TiltCard className="h-full">
                      <div className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 rounded-2xl overflow-hidden flex flex-col h-full group hover:shadow-xl transition-all duration-300">

                      {/* Image */}
                      <div className="relative aspect-[4/5] overflow-hidden">
                        {item.image_url ? (
                          <img
                            src={item.image_url}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center text-5xl">
                            👕
                          </div>
                        )}

                        {/* Remove from wishlist */}
                        <button
                          onClick={() => handleRemove(wishlistEntry.item_id)}
                          disabled={removing === wishlistEntry.item_id}
                          className="absolute top-4 right-4 w-10 h-10 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center text-red-500 hover:bg-red-50 active:scale-95 shadow-md border border-gray-200 dark:border-gray-700 transition-all z-10 disabled:opacity-60"
                          title="Remove from wishlist"
                        >
                          {removing === wishlistEntry.item_id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <HeartOff className="w-5 h-5" />
                          )}
                        </button>

                        {/* Condition badge */}
                        {item.condition && (
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm px-3 py-1.5 text-xs font-bold text-gray-900 dark:text-white rounded-full uppercase shadow-sm border border-gray-200 dark:border-gray-700">
                              {item.condition}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div className="pr-2">
                            {item.category && (
                              <p className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">
                                {item.category}
                              </p>
                            )}
                            <Link
                              to={`/item/${wishlistEntry.item_id}`}
                              className="hover:text-primary transition-colors"
                            >
                              <h3 className="font-bold text-gray-900 dark:text-white line-clamp-1">
                                {item.title}
                              </h3>
                            </Link>
                          </div>
                          {item.price && (
                            <span className="font-bold text-lg text-gray-900 dark:text-white whitespace-nowrap">
                              ₹ {item.price}
                            </span>
                          )}
                        </div>

                        {/* Seller name if available */}
                        {item.profiles?.full_name && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                            by {item.profiles.full_name}
                          </p>
                        )}

                        {/* Actions */}
                        <div className="mt-auto pt-4 flex flex-col gap-2">
                          <Link
                            to={`/item/${wishlistEntry.item_id}`}
                            className="w-full bg-gray-100 dark:bg-slate-800 text-gray-900 dark:text-white text-center py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                          >
                            View Details
                          </Link>

                          {/* View & Buy — goes to item detail page where purchase happens */}
                          <button
                            onClick={() => handleAddToCart(item)}
                            disabled={adding === item.id}
                            className="w-full bg-primary/10 text-primary hover:bg-primary hover:text-dark dark:hover:text-dark text-center py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                          >
                            {adding === item.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <ShoppingCart className="w-4 h-4" />
                            )}
                            Add to Cart
                          </button>
                        </div>
                      </div>
                      </div>
                    </TiltCard>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </motion.div>
          {totalWishlist > PAGE_SIZE && (
            <motion.div
              variants={itemVariants}
              className="mt-8 flex flex-col items-center justify-between gap-4 rounded-2xl border border-gray-100 bg-white px-4 py-4 text-sm dark:border-gray-800 dark:bg-slate-900 sm:flex-row"
            >
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
            </motion.div>
          )}
        </>
      )}
    </motion.div>
  );
}
