import { supabase } from "../supabaseClient";
import { createNotification } from "./notifications";
import { getCurrentUserOrThrow } from "./supabaseHelpers";

/* ===========================
   UPLOAD IMAGE
=========================== */
export async function uploadItemImage(file) {
  if (!file) return null;

  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;

  const { error: uploadError } = await supabase.storage
    .from("items")
    .upload(fileName, file);

  if (uploadError) {
    console.error(uploadError);
    return { url: null, error: uploadError };
  }

  const { data } = supabase.storage.from("items").getPublicUrl(fileName);
  return { url: data.publicUrl, error: null };
}

/* ===========================
   ADD ITEM
=========================== */
export async function addItem(itemData) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: "Not logged in" } };
  }

  const { data, error } = await supabase
    .from("items")
    .insert([{ ...itemData, user_id: user.id, status: "active" }])
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

/* ===========================
   GET ALL ITEMS (Marketplace)
=========================== */
export async function getItems({
  search = "",
  category = "",
  condition = "",
  priceRange = "Any Price",
  sortBy = "Newest",
  page = 1,
  pageSize = 12,
} = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  let query = supabase
    .from("items")
    .select(`
      id,
      user_id,
      title,
      description,
      category,
      condition,
      brand,
      size,
      color,
      price,
      original_price,
      image_url,
      images,
      likes,
      views,
      status,
      created_at
    `, { count: "exact" })
    .eq("status", "active");

  if (search) query = query.or(`title.ilike.%${search}%,brand.ilike.%${search}%,category.ilike.%${search}%`);
  if (category && category !== "All Categories") query = query.eq("category", category);
  if (condition && condition !== "Any Condition") query = query.eq("condition", condition);
  if (priceRange === "Under Rs 50") query = query.lt("price", 50);
  if (priceRange === "Rs 50 - Rs 100") query = query.gte("price", 50).lte("price", 100);
  if (priceRange === "Rs 100 - Rs 200") query = query.gt("price", 100).lte("price", 200);
  if (priceRange === "Over Rs 200") query = query.gt("price", 200);

  if (sortBy === "Newest") query = query.order("created_at", { ascending: false });
  else if (sortBy === "Price: Low to High") query = query.order("price", { ascending: true });
  else if (sortBy === "Price: High to Low") query = query.order("price", { ascending: false });
  else if (sortBy === "Popular") query = query.order("likes", { ascending: false });

  const { data, error, count } = await query.range(from, to);
  if (error) {
    console.error(error);
    return { items: [], count: 0 };
  }

  const userIds = [...new Set((data || []).map((item) => item.user_id).filter(Boolean))];
  if (userIds.length === 0) {
    return { items: data || [], count: count || 0 };
  }

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .in("id", userIds);

  const profileMap = Object.fromEntries((profiles || []).map((profile) => [profile.id, profile]));

  return {
    items: (data || []).map((item) => ({
      ...item,
      profiles: profileMap[item.user_id] || null,
    })),
    count: count || 0,
  };
}

/* ===========================
   GET SINGLE ITEM BY ID
=========================== */
export async function getItemById(id) {
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("id", id)
    .single();

  if (error) { console.error(error); return null; }

  let profile = null;
  if (data?.user_id) {
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", data.user_id)
      .maybeSingle();
    profile = profileData || null;
  }

  // increment view count
  await supabase
    .from("items")
    .update({ views: (data.views || 0) + 1 })
    .eq("id", id);

  return { ...data, profiles: profile };
}

/* ===========================
   GET USER ITEMS (My Items page)
=========================== */
export async function getUserItems(user_id) {
  if (!user_id) {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data?.user) return [];
    user_id = data.user.id;
  }

  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", user_id)
    .order("created_at", { ascending: false });

  if (error) { console.error(error); return []; }
  return data;
}

/* ===========================
   DELETE ITEM
=========================== */
export async function deleteItem(itemId) {
  const user = await getCurrentUserOrThrow();
  const { error } = await supabase
    .from("items")
    .delete()
    .eq("id", itemId)
    .eq("user_id", user.id);

  if (error) return { error };
  return { error: null };
}

/* ===========================
   UPDATE ITEM STATUS
=========================== */
export async function updateItemStatus(itemId, status) {
  const user = await getCurrentUserOrThrow();
  const { data, error } = await supabase
    .from("items")
    .update({ status })
    .eq("id", itemId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) return { data: null, error };
  return { data, error: null };
}

