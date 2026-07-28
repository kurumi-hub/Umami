"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

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
