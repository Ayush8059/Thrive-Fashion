import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, Globe } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { getUserItems, getWishlist } from "../services/items";

const LANGUAGES = [
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "hi", label: "हिंदी", flag: "🇮🇳" },
  { code: "ta", label: "தமிழ்", flag: "🇮🇳" },
  { code: "te", label: "తెలుగు", flag: "🇮🇳" },
  { code: "bn", label: "বাংলা", flag: "🇮🇳" },
  { code: "mr", label: "मराठी", flag: "🇮🇳" },
  { code: "gu", label: "ગુજરાતી", flag: "🇮🇳" },
  { code: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "de", label: "Deutsch", flag: "🇩🇪" },
  { code: "ja", label: "日本語", flag: "🇯🇵" },
  { code: "ar", label: "العربية", flag: "🇸🇦" },
  { code: "zh", label: "中文", flag: "🇨🇳" },
];

const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || "https://tsddhnkkwyqisqlevbcq.supabase.co";
const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzZGRobmtrd3lxaXNxbGV2YmNxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwMjg2MDAsImV4cCI6MjA4OTYwNDYwMH0.3U77lBR9prB0OEQGBaBRmb2kfMth-2rxjjh4bqfAKMw";

export default function Chatbot({ defaultOpen = false, onClose }) {
  const { user, profile } = useAuth();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [wardrobeData, setWardrobeData] = useState([]);
  const [wishlistData, setWishlistData] = useState([]);
  const [selectedLang, setSelectedLang] = useState(LANGUAGES[0]);
  const [showLangPicker, setShowLangPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const userName = profile?.full_name?.split(" ")[0] || "there";

  useEffect(() => {
    if (isOpen && user) loadUserData();
  }, [isOpen, user]);

  useEffect(() => {
    if (profile || user) {
      setMessages([{
        id: 1,
        sender: "bot",
        text: `Hi ${userName}! 👋 I'm your Thrive AI Stylist.\n\nI can help you with:\n• 👗 Your wardrobe & outfit ideas\n• 🛍️ Marketplace recommendations\n• ♻️ Sustainability tips\n• 💰 Selling & donating advice\n\nYou can also chat with me in your preferred language using the 🌐 button above!`
      }]);
    }
  }, [profile, user]);

  const loadUserData = async () => {
    if (!user) return;
    const [items, wishlist] = await Promise.all([
      getUserItems(user.id),
      getWishlist(user.id)
    ]);
    setWardrobeData(items || []);
    setWishlistData(wishlist || []);
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const buildSystemPrompt = () => {
    const wardrobeItems = wardrobeData.map(i =>
      `- ${i.title} (${i.category || "Unknown"}, ${i.condition || ""}, ₹${i.price || 0}, status: ${i.status})`
    ).join("\n");

    const activeListings = wardrobeData.filter(i => i.status === "active");
    const wardrobeOnly = wardrobeData.filter(i => i.status === "wardrobe");
    const soldItems = wardrobeData.filter(i => i.status === "sold");

    const wishlistItems = wishlistData.map(w =>
      `- ${w.items?.title || "Unknown"} (₹${w.items?.price || 0})`
    ).join("\n");

    return `You are Thrive Stylist AI, a friendly and knowledgeable fashion assistant for the Thrive Fashion app — a sustainable fashion marketplace.

User Info:
- Name: ${profile?.full_name || "User"}
- Email: ${user?.email || ""}

Their Wardrobe Data:
Total items: ${wardrobeData.length}
Active listings (for sale): ${activeListings.length}
Wardrobe only items: ${wardrobeOnly.length}
Sold items: ${soldItems.length}

Items:
${wardrobeItems || "No items yet"}

Wishlist (${wishlistData.length} items):
${wishlistItems || "Empty wishlist"}

IMPORTANT LANGUAGE INSTRUCTION:
The user has selected "${selectedLang.label}" as their preferred language.
You MUST respond ONLY in ${selectedLang.label}.
Do not mix languages. Respond entirely in ${selectedLang.label}.
If the language is Arabic, use RTL-friendly formatting.

Your role:
- Answer questions about their wardrobe, items, listings
- Give outfit suggestions based on their clothes
- Give sustainability tips
- Help them decide what to sell or donate
- Recommend items from marketplace
- Be friendly, concise and helpful
- Use emojis occasionally
- Keep responses short and to the point (max 3-4 sentences)
- If asked about specific counts, use the exact data provided above`;
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const userMsg = { id: Date.now(), sender: "user", text: inputValue };
    setMessages(prev => [...prev, userMsg]);
    const currentInput = inputValue;
    setInputValue("");
    setIsTyping(true);

    try {
      // ✅ Build conversation history
      const conversationHistory = messages
        .filter(m => m.id !== 1)
        .map(m => ({
          role: m.sender === "user" ? "user" : "assistant",
          content: m.text
        }));

      conversationHistory.push({ role: "user", content: currentInput });

      const response = await fetch(
        `${SUPABASE_URL}/functions/v1/chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
            "apikey": SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            system: buildSystemPrompt(),
            messages: conversationHistory,
          }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        console.error("Edge function error:", errText);
        throw new Error(`HTTP ${response.status}: ${errText}`);
      }

      const data = await response.json();
      console.log("Chat response:", data);

      const botText = data.content?.[0]?.text || "Sorry, I couldn't process that. Please try again!";

      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "bot",
        text: botText
      }]);

    } catch (err) {
      console.error("Chatbot error:", err);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        sender: "bot",
        text: `Error: ${err.message}. Please check console for details.`
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleLangSelect = (lang) => {
    setSelectedLang(lang);
    setShowLangPicker(false);
    setMessages(prev => [...prev, {
      id: Date.now(),
      sender: "bot",
      text: lang.code === "en"
        ? `Language changed to ${lang.flag} ${lang.label}! How can I help you?`
        : lang.code === "hi"
        ? `भाषा ${lang.flag} ${lang.label} में बदल दी गई है! मैं आपकी कैसे मदद कर सकता हूं?`
        : lang.code === "ta"
        ? `மொழி ${lang.flag} ${lang.label} ஆக மாற்றப்பட்டது! நான் உங்களுக்கு எப்படி உதவலாம்?`
        : `Language changed to ${lang.flag} ${lang.label}! How can I help you?`
    }]);
  };

  const quickReplies = [
    "How many clothes do I have?",
    "What should I sell?",
    "Give me outfit ideas",
    "Sustainability tips",
  ];

  return (
    <>
      {/* Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 w-14 h-14 bg-dark text-white rounded-full flex items-center justify-center shadow-2xl z-50 hover:bg-primary hover:text-dark transition-colors"
          >
            <MessageSquare className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed bottom-6 right-6 w-[350px] sm:w-[400px] h-[600px] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl z-50 flex flex-col overflow-hidden border border-gray-100 dark:border-gray-800"
          >
            {/* Header */}
            <div className="bg-dark dark:bg-slate-800 text-white p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-dark" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Thrive Stylist AI</h3>
                  <p className="text-xs text-primary flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full inline-block" />
                    Online • {selectedLang.flag} {selectedLang.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    onClick={() => setShowLangPicker(!showLangPicker)}
                    className="p-2 hover:bg-white/20 rounded-full transition-colors flex items-center gap-1"
                    title="Change language"
                  >
                    <Globe className="w-4 h-4" />
                    <span className="text-xs">{selectedLang.flag}</span>
                  </button>

                  <AnimatePresence>
                    {showLangPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -10, scale: 0.95 }}
                        className="absolute right-0 top-10 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-72 overflow-y-auto"
                      >
                        <div className="p-2">
                          <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
                            Choose Language
                          </p>
                          {LANGUAGES.map((lang) => (
                            <button
                              key={lang.code}
                              onClick={() => handleLangSelect(lang)}
                              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                                selectedLang.code === lang.code
                                  ? "bg-primary/10 text-primary font-semibold"
                                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-slate-700"
                              }`}
                            >
                              <span className="text-lg">{lang.flag}</span>
                              <span>{lang.label}</span>
                              {selectedLang.code === lang.code && (
                                <span className="ml-auto text-primary">✓</span>
                              )}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  onClick={() => {
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className="p-2 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 dark:bg-slate-800/50 flex flex-col gap-3">
              {messages.map((msg) => (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={msg.id}
                  className={`flex gap-2 ${msg.sender === "user" ? "ml-auto flex-row-reverse" : "mr-auto"} max-w-[88%]`}
                >
                  <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold ${
                    msg.sender === "user"
                      ? "bg-gray-200 dark:bg-slate-700 text-gray-700 dark:text-gray-300"
                      : "bg-primary text-dark"
                  }`}>
                    {msg.sender === "user"
                      ? (profile?.full_name?.charAt(0).toUpperCase() || "U")
                      : <Sparkles className="w-3.5 h-3.5" />
                    }
                  </div>

                  <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-line ${
                    msg.sender === "user"
                      ? "bg-dark dark:bg-indigo-600 text-white rounded-tr-none"
                      : "bg-white dark:bg-slate-700 text-gray-800 dark:text-gray-100 border border-gray-100 dark:border-gray-600 shadow-sm rounded-tl-none"
                  }`}
                    dir={selectedLang.code === "ar" ? "rtl" : "ltr"}
                  >
                    {msg.text}
                    {msg.image && (
                      <div className="mt-3 rounded-xl overflow-hidden border border-gray-100">
                        <img src={msg.image} alt="Item" className="w-full h-auto" />
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-2 items-center"
                >
                  <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center shrink-0">
                    <Sparkles className="w-3.5 h-3.5 text-dark" />
                  </div>
                  <div className="bg-white dark:bg-slate-700 border border-gray-100 dark:border-gray-600 rounded-2xl rounded-tl-none px-4 py-3 shadow-sm">
                    <div className="flex gap-1 items-center">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length <= 1 && (
              <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 flex gap-2 overflow-x-auto shrink-0">
                {quickReplies.map((reply) => (
                  <button
                    key={reply}
                    onClick={() => {
                      setInputValue(reply);
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 text-xs px-3 py-1.5 rounded-full bg-white dark:bg-slate-700 border border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-primary hover:text-primary transition-colors whitespace-nowrap"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <form
              onSubmit={handleSend}
              className="p-4 bg-white dark:bg-slate-900 border-t border-gray-100 dark:border-gray-800 flex items-center gap-2 shrink-0"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={
                  selectedLang.code === "hi" ? "अपना सवाल पूछें..." :
                  selectedLang.code === "ta" ? "உங்கள் கேள்வியை கேளுங்கள்..." :
                  selectedLang.code === "fr" ? "Posez votre question..." :
                  selectedLang.code === "es" ? "Haz tu pregunta..." :
                  selectedLang.code === "ar" ? "اسأل سؤالك..." :
                  "Ask about your wardrobe..."
                }
                dir={selectedLang.code === "ar" ? "rtl" : "ltr"}
                className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-slate-800 rounded-full text-sm text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary"
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-dark dark:bg-primary text-white dark:text-dark flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
