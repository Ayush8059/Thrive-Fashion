import { Outlet } from "react-router-dom";
import AnimatedBackground from "../components/AnimatedBackground";

export default function AuthLayout() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <AnimatedBackground />
      <div className="w-full max-w-4xl grid md:grid-cols-2 rounded-2xl border border-white/40 bg-white/82 text-slate-900 shadow-2xl backdrop-blur-2xl overflow-hidden min-h-[600px] z-10 dark:bg-slate-950/80 dark:text-white">
        <div className="hidden md:block bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center relative border-r border-white/10">
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col items-center justify-end p-8 text-white pb-12">
            <div className="bg-black/40 backdrop-blur-md p-6 rounded-2xl border border-white/10 shadow-2xl transform hover:scale-105 transition-transform duration-500">
              <h1 className="text-4xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">Thrive Fashion</h1>
              <p className="text-sm text-center text-gray-200">Sustainable fashion starts with you. Buy, sell, and donate your pre-loved clothes.</p>
            </div>
          </div>
        </div>
        <div className="relative flex flex-col justify-center bg-white/72 p-8 text-slate-900 dark:bg-slate-950/70 dark:text-white">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
