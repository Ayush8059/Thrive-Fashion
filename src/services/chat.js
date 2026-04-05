import { supabase } from "../supabaseClient";
import { createNotification } from "./notifications";
import { getCurrentUserOrThrow } from "./supabaseHelpers";

export async function uploadChatAttachment(file, conversationId) {
  const user = await getCurrentUserOrThrow();
  if (!file) return null;

  const fileExt = file.name.split(".").pop() || "bin";
  const fileName = `${conversationId}/${user.id}/${Date.now()}-${Math.random()
    .toString(36)
    .slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("chat-attachments")
    .upload(fileName, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (uploadError) throw uploadError;

  return {
    path: fileName,
    type: file.type || "application/octet-stream",
    name: file.name,
  };
}

async function withSignedAttachmentUrl(message) {
  if (!message?.attachment_url) return message;

  if (/^https?:\/\//i.test(message.attachment_url)) {
    return message;
  }

  const { data, error } = await supabase.storage
    .from("chat-attachments")
    .createSignedUrl(message.attachment_url, 60 * 60);

  if (error) {
    return {
      ...message,
      attachment_signed_url: null,
    };
  }

  return {
    ...message,
    attachment_signed_url: data?.signedUrl || null,
  };
}

export async function getUserConversations({ page = 1, pageSize = 10 } = {}) {
  const user = await getCurrentUserOrThrow();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("conversations")
    .select(`
      id,
      item_id,
      buyer_id,
      seller_id,
      created_at,
      buyer:profiles!conversations_buyer_id_fkey (
        id,
        full_name,
        email
      ),
      seller:profiles!conversations_seller_id_fkey (
        id,
        full_name,
        email
      ),
      item:items (
        id,
        title,
        image_url,
        price,
        user_id
      ),
      messages (
        id,
        sender_id,
        message,
        is_read,
        created_at
      )
    `, { count: "exact" })
    .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;
  return {
    conversations: (data || []).map((conversation) => ({
      ...conversation,
      messages: [...(conversation.messages || [])].sort(
        (a, b) => new Date(a.created_at) - new Date(b.created_at)
      ),
    })),
    count: count || 0,
  };
}

export async function getOrCreateConversation({ itemId, sellerId }) {
  const user = await getCurrentUserOrThrow();

  if (!itemId || !sellerId) {
    throw new Error("Conversation details are missing.");
  }

  if (sellerId === user.id) {
    throw new Error("You cannot message yourself.");
  }

  const { data: existing, error: existingError } = await supabase
    .from("conversations")
    .select("id")
    .eq("item_id", itemId)
    .eq("buyer_id", user.id)
    .eq("seller_id", sellerId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("conversations")
    .insert({
      item_id: itemId,
      buyer_id: user.id,
      seller_id: sellerId,
    })
    .select("id")
    .single();

  if (error) throw error;
  return data.id;
}

export async function getMessages(conversationId, { page = 1, pageSize = 20 } = {}) {
  const user = await getCurrentUserOrThrow();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("messages")
    .select(`
      id,
      conversation_id,
      sender_id,
      message,
      attachment_url,
      attachment_type,
      attachment_name,
      is_read,
      created_at
    `, { count: "exact" })
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) throw error;

  const normalizedMessages = [...(data || [])].reverse();
  const resolvedMessages = await Promise.all(normalizedMessages.map(withSignedAttachmentUrl));

  const unreadIds = resolvedMessages
    .filter((message) => message.sender_id !== user.id && !message.is_read)
    .map((message) => message.id);

  if (unreadIds.length > 0) {
    await supabase.from("messages").update({ is_read: true }).in("id", unreadIds);
  }

  return {
    messages: resolvedMessages,
    count: count || 0,
  };
}

export async function sendMessage({ conversationId, recipientId, message, attachment = null }) {
  const user = await getCurrentUserOrThrow();
  const cleanMessage = message.trim();
  const uploadedAttachment = attachment
    ? await uploadChatAttachment(attachment, conversationId)
    : null;

  if (!cleanMessage && !uploadedAttachment) {
    throw new Error("Message cannot be empty.");
  }

  const { data, error } = await supabase
    .from("messages")
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message: cleanMessage || `Sent an attachment: ${uploadedAttachment?.name || "file"}`,
      attachment_url: uploadedAttachment?.path || null,
      attachment_type: uploadedAttachment?.type || null,
      attachment_name: uploadedAttachment?.name || null,
      is_read: false,
    })
    .select(`
      id,
      conversation_id,
      sender_id,
      message,
      attachment_url,
      attachment_type,
      attachment_name,
      is_read,
      created_at
    `)
    .single();

  if (error) throw error;
  if (recipientId && recipientId !== user.id) {
    try {
      await createNotification({
        userId: recipientId,
        title: "New message received",
        message: cleanMessage.length > 80 ? `${cleanMessage.slice(0, 77)}...` : cleanMessage,
        type: "message",
      });
    } catch {
      // Keep chat delivery resilient even if notification creation fails.
    }
  }

  return withSignedAttachmentUrl(data);
}
