import { useLocation } from "react-router-dom";

export default function AnimatedBackground() {
  const location = useLocation();
  const isSignup = location.pathname.includes("signup");
  const isPasswordRoutes =
    location.pathname.includes("forgot-password") ||
    location.pathname.includes("reset-password");

  const gradientClass = isSignup
    ? "from-rose-100/70 via-orange-50/60 to-white/40 dark:from-rose-950/30 dark:via-orange-950/20 dark:to-slate-950"
    : isPasswordRoutes
    ? "from-purple-100/70 via-sky-50/60 to-white/40 dark:from-purple-950/30 dark:via-sky-950/20 dark:to-slate-950"
    : "from-indigo-100/70 via-white/70 to-emerald-50/50 dark:from-slate-950 dark:via-indigo-950/20 dark:to-slate-900";

  return (
    <div className="pointer-events-none fixed inset-0 -z-20 overflow-hidden bg-slate-100 transition-colors duration-500 dark:bg-slate-950">
      <div className={`absolute inset-0 bg-gradient-to-br ${gradientClass}`} />

      <div className="absolute -left-24 top-16 h-72 w-72 rounded-full bg-indigo-300/20 blur-3xl dark:bg-indigo-500/10" />
      <div className="absolute right-0 top-1/4 h-80 w-80 rounded-full bg-emerald-200/20 blur-3xl dark:bg-emerald-500/10" />
      <div className="absolute bottom-0 left-1/3 h-64 w-64 rounded-full bg-sky-200/20 blur-3xl dark:bg-sky-500/10" />

      <div className="absolute inset-0 opacity-40 dark:opacity-20">
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.9) 0 1px, transparent 1.5px), radial-gradient(circle at 80% 30%, rgba(255,255,255,0.7) 0 1px, transparent 1.5px), radial-gradient(circle at 60% 70%, rgba(255,255,255,0.7) 0 1px, transparent 1.5px), radial-gradient(circle at 35% 80%, rgba(255,255,255,0.8) 0 1px, transparent 1.5px)",
            backgroundSize: "220px 220px, 280px 280px, 260px 260px, 240px 240px",
          }}
        />
      </div>

      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-white/50 to-transparent dark:from-slate-950/60" />
    </div>
  );
}
