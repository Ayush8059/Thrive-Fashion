import { supabase } from "../supabaseClient";
import { createNotification } from "./notifications";
import { ensureArray, getCurrentUserOrThrow, normalizeError } from "./supabaseHelpers";

const CART_SELECT = `
  id,
  item_id,
  created_at,
  items (
    id,
    user_id,
    title,
    price,
    image_url,
    status,
    category,
    condition
  )
`;

export async function getCartItems() {
  const user = await getCurrentUserOrThrow();
  const { data, error } = await supabase
    .from("cart")
    .select(CART_SELECT)
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return ensureArray(data);
}

export async function getCartCount() {
  const user = await getCurrentUserOrThrow();
  const { count, error } = await supabase
    .from("cart")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id);

  if (error) throw error;
  return count || 0;
}

export async function addToCart(item) {
  const user = await getCurrentUserOrThrow();

  if (!item?.id) {
    throw new Error("Item is required.");
  }

  if (item.user_id === user.id) {
    throw new Error("You cannot add your own item to cart.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("cart")
    .select("id")
    .eq("user_id", user.id)
    .eq("item_id", item.id)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return { added: false, message: "Item already in cart." };

  const { error } = await supabase
    .from("cart")
    .insert({ user_id: user.id, item_id: item.id });

  if (error) {
    throw new Error(normalizeError(error, "Unable to add item to cart."));
  }

  if (item.user_id && item.user_id !== user.id) {
    await createNotification({
      userId: item.user_id,
      title: "A buyer added your item to cart",
      message: `${item.title} was added to someone's cart.`,
      type: "cart",
      itemId: item.id,
    });
  }

  return { added: true, message: "Item added to cart." };
}

export async function removeFromCart(cartId) {
  const user = await getCurrentUserOrThrow();
  const { error } = await supabase
    .from("cart")
    .delete()
    .eq("id", cartId)
    .eq("user_id", user.id);

  if (error) throw error;
}

export async function clearCart(itemIds = []) {
  const user = await getCurrentUserOrThrow();
  let query = supabase.from("cart").delete().eq("user_id", user.id);

  if (itemIds.length > 0) {
    query = query.in("item_id", itemIds);
  }

  const { error } = await query;
  if (error) throw error;
}
