import { supabase } from "../supabaseClient";

const PROFILE_BASE_SELECT = "id, full_name, email, phone, bio, avatar_url, is_admin";
const PROFILE_EXTENDED_SELECT = `${PROFILE_BASE_SELECT}, status, date_of_birth, gender, city`;
const OPTIONAL_PROFILE_FIELDS = new Set(["status", "date_of_birth", "gender", "city"]);

function isMissingProfileColumnError(error) {
  const message = error?.message || "";
  return error?.code === "PGRST204" || message.includes("Could not find the") || message.includes("schema cache");
}

function stripOptionalProfileFields(payload = {}) {
  return Object.fromEntries(
    Object.entries(payload).filter(([key]) => !OPTIONAL_PROFILE_FIELDS.has(key)),
  );
}

export function normalizeProfile(profile) {
  if (!profile) return null;

  return {
    ...profile,
    status: profile.status || "active",
    date_of_birth: profile.date_of_birth || null,
    gender: profile.gender || "",
    city: profile.city || "",
  };
}

export async function fetchProfileById(id) {
  let response = await supabase
    .from("profiles")
    .select(PROFILE_EXTENDED_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (response.error && isMissingProfileColumnError(response.error)) {
    response = await supabase
      .from("profiles")
      .select(PROFILE_BASE_SELECT)
      .eq("id", id)
      .maybeSingle();
  }

  return {
    ...response,
    data: normalizeProfile(response.data),
  };
}

export async function upsertProfile(payload, options = { onConflict: "id" }) {
  let response = await supabase.from("profiles").upsert(payload, options);

  if (response.error && isMissingProfileColumnError(response.error)) {
    response = await supabase.from("profiles").upsert(stripOptionalProfileFields(payload), options);
  }

  return response;
}

export async function updateProfileById(id, payload) {
  let response = await supabase.from("profiles").update(payload).eq("id", id);

  if (response.error && isMissingProfileColumnError(response.error)) {
    response = await supabase
      .from("profiles")
      .update(stripOptionalProfileFields(payload))
      .eq("id", id);
  }

  return response;
}
