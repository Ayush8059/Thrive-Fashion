import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, MessageSquare, Send, Sparkles, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../supabaseClient";
import { getUserItems, getWishlist } from "../services/items";

const LANGUAGE_CONFIG = {
  en: {
    label: "English",
    welcome: (name) =>
      `Hi ${name}! I am your Thrive assistant. I can help with wardrobe counts, selling advice, donation guidance, outfit ideas, and wishlist help.`,
    confirmation: "Sure, I will continue in English now.",
    placeholder: "Ask about your wardrobe...",
    quickReplies: [
      "How many clothes do I have?",
      "What should I sell?",
      "Give me outfit ideas",
      "Sustainability tips",
    ],
    general: (name) =>
      `Hi ${name}, I can help with wardrobe counts, what to sell, what to donate, outfit ideas, wishlist guidance, and sustainability tips. Ask me something specific and I will keep it practical.`,
    count: (total, active, wardrobe, sold) =>
      `You currently have ${total} total items: ${active} listed for sale, ${wardrobe} kept in wardrobe, and ${sold} sold.`,
    sell: (items) =>
      items.length
        ? `You can try listing ${items.join(", ")} first. Start with items in good condition, clear photos, and a fair price to get better interest.`
        : "You do not have many wardrobe-only items right now. Add a few wearable pieces first, then I can suggest the best ones to sell.",
    donate:
      "Donate items that are still usable but may not sell quickly, like older basics or pieces with low resale value. Clean clothes, clear sizing, and a short note help NGOs process them faster.",
    outfit: (items) =>
      items.length > 1
        ? `A simple outfit idea: start with ${items[0]}, pair it with ${items[1]}, and keep accessories minimal for a clean everyday look.`
        : "Add a few tops, bottoms, and one versatile layer to your wardrobe and I will start giving more specific outfit combinations.",
    wishlist: (items) =>
      items.length
        ? `Your wishlist currently includes ${items.join(", ")}. Look for similar categories in Marketplace and compare price, condition, and brand before buying.`
        : "Your wishlist is still empty. Explore Marketplace, save a few pieces you like, and I can help compare them for you.",
    sustainability:
      "A good sustainability habit is to rotate what you already own, repair before replacing, and sell or donate pieces you no longer wear. That keeps your wardrobe useful and reduces waste.",
  },
  hi: {
    label: "Hindi",
    welcome: (name) =>
      `Hi ${name}! Main Thrive assistant hoon. Main aapko wardrobe count, selling advice, donation guidance, outfit ideas aur wishlist help de sakta hoon.`,
    confirmation: "Theek hai, ab main aapse Hindi me hi baat karunga.",
    placeholder: "Apna sawaal poochho...",
    quickReplies: [
      "Mere paas kitne clothes hain?",
      "Kya sell karna chahiye?",
      "Outfit ideas do",
      "Sustainability tips",
    ],
    general: (name) =>
      `Hi ${name}, main wardrobe count, selling advice, donation suggestions, outfit ideas, wishlist guidance aur sustainability tips me help kar sakta hoon. Koi specific sawaal poochho.`,
    count: (total, active, wardrobe, sold) =>
      `Aapke paas abhi kul ${total} items hain: ${active} sale par listed, ${wardrobe} wardrobe me, aur ${sold} sold.`,
    sell: (items) =>
      items.length
        ? `Sabse pehle ${items.join(", ")} ko list kar sakte ho. Good condition, clear photos aur fair price se interest zyada milega.`
        : "Abhi wardrobe-only items kam hain. Kuch wearable pieces add karo, phir main better selling suggestions dunga.",
    donate:
      "Jo items usable hain lekin jaldi sell nahi honge, unhe donate karna better hai. Clean clothes, correct size aur short note dene se NGO ko process karna easy hota hai.",
    outfit: (items) =>
      items.length > 1
        ? `Ek simple outfit idea: ${items[0]} ke saath ${items[1]} pair karo aur accessories minimal rakho.`
        : "Wardrobe me thode tops, bottoms aur ek versatile layer add karo, phir main aur specific outfit ideas de paunga.",
    wishlist: (items) =>
      items.length
        ? `Aapki wishlist me abhi ${items.join(", ")} hai. Marketplace me similar items dekhte waqt price, condition aur brand compare karo.`
        : "Aapki wishlist abhi empty hai. Marketplace me kuch items save karo, phir main comparison me help karunga.",
    sustainability:
      "Sustainability ke liye jo kapde aapke paas hain unko zyada baar style karo, repair karo, aur jo use nahi hote unhe sell ya donate kar do.",
  },
  ta: {
    label: "Tamil",
    welcome: (name) => `Hi ${name}! Naan Thrive assistant. Ungal wardrobe, sell, donate, outfit ideas matrum wishlist-il help pannalaam.`,
    confirmation: "Sari, ippo naan ungalukku Tamil la than reply pannuren.",
    placeholder: "Ungal kelviyai ketkavum...",
    quickReplies: ["En kitta evlo clothes irukku?", "Enna sell panna?", "Outfit ideas kudu", "Sustainability tips"],
    general: (name) => `Hi ${name}, naan wardrobe count, sell advice, donate guidance, outfit ideas, wishlist help kudukka mudiyum.`,
  },
  te: {
    label: "Telugu",
    welcome: (name) => `Hi ${name}! Nenu Thrive assistant. Wardrobe count, selling advice, donation guidance, outfit ideas mariyu wishlist help chestanu.`,
    confirmation: "Sare, ippati nundi nenu Telugu lo ne reply chestanu.",
    placeholder: "Mee prashna adagandi...",
    quickReplies: ["Na daggara enni clothes unnayi?", "Emi sell cheyyali?", "Outfit ideas ivvu", "Sustainability tips"],
    general: (name) => `Hi ${name}, nenu wardrobe count, selling, donation, outfit ideas mariyu wishlist help ivvagalanu.`,
  },
  bn: {
    label: "Bengali",
    welcome: (name) => `Hi ${name}! Ami Thrive assistant. Wardrobe count, selling advice, donation guidance, outfit ideas ebong wishlist niye help korte pari.`,
    confirmation: "Thik ache, ekhon ami Bangla-tei reply korbo.",
    placeholder: "Apnar proshno likhun...",
    quickReplies: ["Amar kache kato clothes ache?", "Ki sell korbo?", "Outfit ideas dao", "Sustainability tips"],
    general: (name) => `Hi ${name}, ami wardrobe count, selling, donation, outfit ideas ebong wishlist help korte pari.`,
  },
  mr: {
    label: "Marathi",
    welcome: (name) => `Hi ${name}! Mi Thrive assistant aahe. Wardrobe count, selling advice, donation guidance, outfit ideas ani wishlist madhe help karu shakto.`,
    confirmation: "Thik aahe, ata mi tumhala Marathi madhech reply dein.",
    placeholder: "Tumcha prashna vicha...",
    quickReplies: ["Majhyakade kiti clothes aahet?", "Kay sell karu?", "Outfit ideas dya", "Sustainability tips"],
    general: (name) => `Hi ${name}, mi wardrobe count, selling, donation, outfit ideas ani wishlist madhe help karu shakto.`,
  },
  gu: {
    label: "Gujarati",
    welcome: (name) => `Hi ${name}! Hu Thrive assistant chu. Wardrobe count, selling advice, donation guidance, outfit ideas ane wishlist ma madad kari saku chu.`,
    confirmation: "Saru, have hu tamne Gujarati maaj reply karish.",
    placeholder: "Tamaro prashn lakho...",
    quickReplies: ["Mara pase ketla clothes chhe?", "Shu sell karu?", "Outfit ideas aapo", "Sustainability tips"],
    general: (name) => `Hi ${name}, hu wardrobe count, selling, donation, outfit ideas ane wishlist ma madad kari saku chu.`,
  },
  kn: {
    label: "Kannada",
    welcome: (name) => `Hi ${name}! Naanu Thrive assistant. Wardrobe count, selling advice, donation guidance, outfit ideas mattu wishlist-ge sahaaya maadabahudu.`,
    confirmation: "Sari, iga nanu nimge Kannada-dalle reply maaduttene.",
    placeholder: "Nimma prashne keliri...",
    quickReplies: ["Nanna hattira eshtu clothes ide?", "Yenannu sell maadli?", "Outfit ideas kodi", "Sustainability tips"],
    general: (name) => `Hi ${name}, naanu wardrobe count, selling, donation, outfit ideas mattu wishlist-ge sahaaya maadabahudu.`,
  },
  fr: {
    label: "French",
    welcome: (name) => `Hi ${name}! Je suis l'assistant Thrive. Je peux aider avec la garde-robe, la vente, les dons, les idées de tenue et la wishlist.`,
    confirmation: "D'accord, je vais maintenant répondre uniquement en français.",
    placeholder: "Posez votre question...",
    quickReplies: ["Combien de vêtements j'ai ?", "Que dois-je vendre ?", "Donne-moi des idées de tenue", "Conseils durables"],
    general: (name) => `Hi ${name}, je peux aider avec le nombre d'articles, la vente, les dons, les idées de tenue et la wishlist.`,
  },
  es: {
    label: "Spanish",
    welcome: (name) => `Hi ${name}! Soy el asistente de Thrive. Puedo ayudarte con tu armario, ventas, donaciones, ideas de outfit y wishlist.`,
    confirmation: "Perfecto, ahora responderé solo en español.",
    placeholder: "Haz tu pregunta...",
    quickReplies: ["¿Cuánta ropa tengo?", "¿Qué debería vender?", "Dame ideas de outfit", "Consejos sostenibles"],
    general: (name) => `Hi ${name}, puedo ayudarte con el conteo del armario, ventas, donaciones, ideas de outfit y wishlist.`,
  },
  de: {
    label: "German",
    welcome: (name) => `Hi ${name}! Ich bin der Thrive-Assistent. Ich helfe bei Kleiderschrank, Verkauf, Spenden, Outfit-Ideen und Wishlist.`,
    confirmation: "Klar, ich antworte jetzt nur noch auf Deutsch.",
    placeholder: "Stelle deine Frage...",
    quickReplies: ["Wie viele Kleider habe ich?", "Was soll ich verkaufen?", "Gib mir Outfit-Ideen", "Nachhaltigkeitstipps"],
    general: (name) => `Hi ${name}, ich kann bei Kleiderschrank-Zahlen, Verkauf, Spenden, Outfit-Ideen und Wishlist helfen.`,
  },
  ja: {
    label: "Japanese",
    welcome: (name) => `Hi ${name}! Thrive assistantです。ワードローブ、販売、寄付、コーデ提案、ウィッシュリストをお手伝いできます。`,
    confirmation: "はい、これから日本語で返信します。",
    placeholder: "質問を入力してください...",
    quickReplies: ["服は何着ありますか？", "何を売るべき？", "コーデを提案して", "サステナビリティのコツ"],
    general: (name) => `Hi ${name}、ワードローブ数、販売、寄付、コーデ提案、ウィッシュリストについてお手伝いできます。`,
  },
  ar: {
    label: "Arabic",
    welcome: (name) => `Hi ${name}! أنا مساعد Thrive. أستطيع مساعدتك في خزانة الملابس والبيع والتبرع وأفكار الإطلالات وقائمة الرغبات.`,
    confirmation: "حسنًا، سأرد عليك الآن بالعربية فقط.",
    placeholder: "اكتب سؤالك...",
    quickReplies: ["كم عدد الملابس لدي؟", "ماذا أبيع؟", "اعطني أفكار إطلالات", "نصائح للاستدامة"],
    general: (name) => `Hi ${name}، أستطيع مساعدتك في عدد القطع والبيع والتبرع وأفكار الإطلالات وقائمة الرغبات.`,
  },
  zh: {
    label: "Chinese",
    welcome: (name) => `Hi ${name}！我是 Thrive 助手，可以帮助你处理衣橱统计、出售建议、捐赠建议、穿搭灵感和心愿单。`,
    confirmation: "好的，我接下来会只用中文回复你。",
    placeholder: "请输入你的问题...",
    quickReplies: ["我有多少件衣服？", "我应该卖什么？", "给我穿搭建议", "可持续时尚建议"],
    general: (name) => `Hi ${name}，我可以帮助你处理衣橱数量、出售、捐赠、穿搭建议和心愿单。`,
  },
};

