"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function updateProfile(
  displayName: string,
  username: string,
  bio: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const cleanUsername = username.trim().toLowerCase();
  if (!/^[a-z0-9_]{3,30}$/.test(cleanUsername)) {
    return {
      error: "Username cần 3-30 ký tự, chỉ gồm chữ thường, số và dấu gạch dưới.",
    };
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      display_name: displayName.trim() || null,
      username: cleanUsername,
      bio: bio.trim() || null,
    })
    .eq("id", user.id);

  if (error) {
    const msg =
      error.code === "23505"
        ? "Username này đã có người dùng."
        : "Không thể lưu hồ sơ, thử lại sau.";
    return { error: msg };
  }

  revalidatePath("/account");
  revalidatePath("/account/settings");
  return { error: null };
}

export async function updatePreferences(
  units: "metric" | "imperial",
  maxCookTimeMin: number | null,
  dietTagIds: string[]
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase.from("user_preferences").upsert(
    {
      user_id: user.id,
      units,
      max_cook_time_min: maxCookTimeMin,
      diet_tag_ids: dietTagIds,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { error: "Không thể lưu sở thích, thử lại sau." };
  }

  revalidatePath("/account/settings");
  return { error: null };
}

export async function searchIngredients(query: string) {
  const supabase = await createClient();
  const q = query.trim();
  if (q.length < 2) return { error: null, ingredients: [] };

  const { data, error } = await supabase
    .from("ingredients")
    .select("id, name")
    .ilike("name", `%${q}%`)
    .limit(8);

  if (error) {
    return { error: "Không thể tìm nguyên liệu.", ingredients: [] };
  }

  return { error: null, ingredients: data ?? [] };
}

export async function addAllergen(ingredientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase
    .from("user_allergens")
    .upsert(
      { user_id: user.id, ingredient_id: ingredientId },
      { onConflict: "user_id,ingredient_id" }
    );

  if (error) {
    return { error: "Không thể thêm dị ứng, thử lại sau." };
  }

  revalidatePath("/account/settings");
  return { error: null };
}

export async function removeAllergen(ingredientId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase
    .from("user_allergens")
    .delete()
    .eq("user_id", user.id)
    .eq("ingredient_id", ingredientId);

  if (error) {
    return { error: "Không thể xoá, thử lại sau." };
  }

  revalidatePath("/account/settings");
  return { error: null };
}
