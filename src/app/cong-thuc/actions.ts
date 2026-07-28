"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function requireLogin(user: unknown) {
  if (!user) return { error: "Cần đăng nhập để thực hiện thao tác này." };
  return null;
}

export async function toggleSaveRecipe(recipeId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Cần đăng nhập để lưu công thức.", saved: false };
  }

  const { data, error } = await supabase.rpc("toggle_save_recipe", {
    p_recipe_id: recipeId,
  });

  if (error) {
    return { error: "Không thể lưu công thức, thử lại sau.", saved: false };
  }

  revalidatePath(`/cong-thuc/${slug}`);
  return { error: null, saved: Boolean(data) };
}

export async function rateRecipe(recipeId: string, slug: string, rating: number) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("rate_recipe", {
    p_recipe_id: recipeId,
    p_rating: rating,
  });

  if (error) {
    return { error: "Không thể gửi đánh giá, thử lại sau." };
  }

  revalidatePath(`/cong-thuc/${slug}`);
  return { error: null };
}

export async function addRecipeTip(recipeId: string, slug: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return { ...guard, tip: null };

  const { data, error } = await supabase.rpc("add_recipe_tip", {
    p_recipe_id: recipeId,
    p_body: body,
  });

  if (error) {
    return { error: "Không thể đăng bình luận, thử lại sau.", tip: null };
  }

  revalidatePath(`/cong-thuc/${slug}`);
  return { error: null, tip: data };
}

export async function toggleTipLike(tipId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return { ...guard, liked: false };

  const { data, error } = await supabase.rpc("toggle_tip_like", {
    p_tip_id: tipId,
  });

  if (error) {
    return { error: "Không thể thích bình luận, thử lại sau.", liked: false };
  }

  revalidatePath(`/cong-thuc/${slug}`);
  return { error: null, liked: Boolean(data) };
}

export async function addTipReply(tipId: string, slug: string, body: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return { ...guard, reply: null };

  const { data, error } = await supabase.rpc("add_tip_reply", {
    p_tip_id: tipId,
    p_body: body,
  });

  if (error) {
    return { error: "Không thể gửi trả lời, thử lại sau.", reply: null };
  }

  revalidatePath(`/cong-thuc/${slug}`);
  return { error: null, reply: data };
}

export async function getTipReplies(tipId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_tip_replies", {
    p_tip_id: tipId,
  });

  if (error) {
    return { error: "Không thể tải trả lời.", replies: [] };
  }

  return { error: null, replies: data ?? [] };
}

export async function reportContent(
  targetType: "recipe" | "tip" | "reply" | "profile" | "collection",
  targetId: string,
  reason: "spam" | "inappropriate" | "copyright" | "dangerous" | "harassment" | "other",
  detail?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("report_content", {
    p_target_type: targetType,
    p_target_id: targetId,
    p_reason: reason,
    p_detail: detail ?? null,
  });

  if (error) {
    return { error: "Không thể gửi báo cáo, thử lại sau." };
  }

  return { error: null };
}

export async function addToShoppingList(recipeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("add_recipe_to_my_shopping_list", {
    p_recipe_id: recipeId,
  });

  if (error) {
    return { error: "Không thể thêm vào danh sách đi chợ, thử lại sau." };
  }

  return { error: null };
}

export async function toggleFollowAuthor(authorId: string, slug: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return { ...guard, state: null as string | null };

  const { data, error } = await supabase.rpc("toggle_follow", {
    p_user_id: authorId,
  });

  if (error) {
    return { error: "Không thể theo dõi, thử lại sau.", state: null as string | null };
  }

  revalidatePath(`/cong-thuc/${slug}`);
  return { error: null, state: data as string | null };
}

export async function getMyCollectionsForRecipe(recipeId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("my_collections_for_recipe", {
    p_recipe_id: recipeId,
  });

  if (error) {
    return { error: "Không thể tải bộ sưu tập.", collections: [] };
  }

  return { error: null, collections: data ?? [] };
}

export async function toggleCollectionRecipe(
  collectionId: string,
  recipeId: string,
  contains: boolean,
  slug: string
) {
  const supabase = await createClient();

  const { error } = contains
    ? await supabase.rpc("remove_from_collection", {
        p_collection_id: collectionId,
        p_recipe_id: recipeId,
      })
    : await supabase.rpc("add_to_collection", {
        p_collection_id: collectionId,
        p_recipe_id: recipeId,
      });

  if (error) {
    return { error: "Không thể cập nhật bộ sưu tập, thử lại sau." };
  }

  revalidatePath(`/cong-thuc/${slug}`);
  return { error: null };
}
