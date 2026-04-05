import { supabase } from "../supabaseClient";

export async function getMfaStatus() {
  const { data: aalData, error: aalError } =
    await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

  const { data: factorData, error: factorError } =
    await supabase.auth.mfa.listFactors();

  if (aalError) throw aalError;
  if (factorError) throw factorError;

  const totpFactors = factorData?.totp || [];

  return {
    currentLevel: aalData?.currentLevel || "aal1",
    nextLevel: aalData?.nextLevel || "aal1",
    totpFactors,
    primaryFactor: totpFactors[0] || null,
  };
}

export async function enrollTotpFactor(friendlyName = "Authenticator App") {
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName,
  });

  if (error) throw error;
  return data;
}

export async function challengeTotpFactor(factorId) {
  const { data, error } = await supabase.auth.mfa.challenge({ factorId });
  if (error) throw error;
  return data;
}

export async function verifyTotpFactor({ factorId, challengeId, code }) {
  const { data, error } = await supabase.auth.mfa.verify({
    factorId,
    challengeId,
    code,
  });

  if (error) throw error;
  return data;
}

export async function unenrollTotpFactor(factorId) {
  const { data, error } = await supabase.auth.mfa.unenroll({ factorId });
  if (error) throw error;
  return data;
}
