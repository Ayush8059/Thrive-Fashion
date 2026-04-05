import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { challengeTotpFactor, getMfaStatus, verifyTotpFactor } from "../../services/mfa";
import { useAuth } from "../../context/AuthContext";

export default function MfaChallenge() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { profile, aal, nextAal, refreshSecurityState } = useAuth();
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [factorId, setFactorId] = useState("");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");

  const nextPath =
    searchParams.get("next") || (profile?.is_admin ? "/admin/dashboard" : "/dashboard");

  useEffect(() => {
    if (nextAal !== "aal2" || aal === "aal2") {
      navigate(nextPath, { replace: true });
      return;
    }

    loadChallenge();
  }, [aal, nextAal, nextPath]);

  const loadChallenge = async () => {
    setLoading(true);
    setError("");
    try {
      const status = await getMfaStatus();
      const factor = status.primaryFactor;

      if (!factor) {
        setError("No authenticator app is enrolled on this account yet.");
        return;
      }

      const challenge = await challengeTotpFactor(factor.id);
      setFactorId(factor.id);
      setChallengeId(challenge.id);
    } catch (challengeError) {
      setError(challengeError.message || "Unable to start two-factor challenge.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!factorId || !challengeId || code.length !== 6) return;

    setVerifying(true);
    setError("");
    try {
      await verifyTotpFactor({
        factorId,
        challengeId,
        code,
      });
      await refreshSecurityState?.();
      navigate(nextPath, { replace: true });
    } catch (verifyError) {
      setError(verifyError.message || "Incorrect verification code.");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/20 text-primary">
          <ShieldCheck className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-bold mb-2">Two-factor verification</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Enter the 6-digit code from your authenticator app to continue.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            className="input-field text-center text-lg tracking-[0.5em]"
            placeholder="000000"
            inputMode="numeric"
            autoFocus
          />

          <button type="submit" disabled={verifying || code.length !== 6} className="btn-primary w-full disabled:opacity-60">
            {verifying ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </span>
            ) : (
              "Verify and continue"
            )}
          </button>
        </form>
      )}
    </div>
  );
}
