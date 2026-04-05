import { Suspense, lazy, useState } from "react";
import { MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const Chatbot = lazy(() => import("./Chatbot"));

export default function ChatbotLauncher() {
  const [shouldLoad, setShouldLoad] = useState(false);

  if (shouldLoad) {
    return (
      <Suspense fallback={null}>
        <Chatbot defaultOpen onClose={() => setShouldLoad(false)} />
      </Suspense>
    );
  }

  return (
    <AnimatePresence>
      <motion.button
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0 }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.94 }}
        onClick={() => setShouldLoad(true)}
        className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-dark text-white shadow-2xl transition-colors hover:bg-primary hover:text-dark"
        aria-label="Open Thrive AI assistant"
      >
        <MessageSquare className="h-6 w-6" />
      </motion.button>
    </AnimatePresence>
  );
}
