import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, Lock, Moon, Sun, Monitor,
  Eye, EyeOff, ShieldCheck, CheckCircle, AlertCircle, Save
} from "lucide-react";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

const SECTIONS = [
  { id:"profile",  label:"Profile Settings", icon:<User size={15}/> },
  { id:"security", label:"Security",          icon:<Lock size={15}/> },
  { id:"appearance",label:"Appearance",       icon:<Monitor size={15}/> },
];

function Msg({ msg }) {
  if (!msg) return null;
  const isSuccess = msg.type==="success";
  return (
    <motion.div initial={{opacity:0,y:-8}} animate={{opacity:1,y:0}} exit={{opacity:0}}
      style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"10px 14px",borderRadius:10,marginBottom:16,
        background: isSuccess?"rgba(16,185,129,0.12)":"rgba(239,68,68,0.12)",
        border: `1px solid ${isSuccess?"rgba(16,185,129,0.3)":"rgba(239,68,68,0.3)"}`,
        color: isSuccess?"#34d399":"#f87171", fontSize:13, fontWeight:500 }}>
      {isSuccess ? <CheckCircle size={15} style={{flexShrink:0,marginTop:1}}/> : <AlertCircle size={15} style={{flexShrink:0,marginTop:1}}/>}
      {msg.text}
    </motion.div>
  );
}

function PasswordInput({ value, onChange, placeholder, show, onToggle, disabled }) {
  return (
    <div style={{position:"relative"}}>
      <input type={show?"text":"password"} value={value} onChange={onChange}
        placeholder={placeholder} disabled={disabled}
        className="space-input" style={{paddingRight:44}}/>
      <button type="button" onClick={onToggle}
        style={{ position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",
          background:"none",border:"none",cursor:"pointer",color:"rgba(255,255,255,0.4)",padding:0 }}>
        {show ? <EyeOff size={16}/> : <Eye size={16}/>}
      </button>
    </div>
  );
}

function SectionLabel({ text }) {
  return (
    <div style={{ fontSize:11,textTransform:"uppercase",letterSpacing:"0.8px",
      color:"rgba(255,255,255,0.4)",fontWeight:600,marginBottom:8 }}>
      {text}
    </div>
  );
}

