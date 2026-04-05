import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle, Sparkles, ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { forgotPassword } from "../../services/auth";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [email,        setEmail]        = useState("");
  const [isLoading,    setIsLoading]    = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSent,       setIsSent]       = useState(false);

  // ── Email format validation ────────────────────────────────────────────────
  const isValidEmail = (val) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim());

  const handleSendReset = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!email.trim()) {
      setErrorMessage("Please enter your email address.");
      return;
    }

    if (!isValidEmail(email)) {
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setIsLoading(true);

    // ✅ Always call forgotPassword regardless of whether email exists
    // Then always show the same success message — prevents email enumeration
    // (attacker cannot tell if an email is registered or not)
    await forgotPassword(email.trim());

    setIsLoading(false);

    // ✅ Always show success — never reveal if email is registered
    setIsSent(true);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-8">

        {/* Header */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-sky-500 rounded-2xl flex items-center justify-center mb-6">
            <Sparkles className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Forgot Password?</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Enter your email and we'll send you a reset link.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isSent ? (
            // ── Success state ──────────────────────────────────────────────
            <motion.div
              key="sent"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Check your inbox</h3>
                {/* ✅ Vague on purpose — don't confirm if email exists */}
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  If an account exists for <strong>{email}</strong>, you'll
                  receive a password reset link shortly.
                </p>
              </div>
              <p className="text-xs text-gray-400">
                Didn't receive it? Check your spam folder or try again.
              </p>
              <button
                onClick={() => navigate("/")}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </motion.div>

          ) : (
            // ── Form state ─────────────────────────────────────────────────
            <motion.form
              key="form"
              onSubmit={handleSendReset}
              className="space-y-4"
              noValidate
            >
              {/* Error */}
              <AnimatePresence>
                {errorMessage && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-red-500 text-sm font-medium bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-4 py-2"
                  >
                    ⚠️ {errorMessage}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Email field */}
              <div className="space-y-1">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="w-5 h-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    className="input-field pl-10"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setErrorMessage("");
                    }}
                    autoComplete="email"
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Sending...
                  </>
                ) : "Send Reset Link"}
              </button>

              <button
                type="button"
                onClick={() => navigate("/")}
                className="w-full text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center justify-center gap-1 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Back to Login
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}