/* ===========================
   TOGGLE WISHLIST
=========================== */
export async function toggleWishlist(itemId, userId) {
  try {
    const { data: existing } = await supabase
      .from("wishlist")
      .select("id")
      .eq("item_id", itemId)
      .eq("user_id", userId)
      .maybeSingle();

    if (existing) {
      await supabase.from("wishlist").delete().eq("id", existing.id);
      return false;
    } else {
      await supabase.from("wishlist").insert({ item_id: itemId, user_id: userId });

      // ✅ Notify item owner
      const { data: item } = await supabase
        .from("items")
        .select("title, user_id")
        .eq("id", itemId)
        .single();

      if (item && item.user_id !== userId) {
        await createNotification({
          userId: item.user_id,
          title: "Someone wishlisted your item",
          message: `Your item "${item.title}" was added to someone's wishlist.`,
          type: "wishlist",
          itemId,
        });
      }

      return true;
    }
  } catch {
    await supabase.from("wishlist").insert({ item_id: itemId, user_id: userId });
    return true;
  }
}

/* ===========================
   CHECK IF WISHLISTED
=========================== */
export async function isWishlisted(itemId, userId) {
  const { data } = await supabase
    .from("wishlist")
    .select("id")
    .eq("item_id", itemId)
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}

export async function toggleWishlistWithLiveCounts(itemId, userId) {
  const { data: itemRecord, error: itemError } = await supabase
    .from("items")
    .select("id, title, user_id, likes")
    .eq("id", itemId)
    .single();

  if (itemError) throw itemError;

  const { data: existing, error: existingError } = await supabase
    .from("wishlist")
    .select("id")
    .eq("item_id", itemId)
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError) throw existingError;

  if (existing) {
    const { error: deleteError } = await supabase.from("wishlist").delete().eq("id", existing.id);
    if (deleteError) throw deleteError;

    await supabase
      .from("items")
      .update({ likes: Math.max(0, Number(itemRecord.likes || 0) - 1) })
      .eq("id", itemId);

    return false;
  }

  const { error: insertError } = await supabase
    .from("wishlist")
    .insert({ item_id: itemId, user_id: userId });

  if (insertError) throw insertError;

  await supabase
    .from("items")
    .update({ likes: Number(itemRecord.likes || 0) + 1 })
    .eq("id", itemId);

  if (itemRecord.user_id !== userId) {
    try {
      await createNotification({
        userId: itemRecord.user_id,
        title: "Someone wishlisted your item",
        message: `Your item "${itemRecord.title}" was added to someone's wishlist.`,
        type: "wishlist",
        itemId,
      });
    } catch {
      // Keep wishlist actions responsive even if notifications fail.
    }
  }

  return true;
}

/* ===========================
   GET WISHLIST ITEMS
=========================== */
export async function getWishlist(userId, { page = 1, pageSize = 12 } = {}) {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  const { data, error, count } = await supabase
    .from("wishlist")
    .select(`
      id,
      item_id,
      created_at,
      items (
        id,
        title,
        image_url,
        price,
        category,
        condition,
        user_id
      )
    `, { count: "exact" })
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) { console.error(error); return { items: [], count: 0 }; }
  return { items: data || [], count: count || 0 };
}

/* ===========================
   🆕 FIND SIMILAR ITEMS (Duplicate Detection)
   
   This function searches for items that are similar to a new item
   being added to the wardrobe. It helps prevent duplicates by:
   
   1. Matching items in the same category
   2. Comparing item titles using fuzzy matching:
      - Exact match
      - Partial containment (one title contains the other)
      - Word overlap (at least 50% of words match)
   
   @param {string} title - The title of the new item
   @param {string} category - The category of the new item
   @param {string} userId - The user's ID
   @returns {Array} Array of similar items found in user's wardrobe
=========================== */
export async function findSimilarItems(title, category, userId) {
  if (!title || !category || !userId) return [];

  // Normalize title for comparison (lowercase and trim whitespace)
  const normalizedTitle = title.toLowerCase().trim();

  // Fetch all items from the same category for this user
  const { data, error } = await supabase
    .from("items")
    .select("*")
    .eq("user_id", userId)
    .eq("category", category)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching similar items:", error);
    return [];
  }

  // Filter items with similar titles using fuzzy matching
  const similarItems = data.filter(item => {
    const itemTitle = item.title.toLowerCase().trim();
    
    // Method 1: Exact match
    if (itemTitle === normalizedTitle) return true;
    
    // Method 2: One title contains the other
    // Example: "Blue Shirt" matches "Shirt" or "Blue Shirt Long Sleeve"
    if (itemTitle.includes(normalizedTitle) || normalizedTitle.includes(itemTitle)) {
      return true;
    }
    
    // Method 3: Word overlap similarity
    // Split titles into words and check how many words match
    const titleWords = normalizedTitle.split(/\s+/).filter(w => w.length > 0);
    const itemWords = itemTitle.split(/\s+/).filter(w => w.length > 0);
    
    // Count matching words
    const matchingWords = titleWords.filter(word => 
      itemWords.some(itemWord => itemWord.includes(word) || word.includes(itemWord))
    );
    
    // Calculate similarity percentage
    const maxWords = Math.max(titleWords.length, itemWords.length);
    const similarity = maxWords > 0 ? matchingWords.length / maxWords : 0;
    
    // Return true if at least 50% of words match
    return similarity >= 0.5;
  });

  return similarItems;
}
