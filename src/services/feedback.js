import { supabase } from "../supabaseClient";
import { getCurrentUserOrThrow } from "./supabaseHelpers";

async function uploadFeedbackAttachment(file, userId) {
  if (!file) return null;

  const fileExt = file.name.split(".").pop() || "bin";
  const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("feedback-attachments")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  return {
    path: fileName,
    name: file.name,
  };
}

async function withSignedScreenshotUrl(entry) {
  if (!entry?.screenshot_url) return entry;

  if (/^https?:\/\//i.test(entry.screenshot_url)) {
    return {
      ...entry,
      screenshot_signed_url: entry.screenshot_url,
    };
  }

  const { data, error } = await supabase.storage
    .from("feedback-attachments")
    .createSignedUrl(entry.screenshot_url, 60 * 60);

  if (error) {
    return {
      ...entry,
      screenshot_signed_url: null,
    };
  }

  return {
    ...entry,
    screenshot_signed_url: data?.signedUrl || null,
  };
}

export async function submitFeedback({ category, rating, message, screenshot = null }) {
  const user = await getCurrentUserOrThrow();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, email")
    .eq("id", user.id)
    .maybeSingle();

  const uploadedScreenshot = screenshot ? await uploadFeedbackAttachment(screenshot, user.id) : null;

  const payload = {
    user_id: user.id,
    category,
    rating,
    message,
    status: "new",
    full_name: profile?.full_name || user.user_metadata?.full_name || "User",
    email: profile?.email || user.email || null,
    screenshot_url: uploadedScreenshot?.path || null,
    screenshot_name: uploadedScreenshot?.name || null,
  };

  const { data, error } = await supabase
    .from("feedback")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getFeedbackSubmissions({ page = 1, pageSize = 10, status = "all" } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("feedback")
    .select("id, user_id, full_name, email, category, rating, message, status, screenshot_url, screenshot_name, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data, error, count } = await query;
  if (error) throw error;

  const resolvedFeedback = await Promise.all((data || []).map(withSignedScreenshotUrl));

  return {
    feedback: resolvedFeedback,
    count: count || 0,
  };
}

export async function updateFeedbackStatus(id, status) {
  const { data, error } = await supabase
    .from("feedback")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return withSignedScreenshotUrl(data);
}
