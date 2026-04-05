import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, PackageCheck, Trash2, RotateCcw } from "lucide-react";
import { getBuyerOrders } from "../../services/orders";
import { useAuth } from "../../context/AuthContext";

const STATUS_COLORS = {
  placed: "bg-blue-100 text-blue-700",
  confirmed: "bg-violet-100 text-violet-700",
  shipped: "bg-amber-100 text-amber-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-red-100 text-red-700",
};

export default function Orders() {
  const { user } = useAuth();
  const PAGE_SIZE = 8;
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [hiddenOrderIds, setHiddenOrderIds] = useState([]);

  const storageKey = user?.id ? `thrive-hidden-orders-${user.id}` : null;

  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      setHiddenOrderIds(Array.isArray(saved) ? saved : []);
    } catch {
      setHiddenOrderIds([]);
    }
  }, [storageKey]);

  useEffect(() => {
    if (!storageKey) return;
    window.localStorage.setItem(storageKey, JSON.stringify(hiddenOrderIds));
  }, [hiddenOrderIds, storageKey]);

  useEffect(() => {
    loadOrders();
  }, [page]);

  const loadOrders = async () => {
    setLoading(true);
    setError("");
    try {
      const { orders: nextOrders, count } = await getBuyerOrders({ page, pageSize: PAGE_SIZE });
      setOrders(nextOrders);
      setTotalOrders(count);
    } catch (err) {
      setError(err.message || "Unable to load orders.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalOrders / PAGE_SIZE));
  const visibleOrders = orders.filter((order) => !hiddenOrderIds.includes(order.id));

  const hideAllVisibleOrders = () => {
    setHiddenOrderIds((prev) => [...new Set([...prev, ...orders.map((order) => order.id)])]);
  };

  const restoreHiddenOrders = () => {
    setHiddenOrderIds([]);
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">My Orders</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Track all your marketplace purchases in one place.
        </p>
      </div>

      {searchParams.get("created") && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          Order placed successfully. Your order reference is #{searchParams.get("created")}.
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {!loading && orders.length > 0 && (
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gray-100 bg-white px-4 py-4 dark:border-gray-800 dark:bg-slate-900">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            You can hide your order history from this device without deleting it from the database.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            {hiddenOrderIds.length > 0 && (
              <button
                onClick={restoreHiddenOrders}
                className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-4 w-4" />
                Restore hidden
              </button>
            )}
            <button
              onClick={hideAllVisibleOrders}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20"
            >
              <Trash2 className="h-4 w-4" />
              Clear current orders
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : visibleOrders.length === 0 ? (
        <div className="card py-16 text-center">
          <PackageCheck className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">
            {orders.length === 0 ? "No orders yet" : "No visible orders"}
          </h2>
          <p className="text-gray-500">
            {orders.length === 0
              ? "Placed orders will appear here."
              : "You have cleared the current order list from this device."}
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-6">
            {visibleOrders.map((order) => (
              <div key={order.id} className="card">
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold">Order #{order.id}</h2>
                  <p className="text-sm text-gray-500">
                    {new Date(order.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-bold capitalize ${
                      STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    Rs. {order.total_amount}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {(order.order_items || []).map((orderItem) => (
                  <div
                    key={orderItem.id}
                    className="flex flex-col gap-4 rounded-2xl border border-gray-100 p-4 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={orderItem.item?.image_url || "https://placehold.co/160x200?text=Item"}
                        alt={orderItem.item?.title || "Item"}
                        className="h-20 w-16 rounded-xl object-cover"
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-white">
                          {orderItem.item?.title}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Seller: {orderItem.seller?.full_name || "Unknown seller"}
                        </p>
                        <p className="text-sm text-gray-500">
                          {order.shipping_method || "pickup"}
                        </p>
                      </div>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">
                      Rs. {orderItem.price}
                    </span>
                  </div>
                ))}
              </div>
              </div>
            ))}
          </div>
          {totalOrders > PAGE_SIZE && (
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
          )}
        </>
      )}
    </div>
  );
}
