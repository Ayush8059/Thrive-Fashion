import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { loginUser, signInWithGoogle } from "../../services/auth";
import { supabase } from "../../supabaseClient";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
      <path
        fill="#EA4335"
        d="M12 10.2v3.9h5.5c-.2 1.3-1.5 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.5 12 2.5a9.5 9.5 0 0 0 0 19c5.5 0 9.1-3.9 9.1-9.3 0-.6-.1-1.1-.2-1.6H12Z"
      />
      <path
        fill="#34A853"
        d="M2.5 7.8l3.2 2.4C6.6 8 9.1 6 12 6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.8 3.5 14.7 2.5 12 2.5c-3.7 0-6.9 2.1-8.5 5.3Z"
      />
      <path
        fill="#FBBC05"
        d="M12 21.5c2.6 0 4.8-.9 6.4-2.5l-3-2.4c-.8.6-1.9 1-3.4 1-3.9 0-5.2-2.6-5.5-3.9l-3.2 2.4A9.5 9.5 0 0 0 12 21.5Z"
      />
      <path
        fill="#4285F4"
        d="M2.5 16.2l3.2-2.4A6 6 0 0 1 5.9 12c0-.6.1-1.2.3-1.8L3 7.8A9.4 9.4 0 0 0 2.5 12c0 1.5.4 2.9 1 4.2Z"
      />
    </svg>
  );
}

export default function Login() {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showPw, setShowPw] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    if (!email.trim() || !password) {
      setErrorMsg("Please enter both email and password.");
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await loginUser(email.trim(), password);

      if (error) {
        setErrorMsg(error.message || "Login failed. Please try again.");
        return;
      }

      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("is_admin")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.is_admin) {
          navigate("/admin/dashboard");
          return;
        }

        navigate("/dashboard");
      }
    } catch (err) {
      setErrorMsg("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setGoogleLoading(true);
    setErrorMsg("");

    try {
      const { error } = await signInWithGoogle();
      if (error) {
        setErrorMsg(error.message || "Google sign-in failed.");
        setGoogleLoading(false);
      }
    } catch (err) {
      setErrorMsg("Unable to start Google sign-in.");
      setGoogleLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md mx-auto"
    >
      <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Welcome Back</h2>
      <p className="mb-6 text-sm text-slate-600 dark:text-slate-300">
        Enter your credentials to access your account
      </p>

      {errorMsg && (
        <motion.div
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-4 rounded-xl border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
        >
          {errorMsg}
        </motion.div>
      )}

      <div className="mb-5">
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50 disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
        >
          {googleLoading ? <span className="inline-flex items-center gap-2">Signing in...</span> : <><GoogleIcon /> Continue with Google</>}
        </button>
      </div>

      <div className="mb-5 flex items-center gap-3 text-xs uppercase tracking-[0.25em] text-slate-500 dark:text-slate-400">
        <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
        <span>or</span>
        <span className="h-px flex-1 bg-slate-300 dark:bg-slate-700" />
      </div>

      <form onSubmit={handleLogin} className="space-y-4" noValidate>
        <div className="space-y-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Email Address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type="email"
              placeholder="you@example.com"
              className="input-field pl-10"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setErrorMsg("");
              }}
              autoComplete="email"
              autoFocus
            />
          </div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Password</label>
            <Link to="/forgot-password" className="text-xs font-medium text-slate-700 hover:underline dark:text-slate-200">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-500 dark:text-slate-400" />
            <input
              type={showPw ? "text" : "password"}
              placeholder="Password"
              className="input-field pl-10 pr-12"
              value={password}
              onChange={(event) => {
                setPassword(event.target.value);
                setErrorMsg("");
              }}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPw(!showPw)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-50">
          {loading ? (
            <>
              <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
              </svg>
              Signing in...
            </>
          ) : (
            <>
              Sign In <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-700 dark:text-slate-300">
        Don't have an account?{" "}
        <Link to="/signup" className="font-semibold text-slate-900 hover:underline dark:text-white">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
