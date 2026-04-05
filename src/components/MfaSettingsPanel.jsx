import { useEffect, useMemo, useState } from "react";
import { Loader2, ShieldCheck, ShieldAlert, Smartphone, Trash2 } from "lucide-react";
import {
  challengeTotpFactor,
  enrollTotpFactor,
  getMfaStatus,
  unenrollTotpFactor,
  verifyTotpFactor,
} from "../services/mfa";
import { useAuth } from "../context/AuthContext";

export default function MfaSettingsPanel({
  cardClassName = "rounded-2xl border border-gray-100 bg-gray-50 p-5 dark:border-gray-800 dark:bg-slate-800/40",
  compact = false,
}) {
  const { refreshSecurityState, aal, nextAal, hasTotpFactor } = useAuth();
  const [loading, setLoading] = useState(false);
  const [statusError, setStatusError] = useState("");
  const [panelMessage, setPanelMessage] = useState({ type: "", text: "" });
  const [setup, setSetup] = useState(null);
  const [verifyCode, setVerifyCode] = useState("");
  const [factor, setFactor] = useState(null);

  const enrolled = Boolean(factor);
  const fullyVerified = enrolled && aal === "aal2";
  const pendingChallenge = enrolled && nextAal === "aal2" && aal !== "aal2";

  const qrMarkup = useMemo(() => {
    if (!setup?.totp?.qr_code) return "";
    return setup.totp.qr_code;
  }, [setup]);

  const qrImageSrc = useMemo(() => {
    if (!qrMarkup) return "";
    return qrMarkup.startsWith("data:image") ? qrMarkup : "";
  }, [qrMarkup]);

  const loadStatus = async () => {
    setLoading(true);
    setStatusError("");
    try {
      const status = await getMfaStatus();
      setFactor(status.primaryFactor);
      await refreshSecurityState?.();
    } catch (error) {
      setStatusError(error.message || "Unable to load two-factor settings.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const handleEnroll = async () => {
    setLoading(true);
    setPanelMessage({ type: "", text: "" });
    setStatusError("");

    try {
      const enrolledFactor = await enrollTotpFactor("Thrive Authenticator");
      const challenge = await challengeTotpFactor(enrolledFactor.id);
      setSetup({
        factorId: enrolledFactor.id,
        challengeId: challenge.id,
        totp: enrolledFactor.totp,
      });
      setPanelMessage({
        type: "success",
        text: "Scan the QR code with Google Authenticator or Authy, then enter the 6-digit code.",
      });
    } catch (error) {
      if (error?.message?.includes('friendly name "Thrive Authenticator"')) {
        try {
          const status = await getMfaStatus();
          const existingFactor = status.primaryFactor;

          if (existingFactor?.id) {
            const challenge = await challengeTotpFactor(existingFactor.id);
            setFactor(existingFactor);
            setSetup({
              factorId: existingFactor.id,
              challengeId: challenge.id,
              totp: existingFactor.totp || null,
            });
            setPanelMessage({
              type: "success",
              text: "A pending authenticator setup already exists. Enter the 6-digit code from your app to finish enabling 2FA.",
            });
            return;
          }
        } catch (recoverError) {
          setStatusError(recoverError.message || "Unable to resume two-factor setup.");
          return;
        }
      }

      setStatusError(error.message || "Unable to start two-factor setup.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (event) => {
    event.preventDefault();
    if (!setup?.factorId || !setup?.challengeId || !verifyCode.trim()) return;

    setLoading(true);
    setStatusError("");
    try {
      await verifyTotpFactor({
        factorId: setup.factorId,
        challengeId: setup.challengeId,
        code: verifyCode.trim(),
      });
      setVerifyCode("");
      setSetup(null);
      setPanelMessage({ type: "success", text: "Two-factor authentication is now enabled." });
      await loadStatus();
    } catch (error) {
      setStatusError(error.message || "Invalid verification code.");
    } finally {
      setLoading(false);
    }
  };

  const handleDisable = async () => {
    if (!factor?.id) return;

    setLoading(true);
    setStatusError("");
    try {
      await unenrollTotpFactor(factor.id);
      setFactor(null);
      setSetup(null);
      setVerifyCode("");
      setPanelMessage({ type: "success", text: "Two-factor authentication has been disabled." });
      await loadStatus();
    } catch (error) {
      setStatusError(error.message || "Unable to disable two-factor authentication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cardClassName}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h4 className="text-lg font-bold text-gray-900 dark:text-white">Two-factor authentication</h4>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Protect your account with an authenticator app.
          </p>
        </div>
        <div
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${
            fullyVerified
              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300"
              : enrolled
              ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300"
              : "bg-gray-100 text-gray-600 dark:bg-slate-700 dark:text-gray-300"
          }`}
        >
          {fullyVerified ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldAlert className="h-3.5 w-3.5" />}
          {fullyVerified ? "Enabled" : enrolled ? "Verification required" : "Not enabled"}
        </div>
      </div>

      {statusError && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
          {statusError}
        </div>
      )}

      {panelMessage.text && (
        <div
          className={`mb-4 rounded-xl px-4 py-3 text-sm ${
            panelMessage.type === "success"
              ? "border border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-900/20 dark:text-green-300"
              : "border border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300"
          }`}
        >
          {panelMessage.text}
        </div>
      )}

      {setup ? (
        <div className="space-y-4">
          <div className="rounded-2xl border border-dashed border-primary/40 bg-white p-4 dark:bg-slate-900">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-primary">
              <Smartphone className="h-4 w-4" />
              Scan with your authenticator app
            </div>
            {qrMarkup ? (
              qrImageSrc ? (
                <div className="mx-auto flex max-w-[220px] justify-center rounded-2xl bg-white p-4">
                  <img
                    src={qrImageSrc}
                    alt="Authenticator QR code"
                    className="h-auto w-full max-w-[180px]"
                  />
                </div>
              ) : (
                <div
                  className="mx-auto flex max-w-[220px] justify-center rounded-2xl bg-white p-4"
                  dangerouslySetInnerHTML={{ __html: qrMarkup }}
                />
              )
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                QR code unavailable. Use the secret below in your authenticator app.
              </p>
            )}
            {setup.totp?.secret && (
              <div className="mt-4 rounded-xl bg-gray-50 p-3 text-xs font-mono text-gray-700 dark:bg-slate-800 dark:text-gray-200">
                {setup.totp.secret}
              </div>
            )}
          </div>

          <form onSubmit={handleVerify} className="space-y-3">
            <input
              type="text"
              value={verifyCode}
              onChange={(event) => setVerifyCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
              className="input-field"
              placeholder="Enter 6-digit code"
              inputMode="numeric"
            />
            <div className={`flex ${compact ? "flex-col" : "justify-end"} gap-3`}>
              <button
                type="button"
                onClick={() => {
                  setSetup(null);
                  setVerifyCode("");
                  setPanelMessage({ type: "", text: "" });
                }}
                className="btn-outline"
              >
                Cancel
              </button>
              <button type="submit" disabled={loading || verifyCode.length !== 6} className="btn-primary disabled:opacity-60">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verify and enable"}
              </button>
            </div>
          </form>
        </div>
      ) : enrolled ? (
        <div className="space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {pendingChallenge
              ? "A second factor is enrolled, but you still need to verify it during sign-in."
              : "Your authenticator app is connected to this account."}
          </p>
          <button
            type="button"
            onClick={handleDisable}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-300 dark:hover:bg-red-900/20 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Disable 2FA
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleEnroll}
          disabled={loading}
          className="btn-primary inline-flex items-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
          Enable 2FA
        </button>
      )}
    </div>
  );
}
