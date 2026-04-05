import { supabase } from "../supabaseClient";
import { getCurrentUserOrThrow } from "./supabaseHelpers";

const ORDER_SELECT = `
  id,
  buyer_id,
  total_amount,
  status,
  created_at,
  shipping_method,
  shipping_address,
  buyer:profiles!orders_buyer_id_fkey (
    id,
    full_name,
    email
  ),
  order_items (
    id,
    item_id,
    seller_id,
    price,
    status,
    item:items (
      id,
      title,
      image_url,
      category,
      condition
    ),
    seller:profiles!order_items_seller_id_fkey (
      id,
      full_name,
      email
    )
  )
`;

export async function createOrderFromCart({
  shippingMethod = "pickup",
  shippingAddress = "",
} = {}) {
  await getCurrentUserOrThrow();
  const { data, error } = await supabase.rpc("checkout_cart", {
    p_shipping_method: shippingMethod,
    p_shipping_address: shippingAddress.trim() || null,
  });

  if (error) throw error;
  if (!data) {
    throw new Error("Checkout failed. No order was created.");
  }

  return data;
}

export async function getBuyerOrders({ page = 1, pageSize = 8 } = {}) {
  const user = await getCurrentUserOrThrow();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("orders")
    .select(ORDER_SELECT, { count: "exact" })
    .eq("buyer_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { orders: data || [], count: count || 0 };
}

export async function getSellerOrders({ page = 1, pageSize = 8 } = {}) {
  const user = await getCurrentUserOrThrow();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("order_items")
    .select(`
      id,
      order_id,
      item_id,
      seller_id,
      price,
      status,
      created_at,
      order:orders (
        id,
        buyer_id,
        status,
        created_at,
        shipping_method,
        buyer:profiles!orders_buyer_id_fkey (
          id,
          full_name,
          email
        )
      ),
      item:items (
        id,
        title,
        image_url,
        category,
        condition
      )
    `, { count: "exact" })
    .eq("seller_id", user.id)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return { sales: data || [], count: count || 0 };
}

export async function getOrderById(orderId) {
  const user = await getCurrentUserOrThrow();
  const { data, error } = await supabase
    .from("orders")
    .select(ORDER_SELECT)
    .eq("id", orderId)
    .or(`buyer_id.eq.${user.id}`)
    .single();

  if (error) throw error;
  return data;
}