export default function AdminSettings() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeSection, setActiveSection] = useState("profile");

  // Profile
  const [displayName, setDisplayName] = useState("");
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  // Security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifyMsg,   setVerifyMsg]  = useState(null);
  const [isVerified,  setIsVerified] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  // Appearance
  const [theme, setTheme] = useState(() => localStorage.getItem("admin-theme")||"dark");

  useEffect(() => {
    if (profile?.full_name) setDisplayName(profile.full_name);
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("admin-theme", theme);
    const root = document.documentElement;
    if (theme==="dark")       root.classList.add("dark");
    else if (theme==="light") root.classList.remove("dark");
    else window.matchMedia("(prefers-color-scheme: dark)").matches ? root.classList.add("dark") : root.classList.remove("dark");
  }, [theme]);

  const handleSaveProfile = async (e) => {
    e.preventDefault(); setProfileMsg(null);
    if (!displayName.trim()) { setProfileMsg({type:"error",text:"Display name cannot be empty."}); return; }
    setProfileLoading(true);
    try {
      const { error } = await supabase.from("profiles").update({full_name:displayName.trim()}).eq("id",user.id);
      if (error) {
        setProfileMsg({type:"error",text:error.message});
        return;
      }
      await refreshProfile();
      setProfileMsg({type:"success",text:"Profile updated successfully!"});
    } catch {
      setProfileMsg({type:"error",text:"Failed to update profile."});
    } finally {
      setProfileLoading(false);
    }
  };

  const handleVerifyPassword = async (e) => {
    e.preventDefault(); setVerifyMsg(null);
    if (!currentPassword) { setVerifyMsg({type:"error",text:"Please enter your current password."}); return; }
    setVerifyLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({email:user?.email, password:currentPassword});
      if (error) {
        setVerifyMsg({type:"error",text:"Current password is incorrect."});
      } else {
        setVerifyMsg({type:"success",text:"Identity verified. Set your new password."});
        setIsVerified(true); setCurrentPassword("");
      }
    } finally {
      setVerifyLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault(); setPasswordMsg(null);
    if (!isVerified) { setPasswordMsg({type:"error",text:"Please verify your current password first."}); return; }
    if (newPassword.length<8)         { setPasswordMsg({type:"error",text:"Password must be at least 8 characters."}); return; }
    if (!/[A-Z]/.test(newPassword))   { setPasswordMsg({type:"error",text:"Must contain at least one uppercase letter."}); return; }
    if (!/[0-9]/.test(newPassword))   { setPasswordMsg({type:"error",text:"Must contain at least one number."}); return; }
    if (newPassword!==confirmPassword) { setPasswordMsg({type:"error",text:"Passwords do not match."}); return; }
    setPasswordLoading(true);
    const { error } = await supabase.auth.updateUser({password:newPassword});
    setPasswordLoading(false);
    if (error) {
      setPasswordMsg({type:"error",text:error.message});
    } else {
      setPasswordMsg({type:"success",text:"Password updated successfully!"});
      setNewPassword(""); setConfirmPassword(""); setIsVerified(false); setVerifyMsg(null);
    }
  };

  const pwStrength = (pwd) => {
    if (!pwd) return null;
    let s=0;
    if (pwd.length>=8) s++;
    if (/[A-Z]/.test(pwd)) s++;
    if (/[0-9]/.test(pwd)) s++;
    if (/[^A-Za-z0-9]/.test(pwd)) s++;
    const map = [{label:"Weak",color:"#ef4444"},{label:"Fair",color:"#f59e0b"},{label:"Good",color:"#eab308"},{label:"Strong",color:"#10b981"}];
    return {...map[Math.min(s-1,3)], pct:s*25};
  };
  const strength = pwStrength(newPassword);

  const initials = profile?.full_name?.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)||"SA";

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:"flex",flexDirection:"column",gap:24}}>
      {/* Header */}
      <div>
        <h1 style={{ fontSize:28,fontWeight:800,color:"white",margin:0,
          background:"linear-gradient(135deg,#a5b4fc,white)", WebkitBackgroundClip:"text", WebkitTextFillColor:"transparent" }}>
          Settings
        </h1>
        <p style={{ color:"rgba(255,255,255,0.4)",marginTop:4,fontSize:13 }}>
          Manage your admin account preferences
        </p>
      </div>

      <div style={{display:"flex",gap:20,flexWrap:"wrap"}}>

        {/* Side nav */}
        <div style={{width:200,flexShrink:0}}>
          <div className="space-card" style={{padding:8}}>
            {SECTIONS.map(s=>(
              <button key={s.id} onClick={()=>setActiveSection(s.id)}
                style={{ display:"flex",alignItems:"center",gap:10,padding:"10px 14px",
                  width:"100%",textAlign:"left",background:activeSection===s.id?"rgba(99,102,241,0.15)":"transparent",
                  border:activeSection===s.id?"1px solid rgba(99,102,241,0.25)":"1px solid transparent",
                  borderRadius:8,color:activeSection===s.id?"#a5b4fc":"rgba(255,255,255,0.5)",
                  cursor:"pointer",fontFamily:"'Inter',sans-serif",fontSize:13,fontWeight:activeSection===s.id?600:400,
                  marginBottom:4,transition:"all 0.2s" }}>
                {s.icon} {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div style={{flex:1,minWidth:0}}>
          <AnimatePresence mode="wait">

            {/* Profile Section */}
            {activeSection==="profile" && (
              <motion.div key="profile" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
                className="space-card" style={{padding:28}}>
                <h2 style={{margin:"0 0 20px",fontSize:16,fontWeight:700,color:"white",display:"flex",alignItems:"center",gap:8}}>
                  <User size={16} color="#818cf8"/> Profile Settings
                </h2>

                {/* Avatar + Info display */}
                <div style={{ display:"flex",alignItems:"center",gap:16,padding:"16px 20px",
                  background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",
                  borderRadius:12,marginBottom:24 }}>
                  <div style={{ width:60,height:60,borderRadius:"50%",
                    background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    fontSize:22,fontWeight:700,color:"white",flexShrink:0,
                    boxShadow:"0 0 20px rgba(99,102,241,0.4)" }}>
                    {initials}
                  </div>
                  <div>
                    <div style={{fontSize:15,fontWeight:700,color:"white"}}>
                      {profile?.full_name||"Admin"}
                    </div>
                    <div style={{fontSize:12,color:"rgba(255,255,255,0.4)",marginTop:2}}>
                      {user?.email}
                    </div>
                    <span style={{ display:"inline-block",marginTop:6,fontSize:10,padding:"2px 10px",
                      borderRadius:12,fontWeight:700,letterSpacing:"0.5px",
                      background:"rgba(99,102,241,0.15)",color:"#818cf8",
                      border:"1px solid rgba(99,102,241,0.25)" }}>
                      ADMINISTRATOR
                    </span>
                  </div>
                </div>

                <form onSubmit={handleSaveProfile} style={{display:"flex",flexDirection:"column",gap:16}}>
                  <AnimatePresence><Msg msg={profileMsg}/></AnimatePresence>

                  <div>
                    <SectionLabel text="Display Name"/>
                    <input type="text" value={displayName}
                      onChange={e=>setDisplayName(e.target.value)}
                      placeholder="Your display name"
                      className="space-input"/>
                  </div>

                  <div>
                    <SectionLabel text="Email Address"/>
                    <input type="email" value={user?.email||""} disabled
                      className="space-input"
                      style={{opacity:0.5,cursor:"not-allowed"}}/>
                    <div style={{fontSize:11,color:"rgba(255,255,255,0.3)",marginTop:6}}>
                      Email cannot be changed from this panel
                    </div>
                  </div>

                  <div style={{display:"flex",justifyContent:"flex-end",marginTop:4}}>
                    <button type="submit" disabled={profileLoading}
                      style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 22px",
                        background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                        border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:13,
                        cursor:profileLoading?"not-allowed":"pointer",fontFamily:"'Inter',sans-serif",
                        boxShadow:"0 0 20px rgba(99,102,241,0.3)",opacity:profileLoading?0.7:1 }}>
                      {profileLoading ? "Saving…" : <><Save size={14}/> Save Changes</>}
                    </button>
                  </div>
                </form>
              </motion.div>
            )}

            {/* Security Section */}
            {activeSection==="security" && (
              <motion.div key="security" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
                className="space-card" style={{padding:28}}>
                <h2 style={{margin:"0 0 8px",fontSize:16,fontWeight:700,color:"white",display:"flex",alignItems:"center",gap:8}}>
                  <Lock size={16} color="#818cf8"/> Change Password
                </h2>
                <p style={{margin:"0 0 20px",fontSize:13,color:"rgba(255,255,255,0.4)"}}>
                  Verify your current password before setting a new one
                </p>

                <AnimatePresence mode="wait">
                  {!isVerified ? (
                    <motion.form key="verify" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                      onSubmit={handleVerifyPassword} style={{display:"flex",flexDirection:"column",gap:16}}>

                      <div style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",
                        background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.25)",borderRadius:10 }}>
                        <ShieldCheck size={16} color="#fbbf24" style={{flexShrink:0,marginTop:1}}/>
                        <p style={{margin:0,fontSize:13,color:"#fbbf24"}}>
                          Enter your current password to verify your identity before making changes.
                        </p>
                      </div>

                      <AnimatePresence><Msg msg={verifyMsg}/></AnimatePresence>

                      <div>
                        <SectionLabel text="Current Password"/>
                        <PasswordInput value={currentPassword}
                          onChange={e=>setCurrentPassword(e.target.value)}
                          placeholder="Enter current password"
                          show={showCurrent} onToggle={()=>setShowCurrent(v=>!v)}/>
                      </div>

                      <div style={{display:"flex",justifyContent:"flex-end"}}>
                        <button type="submit" disabled={verifyLoading||!currentPassword}
                          style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 22px",
                            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                            border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:13,
                            cursor:verifyLoading||!currentPassword?"not-allowed":"pointer",
                            fontFamily:"'Inter',sans-serif",
                            boxShadow:"0 0 20px rgba(99,102,241,0.3)",
                            opacity:verifyLoading||!currentPassword?0.6:1 }}>
                          {verifyLoading?"Verifying…":<><ShieldCheck size={14}/>Verify Identity</>}
                        </button>
                      </div>
                    </motion.form>
                  ) : (
                    <motion.form key="change" initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}}
                      onSubmit={handleUpdatePassword} style={{display:"flex",flexDirection:"column",gap:16}}>

                      <div style={{ display:"flex",alignItems:"flex-start",gap:10,padding:"12px 14px",
                        background:"rgba(16,185,129,0.1)",border:"1px solid rgba(16,185,129,0.25)",borderRadius:10 }}>
                        <ShieldCheck size={16} color="#34d399" style={{flexShrink:0,marginTop:1}}/>
                        <p style={{margin:0,fontSize:13,color:"#34d399"}}>
                          Identity verified. Enter your new password below.
                        </p>
                      </div>

                      <AnimatePresence><Msg msg={passwordMsg}/></AnimatePresence>

                      <div>
                        <SectionLabel text="New Password"/>
                        <PasswordInput value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                          placeholder="Min. 8 characters" show={showNew} onToggle={()=>setShowNew(v=>!v)}/>
                        {newPassword && strength && (
                          <div style={{marginTop:8}}>
                            <div style={{height:4,background:"rgba(255,255,255,0.06)",borderRadius:20,overflow:"hidden"}}>
                              <motion.div initial={{width:0}} animate={{width:`${strength.pct}%`}} transition={{duration:0.4}}
                                style={{height:"100%",background:strength.color,borderRadius:20}}/>
                            </div>
                            <div style={{display:"flex",justifyContent:"space-between",marginTop:4}}>
                              <span style={{fontSize:11,color:strength.color,fontWeight:600}}>{strength.label}</span>
                              <div style={{display:"flex",gap:8}}>
                                {[
                                  {r:newPassword.length>=8,t:"8+ chars"},
                                  {r:/[A-Z]/.test(newPassword),t:"Uppercase"},
                                  {r:/[0-9]/.test(newPassword),t:"Number"},
                                ].map(({r,t})=>(
                                  <span key={t} style={{fontSize:10,color:r?"#34d399":"rgba(255,255,255,0.3)"}}>
                                    {r?"✓":""} {t}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      <div>
                        <SectionLabel text="Confirm New Password"/>
                        <PasswordInput value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)}
                          placeholder="Re-enter new password" show={showConfirm} onToggle={()=>setShowConfirm(v=>!v)}/>
                        {confirmPassword && (
                          <div style={{fontSize:11,marginTop:6,color:newPassword===confirmPassword?"#34d399":"#f87171"}}>
                            {newPassword===confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                          </div>
                        )}
                      </div>

                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                        <button type="button"
                          onClick={()=>{setIsVerified(false);setNewPassword("");setConfirmPassword("");setPasswordMsg(null);setVerifyMsg(null);}}
                          style={{ background:"none",border:"none",color:"rgba(255,255,255,0.4)",
                            cursor:"pointer",fontSize:13,fontFamily:"'Inter',sans-serif" }}>
                          Cancel
                        </button>
                        <button type="submit" disabled={passwordLoading||!newPassword||!confirmPassword}
                          style={{ display:"flex",alignItems:"center",gap:8,padding:"10px 22px",
                            background:"linear-gradient(135deg,#6366f1,#8b5cf6)",
                            border:"none",borderRadius:10,color:"white",fontWeight:700,fontSize:13,
                            cursor:passwordLoading||!newPassword||!confirmPassword?"not-allowed":"pointer",
                            fontFamily:"'Inter',sans-serif",boxShadow:"0 0 20px rgba(99,102,241,0.3)",
                            opacity:passwordLoading||!newPassword||!confirmPassword?0.6:1 }}>
                          {passwordLoading?"Updating…":"Update Password"}
                        </button>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

              </motion.div>
            )}

            {/* Appearance Section */}
            {activeSection==="appearance" && (
              <motion.div key="appearance" initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}}
                className="space-card" style={{padding:28}}>
                <h2 style={{margin:"0 0 8px",fontSize:16,fontWeight:700,color:"white",display:"flex",alignItems:"center",gap:8}}>
                  <Monitor size={16} color="#818cf8"/> Appearance
                </h2>
                <p style={{margin:"0 0 24px",fontSize:13,color:"rgba(255,255,255,0.4)"}}>
                  Choose your preferred dashboard theme
                </p>

                <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14}}>
                  {[
                    { id:"light",  icon:<Sun size={28}/>,     label:"Light",  desc:"Bright interface" },
                    { id:"dark",   icon:<Moon size={28}/>,    label:"Dark",   desc:"Space mode" },
                    { id:"system", icon:<Monitor size={28}/>, label:"System", desc:"Auto detect" },
                  ].map(t=>(
                    <button key={t.id} onClick={()=>setTheme(t.id)}
                      style={{ padding:"20px 14px",borderRadius:14,
                        background:theme===t.id?"rgba(99,102,241,0.15)":"rgba(255,255,255,0.03)",
                        border:theme===t.id?"1px solid rgba(99,102,241,0.5)":"1px solid rgba(255,255,255,0.07)",
                        color:theme===t.id?"#a5b4fc":"rgba(255,255,255,0.5)",
                        cursor:"pointer",textAlign:"center",
                        fontFamily:"'Inter',sans-serif",
                        boxShadow:theme===t.id?"0 0 20px rgba(99,102,241,0.2)":"none",
                        transition:"all 0.2s" }}>
                      <div style={{marginBottom:8,opacity:theme===t.id?1:0.5}}>{t.icon}</div>
                      <div style={{fontSize:14,fontWeight:theme===t.id?700:500}}>{t.label}</div>
                      <div style={{fontSize:11,marginTop:4,color:theme===t.id?"rgba(165,180,252,0.7)":"rgba(255,255,255,0.3)"}}>
                        {t.desc}
                      </div>
                    </button>
                  ))}
                </div>
                <p style={{fontSize:11,color:"rgba(255,255,255,0.25)",marginTop:14}}>
                  Theme preference is saved locally in your browser.
                </p>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
