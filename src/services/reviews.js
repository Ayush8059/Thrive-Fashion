import { supabase } from "../supabaseClient";
import { getCurrentUserOrThrow } from "./supabaseHelpers";

export async function getReviewsForItem(itemId) {
  const { data, error } = await supabase
    .from("reviews")
    .select(`
      id,
      order_id,
      item_id,
      reviewer_id,
      seller_id,
      rating,
      comment,
      created_at,
      profiles!reviews_reviewer_id_fkey (
        full_name,
        avatar_url
      )
    `)
    .eq("item_id", itemId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function upsertReview({ orderId, itemId, sellerId, rating, comment }) {
  const user = await getCurrentUserOrThrow();

  const { data: existing, error: existingError } = await supabase
    .from("reviews")
    .select("id")
    .eq("item_id", itemId)
    .eq("reviewer_id", user.id)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error } = await supabase
      .from("reviews")
      .update({
        rating,
        comment: comment.trim(),
      })
      .eq("id", existing.id)
      .eq("reviewer_id", user.id);

    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("reviews")
    .insert({
      order_id: orderId || null,
      item_id: itemId,
      reviewer_id: user.id,
      seller_id: sellerId,
      rating,
      comment: comment.trim(),
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}
