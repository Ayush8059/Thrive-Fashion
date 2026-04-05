import { Plus, Camera, FileText, X, Trash2, Loader, ShoppingBag, AlertCircle, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import TiltCard from "../../components/TiltCard";
import { useState, useRef, useEffect } from "react";
import { addItem, uploadItemImage, getUserItems, deleteItem, findSimilarItems } from "../../services/items";
import { useAuth } from "../../context/AuthContext";

// Helper function to format relative time
function getRelativeTime(date) {
  const now = new Date();
  const then = new Date(date);
  const diffInSeconds = Math.floor((now - then) / 1000);

  if (diffInSeconds < 60) return "Just now";
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
  return `${Math.floor(diffInSeconds / 31536000)}y ago`;
}

export default function Wardrobe() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addMethod, setAddMethod] = useState(null); // null | "camera" | "manual"

  // Camera
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);

  // Manual
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("");
  const [manualFile, setManualFile] = useState(null);
  const [manualImagePreview, setManualImagePreview] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const manualFileInputRef = useRef(null);

  // 🆕 Duplicate Detection
  const [similarItems, setSimilarItems] = useState([]);
  const [showDuplicateWarning, setShowDuplicateWarning] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadItems();
    return () => stopCamera();
  }, [user]);

  const loadItems = async () => {
    setLoading(true);
    const data = await getUserItems(user.id);
    setItems(data);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this item from your wardrobe?")) return;
    await deleteItem(id);
    setItems(prev => prev.filter(i => i.id !== id));
  };

  const openModal = () => {
    setIsModalOpen(true);
    setAddMethod(null);
    setCapturedImage(null);
    setManualTitle("");
    setManualCategory("");
    setManualFile(null);
    setManualImagePreview("");
    setSimilarItems([]);
    setShowDuplicateWarning(false);
  };

  const closeModal = () => {
    stopCamera();
    setIsModalOpen(false);
    setAddMethod(null);
    setCapturedImage(null);
    setManualTitle("");
    setManualCategory("");
    setManualFile(null);
    setManualImagePreview("");
    setSimilarItems([]);
    setShowDuplicateWarning(false);
  };

  const startCamera = async () => {
    setAddMethod("camera");
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
      setStream(mediaStream);
      setTimeout(() => {
        if (videoRef.current) videoRef.current.srcObject = mediaStream;
      }, 100);
    } catch {
      alert("Camera not accessible. Please allow camera permission.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
  };

  const captureImage = () => {
    if (videoRef.current && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      ctx.drawImage(videoRef.current, 0, 0);
      const data = canvasRef.current.toDataURL("image/jpeg");
      setCapturedImage(data);
      stopCamera();
    }
  };

  const handleManualFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setManualFile(file);
    setManualImagePreview(URL.createObjectURL(file));
  };

  // 🆕 Check for duplicates when title/category changes
  const checkForDuplicates = async (title, category) => {
    if (!title || !category || !user) return;
    
    const similar = await findSimilarItems(title, category, user.id);
    setSimilarItems(similar);
    setShowDuplicateWarning(similar.length > 0);
  };

  // 🆕 Auto-check when title or category changes
  useEffect(() => {
    const timer = setTimeout(() => {
      if (manualTitle && manualCategory) {
        checkForDuplicates(manualTitle, manualCategory);
      }
    }, 500); // Debounce for 500ms

    return () => clearTimeout(timer);
  }, [manualTitle, manualCategory]);

  const handleWardrobeSubmit = async (e) => {
    e.preventDefault();
    if (!user) { alert("Login first"); return; }
    if (!manualTitle || !manualCategory) { alert("Title and Category are required"); return; }

    setIsSubmitting(true);
    try {
      let finalImageUrl = "";

      if (manualFile) {
        const result = await uploadItemImage(manualFile);
        finalImageUrl = result?.url || "";
      } else if (capturedImage) {
        const res = await fetch(capturedImage);
        const blob = await res.blob();
        const file = new File([blob], `${Date.now()}.jpg`, { type: "image/jpeg" });
        const result = await uploadItemImage(file);
        finalImageUrl = result?.url || "";
      }

      await addItem({
        title: manualTitle,
        category: manualCategory,
        price: 0,
        image_url: finalImageUrl,
        status: "wardrobe",
        likes: 0,
        views: 0,
      });

      await loadItems();
      closeModal();
    } catch {
      alert("Failed to save item. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Virtual Wardrobe</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Your personal digital closet — {items.length} items stored
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={openModal}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Add Item
        </motion.button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && items.length === 0 && (
        <div className="text-center py-20">
          <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-400 mb-2">Your wardrobe is empty</p>
          <p className="text-gray-500 mb-6">Start adding your clothes to build your digital wardrobe!</p>
          <button onClick={openModal} className="btn-primary">Add Your First Item</button>
        </div>
      )}

      {/* Items Grid */}
      {!loading && items.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((item) => (
            <TiltCard key={item.id}>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative group rounded-2xl overflow-hidden bg-white dark:bg-slate-900 border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-lg transition-all"
              >
                {/* Full Image */}
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=400&h=500&fit=crop";
                    }}
                  />
                  {/* Overlay on hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                  {/* 🆕 Date Added Badge (top-left) */}
                  <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {getRelativeTime(item.created_at)}
                  </div>

                  {/* Delete button */}
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  {/* Title & Category overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-white font-bold text-sm line-clamp-1">{item.title}</p>
                    <p className="text-white/70 text-xs">{item.category}</p>
                  </div>
                </div>

                {/* Info below image */}
                <div className="p-3">
                  <p className="font-semibold text-sm text-gray-900 dark:text-white line-clamp-1">{item.title}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{item.category}</p>
                </div>
              </motion.div>
            </TiltCard>
          ))}
        </div>
      )}

      {/* Hidden canvas for camera */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Add Item Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={closeModal}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md z-10 overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-gray-800 sticky top-0 bg-white dark:bg-slate-900 z-10">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  {!addMethod && "Add to Wardrobe"}
                  {addMethod === "camera" && "📷 Take a Photo"}
                  {addMethod === "manual" && "✍️ Manual Entry"}
                </h2>
                <button
                  onClick={closeModal}
                  className="w-8 h-8 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center hover:bg-gray-200 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6">

                {/* Step 1 — Choose method */}
                {!addMethod && (
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mb-6 text-center">
                      How would you like to add your item?
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      {/* Camera Option */}
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={startCamera}
                        className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <Camera className="w-8 h-8 text-blue-600 dark:text-blue-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900 dark:text-white">Camera</p>
                          <p className="text-xs text-gray-500 mt-1">Take a photo now</p>
                        </div>
                      </motion.button>

                      {/* Manual Option */}
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setAddMethod("manual")}
                        className="flex flex-col items-center gap-4 p-8 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700 hover:border-primary hover:bg-primary/5 transition-all group"
                      >
                        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                          <FileText className="w-8 h-8 text-green-600 dark:text-green-400 group-hover:text-primary transition-colors" />
                        </div>
                        <div className="text-center">
                          <p className="font-bold text-gray-900 dark:text-white">Manual Entry</p>
                          <p className="text-xs text-gray-500 mt-1">Upload & fill details</p>
                        </div>
                      </motion.button>
                    </div>
                  </div>
                )}

                {/* Step 2A — Camera View */}
                {addMethod === "camera" && (
                  <div className="space-y-4">
                    {!capturedImage ? (
                      <>
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                          <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => { stopCamera(); setAddMethod(null); }}
                            className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                          >
                            ← Back
                          </button>
                          <button
                            type="button"
                            onClick={captureImage}
                            className="flex-1 btn-primary flex items-center justify-center gap-2"
                          >
                            <Camera className="w-4 h-4" /> Capture
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <img src={capturedImage} alt="Captured" className="w-full rounded-xl aspect-video object-cover" />
                        
                        <form onSubmit={handleWardrobeSubmit} className="space-y-3">
                          <input
                            type="text"
                            placeholder="Item name (e.g. Blue Shirt)"
                            className="input-field"
                            required
                            value={manualTitle}
                            onChange={(e) => setManualTitle(e.target.value)}
                          />
                          <select
                            className="input-field"
                            value={manualCategory}
                            onChange={(e) => setManualCategory(e.target.value)}
                            required
                          >
                            <option value="">Select category</option>
                            <option>Tops</option>
                            <option>Shirts</option>
                            <option>T-Shirts</option>
                            <option>Outerwear</option>
                            <option>Pants</option>
                            <option>Jeans</option>
                            <option>Dresses</option>
                            <option>Shoes</option>
                            <option>Accessories</option>
                            <option>Ethnic Wear</option>
                            <option>Sportswear</option>
                            <option>Other</option>
                          </select>

                          {/* 🆕 Duplicate Warning */}
                          {showDuplicateWarning && similarItems.length > 0 && (
                            <motion.div
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
                            >
                              <div className="flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                  <p className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                                    Similar item{similarItems.length > 1 ? 's' : ''} found in your wardrobe
                                  </p>
                                  <div className="space-y-2">
                                    {similarItems.slice(0, 2).map(similar => (
                                      <div key={similar.id} className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-800">
                                          <img 
                                            src={similar.image_url} 
                                            alt={similar.title}
                                            className="w-full h-full object-cover"
                                          />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium truncate">{similar.title}</p>
                                          <p className="text-amber-600 dark:text-amber-400">Added {getRelativeTime(similar.created_at)}</p>
                                        </div>
                                      </div>
                                    ))}
                                    {similarItems.length > 2 && (
                                      <p className="text-xs text-amber-600 dark:text-amber-400">
                                        +{similarItems.length - 2} more similar item{similarItems.length - 2 > 1 ? 's' : ''}
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}

                          <div className="flex gap-3">
                            <button
                              type="button"
                              onClick={() => { setCapturedImage(null); startCamera(); }}
                              className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
                            >
                              Retake
                            </button>
                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="flex-1 btn-primary disabled:opacity-50"
                            >
                              {isSubmitting ? "Saving..." : "Save to Wardrobe"}
                            </button>
                          </div>
                        </form>
                      </>
                    )}
                  </div>
                )}

                {/* Step 2B — Manual Entry */}
                {addMethod === "manual" && (
                  <form onSubmit={handleWardrobeSubmit} className="space-y-4">
                    {/* Image Upload */}
                    <div>
                      {!manualImagePreview ? (
                        <button
                          type="button"
                          onClick={() => manualFileInputRef.current.click()}
                          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 flex flex-col items-center gap-3 hover:border-primary hover:bg-primary/5 transition-all group"
                        >
                          <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <Camera className="w-6 h-6 text-gray-400 group-hover:text-primary" />
                          </div>
                          <div className="text-center">
                            <p className="font-semibold text-sm text-gray-700 dark:text-gray-300">Upload Photo</p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WEBP</p>
                          </div>
                        </button>
                      ) : (
                        <div className="relative rounded-xl overflow-hidden aspect-video">
                          <img src={manualImagePreview} alt="Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setManualFile(null); setManualImagePreview(""); }}
                            className="absolute top-2 right-2 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        ref={manualFileInputRef}
                        className="hidden"
                        onChange={handleManualFileChange}
                      />
                    </div>

                    {/* Title */}
                    <input
                      type="text"
                      placeholder="Item name (e.g. Blue Shirt)"
                      className="input-field"
                      required
                      value={manualTitle}
                      onChange={(e) => setManualTitle(e.target.value)}
                    />

                    {/* Category */}
                    <select
                      className="input-field"
                      value={manualCategory}
                      onChange={(e) => setManualCategory(e.target.value)}
                      required
                    >
                      <option value="">Select category</option>
                      <option>Tops</option>
                      <option>Shirts</option>
                      <option>T-Shirts</option>
                      <option>Outerwear</option>
                      <option>Pants</option>
                      <option>Jeans</option>
                      <option>Dresses</option>
                      <option>Shoes</option>
                      <option>Accessories</option>
                      <option>Ethnic Wear</option>
                      <option>Sportswear</option>
                      <option>Other</option>
                    </select>

                    {/* 🆕 Duplicate Warning */}
                    {showDuplicateWarning && similarItems.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4"
                      >
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                          <div className="flex-1">
                            <p className="font-semibold text-sm text-amber-900 dark:text-amber-100 mb-2">
                              Similar item{similarItems.length > 1 ? 's' : ''} found in your wardrobe
                            </p>
                            <div className="space-y-2">
                              {similarItems.slice(0, 2).map(similar => (
                                <div key={similar.id} className="flex items-center gap-2 text-xs text-amber-800 dark:text-amber-200">
                                  <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 dark:bg-slate-800">
                                    <img 
                                      src={similar.image_url} 
                                      alt={similar.title}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium truncate">{similar.title}</p>
                                    <p className="text-amber-600 dark:text-amber-400">Added {getRelativeTime(similar.created_at)}</p>
                                  </div>
                                </div>
                              ))}
                              {similarItems.length > 2 && (
                                <p className="text-xs text-amber-600 dark:text-amber-400">
                                  +{similarItems.length - 2} more similar item{similarItems.length - 2 > 1 ? 's' : ''}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* Buttons */}
                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setAddMethod(null)}
                        className="flex-1 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                      >
                        ← Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isSubmitting ? "Saving..." : "Save to Wardrobe"}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}