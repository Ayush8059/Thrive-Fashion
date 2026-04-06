import { supabase } from "../supabaseClient";
import { getAppErrors } from "./appErrors";
import { getFeedbackSubmissions } from "./feedback";

export async function getAdminOverview() {
  const [
    { data: profiles = [] },
    { count: activeListings = 0 },
    { count: donations = 0 },
    feedbackResult,
    errorResult,
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, is_blocked, status, full_name, email, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("items").select("id", { count: "exact", head: true }).eq("status", "active"),
    supabase.from("donations").select("id", { count: "exact", head: true }),
    getFeedbackSubmissions({ page: 1, pageSize: 5 }),
    getAppErrors({ page: 1, pageSize: 5 }),
  ]);

  const activeUsers = profiles.filter(
    (profile) => !profile.is_blocked && (profile.status === "active" || !profile.status),
  ).length;
  const blockedUsers = profiles.filter(
    (profile) => profile.is_blocked || profile.status === "blocked",
  ).length;
  const deletedUsers = profiles.filter((profile) => profile.status === "deleted").length;
  const inactiveUsers = profiles.filter(
    (profile) =>
      !profile.is_blocked &&
      profile.status &&
      !["active", "blocked", "deleted"].includes(profile.status),
  ).length;

  return {
    users: profiles.length,
    activeUsers,
    blockedUsers,
    inactiveUsers,
    deletedUsers,
    activeListings,
    donations,
    feedbackCount: feedbackResult.count,
    openErrorCount: errorResult.errors.filter((entry) => entry.status !== "resolved").length,
    recentUsers: profiles.slice(0, 5),
    recentFeedback: feedbackResult.feedback,
    recentErrors: errorResult.errors,
  };
}
