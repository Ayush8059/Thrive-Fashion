import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, ArrowRight, Lock, Mail, Eye, EyeOff } from "lucide-react";
import { supabase } from "../../supabaseClient";

/* Rate limiter */
const loginAttempts = { count: 0, firstAttempt: null };
function isRateLimited() {
  const now = Date.now(), WINDOW = 15*60*1000, MAX = 5;
  if (!loginAttempts.firstAttempt || now - loginAttempts.firstAttempt > WINDOW) {
    loginAttempts.count = 1; loginAttempts.firstAttempt = now; return false;
  }
  loginAttempts.count++;
  return loginAttempts.count > MAX;
}

export default function AdminLogin() {
  const navigate = useNavigate();
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [showPw,   setShowPw]   = useState(false);
  const [loading,  setLoading]  = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [lockout,  setLockout]  = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    if (isRateLimited()) { setLockout(true); setErrorMsg("Too many attempts. Please wait 15 minutes."); return; }
    if (!email.trim() || !password) { setErrorMsg("Please enter both email and password."); return; }
    setLoading(true);
    try {
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(), password,
      });
      if (authError) { setErrorMsg("Invalid email or password."); return; }
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin, is_blocked, status, full_name")
        .eq("id", data.user.id)
        .maybeSingle();
      if (profileError || !profile?.is_admin) {
        await supabase.auth.signOut();
        setErrorMsg("Access denied. Admin accounts only.");
        return;
      }
      if (profile.is_blocked || profile.status === "blocked" || (profile.status && profile.status !== "active")) {
        await supabase.auth.signOut();
        setErrorMsg("This admin account is inactive or blocked.");
        return;
      }
      navigate("/admin/dashboard", { replace: true });
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight:"100vh",
      background:"linear-gradient(135deg, #050818 0%, #0a0f2e 50%, #060d1f 100%)",
      display:"flex", alignItems:"center", justifyContent:"center",
      padding:16, position:"relative", overflow:"hidden",
      fontFamily:"'Inter','Segoe UI',sans-serif",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        @keyframes twinkle { 0%,100%{opacity:0.3} 50%{opacity:1} }
        @keyframes orb-float { 0%,100%{transform:translateY(0) scale(1)} 50%{transform:translateY(-20px) scale(1.1)} }
        @keyframes pulse-shield { 0%,100%{box-shadow:0 0 20px rgba(99,102,241,0.5),0 0 40px rgba(99,102,241,0.2)} 50%{box-shadow:0 0 35px rgba(99,102,241,0.9),0 0 70px rgba(99,102,241,0.5)} }
        @keyframes orbit-spin { from{transform:translate(-50%,-50%) rotateX(75deg) rotate(0deg)} to{transform:translate(-50%,-50%) rotateX(75deg) rotate(360deg)} }
        @keyframes spin-loader { to{transform:rotate(360deg)} }
        .login-input { background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:10px; color:white; width:100%; padding:12px 44px; outline:none; font-size:14px; font-family:'Inter',sans-serif; transition:border-color 0.2s,box-shadow 0.2s; }
        .login-input::placeholder { color:rgba(255,255,255,0.3); }
        .login-input:focus { border-color:rgba(99,102,241,0.6); box-shadow:0 0 20px rgba(99,102,241,0.2); }
      `}</style>

      {/* Stars */}
      {[...Array(60)].map((_,i) => (
        <div key={i} style={{
          position:"absolute", width:i%7===0?2.5:1.5, height:i%7===0?2.5:1.5,
          background:"white", borderRadius:"50%",
          left:`${(i*137.5)%100}%`, top:`${(i*93.7)%100}%`,
          opacity:0.3+(i%4)*0.15,
          animation:`twinkle ${2+(i%4)}s ease-in-out ${(i*0.3)%3}s infinite`,
          pointerEvents:"none",
        }}/>
      ))}

      {/* Orbs */}
      <div style={{ position:"absolute", top:"10%", right:"5%", width:500, height:500,
        background:"radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)",
        borderRadius:"50%", filter:"blur(40px)", animation:"orb-float 10s ease-in-out infinite", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", bottom:"10%", left:"5%", width:400, height:400,
        background:"radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)",
        borderRadius:"50%", filter:"blur(40px)", animation:"orb-float 13s ease-in-out 2s infinite", pointerEvents:"none" }}/>
      <div style={{ position:"absolute", top:"50%", left:"30%", width:350, height:350,
        background:"radial-gradient(circle, rgba(6,182,212,0.08) 0%, transparent 70%)",
        borderRadius:"50%", filter:"blur(40px)", animation:"orb-float 15s ease-in-out 5s infinite", pointerEvents:"none" }}/>

      {/* Orbit rings */}
      {[350,550].map((size,i) => (
        <div key={i} style={{
          position:"absolute", top:"30%", left:"80%",
          width:size, height:size,
          border:"1px solid rgba(99,102,241,0.12)",
          borderRadius:"50%",
          animation:`orbit-spin ${20+i*12}s linear infinite`,
          animationDirection: i%2===0?"normal":"reverse",
          transform:"translate(-50%,-50%) rotateX(75deg)",
          pointerEvents:"none",
        }}/>
      ))}

      {/* Grid */}
      <div style={{
        position:"absolute", bottom:-80, left:"50%",
        transform:"translateX(-50%) rotateX(65deg)",
        width:1200, height:500,
        backgroundImage:`linear-gradient(rgba(99,102,241,0.12) 1px, transparent 1px),linear-gradient(90deg, rgba(99,102,241,0.12) 1px, transparent 1px)`,
        backgroundSize:"60px 60px",
        opacity:0.5, pointerEvents:"none",
      }}/>

      {/* Card */}
      <motion.div
        initial={{ opacity:0, scale:0.92, y:30 }}
        animate={{ opacity:1, scale:1, y:0 }}
        transition={{ duration:0.6, type:"spring", bounce:0.35 }}
        style={{
          width:"100%", maxWidth:420, position:"relative", zIndex:10,
          background:"rgba(255,255,255,0.04)",
          border:"1px solid rgba(255,255,255,0.1)",
          borderRadius:20, padding:40,
          backdropFilter:"blur(24px)",
          boxShadow:"0 30px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Top highlight line */}
        <div style={{
          position:"absolute", top:0, left:0, right:0, height:1,
          background:"linear-gradient(90deg, transparent, rgba(99,102,241,0.7), transparent)",
          borderRadius:"20px 20px 0 0",
        }}/>

        {/* Shield icon */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{
            width:64, height:64,
            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
            borderRadius:16, display:"inline-flex", alignItems:"center", justifyContent:"center",
            animation:"pulse-shield 3s ease-in-out infinite",
            marginBottom:16,
          }}>
            <Shield size={28} color="white" />
          </div>
          <h1 style={{
            fontSize:28, fontWeight:800, margin:0,
            background:"linear-gradient(135deg,#a5b4fc,#ffffff,#67e8f9)",
            WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent",
            letterSpacing:"-0.5px",
          }}>ThriveAdmin</h1>
          <p style={{ color:"rgba(255,255,255,0.4)", fontSize:13, marginTop:6 }}>
            Space Station Control Center
          </p>
        </div>

        {/* Error */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div
              initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{
                marginBottom:16, padding:"10px 14px",
                background:"rgba(239,68,68,0.12)", border:"1px solid rgba(239,68,68,0.25)",
                borderRadius:10, color:"#f87171", fontSize:13, fontWeight:500,
              }}
            >
              🔒 {errorMsg}
            </motion.div>
          )}
        </AnimatePresence>

        <form onSubmit={handleLogin} style={{ display:"flex", flexDirection:"column", gap:16 }} noValidate>
          {/* Email */}
          <div>
            <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.5)",
              textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:8, fontWeight:600 }}>
              Admin Email
            </label>
            <div style={{ position:"relative" }}>
              <Mail size={16} color="rgba(255,255,255,0.3)" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }}/>
              <input
                type="email" placeholder="admin@thrive.com"
                value={email} onChange={e => { setEmail(e.target.value); setErrorMsg(""); }}
                disabled={lockout||loading} autoComplete="email"
                className="login-input"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label style={{ display:"block", fontSize:11, color:"rgba(255,255,255,0.5)",
              textTransform:"uppercase", letterSpacing:"0.8px", marginBottom:8, fontWeight:600 }}>
              Password
            </label>
            <div style={{ position:"relative" }}>
              <Lock size={16} color="rgba(255,255,255,0.3)" style={{ position:"absolute", left:14, top:"50%", transform:"translateY(-50%)" }}/>
              <input
                type={showPw?"text":"password"} placeholder="••••••••"
                value={password} onChange={e => { setPassword(e.target.value); setErrorMsg(""); }}
                disabled={lockout||loading} autoComplete="current-password"
                className="login-input"
                style={{ paddingRight:44 }}
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                style={{ position:"absolute", right:14, top:"50%", transform:"translateY(-50%)",
                  background:"none", border:"none", cursor:"pointer", color:"rgba(255,255,255,0.4)", padding:0 }}>
                {showPw ? <EyeOff size={16}/> : <Eye size={16}/>}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            whileHover={{ scale: lockout||loading ? 1 : 1.03 }}
            whileTap={{ scale: lockout||loading ? 1 : 0.97 }}
            type="submit" disabled={loading||lockout}
            style={{
              background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
              border:"none", borderRadius:10, color:"white",
              padding:"13px 0", fontWeight:700, fontSize:15,
              cursor: loading||lockout ? "not-allowed" : "pointer",
              display:"flex", alignItems:"center", justifyContent:"center", gap:8,
              opacity: loading||lockout ? 0.7 : 1,
              boxShadow:"0 0 30px rgba(99,102,241,0.3)",
              fontFamily:"'Inter',sans-serif",
              transition:"box-shadow 0.2s",
              marginTop:4,
            }}
          >
            {loading ? (
              <>
                <div style={{ width:18,height:18,border:"2px solid rgba(255,255,255,0.3)",
                  borderTopColor:"white",borderRadius:"50%",animation:"spin-loader 0.8s linear infinite" }}/>
                Verifying…
              </>
            ) : lockout ? "🔒 Locked Out" : (
              <>Access Dashboard <ArrowRight size={16}/></>
            )}
          </motion.button>
        </form>

        {/* Return link */}
        <div style={{ textAlign:"center", marginTop:24 }}>
          <button
            type="button"
            onClick={() => {
              navigate("/", { replace: true });
            }}
            style={{
              background:"none", border:"none", cursor:"pointer",
              color:"rgba(255,255,255,0.35)", fontSize:13,
              fontFamily:"'Inter',sans-serif",
              transition:"color 0.2s",
            }}
            onMouseEnter={e => e.target.style.color = "#818cf8"}
            onMouseLeave={e => e.target.style.color = "rgba(255,255,255,0.35)"}
          >
            ← Return to Main Application
          </button>
        </div>
      </motion.div>
    </div>
  );
}
