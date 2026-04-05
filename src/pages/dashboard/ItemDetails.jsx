import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  Heart,
  Loader2,
  MessageCircle,
  Share2,
  ShoppingCart,
  Star,
} from "lucide-react";
import { getItemById, isWishlisted, toggleWishlistWithLiveCounts } from "../../services/items";
import { addToCart } from "../../services/cart";
import { getOrCreateConversation } from "../../services/chat";
import { getReviewsForItem, upsertReview } from "../../services/reviews";
import { useAuth } from "../../context/AuthContext";

function StarPicker({ value, onChange, readOnly = false }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((starValue) => (
        <button
          key={starValue}
          type="button"
          disabled={readOnly}
          onClick={() => onChange?.(starValue)}
          className={readOnly ? "cursor-default" : "transition-transform hover:scale-110"}
        >
          <Star
            className={`h-5 w-5 ${
              starValue <= value
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300 dark:text-gray-600"
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ItemDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [item, setItem] = useState(null);
  const [mainImage, setMainImage] = useState("");
  const [reviews, setReviews] = useState([]);
  const [wishlisted, setWishlisted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState({ type: "", text: "" });
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  useEffect(() => {
    loadItem();
  }, [id, user?.id]);

  const loadItem = async () => {
    setLoading(true);
    setNotice({ type: "", text: "" });
    try {
      const [itemData, reviewData] = await Promise.all([
        getItemById(id),
        getReviewsForItem(id).catch(() => []),
      ]);

      setItem(itemData);
      setMainImage(itemData?.images?.[0] || itemData?.image_url || "");
      setReviews(reviewData);

      if (user && itemData) {
        const saved = await isWishlisted(itemData.id, user.id).catch(() => false);
        setWishlisted(saved);
      }
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to load item." });
    } finally {
      setLoading(false);
    }
  };

  const isOwnItem = user?.id && item?.user_id === user.id;
  const gallery = item?.images?.length ? item.images : [item?.image_url].filter(Boolean);

  const averageRating = useMemo(() => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
    return Number((total / reviews.length).toFixed(1));
  }, [reviews]);

  const handleWishlist = async () => {
    if (!user || !item) {
      navigate("/");
      return;
    }

    setBusy("wishlist");
    try {
      const next = await toggleWishlistWithLiveCounts(item.id, user.id);
      setWishlisted(next);
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to update wishlist." });
    } finally {
      setBusy("");
    }
  };

  const handleAddToCart = async () => {
    if (!user || !item) {
      navigate("/");
      return;
    }

    setBusy("cart");
    try {
      const result = await addToCart(item);
      setNotice({ type: "success", text: result.message });
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to add item to cart." });
    } finally {
      setBusy("");
    }
  };

  const handleStartChat = async () => {
    if (!user || !item) {
      navigate("/");
      return;
    }

    setBusy("chat");
    try {
      await getOrCreateConversation({ itemId: item.id, sellerId: item.user_id });
      navigate("/messages");
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to start conversation." });
    } finally {
      setBusy("");
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;
    const shareText = `Check out this item on Thrive: ${item?.title || "Fashion item"}`;

    try {
      if (navigator.share) {
        await navigator.share({
          title: item?.title || "Thrive item",
          text: shareText,
          url: shareUrl,
        });
        setNotice({ type: "success", text: "Item shared successfully." });
        return;
      }

      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`;
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
      setNotice({ type: "success", text: "Opening WhatsApp share." });
    } catch (error) {
      if (error?.name === "AbortError") {
        return;
      }

      try {
        await navigator.clipboard.writeText(shareUrl);
        setNotice({ type: "success", text: "Share link copied." });
      } catch {
        setNotice({ type: "error", text: "Unable to share this item right now." });
      }
    }
  };

  const handleReviewSubmit = async (event) => {
    event.preventDefault();

    if (!user) {
      navigate("/");
      return;
    }

    if (rating < 1) {
      setNotice({ type: "error", text: "Please choose a rating." });
      return;
    }

    if (!comment.trim()) {
      setNotice({ type: "error", text: "Please write a review comment." });
      return;
    }

    setBusy("review");
    try {
      await upsertReview({
        itemId: item.id,
        sellerId: item.user_id,
        rating,
        comment,
      });
      setRating(0);
      setComment("");
      setNotice({ type: "success", text: "Review saved." });
      const latestReviews = await getReviewsForItem(item.id).catch(() => []);
      setReviews(latestReviews);
    } catch (err) {
      setNotice({ type: "error", text: err.message || "Unable to save review." });
    } finally {
      setBusy("");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="py-24 text-center">
        <h1 className="mb-2 text-2xl font-bold">Item not found</h1>
        <button onClick={() => navigate("/marketplace")} className="btn-primary">
          Back to marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pb-16">
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-gray-600 transition-colors hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {notice.text && (
        <div
          className={`mb-6 rounded-2xl px-4 py-3 text-sm ${
            notice.type === "error"
              ? "border border-red-200 bg-red-50 text-red-600"
              : "border border-green-200 bg-green-50 text-green-700"
          }`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="card">
          <div className="overflow-hidden rounded-3xl bg-gray-50 dark:bg-slate-800/60">
            <img
              src={mainImage || "https://placehold.co/600x800?text=No+Image"}
              alt={item.title}
              className="aspect-[4/5] w-full object-cover"
            />
          </div>

          {gallery.length > 1 && (
            <div className="mt-4 flex gap-3 overflow-x-auto">
              {gallery.map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  onClick={() => setMainImage(image)}
                  className={`overflow-hidden rounded-2xl border-2 ${
                    mainImage === image ? "border-primary" : "border-transparent"
                  }`}
                >
                  <img src={image} alt={`${item.title} ${index + 1}`} className="h-20 w-16 object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card flex flex-col">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {item.category}
          </p>
          <h1 className="mb-3 text-3xl font-bold text-gray-900 dark:text-white">{item.title}</h1>

          <div className="mb-4 flex items-center gap-3">
            <span className="text-4xl font-black text-gray-900 dark:text-white">Rs. {item.price}</span>
            {item.original_price && (
              <span className="text-lg text-gray-400 line-through">Rs. {item.original_price}</span>
            )}
          </div>

          <div className="mb-6 flex items-center gap-2">
            <StarPicker value={Math.round(averageRating)} readOnly />
            <span className="text-sm text-gray-500">
              {reviews.length ? `${averageRating} from ${reviews.length} review(s)` : "No reviews yet"}
            </span>
          </div>

          <div className="mb-6 grid grid-cols-2 gap-4">
            <InfoCard label="Condition" value={item.condition || "Not specified"} />
            <InfoCard label="Size" value={item.size || "Not specified"} />
            <InfoCard label="Brand" value={item.brand || "Not specified"} />
            <InfoCard label="Seller" value={isOwnItem ? "Uploaded by you" : item.profiles?.full_name || "Unknown seller"} />
          </div>

          <div className="mb-8">
            <h2 className="mb-2 text-lg font-bold">Description</h2>
            <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">
              {item.description || "No description provided for this item yet."}
            </p>
          </div>

          {!isOwnItem && (
            <div className="mt-auto grid gap-3 sm:grid-cols-2">
              <button
                onClick={handleAddToCart}
                disabled={busy === "cart"}
                className="btn-primary inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy === "cart" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShoppingCart className="h-4 w-4" />
                )}
                Add to cart
              </button>
              <button
                onClick={handleStartChat}
                disabled={busy === "chat"}
                className="btn-outline inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {busy === "chat" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MessageCircle className="h-4 w-4" />
                )}
                Message seller
              </button>
              <button
                onClick={handleWishlist}
                disabled={busy === "wishlist"}
                className="btn-outline inline-flex items-center justify-center gap-2 disabled:opacity-60"
              >
                <Heart className={`h-4 w-4 ${wishlisted ? "fill-red-500 text-red-500" : ""}`} />
                {wishlisted ? "Saved" : "Wishlist"}
              </button>
              <button
                onClick={handleShare}
                className="btn-outline inline-flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_0.95fr]">
        <div className="card">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Reviews</h2>
              <p className="text-sm text-gray-500">Buyer feedback for this listing.</p>
            </div>
          </div>

          {reviews.length === 0 ? (
            <p className="text-sm text-gray-500">No reviews yet.</p>
          ) : (
            <div className="space-y-4">
              {reviews.map((review) => (
                <div key={review.id} className="rounded-2xl border border-gray-100 p-4 dark:border-gray-800">
                  <div className="mb-2 flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {review.profiles?.full_name || "Buyer"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {new Date(review.created_at).toLocaleString()}
                      </p>
                    </div>
                    <StarPicker value={review.rating} readOnly />
                  </div>
                  <p className="text-sm leading-7 text-gray-600 dark:text-gray-300">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isOwnItem && (
          <div className="card">
            <h2 className="mb-2 text-2xl font-bold">Write a review</h2>
            <p className="mb-6 text-sm text-gray-500">
              Reviews should only come from delivered orders. We will enforce that in Supabase policies.
            </p>

            <form onSubmit={handleReviewSubmit} className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Rating
                </label>
                <StarPicker value={rating} onChange={setRating} />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Comment
                </label>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  className="input-field min-h-[130px] resize-none"
                  placeholder="Share your buying experience."
                  maxLength={500}
                />
              </div>

              <button
                type="submit"
                disabled={busy === "review"}
                className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
              >
                {busy === "review" && <Loader2 className="h-4 w-4 animate-spin" />}
                Save review
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoCard({ label, value }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 p-4 dark:border-gray-800 dark:bg-slate-800/40">
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="font-semibold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}
