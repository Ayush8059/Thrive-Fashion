import { supabase } from "../supabaseClient";

export async function getCurrentUserOrThrow() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("Authentication required.");
  }

  return user;
}

export async function getCurrentUserId() {
  const user = await getCurrentUserOrThrow();
  return user.id;
}

export function normalizeError(error, fallback = "Something went wrong.") {
  if (!error) return fallback;
  if (typeof error === "string") return error;
  return error.message || fallback;
}

export function ensureArray(value) {
  return Array.isArray(value) ? value : [];
}
