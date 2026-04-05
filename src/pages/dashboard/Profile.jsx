import { Settings, Shield, CreditCard, LogOut, Camera, Loader, Check, Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../supabaseClient";
import { uploadItemImage } from "../../services/items";
import { updateProfileById } from "../../services/profiles";

// ── Password strength checker ──────────────────────────────────────────────
function getPasswordStrength(password) {
  if (!password) return null;
  let score = 0;
  if (password.length >= 8)               score++;
  if (password.length >= 12)              score++;
  if (/[A-Z]/.test(password))             score++;
  if (/[0-9]/.test(password))             score++;
  if (/[^A-Za-z0-9]/.test(password))      score++;

  if (score <= 1) return { label: "Weak",   color: "bg-red-500",    width: "w-1/4"  };
  if (score <= 2) return { label: "Fair",   color: "bg-yellow-500", width: "w-2/4"  };
  if (score <= 3) return { label: "Good",   color: "bg-blue-500",   width: "w-3/4"  };
  return           { label: "Strong", color: "bg-green-500",  width: "w-full" };
}

export default function Profile() {
  const { user, profile, logout, refreshProfile } = useAuth();
  const navigate = useNavigate();

  const [activeTab,     setActiveTab]     = useState("general");
  const [loading,       setLoading]       = useState(false);
  const [saved,         setSaved]         = useState(false);
  const [errorMsg,      setErrorMsg]      = useState("");

  // Profile fields
  const [firstName,     setFirstName]     = useState("");
  const [lastName,      setLastName]      = useState("");
  const [phone,         setPhone]         = useState("");
  const [bio,           setBio]           = useState("");
  const [avatarUrl,     setAvatarUrl]     = useState("");
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [dateOfBirth,   setDateOfBirth]   = useState("");
  const [gender,        setGender]        = useState("");
  const [city,          setCity]          = useState("");

  // Security fields
  const [currentPassword,  setCurrentPassword]  = useState("");
  const [newPassword,      setNewPassword]      = useState("");
  const [confirmPassword,  setConfirmPassword]  = useState("");
  const [showCurrent,      setShowCurrent]      = useState(false);
  const [showNew,          setShowNew]          = useState(false);
  const [showConfirm,      setShowConfirm]      = useState(false);
  const [passwordLoading,  setPasswordLoading]  = useState(false);
  const [passwordMsg,      setPasswordMsg]      = useState(null); // {type,text}
  const [pwErrors,         setPwErrors]         = useState({});

  const fileInputRef = useRef(null);
  const strength = getPasswordStrength(newPassword);

  // ── Load profile ───────────────────────────────────────────────────────────
  useEffect(() => {
    if (profile) {
      const parts = (profile.full_name || "").split(" ");
      setFirstName(parts[0] || "");
      setLastName(parts.slice(1).join(" ") || "");
      setPhone(profile.phone || "");
      setBio(profile.bio || "");
      setAvatarUrl(profile.avatar_url || "");
      setDateOfBirth(profile.date_of_birth || "");
      setGender(profile.gender || "");
      setCity(profile.city || "");
    }
  }, [profile]);

  // ── Auto-dismiss password message ─────────────────────────────────────────
  useEffect(() => {
    if (!passwordMsg) return;
    const t = setTimeout(() => setPasswordMsg(null), 4000);
    return () => clearTimeout(t);
  }, [passwordMsg]);

  // ── Avatar ─────────────────────────────────────────────────────────────────
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowed = ["image/jpeg", "image/png", "image/webp"];
    if (!allowed.includes(file.type)) {
      setErrorMsg("Only JPG, PNG, WebP allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg("Image must be under 5MB.");
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  // ── Save profile ───────────────────────────────────────────────────────────
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    setSaved(false);

    try {
      let finalAvatarUrl = avatarUrl;
      if (avatarFile) {
        const result = await uploadItemImage(avatarFile);
        if (result?.url) finalAvatarUrl = result.url;
      }

      const { error } = await updateProfileById(user.id, {
        full_name: `${firstName} ${lastName}`.trim(),
        phone: phone.trim(),
        bio: bio.trim(),
        avatar_url: finalAvatarUrl,
        date_of_birth: dateOfBirth || null,
        gender: gender || null,
        city: city.trim() || null,
      });

      if (error) { setErrorMsg(error.message); return; }

      setAvatarUrl(finalAvatarUrl);
      setAvatarFile(null);
      setAvatarPreview("");
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setErrorMsg("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // ── Password change — with current password re-auth ────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordMsg(null);
    const errs = {};

    if (!currentPassword)
      errs.current = "Current password is required.";

    if (!newPassword || newPassword.length < 8)
      errs.new = "Password must be at least 8 characters.";
    else if (!/[A-Z]/.test(newPassword))
      errs.new = "Must contain at least one uppercase letter.";
    else if (!/[0-9]/.test(newPassword))
      errs.new = "Must contain at least one number.";
    else if (newPassword === currentPassword)
      errs.new = "New password must be different from current password.";

    if (!confirmPassword)
      errs.confirm = "Please confirm your new password.";
    else if (newPassword !== confirmPassword)
      errs.confirm = "Passwords do not match.";

    if (Object.keys(errs).length > 0) {
      setPwErrors(errs);
      return;
    }

    setPwErrors({});
    setPasswordLoading(true);

    try {
      // Step 1: Re-authenticate with current password to verify identity
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email:    user.email,
        password: currentPassword,
      });

      if (signInError) {
        setPwErrors({ current: "Current password is incorrect." });
        setPasswordLoading(false);
        return;
      }

      // Step 2: Update to new password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        setPasswordMsg({ type: "error", text: updateError.message });
        return;
      }

      setPasswordMsg({ type: "success", text: "Password updated successfully!" });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ type: "error", text: "Something went wrong. Please try again." });
      console.error(err);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const displayAvatar = avatarPreview || avatarUrl;
  const fullName = `${firstName} ${lastName}`.trim() || profile?.full_name || "User";
  const initials = fullName.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  // ── Password input helper ─────────────────────────────────────────────────
  const PasswordInput = ({ label, value, onChange, show, setShow, placeholder, error, required }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className={`input-field pr-12 ${error ? "border-red-400 focus:ring-red-400" : ""}`}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          autoComplete="off"
        />
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
      {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
    </div>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-4xl mx-auto pb-16"
    >
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Account Profile</h1>
        <p className="text-gray-700 dark:text-gray-400">Manage your personal information and preferences.</p>
      </div>

      <div className="grid md:grid-cols-3 gap-8">

        {/* Left Column */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="md:col-span-1 space-y-6"
        >
          {/* Avatar Card */}
          <div className="card flex flex-col items-center text-center">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative mb-4 group cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-slate-700 shadow-lg">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="Profile"
                    className="w-full h-full object-cover"
                    onError={(e) => { e.target.onerror = null; e.target.src = ""; }}
                  />
                ) : (
                  <div className="w-full h-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                    {initials}
                  </div>
                )}
              </div>
              <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 backdrop-blur-sm">
                <Camera className="w-6 h-6 text-white" />
              </div>
            </motion.div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              ref={fileInputRef}
              className="hidden"
              onChange={handleAvatarChange}
            />
            <h2 className="text-xl font-bold">{fullName}</h2>
            <p className="text-gray-700 dark:text-gray-400 text-sm mb-4">{user?.email}</p>
            <motion.span
              whileHover={{ scale: 1.1 }}
              className="px-3 py-1 bg-primary/20 text-dark dark:text-white text-xs font-bold rounded-full shadow-sm"
            >
              Member
            </motion.span>
            {avatarPreview && (
              <p className="text-xs text-primary mt-2 font-semibold">
                📷 New photo selected — save to apply
              </p>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="card p-0 overflow-hidden">
            <div className="flex flex-col">
              <TabLink icon={<Settings className="w-5 h-5" />} label="General Settings" active={activeTab === "general"} onClick={() => setActiveTab("general")} />
              <TabLink icon={<Shield className="w-5 h-5" />}   label="Security"          active={activeTab === "security"} onClick={() => setActiveTab("security")} />
              <TabLink icon={<CreditCard className="w-5 h-5" />} label="Payment Methods" active={activeTab === "payment"}  onClick={() => setActiveTab("payment")}  />
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 px-6 py-4 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors border-t border-gray-100 dark:border-gray-800 font-medium text-left"
              >
                <LogOut className="w-5 h-5" /> Sign Out
              </button>
            </div>
          </div>
        </motion.div>

        {/* Right Column */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="md:col-span-2"
        >
          {/* General Tab */}
          {activeTab === "general" && (
            <div className="card">
              <h3 className="text-xl font-bold mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                Personal Information
              </h3>

              {errorMsg && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-xl text-sm">
                  ⚠️ {errorMsg}
                </div>
              )}
              {saved && (
                <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-xl text-sm flex items-center gap-2">
                  <Check className="w-4 h-4" /> Profile saved successfully!
                </div>
              )}

              <form className="space-y-6" onSubmit={handleSave}>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">First Name</label>
                    <input type="text" className="input-field" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="First name" maxLength={50} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Last Name</label>
                    <input type="text" className="input-field" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Last name" maxLength={50} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email Address</label>
                  <input type="email" className="input-field opacity-60 cursor-not-allowed" value={user?.email || ""} disabled />
                  <p className="text-xs text-gray-500">Email cannot be changed here.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Phone Number</label>
                  <input type="tel" className="input-field" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" maxLength={15} />
                </div>

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Birth Date</label>
                    <input type="date" className="input-field" value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Gender</label>
                    <select className="input-field" value={gender} onChange={(e) => setGender(e.target.value)}>
                      <option value="">Prefer not to say</option>
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="non_binary">Non-binary</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">City</label>
                  <input type="text" className="input-field" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Your city" maxLength={80} />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Bio</label>
                  <textarea className="input-field min-h-[100px] resize-none" value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Tell others about yourself..." maxLength={300} />
                  <p className="text-xs text-gray-400 text-right">{bio.length}/300</p>
                </div>

                <div className="pt-4 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={loading}
                    className="btn-primary shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Saving...</>
                    ) : saved ? (
                      <><Check className="w-4 h-4" /> Saved!</>
                    ) : "Save Changes"}
                  </motion.button>
                </div>
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === "security" && (
            <div className="card">
              <h3 className="text-xl font-bold mb-2 border-b border-gray-100 dark:border-gray-800 pb-4">
                Change Password
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
                Your current password is required to make changes.
              </p>

              {/* Password message toast */}
              <AnimatePresence>
                {passwordMsg && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className={`mb-5 p-3 rounded-xl text-sm border flex items-center gap-2 ${
                      passwordMsg.type === "error"
                        ? "bg-red-100 dark:bg-red-900/20 border-red-400 text-red-700 dark:text-red-400"
                        : "bg-green-100 dark:bg-green-900/20 border-green-400 text-green-700 dark:text-green-400"
                    }`}
                  >
                    {passwordMsg.type === "success" ? "✅" : "⚠️"} {passwordMsg.text}
                  </motion.div>
                )}
              </AnimatePresence>

              <form className="space-y-5" onSubmit={handlePasswordChange} noValidate>

                {/* Current Password — verifies identity */}
                <PasswordInput
                  label="Current Password"
                  value={currentPassword}
                  onChange={(e) => {
                    setCurrentPassword(e.target.value);
                    setPwErrors(prev => ({ ...prev, current: null }));
                  }}
                  show={showCurrent}
                  setShow={setShowCurrent}
                  placeholder="Enter your current password"
                  error={pwErrors.current}
                  required
                />

                {/* New Password */}
                <div className="space-y-2">
                  <PasswordInput
                    label="New Password"
                    value={newPassword}
                    onChange={(e) => {
                      setNewPassword(e.target.value);
                      setPwErrors(prev => ({ ...prev, new: null }));
                    }}
                    show={showNew}
                    setShow={setShowNew}
                    placeholder="Enter new password"
                    error={pwErrors.new}
                    required
                  />
                  {/* Strength meter */}
                  {newPassword && strength && (
                    <div className="space-y-1 mt-2">
                      <div className="h-1.5 rounded-full bg-gray-100 dark:bg-slate-700 overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${strength.color}`}
                          initial={{ width: 0 }}
                          animate={{ width: "100%" }}
                          style={{ maxWidth: strength.width.replace("w-", "").replace("full","100%").replace("3/4","75%").replace("2/4","50%").replace("1/4","25%") }}
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
                      <ul className="text-xs text-gray-400 space-y-0.5 mt-1">
                        <li className={newPassword.length >= 8      ? "text-green-500" : ""}>• At least 8 characters</li>
                        <li className={/[A-Z]/.test(newPassword)    ? "text-green-500" : ""}>• One uppercase letter</li>
                        <li className={/[0-9]/.test(newPassword)    ? "text-green-500" : ""}>• One number</li>
                        <li className={/[^A-Za-z0-9]/.test(newPassword) ? "text-green-500" : ""}>• One special character (bonus)</li>
                      </ul>
                    </div>
                  )}
                </div>

                {/* Confirm Password */}
                <PasswordInput
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setPwErrors(prev => ({ ...prev, confirm: null }));
                  }}
                  show={showConfirm}
                  setShow={setShowConfirm}
                  placeholder="Confirm new password"
                  error={pwErrors.confirm}
                  required
                />

                {/* Match indicator */}
                {confirmPassword && newPassword && (
                  <p className={`text-xs font-semibold ${newPassword === confirmPassword ? "text-green-500" : "text-red-500"}`}>
                    {newPassword === confirmPassword ? "✓ Passwords match" : "✗ Passwords do not match"}
                  </p>
                )}

                <div className="pt-2 flex justify-end">
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    type="submit"
                    disabled={passwordLoading}
                    className="btn-primary shadow-md flex items-center gap-2 disabled:opacity-50"
                  >
                    {passwordLoading ? (
                      <><Loader className="w-4 h-4 animate-spin" /> Verifying...</>
                    ) : "Update Password"}
                  </motion.button>
                </div>
              </form>

            </div>
          )}

          {/* Payment Tab */}
          {activeTab === "payment" && (
            <div className="card">
              <h3 className="text-xl font-bold mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
                Payment Methods
              </h3>
              <div className="text-center py-12">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
                  <CreditCard className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">No payment methods added yet</p>
                <p className="text-gray-400 text-sm mt-1">Payment integration coming soon!</p>
              </div>
            </div>
          )}

        </motion.div>
      </div>
    </motion.div>
  );
}

function TabLink({ icon, label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-6 py-4 transition-all duration-300 text-left border-l-4 ${
        active
          ? "bg-primary/10 border-primary text-dark dark:text-white font-semibold"
          : "border-transparent text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50 hover:text-dark dark:hover:text-white hover:border-gray-300"
      }`}
    >
      {icon} {label}
    </button>
  );
}
