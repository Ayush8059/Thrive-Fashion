import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { getCartItems, removeFromCart } from "../../services/cart";
import { createOrderFromCart } from "../../services/orders";

export default function Cart() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [shippingMethod, setShippingMethod] = useState("pickup");
  const [shippingAddress, setShippingAddress] = useState("");

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getCartItems();
      setCartItems(data);
    } catch (err) {
      setError(err.message || "Unable to load cart.");
    } finally {
      setLoading(false);
    }
  };

  const total = useMemo(
    () => cartItems.reduce((sum, entry) => sum + Number(entry.items?.price || 0), 0),
    [cartItems]
  );

  const handleRemove = async (cartId) => {
    try {
      await removeFromCart(cartId);
      setCartItems((prev) => prev.filter((entry) => entry.id !== cartId));
    } catch (err) {
      setError(err.message || "Unable to remove item.");
    }
  };

  const handleCheckout = async () => {
    setProcessing(true);
    setError("");
    try {
      const orderId = await createOrderFromCart({ shippingMethod, shippingAddress });
      navigate(`/orders?created=${orderId}`);
    } catch (err) {
      setError(err.message || "Checkout failed.");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Cart</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Review your selected items before checkout.
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
      ) : cartItems.length === 0 ? (
        <div className="card text-center py-16">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-slate-800">
            <ShoppingCart className="h-8 w-8 text-gray-400" />
          </div>
          <h2 className="text-xl font-bold mb-2">Your cart is empty</h2>
          <p className="text-gray-500 mb-6">Add items from the marketplace to start an order.</p>
          <Link to="/marketplace" className="btn-primary inline-flex items-center gap-2">
            Browse marketplace <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-4">
            {cartItems.map((entry) => (
              <div
                key={entry.id}
                className="card flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={entry.items?.image_url || "https://placehold.co/160x200?text=Item"}
                    alt={entry.items?.title || "Item"}
                    className="h-24 w-20 rounded-2xl object-cover"
                  />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                      {entry.items?.category || "Fashion"}
                    </p>
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                      {entry.items?.title}
                    </h3>
                    <p className="text-sm text-gray-500">
                      Condition: {entry.items?.condition || "Not specified"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between gap-4 sm:flex-col sm:items-end">
                  <span className="text-xl font-bold text-gray-900 dark:text-white">
                    Rs. {entry.items?.price}
                  </span>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="card h-fit space-y-5">
            <div>
              <h2 className="text-xl font-bold">Order Summary</h2>
              <p className="text-sm text-gray-500">{cartItems.length} item(s) ready for checkout</p>
            </div>

            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Delivery method
              </label>
              <select
                value={shippingMethod}
                onChange={(event) => setShippingMethod(event.target.value)}
                className="input-field"
              >
                <option value="pickup">Local pickup</option>
                <option value="delivery">Home delivery</option>
                <option value="shipping">Courier shipping</option>
              </select>
              <textarea
                value={shippingAddress}
                onChange={(event) => setShippingAddress(event.target.value)}
                placeholder="Delivery notes or address"
                className="input-field min-h-[100px] resize-none"
              />
            </div>

            <div className="rounded-2xl bg-gray-50 p-4 dark:bg-slate-800/60">
              <div className="mb-2 flex items-center justify-between text-sm text-gray-500">
                <span>Subtotal</span>
                <span>Rs. {total}</span>
              </div>
              <div className="flex items-center justify-between text-lg font-bold text-gray-900 dark:text-white">
                <span>Total</span>
                <span>Rs. {total}</span>
              </div>
            </div>

            <button
              onClick={handleCheckout}
              disabled={processing}
              className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-60"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Processing order...
                </>
              ) : (
                <>
                  Place order
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
