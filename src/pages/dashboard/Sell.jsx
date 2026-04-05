import { UploadCloud, X, Tag, Package, Ruler, FileText, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { addItem, uploadItemImage } from "../../services/items";
import { useAuth } from "../../context/AuthContext";
import { validateItem, validateImageFile } from "../../utils/validators";

export default function Sell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title,          setTitle]          = useState("");
  const [description,    setDescription]    = useState("");
  const [category,       setCategory]       = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [condition,      setCondition]      = useState("");
  const [brand,          setBrand]          = useState("");
  const [size,           setSize]           = useState("");
  const [color,          setColor]          = useState("");
  const [gender,         setGender]         = useState("");
  const [price,          setPrice]          = useState("");
  const [originalPrice,  setOriginalPrice]  = useState("");
  const [imageUrl,       setImageUrl]       = useState("");
  const [selectedFile,   setSelectedFile]   = useState(null);
  const [isUploading,    setIsUploading]    = useState(false);
  const [errors,         setErrors]         = useState({});
  const [successMsg,     setSuccessMsg]     = useState("");

  const fileInputRef = useRef(null);

  // ── Image handlers ─────────────────────────────────────────────────────────
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const imgError = validateImageFile(file);
    if (imgError) {
      setErrors(prev => ({ ...prev, image: imgError }));
      return;
    }

    setErrors(prev => ({ ...prev, image: null }));
    setSelectedFile(file);
    setImageUrl(URL.createObjectURL(file));
  };

  const handleRemoveImage = () => {
    setSelectedFile(null);
    setImageUrl("");
    fileInputRef.current.value = "";
    setErrors(prev => ({ ...prev, image: null }));
  };

  // ── Submit ─────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSuccessMsg("");

    if (!user) {
      setErrors({ general: "You must be logged in to sell items." });
      return;
    }

    // Validate fields
    const { isValid, errors: validationErrors } = validateItem({
      title, price, originalPrice, category, condition, gender,
    });

    if (!selectedFile) {
      validationErrors.image = "Please upload an image of your item.";
    }

    if (!isValid || validationErrors.image) {
      setErrors(validationErrors);
      // Scroll to first error
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    try {
      setIsUploading(true);

      // Validate image file before upload
      const imgError = validateImageFile(selectedFile);
      if (imgError) {
        setErrors({ image: imgError });
        return;
      }

      const result = await uploadItemImage(selectedFile);
      if (!result?.url) {
        setErrors({ general: "Image upload failed. Please try again." });
        return;
      }

      const finalCategory = category === "Other"
        ? (customCategory.trim() || "Other")
        : category;

      const { data, error } = await addItem({
        title:          title.trim(),
        description:    description.trim(),
        category:       finalCategory,
        condition,
        brand:          brand.trim(),
        size,
        color,
        gender,
        price:          Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        image_url:      result.url,
        images:         [result.url],
        likes:          0,
        views:          0,
        status:         "active",
      });

      if (error) {
        setErrors({ general: error.message || "Failed to list item." });
        return;
      }

      if (data) {
        setSuccessMsg("Item listed successfully! 🎉 Redirecting to marketplace...");
        // Reset form
        setTitle(""); setDescription(""); setCategory(""); setCustomCategory("");
        setCondition(""); setBrand(""); setSize(""); setColor(""); setGender("");
        setPrice(""); setOriginalPrice(""); setImageUrl(""); setSelectedFile(null);
        setTimeout(() => navigate("/marketplace"), 1500);
      }
    } catch (err) {
      console.error(err);
      setErrors({ general: err?.message || "Something went wrong. Please try again." });
    } finally {
      setIsUploading(false);
    }
  };

  // ── Field error helper ─────────────────────────────────────────────────────
  const FieldError = ({ field }) =>
    errors[field] ? (
      <p className="text-red-500 text-xs mt-1 font-medium">{errors[field]}</p>
    ) : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="max-w-3xl mx-auto pb-16"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Sell an Item</h1>
        <p className="text-gray-700 dark:text-gray-400">
          List your pre-loved clothes and give them a new home.
        </p>
      </div>

      {/* General error */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-red-100 dark:bg-red-900/20 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-400 rounded-xl text-sm font-medium"
        >
          ⚠️ {errors.general}
        </motion.div>
      )}

      {/* Success message */}
      {successMsg && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-100 dark:bg-green-900/20 border border-green-400 dark:border-green-700 text-green-700 dark:text-green-400 rounded-xl text-sm font-medium"
        >
          ✅ {successMsg}
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>

        {/* Image Upload */}
        <div className="card">
          <h2 className="text-lg font-bold mb-4">Item Photo</h2>
          {!imageUrl ? (
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className={`w-full border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center gap-3 hover:border-primary hover:bg-primary/5 transition-all group ${
                errors.image
                  ? "border-red-400 bg-red-50 dark:bg-red-900/10"
                  : "border-gray-300 dark:border-gray-700"
              }`}
            >
              <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                <UploadCloud className="w-8 h-8 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
              <div className="text-center">
                <p className="font-semibold text-gray-700 dark:text-gray-300">
                  Click to upload photo
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  JPG, PNG, WebP — max 5MB
                </p>
              </div>
            </button>
          ) : (
            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-3 right-3 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-3">
                <span className="bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  ✓ Photo ready
                </span>
              </div>
            </div>
          )}
          <FieldError field="image" />
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            ref={fileInputRef}
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        {/* Basic Info */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold mb-2">Basic Information</h2>

          {/* Title */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Title <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Tag className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="e.g. Vintage Leather Jacket"
                className={`input-field pl-10 ${errors.title ? "border-red-400 focus:ring-red-400" : ""}`}
                value={title}
                maxLength={100}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (errors.title) setErrors(prev => ({ ...prev, title: null }));
                }}
              />
            </div>
            <div className="flex justify-between items-center">
              <FieldError field="title" />
              <span className="text-xs text-gray-400 ml-auto">{title.length}/100</span>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Description
            </label>
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                <FileText className="h-5 w-5 text-gray-400" />
              </div>
              <textarea
                placeholder="Describe your item — condition details, why you're selling, measurements, etc."
                className="input-field pl-10 min-h-[100px] resize-none"
                value={description}
                maxLength={500}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <span className="text-xs text-gray-400 block text-right">{description.length}/500</span>
          </div>

          {/* Gender */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
              Gender <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-4 gap-3">
              {[
                { label: "👨 Male",   value: "Male"   },
                { label: "👩 Female", value: "Female" },
                { label: "🧑 Unisex", value: "Unisex" },
                { label: "👶 Kids",   value: "Kids"   },
              ].map((g) => (
                <button
                  key={g.value}
                  type="button"
                  onClick={() => {
                    setGender(g.value);
                    setErrors(prev => ({ ...prev, gender: null }));
                  }}
                  className={`py-2.5 rounded-xl text-sm font-semibold border-2 transition-all ${
                    gender === g.value
                      ? "border-primary bg-primary/10 text-primary"
                      : errors.gender
                      ? "border-red-300 text-gray-600 dark:text-gray-400"
                      : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:border-primary/50"
                  }`}
                >
                  {g.label}
                </button>
              ))}
            </div>
            <FieldError field="gender" />
          </div>

          {/* Category & Condition */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setErrors(prev => ({ ...prev, category: null }));
                }}
                className={`input-field ${errors.category ? "border-red-400" : ""}`}
              >
                <option value="">Select category</option>
                <option>Tops</option>
                <option>Shirts</option>
                <option>T-Shirts</option>
                <option>Outerwear</option>
                <option>Jackets & Coats</option>
                <option>Pants</option>
                <option>Jeans</option>
                <option>Shorts</option>
                <option>Dresses</option>
                <option>Skirts</option>
                <option>Ethnic Wear</option>
                <option>Shoes</option>
                <option>Sneakers</option>
                <option>Accessories</option>
                <option>Sportswear</option>
                <option>Innerwear</option>
                <option>Swimwear</option>
                <option>Other</option>
              </select>
              {category === "Other" && (
                <input
                  type="text"
                  placeholder="Type your category..."
                  className="input-field mt-2"
                  value={customCategory}
                  maxLength={50}
                  onChange={(e) => setCustomCategory(e.target.value)}
                />
              )}
              <FieldError field="category" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                value={condition}
                onChange={(e) => {
                  setCondition(e.target.value);
                  setErrors(prev => ({ ...prev, condition: null }));
                }}
                className={`input-field ${errors.condition ? "border-red-400" : ""}`}
              >
                <option value="">Select condition</option>
                <option>New with tags</option>
                <option>Like New</option>
                <option>Excellent</option>
                <option>Good</option>
                <option>Fair</option>
              </select>
              <FieldError field="condition" />
            </div>
          </div>
        </div>

        {/* Item Details */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold mb-2">Item Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Brand</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Package className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  placeholder="e.g. Zara, Nike, H&M"
                  className="input-field pl-10"
                  value={brand}
                  maxLength={50}
                  onChange={(e) => setBrand(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Size</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Ruler className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  value={size}
                  onChange={(e) => setSize(e.target.value)}
                  className="input-field pl-10"
                >
                  <option value="">Select size</option>
                  <option>XS</option><option>S</option><option>M</option>
                  <option>L</option><option>XL</option><option>XXL</option>
                  <option>Free Size</option>
                  <option>28</option><option>30</option><option>32</option>
                  <option>34</option><option>36</option><option>38</option>
                  <option>40</option><option>42</option><option>44</option>
                </select>
              </div>
            </div>
          </div>

          {/* Color Swatches */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">Color</label>
            <div className="flex flex-wrap gap-3">
              {[
                { name: "Black",      hex: "#000000" },
                { name: "White",      hex: "#FFFFFF" },
                { name: "Red",        hex: "#EF4444" },
                { name: "Blue",       hex: "#3B82F6" },
                { name: "Navy",       hex: "#1E3A5F" },
                { name: "Green",      hex: "#22C55E" },
                { name: "Yellow",     hex: "#EAB308" },
                { name: "Pink",       hex: "#EC4899" },
                { name: "Purple",     hex: "#A855F7" },
                { name: "Orange",     hex: "#F97316" },
                { name: "Brown",      hex: "#92400E" },
                { name: "Grey",       hex: "#6B7280" },
                { name: "Beige",      hex: "#D4B896" },
                { name: "Multicolor", hex: null      },
              ].map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onClick={() => setColor(c.name)}
                  title={c.name}
                  className={`relative w-9 h-9 rounded-full border-2 transition-all hover:scale-110 ${
                    color === c.name
                      ? "border-primary scale-110 shadow-lg shadow-primary/30"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                  style={{ backgroundColor: c.hex || "transparent" }}
                >
                  {!c.hex && (
                    <span className="absolute inset-0 rounded-full bg-gradient-to-br from-red-400 via-yellow-400 to-blue-400" />
                  )}
                  {c.name === "White" && (
                    <span className="absolute inset-1 rounded-full border border-gray-200" />
                  )}
                  {color === c.name && (
                    <span className={`absolute inset-0 flex items-center justify-center text-xs font-bold ${
                      ["White","Yellow","Beige"].includes(c.name) ? "text-gray-800" : "text-white"
                    }`}>✓</span>
                  )}
                </button>
              ))}
            </div>
            {color && (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Selected: <span className="font-semibold text-primary">{color}</span>
              </p>
            )}
            <input
              type="text"
              placeholder="Or type a custom color..."
              className="input-field mt-1"
              value={color}
              maxLength={30}
              onChange={(e) => setColor(e.target.value)}
            />
          </div>
        </div>

        {/* Pricing */}
        <div className="card space-y-4">
          <h2 className="text-lg font-bold mb-2">Pricing</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Selling Price (₹) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-semibold text-sm">₹</span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 499"
                  className={`input-field pl-8 ${errors.price ? "border-red-400" : ""}`}
                  min="1"
                  max="100000"
                  value={price}
                  onChange={(e) => {
                    setPrice(e.target.value);
                    setErrors(prev => ({ ...prev, price: null }));
                  }}
                />
              </div>
              <FieldError field="price" />
            </div>

            <div className="space-y-1">
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Original Price (₹)
                <span className="text-xs text-gray-500 ml-1">(optional)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span className="text-gray-400 font-semibold text-sm">₹</span>
                </div>
                <input
                  type="number"
                  placeholder="e.g. 1999"
                  className={`input-field pl-8 ${errors.originalPrice ? "border-red-400" : ""}`}
                  min="1"
                  value={originalPrice}
                  onChange={(e) => {
                    setOriginalPrice(e.target.value);
                    setErrors(prev => ({ ...prev, originalPrice: null }));
                  }}
                />
              </div>
              <FieldError field="originalPrice" />
              {price && originalPrice && Number(originalPrice) > Number(price) && (
                <p className="text-xs text-green-600 font-semibold mt-1">
                  Buyers save ₹{Number(originalPrice) - Number(price)} ({Math.round((1 - Number(price) / Number(originalPrice)) * 100)}% off)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Submit */}
        <motion.button
          whileHover={{ scale: isUploading ? 1 : 1.02 }}
          whileTap={{ scale: isUploading ? 1 : 0.98 }}
          type="submit"
          disabled={isUploading}
          className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Uploading & Listing...
            </>
          ) : (
            <>
              List Item on Marketplace
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
}
