import { supabase } from "../supabaseClient";
import { createNotification } from "./notifications";
import { getCurrentUserOrThrow } from "./supabaseHelpers";

export const createDonation = async ({ user_id, ngo, method, items }) => {
  const user = await getCurrentUserOrThrow();
  const ownerId = user_id || user.id;

  // Build one row per selected item_id
  const rows = items.map((item_id) => ({
    user_id: ownerId,
    item_id,
    ngo_name: ngo,
    donation_method: method,
    status: "pending",
  }));

  // Insert donation rows
  const { data, error } = await supabase
    .from("donations")
    .insert(rows);

  if (error) throw error;

  // Mark donated items as "donated" in items table
  // so they leave active listings and wardrobe
  const { error: updateError } = await supabase
    .from("items")
    .update({ status: "donated" })
    .in("id", items)
    .eq("user_id", ownerId);

  if (updateError) throw updateError;

  await createNotification({
    userId: ownerId,
    title: "Donation request created",
    message: `${items.length} item${items.length === 1 ? "" : "s"} submitted for donation.`,
    type: "success",
  });

  return data;
};

export async function getDonationHistory() {
  const user = await getCurrentUserOrThrow();
  const { data, error } = await supabase
    .from("donations")
    .select(`
      id,
      user_id,
      item_id,
      ngo_name,
      donation_method,
      status,
      notes,
      pickup_date,
      completed_at,
      created_at,
      item:items (
        id,
        title,
        image_url,
        category,
        condition
      )
    `)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getDonationImpactSummary() {
  const donations = await getDonationHistory();
  return buildDonationImpactSummary(donations);
}

export function buildDonationImpactSummary(donations = []) {
  const completed = donations.filter((entry) =>
    ["received", "completed"].includes((entry.status || "").toLowerCase())
  );

  return {
    totalDonations: donations.length,
    completedDonations: completed.length,
    waterSavedLitres: completed.length * 2700,
    co2ReducedKg: Number((completed.length * 3.6).toFixed(1)),
  };
}

export async function deleteDonation(donationId) {
  const user = await getCurrentUserOrThrow();

  const { error } = await supabase
    .from("donations")
    .delete()
    .eq("id", donationId)
    .eq("user_id", user.id);

  if (error) throw error;
  return true;
}

export async function clearDonations(donationIds = []) {
  const user = await getCurrentUserOrThrow();

  if (!donationIds.length) return true;

  const { error } = await supabase
    .from("donations")
    .delete()
    .in("id", donationIds)
    .eq("user_id", user.id);

  if (error) throw error;
  return true;
}
