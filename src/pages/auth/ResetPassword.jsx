import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, CheckCircle, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { resetPassword } from "../../services/auth";
import { supabase } from "../../supabaseClient";

// ── Password strength ──────────────────────────────────────────────────────
function getStrength(pw) {
  if (!pw) return null;
  let score = 0;
  if (pw.length >= 8)              score++;
  if (pw.length >= 12)             score++;
  if (/[A-Z]/.test(pw))            score++;
  if (/[0-9]/.test(pw))            score++;
  if (/[^A-Za-z0-9]/.test(pw))     score++;
  if (score <= 1) return { label: "Weak",   color: "bg-red-500",    pct: "25%"  };
  if (score <= 2) return { label: "Fair",   color: "bg-yellow-500", pct: "50%"  };
  if (score <= 3) return { label: "Good",   color: "bg-blue-500",   pct: "75%"  };
  return           { label: "Strong", color: "bg-green-500",  pct: "100%" };
}

export default function ResetPassword() {
  const navigate = useNavigate();

  const [password,        setPassword]        = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword,    setShowPassword]    = useState(false);
  const [showConfirm,     setShowConfirm]     = useState(false);
  const [isLoading,       setIsLoading]       = useState(false);
  const [isSuccess,       setIsSuccess]       = useState(false);
  const [errorMessage,    setErrorMessage]    = useState("");
  const [hasSession,      setHasSession]      = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const strength = getStrength(password);

  // ── Verify reset token is valid ────────────────────────────────────────────
  // Without this, anyone can visit /reset-password and see the form
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession();
      // Supabase sets session automatically when user clicks the reset link
      if (data?.session) {
        setHasSession(true);
      } else {
        setHasSession(false);
      }
      setCheckingSession(false);
    };
    checkSession();

    // Also listen for auth state change (token exchange happens async)
    const { data: listener } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setHasSession(true);
        setCheckingSession(false);
      }
    });

    return () => listener?.subscription?.unsubscribe();
  }, []);

  // ── Validate ───────────────────────────────────────────────────────────────
  const validate = () => {
    if (!password) {
      setErrorMessage("Please enter a new password.");
      return false;
    }
    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters.");
      return false;
    }
    if (!/[A-Z]/.test(password)) {
      setErrorMessage("Password must contain at least one uppercase letter.");
      return false;
    }
    if (!/[0-9]/.test(password)) {
      setErrorMessage("Password must contain at least one number.");
      return false;
    }
    if (!confirmPassword) {
      setErrorMessage("Please confirm your password.");
      return false;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    if (!validate()) return;

    setIsLoading(true);
    const { error } = await resetPassword(password);
    setIsLoading(false);

    if (error) {
      setErrorMessage(error.message);
    } else {
      setIsSuccess(true);
      // Auto redirect to login after 3 seconds
      setTimeout(() => navigate("/"), 3000);
    }
  };

  // ── Loading session check ──────────────────────────────────────────────────
  if (checkingSession) {
    return (
      <div className="flex items-center justify-center py-20">
        <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
      </div>
    );
  }

  // ── Invalid / expired token ────────────────────────────────────────────────
  // ✅ Block the form if no valid reset session — prevents unauthorized access
  if (!hasSession) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto"
      >
        <div className="card p-8 text-center space-y-5">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto">
            <span className="text-4xl">🔗</span>
          </div>
          <h2 className="text-xl font-bold">Invalid or Expired Link</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            This password reset link is invalid or has expired.
            Please request a new one.
          </p>
          <button
            onClick={() => navigate("/forgot-password")}
            className="btn-primary w-full"
          >
            Request New Link
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="card p-8">

        {/* Header */}
        <div className="mb-8">
          <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-sky-500 rounded-2xl flex items-center justify-center mb-6">
            <Lock className="text-white w-8 h-8" />
          </div>
          <h2 className="text-3xl font-bold mb-2">Set New Password</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Choose a strong password for your account.
          </p>
        </div>

        <AnimatePresence mode="wait">
          {isSuccess ? (
            // ── Success ──────────────────────────────────────────────────
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5"
            >
              <div className="w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle className="w-10 h-10 text-green-500" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-1">Password Updated!</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Your password has been changed successfully.
                  Redirecting to login...
                </p>
              </div>
              <button
                onClick={() => navigate("/")}
                className="btn-primary w-full"
              >
                Go to Login
              </button>
            </motion.div>

          ) : (
            // ── Form ─────────────────────────────────────────────────────
            <motion.form
              key="form"
              onSubmit={handleReset}
              className="space-y-5"
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

              {/* New password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  New Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    className="input-field pr-12"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Strength meter */}
                {password && strength && (
                  <div className="space-y-1 mt-1">
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full ${strength.color}`}
                        initial={{ width: 0 }}
                        animate={{ width: strength.pct }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                    <p className={`text-xs font-semibold ${
                      strength.label === "Weak"   ? "text-red-500"    :
                      strength.label === "Fair"   ? "text-yellow-500" :
                      strength.label === "Good"   ? "text-blue-500"   : "text-green-500"
                    }`}>
                      Strength: {strength.label}
                    </p>
                    <ul className="text-xs text-gray-400 space-y-0.5">
                      <li className={password.length >= 8      ? "text-green-500" : ""}>• At least 8 characters</li>
                      <li className={/[A-Z]/.test(password)    ? "text-green-500" : ""}>• One uppercase letter</li>
                      <li className={/[0-9]/.test(password)    ? "text-green-500" : ""}>• One number</li>
                      <li className={/[^A-Za-z0-9]/.test(password) ? "text-green-500" : ""}>• One special character (bonus)</li>
                    </ul>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    placeholder="Confirm new password"
                    className="input-field pr-12"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      setErrorMessage("");
                    }}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Match indicator */}
                {confirmPassword && (
                  <p className={`text-xs font-semibold ${
                    password === confirmPassword ? "text-green-500" : "text-red-500"
                  }`}>
                    {password === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 pt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                    </svg>
                    Updating...
                  </>
                ) : "Reset Password"}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}