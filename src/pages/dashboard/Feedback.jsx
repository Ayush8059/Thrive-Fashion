import { useEffect, useMemo, useRef, useState } from "react";
import { ImagePlus, MessageSquareHeart, Send, Star, X } from "lucide-react";
import { motion } from "framer-motion";
import { submitFeedback } from "../../services/feedback";

const categories = [
  "Bug report",
  "Feature request",
  "UI/UX feedback",
  "Performance issue",
  "General feedback",
];

export default function Feedback() {
  const [category, setCategory] = useState(categories[0]);
  const [rating, setRating] = useState(5);
  const [message, setMessage] = useState("");
  const [screenshot, setScreenshot] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);

  const screenshotPreview = useMemo(
    () => (screenshot ? URL.createObjectURL(screenshot) : ""),
    [screenshot],
  );

  useEffect(() => {
    return () => {
      if (screenshotPreview) {
        URL.revokeObjectURL(screenshotPreview);
      }
    };
  }, [screenshotPreview]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSuccess("");
    setError("");

    if (!message.trim()) {
      setError("Please share your feedback before submitting.");
      return;
    }

    try {
      setSubmitting(true);
      await submitFeedback({
        category,
        rating,
        message: message.trim(),
        screenshot,
      });
      setMessage("");
      setRating(5);
      setCategory(categories[0]);
      setScreenshot(null);
      setSuccess("Thanks! Your feedback has been sent to the admin team.");
    } catch (err) {
      setError(err.message || "Unable to submit feedback right now.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleScreenshotChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const isAllowedType = ["image/png", "image/jpeg", "image/webp"].includes(file.type);
    if (!isAllowedType) {
      setError("Please upload a PNG, JPG, or WEBP screenshot.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Screenshot size must be under 5 MB.");
      event.target.value = "";
      return;
    }

    setError("");
    setScreenshot(file);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto max-w-3xl pb-16"
    >
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">Feedback</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Share bugs, suggestions, and product ideas so we can improve Thrive for everyone.
        </p>
      </div>

      {error && (
        <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl bg-primary/10 p-3 text-primary">
            <MessageSquareHeart className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Tell us what you think</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Good feedback helps us fix issues faster and ship better features.
            </p>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Feedback Type
            </label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="input-field">
              {categories.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
              Rating
            </label>
            <div className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-slate-900">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(value)}
                  className={`transition ${value <= rating ? "text-yellow-400" : "text-gray-300 dark:text-gray-600"}`}
                >
                  <Star className={`h-5 w-5 ${value <= rating ? "fill-current" : ""}`} />
                </button>
              ))}
              <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{rating}/5</span>
            </div>
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300">
            Message
          </label>
          <textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={7}
            maxLength={1500}
            placeholder="Describe the issue, idea, or improvement you want to share..."
            className="input-field min-h-[180px] resize-none"
          />
          <p className="mt-2 text-right text-xs text-gray-400">{message.length}/1500</p>
        </div>

        <div className="rounded-3xl border border-dashed border-primary/25 bg-primary/5 p-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">Optional screenshot</h3>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Add a screenshot for bugs, layout issues, or anything visual. PNG, JPG, or WEBP up to 5 MB.
              </p>
            </div>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl border border-primary/20 bg-white px-4 py-2 text-sm font-semibold text-primary shadow-sm transition hover:border-primary/40 dark:bg-slate-900"
            >
              <ImagePlus className="h-4 w-4" />
              {screenshot ? "Change screenshot" : "Upload screenshot"}
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={handleScreenshotChange}
          />

          {screenshot && (
            <div className="mt-4 rounded-2xl border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-slate-950">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-gray-800 dark:text-gray-200">{screenshot.name}</div>
                  <div className="text-xs text-gray-400">{(screenshot.size / 1024 / 1024).toFixed(2)} MB</div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setScreenshot(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                  className="rounded-full border border-gray-200 p-2 text-gray-500 transition hover:border-red-200 hover:text-red-500 dark:border-gray-700"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {screenshotPreview && (
                <img
                  src={screenshotPreview}
                  alt="Feedback screenshot preview"
                  className="max-h-72 w-full rounded-2xl object-cover"
                />
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end">
          <button type="submit" disabled={submitting} className="btn-primary inline-flex items-center gap-2 disabled:opacity-60">
            <Send className="h-4 w-4" />
            {submitting ? "Submitting..." : "Send Feedback"}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
