import { Heart, CheckCircle2, X, Search, Package } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { getUserItems } from "../../services/items";
import { createDonation } from "../../services/donation";

const WATER_PER_ITEM = 2700;  // litres — WWF cotton production data
const CO2_PER_ITEM   = 3.6;   // kg — WRAP clothing lifecycle analysis

const NGOS = [
  {
    name: "Goodwill Foundation",
    description: "Provides job training & clothing to low-income families.",
  },
  {
    name: "Oxfam Fashion",
    description: "Fights poverty through sustainable fashion resale globally.",
  },
  {
    name: "Red Cross",
    description: "Distributes clothing to disaster-relief & refugee camps.",
  },
  {
    name: "Local Shelter",
    description: "Supplies essentials to homeless shelters in your city.",
  },
];

const METHODS = [
  { value: "pickup",  label: "Schedule a Pickup" },
  { value: "dropoff", label: "Drop-off at Centre" },
  { value: "mail",    label: "Send via Mail" },
];

const COLOR_MAP = {
  blue:   { text: "text-blue-500",   bar: "bg-blue-500"   },
  green:  { text: "text-green-500",  bar: "bg-green-500"  },
  violet: { text: "text-violet-500", bar: "bg-violet-500" },
};

export default function Donate() {
  const { user } = useContext(AuthContext);

  const [selectedNGO,   setSelectedNGO]   = useState("Goodwill Foundation");
  const [method,        setMethod]        = useState("pickup");
  const [items,         setItems]         = useState([]);
  const [selectedItems, setSelectedItems] = useState([]);
  const [showModal,     setShowModal]     = useState(false);
  const [search,        setSearch]        = useState("");
  const [fetching,      setFetching]      = useState(true);
  const [loading,       setLoading]       = useState(false);
  const [toast,         setToast]         = useState(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setFetching(true);
      try {
        const data = await getUserItems(user.id);
        setItems((data || []).filter((i) => i.status === "active"));
      } catch (err) {
        console.error("Fetch items error:", err);
        setItems([]);
      } finally {
        setFetching(false);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const isSelected = (id) => selectedItems.some((i) => i.id === id);

  const toggleItem = (item) =>
    setSelectedItems((prev) =>
      isSelected(item.id) ? prev.filter((i) => i.id !== item.id) : [...prev, item]
    );

  const removeChip = (id) =>
    setSelectedItems((prev) => prev.filter((i) => i.id !== id));

  const filteredItems = items.filter(
    (item) =>
      (item.title     || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.category  || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.condition || "").toLowerCase().includes(search.toLowerCase())
  );

  const impact = {
    water:    selectedItems.length * WATER_PER_ITEM,
    co2:      (selectedItems.length * CO2_PER_ITEM).toFixed(1),
    recycled: selectedItems.length,
  };

  const canDonate = selectedItems.length > 0;

  const handleDonate = async () => {
    if (!canDonate) return;
    setLoading(true);
    try {
      await createDonation({
        user_id: user.id,
        ngo:     selectedNGO,
        method,
        items:   selectedItems.map((i) => i.id),
      });
      setToast({
        type: "success",
        msg: `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} donated to ${selectedNGO} 🎉`,
      });
      setSelectedItems([]);
    } catch (err) {
      console.error("Donation error:", err);
      setToast({ type: "error", msg: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-4xl mx-auto relative"
    >
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3
              px-5 py-3 rounded-xl shadow-xl text-sm font-medium
              ${toast.type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"}`}
          >
            {toast.type === "success" ? "🎉" : "⚠️"} {toast.msg}
            <button onClick={() => setToast(null)}>
              <X className="w-4 h-4 opacity-70 hover:opacity-100" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
          Donate to NGO
          <Heart className="w-6 h-6 text-pink-500 fill-pink-500" />
        </h1>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* LEFT */}
        <div className="md:col-span-2 space-y-6">
          <div className="card p-6 space-y-6">
            <h2 className="text-xl font-bold">Donation Details</h2>

            {/* Select Items */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Select Clothing Items
              </label>
              <div className="p-4 border border-gray-200 dark:border-slate-700 rounded-xl flex items-center justify-between bg-gray-50 dark:bg-slate-800/50">
                <div>
                  <h4 className="font-semibold">Select from Wardrobe</h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedItems.length} item{selectedItems.length !== 1 ? "s" : ""} selected
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => { setSearch(""); setShowModal(true); }}
                  className="btn-secondary text-sm px-4 py-1.5"
                >
                  Browse
                </button>
              </div>

              {/* Chips */}
              <AnimatePresence>
                {selectedItems.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-2"
                  >
                    {selectedItems.map((item) => (
                      <motion.span
                        key={item.id}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.8, opacity: 0 }}
                        className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full
                          bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300
                          border border-violet-200 dark:border-violet-700"
                      >
                        {item.title}
                        <button onClick={() => removeChip(item.id)} className="hover:text-red-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </motion.span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* NGO */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Select Partner NGO
              </label>
              <div className="grid sm:grid-cols-2 gap-3">
                {NGOS.map((ngo) => (
                  <NGOSelector
                    key={ngo.name}
                    name={ngo.name}
                    description={ngo.description}
                    selected={selectedNGO === ngo.name}
                    onClick={() => setSelectedNGO(ngo.name)}
                  />
                ))}
              </div>
            </div>

            {/* Method */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                Donation Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="input-field"
              >
                {METHODS.map((m) => (
                  <option key={m.value} value={m.value}>{m.label}</option>
                ))}
              </select>
            </div>

            {/* Confirm Button */}
            <button
              onClick={handleDonate}
              disabled={!canDonate || loading}
              className="btn-primary w-full flex items-center justify-center gap-2
                disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  Confirming…
                </span>
              ) : (
                <> Confirm Donation <CheckCircle2 className="w-5 h-5" /> </>
              )}
            </button>
          </div>
        </div>

        {/* RIGHT: Impact */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="font-bold text-lg mb-1">🌿 Sustainability Impact</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">
              Per garment: ~2,700L water saved · ~3.6kg CO₂ reduced
            </p>

            <ImpactStat value={impact.water}    unit="L"  label="Water Saved"    color="blue"   max={27000} />
            <ImpactStat value={impact.co2}      unit="kg" label="CO₂ Reduced"    color="green"  max={36}    />
            <ImpactStat value={impact.recycled} unit=""   label="Items Recycled" color="violet" max={10}    />

            <AnimatePresence>
              {selectedItems.length > 0 && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 6 }}
                  className="mt-4 text-xs text-gray-500 dark:text-gray-400
                    bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800
                    rounded-lg p-3 leading-relaxed"
                >
                  🌍 Donating {selectedItems.length} item{selectedItems.length > 1 ? "s" : ""} saves
                  ~{impact.water.toLocaleString()}L of water — equal to{" "}
                  <strong className="text-green-600 dark:text-green-400">
                    {Math.round(impact.water / 60)} showers
                  </strong>{" "}
                  saved!
                </motion.p>
              )}
            </AnimatePresence>

            {/* Sources */}
            <div className="mt-5 pt-4 border-t border-gray-100 dark:border-slate-700">
              <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">
                📊 How we calculate this
              </p>
              <ul className="space-y-1.5">
                <li className="text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1.5">
                  <span className="text-blue-400 mt-0.5">💧</span>
                  <span>
                    <strong className="text-gray-500 dark:text-gray-400">2,700L water</strong> per garment —
                    based on <span className="underline decoration-dotted">WWF cotton production data</span>
                  </span>
                </li>
                <li className="text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1.5">
                  <span className="text-green-400 mt-0.5">🌱</span>
                  <span>
                    <strong className="text-gray-500 dark:text-gray-400">3.6kg CO₂</strong> per garment —
                    based on <span className="underline decoration-dotted">WRAP clothing lifecycle analysis</span>
                  </span>
                </li>
                <li className="text-xs text-gray-400 dark:text-gray-500 flex items-start gap-1.5">
                  <span className="text-violet-400 mt-0.5">♻️</span>
                  <span>
                    <strong className="text-gray-500 dark:text-gray-400">Shower equivalent</strong> —
                    avg shower uses <span className="underline decoration-dotted">60L (Ellen MacArthur Foundation)</span>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
            onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col shadow-2xl"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-slate-700">
                <div>
                  <h2 className="text-lg font-bold">Select from Wardrobe</h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {selectedItems.length} of {items.length} selected
                  </p>
                </div>
                <button
                  onClick={() => setShowModal(false)}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="p-4 border-b border-gray-200 dark:border-slate-700">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by title, category or condition…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="input-field pl-9 text-sm"
                    autoFocus
                  />
                </div>
              </div>

              {/* Items Grid */}
              <div className="flex-1 overflow-y-auto p-4">
                {fetching ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <svg className="animate-spin w-8 h-8 mb-3 opacity-40" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                    </svg>
                    <p className="text-sm">Loading your wardrobe…</p>
                  </div>
                ) : filteredItems.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                    <Package className="w-12 h-12 mb-3 opacity-30" />
                    <p className="text-sm text-center">
                      {items.length === 0
                        ? "No active items in your wardrobe. Add items from the Sell page first!"
                        : "No items match your search."}
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {filteredItems.map((item) => {
                      const sel = isSelected(item.id);
                      return (
                        <motion.div
                          key={item.id}
                          whileTap={{ scale: 0.97 }}
                          onClick={() => toggleItem(item)}
                          className={`relative flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all
                            ${sel
                              ? "border-green-500 bg-green-50 dark:bg-green-900/20"
                              : "border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800/50 hover:border-violet-400 dark:hover:border-violet-500"
                            }`}
                        >
                          <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-slate-700 flex-shrink-0 overflow-hidden">
                            {item.image_url ? (
                              <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-2xl">👕</div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold truncate">{item.title}</p>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                              {item.category && (
                                <span className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.category}</span>
                              )}
                              {item.condition && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-slate-700 text-gray-500 dark:text-gray-400">
                                  {item.condition}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all
                            ${sel ? "bg-green-500" : "border-2 border-gray-300 dark:border-slate-600"}`}
                          >
                            {sel && (
                              <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                                <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Modal Footer */}
              <div className="p-4 border-t border-gray-200 dark:border-slate-700 flex items-center justify-between gap-3">
                <p className="text-sm text-gray-500">
                  {selectedItems.length > 0
                    ? `${selectedItems.length} item${selectedItems.length > 1 ? "s" : ""} selected`
                    : "Tap items to select"}
                </p>
                <button onClick={() => setShowModal(false)} className="btn-primary px-6 py-2 text-sm">
                  Done
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── NGO Selector ──────────────────────────────────────────────────────────────
function NGOSelector({ name, description, selected, onClick }) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`p-4 border rounded-xl cursor-pointer flex items-start gap-3 transition-all
        ${selected
          ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
          : "border-gray-200 dark:border-slate-700 hover:border-violet-400 dark:hover:border-violet-500"
        }`}
    >
      <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 mt-1 transition-all
        ${selected ? "bg-green-500" : "bg-gray-300 dark:bg-slate-600"}`}
      />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold">{name}</span>
          {selected && <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-500" />}
        </div>
        <p className={`text-xs mt-0.5 leading-relaxed
          ${selected ? "text-green-600/80 dark:text-green-400/70" : "text-gray-500 dark:text-gray-400"}`}
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
}

// ─── Impact Stat ───────────────────────────────────────────────────────────────
function ImpactStat({ value, unit, label, color, max }) {
  const pct = Math.min(100, (parseFloat(value) / max) * 100);
  const { text, bar } = COLOR_MAP[color] || COLOR_MAP.green;
  return (
    <div className="mb-4">
      <div className="flex justify-between items-center mb-1">
        <span className="text-sm text-gray-600 dark:text-gray-400">{label}</span>
        <span className={`font-bold text-lg ${text}`}>
          {Number(value).toLocaleString()}
          <span className="text-xs font-normal text-gray-400 ml-0.5">{unit}</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${bar}`}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}