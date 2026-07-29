"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function requireLogin(user: unknown) {
  if (!user) return { error: "Cần đăng nhập để thực hiện thao tác này." };
  return null;
}

export async function approveRecipe(recipeId: string, trustAuthor: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("mod_approve_recipe", {
    p_recipe_id: recipeId,
    p_trust_author: trustAuthor,
  });

  if (error) {
    return { error: error.message || "Không thể duyệt bài, thử lại sau." };
  }

  revalidatePath("/mod");
  revalidatePath("/cong-thuc/[slug]", "page");
  return { error: null };
}

export async function rejectRecipe(recipeId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  if (!reason.trim()) {
    return { error: "Phải nêu lý do từ chối." };
  }

  const { error } = await supabase.rpc("mod_reject_recipe", {
    p_recipe_id: recipeId,
    p_reason: reason.trim(),
  });

  if (error) {
    return { error: error.message || "Không thể từ chối bài, thử lại sau." };
  }

  revalidatePath("/mod");
  revalidatePath("/cong-thuc/[slug]", "page");
  return { error: null };
}