const LANGUAGES = [
  { code: "en", label: "English" },
  { code: "hi", label: "Hindi" },
  { code: "ta", label: "Tamil" },
  { code: "te", label: "Telugu" },
  { code: "bn", label: "Bengali" },
  { code: "mr", label: "Marathi" },
  { code: "gu", label: "Gujarati" },
  { code: "kn", label: "Kannada" },
  { code: "fr", label: "French" },
  { code: "es", label: "Spanish" },
  { code: "de", label: "German" },
  { code: "ja", label: "Japanese" },
  { code: "ar", label: "Arabic" },
  { code: "zh", label: "Chinese" },
];

function buildFallbackReply(input, { userName, wardrobeData, wishlistData, selectedLang }) {
  const languageCopy = LANGUAGE_CONFIG[selectedLang.code] || LANGUAGE_CONFIG.en;
  const text = input.toLowerCase();
  const activeListings = wardrobeData.filter((item) => item.status === "active");
  const wardrobeOnly = wardrobeData.filter((item) => item.status === "wardrobe");
  const soldItems = wardrobeData.filter((item) => item.status === "sold");
  const topWishlist = wishlistData.slice(0, 3).map((item) => item.items?.title).filter(Boolean);

  if (languageCopy.count && (text.includes("how many") || text.includes("count") || text.includes("clothes") || text.includes("kitne"))) {
    return languageCopy.count(wardrobeData.length, activeListings.length, wardrobeOnly.length, soldItems.length);
  }

  if (languageCopy.sell && (text.includes("sell") || text.includes("bech"))) {
    return languageCopy.sell(wardrobeOnly.slice(0, 3).map((item) => item.title).filter(Boolean));
  }

  if (languageCopy.donate && (text.includes("donate") || text.includes("daan"))) {
    return languageCopy.donate;
  }

  if (languageCopy.outfit && (text.includes("outfit") || text.includes("wear") || text.includes("pehen"))) {
    return languageCopy.outfit(wardrobeData.slice(0, 3).map((item) => item.title).filter(Boolean));
  }

  if (languageCopy.wishlist && (text.includes("wishlist") || text.includes("recommend") || text.includes("suggest"))) {
    return languageCopy.wishlist(topWishlist);
  }

  if (languageCopy.sustainability && (text.includes("sustain") || text.includes("eco") || text.includes("tip"))) {
    return languageCopy.sustainability;
  }

  return languageCopy.general(userName);
}

