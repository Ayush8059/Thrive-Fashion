import { useEffect, useState } from "react";
import { Loader2, ReceiptText } from "lucide-react";
import { getSellerOrders } from "../../services/orders";

export default function Sales() {
  const PAGE_SIZE = 8;
  const [sales, setSales] = useState([]);
  const [page, setPage] = useState(1);
  const [totalSales, setTotalSales] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadSales();
  }, [page]);

  const loadSales = async () => {
    setLoading(true);
    setError("");
    try {
      const { sales: nextSales, count } = await getSellerOrders({ page, pageSize: PAGE_SIZE });
      setSales(nextSales);
      setTotalSales(count);
    } catch (err) {
      setError(err.message || "Unable to load sales.");
    } finally {
      setLoading(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(totalSales / PAGE_SIZE));

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sales History</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Monitor every completed and in-progress sale from your listings.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : sales.length === 0 ? (
        <div className="card py-16 text-center">
          <ReceiptText className="mx-auto mb-4 h-12 w-12 text-gray-300" />
          <h2 className="text-xl font-bold mb-2">No sales yet</h2>
          <p className="text-gray-500">Sold items will appear here once buyers check out.</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {sales.map((sale) => (
              <div key={sale.id} className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-4">
                <img
                  src={sale.item?.image_url || "https://placehold.co/160x200?text=Item"}
                  alt={sale.item?.title || "Item"}
                  className="h-20 w-16 rounded-xl object-cover"
                />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{sale.item?.title}</h3>
                  <p className="text-sm text-gray-500">
                    Buyer: {sale.order?.buyer?.full_name || sale.order?.buyer?.email || "Unknown buyer"}
                  </p>
                  <p className="text-sm text-gray-500">
                    Status: <span className="capitalize">{sale.order?.status || sale.status}</span>
                  </p>
                </div>
              </div>
              <div className="text-left sm:text-right">
                <p className="text-lg font-bold text-gray-900 dark:text-white">Rs. {sale.price}</p>
                <p className="text-sm text-gray-500">
                  {new Date(sale.created_at).toLocaleString()}
                </p>
              </div>
              </div>
            ))}
          </div>
          {totalSales > PAGE_SIZE && (
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
