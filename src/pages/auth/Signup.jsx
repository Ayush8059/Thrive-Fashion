import { Link, useNavigate } from "react-router-dom";
import { CalendarDays, Lock, Mail, MapPin, Phone, User, ArrowRight, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { signUpUser } from "../../services/auth";

const COUNTRY_CODES = [
  { label: "IN (+91)", value: "+91" },
  { label: "US (+1)", value: "+1" },
  { label: "UK (+44)", value: "+44" },
  { label: "AE (+971)", value: "+971" },
  { label: "AU (+61)", value: "+61" },
];

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const navigate = useNavigate();

  const handleSignup = async (event) => {
    event.preventDefault();
    setErrorMsg("");

    if (!fullName.trim()) {
      setErrorMsg("Please enter your full name.");
      return;
    }

    if (!dateOfBirth) {
      setErrorMsg("Please add your birth date.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMsg("Passwords do not match");
      return;
    }

    if (password.length < 6) {
      setErrorMsg("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { user, error } = await signUpUser({
        email,
        password,
        fullName: fullName.trim(),
        phone: `${countryCode} ${phone.trim()}`.trim(),
        dateOfBirth,
        gender,
        city: city.trim(),
      });

      if (error) {
        setErrorMsg(error.message || "Signup failed. Please try again.");
        return;
      }

      if (user) {
        navigate("/");
      }
    } catch (err) {
      setErrorMsg("Something went wrong. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
      className="w-full max-w-md mx-auto"
    >
      <div className="mb-8">
        <h2 className="mb-2 text-3xl font-bold text-slate-900 dark:text-white">Create Account</h2>
        <p className="text-slate-600 dark:text-slate-300">Join the sustainable fashion movement</p>
      </div>

      {errorMsg && (
        <div className="mb-4 rounded-lg border border-red-400 bg-red-100 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {errorMsg}
        </div>
      )}

      <form className="space-y-5" onSubmit={handleSignup}>
        <FormField label="Full Name" icon={<User className="h-5 w-5 text-slate-500 dark:text-slate-400" />}>
          <input
            type="text"
            className="input-field pl-10"
            placeholder="John Doe"
            required
            value={fullName}
            onChange={(event) => setFullName(event.target.value)}
          />
        </FormField>

        <FormField label="Email Address" icon={<Mail className="h-5 w-5 text-slate-500 dark:text-slate-400" />}>
          <input
            type="email"
            className="input-field pl-10"
            placeholder="you@example.com"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </FormField>

        <div className="grid gap-5">
          <div className="space-y-1 sm:col-span-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Phone Number</label>
            <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm transition-all focus-within:border-primary/70 focus-within:ring-2 focus-within:ring-primary/30 dark:border-gray-700 dark:bg-slate-800/80">
              <select
                className="w-32 shrink-0 border-r border-slate-200 bg-slate-50 px-3 text-sm font-medium text-slate-700 focus:outline-none dark:border-gray-700 dark:bg-slate-900 dark:text-slate-200"
                value={countryCode}
                onChange={(event) => setCountryCode(event.target.value)}
              >
                {COUNTRY_CODES.map((country) => (
                  <option key={country.value} value={country.value}>
                    {country.label}
                  </option>
                ))}
              </select>
              <div className="relative min-w-0 flex-1">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Phone className="h-5 w-5 text-slate-500 dark:text-slate-400" />
                </div>
                <input
                  type="tel"
                  className="w-full min-w-0 bg-transparent py-3.5 pl-10 pr-4 text-slate-900 placeholder:text-slate-500 focus:outline-none dark:text-white dark:placeholder:text-slate-400"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  inputMode="tel"
                  autoComplete="tel-national"
                />
              </div>
            </div>
          </div>
        </div>

        <FormField label="Birth Date" icon={<CalendarDays className="h-5 w-5 text-slate-500 dark:text-slate-400" />}>
          <input
            type="date"
            className="input-field pl-10"
            required
            value={dateOfBirth}
            onChange={(event) => setDateOfBirth(event.target.value)}
          />
        </FormField>

        <div className="grid gap-5 md:grid-cols-2">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">Gender</label>
            <select
              className="input-field"
              value={gender}
              onChange={(event) => setGender(event.target.value)}
            >
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="non_binary">Non-binary</option>
              <option value="other">Other</option>
            </select>
          </div>

          <FormField label="City" icon={<MapPin className="h-5 w-5 text-slate-500 dark:text-slate-400" />}>
            <input
              type="text"
              className="input-field pl-10"
              placeholder="Mumbai"
              value={city}
              onChange={(event) => setCity(event.target.value)}
            />
          </FormField>
        </div>

        <FormField label="Password" icon={<Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />}>
          <input
            type={showPassword ? "text" : "password"}
            className="input-field pl-10 pr-12"
            placeholder="Password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </FormField>

        <FormField label="Confirm Password" icon={<Lock className="h-5 w-5 text-slate-500 dark:text-slate-400" />}>
          <input
            type={showConfirmPassword ? "text" : "password"}
            className="input-field pl-10 pr-12"
            placeholder="Confirm password"
            required
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword((current) => !current)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
            aria-label={showConfirmPassword ? "Hide password confirmation" : "Show password confirmation"}
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </FormField>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
          className="btn-primary mt-7 flex w-full items-center justify-center gap-2 py-3 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Creating Account..." : "Create Account"}
          {!loading && <ArrowRight className="h-4 w-4" />}
        </motion.button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-700 dark:text-slate-300">
        Already have an account? <Link to="/" className="font-semibold text-slate-900 hover:underline dark:text-white">Sign in</Link>
      </div>
    </motion.div>
  );
}

function FormField({ label, icon, children }) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">{icon}</div>
        {children}
      </div>
    </div>
  );
}
