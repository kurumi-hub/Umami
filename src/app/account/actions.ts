"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

// ---------------------------------------------------------------------
// Bộ sưu tập — RLS "own collections"/"own coll_items" đã cho phép CRUD
// trực tiếp trên bảng cho hàng của chính mình, nên không cần RPC riêng
// cho create/delete/update, chỉ dùng RPC có sẵn cho add/remove recipe.
// ---------------------------------------------------------------------

export async function createCollection(
  name: string,
  description: string,
  isPublic: boolean
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập.", id: null };
  if (!name.trim()) return { error: "Tên bộ sưu tập không được để trống.", id: null };

  const { data, error } = await supabase
    .from("collections")
    .insert({
      user_id: user.id,
      name: name.trim(),
      description: description.trim() || null,
      is_public: isPublic,
    })
    .select("id")
    .single();

  if (error) {
    const msg = error.code === "23505"
      ? "Bạn đã có bộ sưu tập trùng tên này rồi."
      : "Không thể tạo bộ sưu tập, thử lại sau.";
    return { error: msg, id: null };
  }

  revalidatePath("/account");
  return { error: null, id: data.id as string };
}

export async function deleteCollection(collectionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("collections")
    .delete()
    .eq("id", collectionId);

  if (error) {
    return { error: "Không thể xoá bộ sưu tập, thử lại sau." };
  }

  revalidatePath("/account");
  return { error: null };
}

export async function updateCollectionVisibility(
  collectionId: string,
  isPublic: boolean
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("collections")
    .update({ is_public: isPublic })
    .eq("id", collectionId);

  if (error) {
    return { error: "Không thể cập nhật, thử lại sau." };
  }

  revalidatePath(`/account/collections/${collectionId}`);
  return { error: null };
}

export async function updateCollectionDetails(
  collectionId: string,
  name: string,
  description: string
) {
  const supabase = await createClient();

  if (!name.trim()) {
    return { error: "Tên bộ sưu tập không được để trống." };
  }

  const { error } = await supabase
    .from("collections")
    .update({ name: name.trim(), description: description.trim() || null })
    .eq("id", collectionId);

  if (error) {
    const msg =
      error.code === "23505"
        ? "Bạn đã có bộ sưu tập trùng tên này rồi."
        : "Không thể lưu, thử lại sau.";
    return { error: msg };
  }

  revalidatePath(`/account/collections/${collectionId}`);
  revalidatePath("/account");
  return { error: null };
}

export async function reorderCollection(collectionId: string, recipeIds: string[]) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("reorder_collection", {
    p_collection_id: collectionId,
    p_recipe_ids: recipeIds,
  });

  if (error) {
    return { error: "Không thể lưu thứ tự mới, thử lại sau." };
  }

  revalidatePath(`/account/collections/${collectionId}`);
  return { error: null };
}

export async function toggleCollectionFollow(collectionId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập.", following: false };

  const { data: existing } = await supabase
    .from("collection_followers")
    .select("collection_id")
    .eq("collection_id", collectionId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("collection_followers")
      .delete()
      .eq("collection_id", collectionId)
      .eq("user_id", user.id);
    if (error) return { error: "Không thể bỏ theo dõi, thử lại sau.", following: true };
    revalidatePath(`/account/collections/${collectionId}`);
    revalidatePath("/bo-suu-tap");
    return { error: null, following: false };
  }

  const { error } = await supabase
    .from("collection_followers")
    .insert({ collection_id: collectionId, user_id: user.id });
  if (error) return { error: "Không thể theo dõi, thử lại sau.", following: false };
  revalidatePath(`/account/collections/${collectionId}`);
  revalidatePath("/bo-suu-tap");
  return { error: null, following: true };
}

export async function removeRecipeFromCollection(
  collectionId: string,
  recipeId: string
) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("remove_from_collection", {
    p_collection_id: collectionId,
    p_recipe_id: recipeId,
  });

  if (error) {
    return { error: "Không thể bỏ công thức khỏi bộ sưu tập." };
  }

  revalidatePath(`/account/collections/${collectionId}`);
  return { error: null };
}

// ---------------------------------------------------------------------
// Danh sách đi chợ — RLS "own lists"/"own list items" cho phép CRUD
// trực tiếp cho danh sách/mục của chính mình.
// ---------------------------------------------------------------------

async function getOrCreateMyListId(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string
) {
  const { data: existing } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (existing) return existing.id as string;

  const { data: created, error } = await supabase
    .from("shopping_lists")
    .insert({ user_id: userId })
    .select("id")
    .single();

  if (error) throw error;
  return created.id as string;
}

export async function toggleShoppingItem(itemId: string, nextChecked: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shopping_list_items")
    .update({ is_checked: nextChecked })
    .eq("id", itemId);

  if (error) {
    return { error: "Không thể cập nhật, thử lại sau." };
  }

  revalidatePath("/account/shopping-list");
  return { error: null };
}

export async function addCustomShoppingItem(name: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập.", item: null };
  if (!name.trim()) return { error: "Tên món không được để trống.", item: null };

  try {
    const listId = await getOrCreateMyListId(supabase, user.id);

    const { data, error } = await supabase
      .from("shopping_list_items")
      .insert({ list_id: listId, custom_name: name.trim() })
      .select("id, custom_name, quantity, unit, is_checked, created_at")
      .single();

    if (error) return { error: "Không thể thêm món, thử lại sau.", item: null };

    revalidatePath("/account/shopping-list");
    return { error: null, item: data };
  } catch {
    return { error: "Không thể tạo danh sách đi chợ, thử lại sau.", item: null };
  }
}

export async function removeShoppingItem(itemId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", itemId);

  if (error) {
    return { error: "Không thể xoá món, thử lại sau." };
  }

  revalidatePath("/account/shopping-list");
  return { error: null };
}

export async function clearCheckedItems() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { data: lists } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", user.id);

  const listIds = (lists ?? []).map((l) => l.id);
  if (listIds.length === 0) return { error: null };

  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .in("list_id", listIds)
    .eq("is_checked", true);

  if (error) {
    return { error: "Không thể xoá các món đã mua, thử lại sau." };
  }

  revalidatePath("/account/shopping-list");
  return { error: null };
}

// ---------------------------------------------------------------------
// Tủ lạnh của tôi (user_pantry) — RLS "own pantry" cho phép CRUD trực
// tiếp cho hàng của chính mình.
// ---------------------------------------------------------------------

export async function addPantryItem(
  ingredientId: string,
  quantity: number | null,
  unit: string | null,
  expiresOn: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase.from("user_pantry").upsert(
    {
      user_id: user.id,
      ingredient_id: ingredientId,
      quantity,
      unit,
      expires_on: expiresOn,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,ingredient_id" }
  );

  if (error) {
    return { error: "Không thể thêm vào tủ lạnh, thử lại sau." };
  }

  revalidatePath("/account/shopping-list");
  revalidatePath("/");
  return { error: null };
}

export async function removePantryItem(ingredientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase
    .from("user_pantry")
    .delete()
    .eq("user_id", user.id)
    .eq("ingredient_id", ingredientId);

  if (error) {
    return { error: "Không thể xoá, thử lại sau." };
  }

  revalidatePath("/account/shopping-list");
  revalidatePath("/");
  return { error: null };
}