function isReplyInSelectedLanguage(reply, selectedLang) {
  if (!reply) return false;

  if (selectedLang.code === "en") return !/[\u0900-\u097F]/.test(reply);
  if (selectedLang.code === "hi") return /[\u0900-\u097F]/.test(reply);
  return true;
}

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

  const userName = useMemo(
    () => profile?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there",
    [profile?.full_name, user?.email],
  );

  const currentLanguageCopy = LANGUAGE_CONFIG[selectedLang.code] || LANGUAGE_CONFIG.en;

  useEffect(() => {
    if (isOpen && user) {
      void (async () => {
        const [items, wishlist] = await Promise.all([
          getUserItems(user.id),
          getWishlist(user.id),
        ]);

        setWardrobeData(items || []);
        setWishlistData(wishlist?.items || wishlist || []);
      })();
    }
  }, [isOpen, user]);

  useEffect(() => {
    setMessages((current) => {
      if (current.length > 0) return current;
      return [
        {
          id: 1,
          sender: "bot",
          text: currentLanguageCopy.welcome(userName),
        },
      ];
    });
  }, [currentLanguageCopy, userName]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isOpen]);

  const tryEdgeFunctionReply = async (conversationHistory) => {
    const { data, error } = await supabase.functions.invoke("chat", {
      body: {
        system: `Reply only in ${currentLanguageCopy.label}. Keep the reply concise, practical, and natural for a fashion marketplace assistant.`,
        messages: conversationHistory,
        metadata: {
          language_code: selectedLang.code,
          language: currentLanguageCopy.label,
          wardrobe_count: wardrobeData.length,
          wishlist_count: wishlistData.length,
        },
      },
    });

    if (error) throw error;
    return data?.content?.[0]?.text || data?.reply || data?.message || null;
  };

  const handleSend = async (event) => {
    event.preventDefault();
    if (!inputValue.trim() || isTyping) return;

    const currentInput = inputValue.trim();
    setMessages((prev) => [...prev, { id: Date.now(), sender: "user", text: currentInput }]);
    setInputValue("");
    setIsTyping(true);

    try {
      const conversationHistory = messages.map((message) => ({
        role: message.sender === "user" ? "user" : "assistant",
        content: message.text,
      })).concat({ role: "user", content: currentInput });

      let reply = null;

      try {
        reply = await tryEdgeFunctionReply(conversationHistory);
      } catch (edgeError) {
        console.warn("Chat edge function unavailable, falling back locally:", edgeError?.message || edgeError);
      }

      if (!reply || !isReplyInSelectedLanguage(reply, selectedLang)) {
        reply = buildFallbackReply(currentInput, {
          userName,
          wardrobeData,
          wishlistData,
          selectedLang,
        });
      }

      setMessages((prev) => [...prev, { id: Date.now() + 1, sender: "bot", text: reply }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.94 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-dark text-white shadow-2xl transition-colors hover:bg-primary hover:text-dark"
            aria-label="Open Thrive AI assistant"
          >
            <MessageSquare className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[350px] flex-col overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-2xl dark:border-gray-800 dark:bg-slate-900 sm:w-[400px]"
          >
            <div className="flex items-center justify-between bg-dark p-4 text-white dark:bg-slate-800">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary">
                  <Sparkles className="h-5 w-5 text-dark" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">Thrive Assistant</h3>
                  <p className="flex items-center gap-1 text-xs text-primary">
                    <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
                    Online · {currentLanguageCopy.label}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowLangPicker((current) => !current)}
                    className="rounded-full p-2 transition-colors hover:bg-white/15"
                    title="Change language"
                  >
                    <Globe className="h-4 w-4" />
                  </button>

                  <AnimatePresence>
                    {showLangPicker && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.96 }}
                        className="absolute right-0 top-11 z-50 max-h-72 w-44 overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-slate-900"
                      >
                        {LANGUAGES.map((language) => (
                          <button
                            key={language.code}
                            type="button"
                            onClick={() => {
                              setSelectedLang(language);
                              setShowLangPicker(false);
                              const langCopy = LANGUAGE_CONFIG[language.code] || LANGUAGE_CONFIG.en;
                              setMessages((prev) => [
                                ...prev,
                                {
                                  id: Date.now(),
                                  sender: "bot",
                                  text: langCopy.confirmation,
                                },
                              ]);
                            }}
                            className={`w-full px-4 py-3 text-left text-sm ${
                              selectedLang.code === language.code
                                ? "bg-primary/10 font-semibold text-primary"
                                : "text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-slate-800"
                            }`}
                          >
                            {language.label}
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsOpen(false);
                    onClose?.();
                  }}
                  className="rounded-full p-2 transition-colors hover:bg-white/15"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="flex flex-1 flex-col gap-3 overflow-y-auto bg-gray-50 p-4 dark:bg-slate-800/50">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[86%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      message.sender === "user"
                        ? "rounded-tr-none bg-dark text-white"
                        : "rounded-tl-none border border-gray-100 bg-white text-gray-800 shadow-sm dark:border-gray-700 dark:bg-slate-700 dark:text-gray-100"
                    }`}
                    dir={selectedLang.code === "ar" ? "rtl" : "ltr"}
                  >
                    {message.text}
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-tl-none border border-gray-100 bg-white px-4 py-3 text-sm shadow-sm dark:border-gray-700 dark:bg-slate-700">
                    Thinking...
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {messages.length <= 1 && (
              <div className="flex gap-2 overflow-x-auto bg-gray-50 px-4 py-2 dark:bg-slate-800/50">
                {currentLanguageCopy.quickReplies.map((reply) => (
                  <button
                    key={reply}
                    type="button"
                    onClick={() => {
                      setInputValue(reply);
                      inputRef.current?.focus();
                    }}
                    className="shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:border-primary hover:text-primary dark:border-gray-700 dark:bg-slate-900 dark:text-gray-200 dark:hover:border-primary dark:hover:text-primary"
                  >
                    {reply}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={handleSend}
              className="flex items-center gap-2 border-t border-gray-100 bg-white p-4 dark:border-gray-800 dark:bg-slate-900"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(event) => setInputValue(event.target.value)}
                placeholder={currentLanguageCopy.placeholder}
                className="flex-1 rounded-full bg-gray-100 px-4 py-2.5 text-sm text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary dark:bg-slate-800 dark:text-white"
                dir={selectedLang.code === "ar" ? "rtl" : "ltr"}
              />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                type="submit"
                disabled={!inputValue.trim() || isTyping}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-dark text-white disabled:cursor-not-allowed disabled:opacity-50 dark:bg-primary dark:text-dark"
              >
                <Send className="ml-0.5 h-4 w-4" />
              </motion.button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
