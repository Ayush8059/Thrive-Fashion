import { supabase } from "../supabaseClient";

/* ===========================
   GET NOTIFICATIONS
=========================== */
export async function getNotifications(userId, { page = 1, pageSize = 20 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("notifications")
    .select("id, title, message, type, item_id, order_id, conversation_id, is_read, created_at", { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) { console.error(error); return { notifications: [], count: 0 }; }
  return { notifications: data || [], count: count || 0 };
}

/* ===========================
   MARK AS READ
=========================== */
export async function markNotificationRead(id) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", id);

  return { error };
}

/* ===========================
   MARK ALL AS READ
=========================== */
export async function markAllNotificationsRead(userId) {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  return { error };
}

/* ===========================
   CREATE NOTIFICATION
=========================== */
export async function createNotification({ userId, title, message, type = "info", itemId = null }) {
  const { error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      title,
      message,
      type,
      item_id: itemId,
      is_read: false,
    });

  if (error) console.error("Notification error:", error);
  return { error };
}

/* ===========================
   DELETE NOTIFICATION
=========================== */
export async function deleteNotification(id) {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id);

  return { error };
}
