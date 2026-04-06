import { supabase } from "../supabaseClient";

let inFlightFingerprints = new Set();

function buildFingerprint({ message, source, stack }) {
  return `${source || "app"}::${message || "unknown"}::${(stack || "").slice(0, 180)}`;
}

export async function logAppError({
  message,
  stack = "",
  source = "app",
  url = "",
  metadata = null,
}) {
  if (!message) return null;

  const fingerprint = buildFingerprint({ message, source, stack });
  if (inFlightFingerprints.has(fingerprint)) return null;
  inFlightFingerprints.add(fingerprint);

  try {
    const payload = {
      message: String(message).slice(0, 1000),
      stack: stack ? String(stack).slice(0, 4000) : null,
      source: String(source).slice(0, 120),
      url: url ? String(url).slice(0, 500) : window?.location?.href || null,
      metadata: metadata || null,
      status: "open",
    };

    const { data, error } = await supabase
      .from("app_errors")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return null;
    }

    return data;
  } finally {
    window.setTimeout(() => {
      inFlightFingerprints.delete(fingerprint);
    }, 5000);
  }
}

export async function getAppErrors({ page = 1, pageSize = 10, status = "all" } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("app_errors")
    .select("id, message, stack, source, url, metadata, status, created_at", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  return {
    errors: data || [],
    count: count || 0,
  };
}

export async function updateAppErrorStatus(id, status) {
  const { data, error } = await supabase
    .from("app_errors")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
}
