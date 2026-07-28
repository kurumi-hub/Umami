"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

const slots = ["breakfast", "lunch", "dinner", "snack", "dessert"] as const;
type Slot = (typeof slots)[number];

export async function addMealPlanEntry(
  recipeId: string,
  planDate: string,
  slot: Slot,
  servings: number | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { data, error } = await supabase
    .from("meal_plans")
    .insert({
      user_id: user.id,
      recipe_id: recipeId,
      plan_date: planDate,
      slot,
      servings,
    })
    .select("id")
    .single();

  if (error) {
    const msg =
      error.code === "23505"
        ? "Công thức này đã có trong bữa này rồi."
        : "Không thể thêm vào kế hoạch, thử lại sau.";
    return { error: msg, id: null };
  }

  revalidatePath("/account/meal-plan");
  return { error: null, id: data.id as string };
}

export async function removeMealPlanEntry(id: string) {
  const supabase = await createClient();

  const { error } = await supabase.from("meal_plans").delete().eq("id", id);

  if (error) {
    return { error: "Không thể xoá khỏi kế hoạch, thử lại sau." };
  }

  revalidatePath("/account/meal-plan");
  return { error: null };
}

export async function addWeekToShoppingList(startDate: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { data: entries, error: fetchError } = await supabase
    .from("meal_plans")
    .select("recipe_id, servings")
    .eq("user_id", user.id)
    .gte("plan_date", startDate)
    .lt(
      "plan_date",
      new Date(new Date(startDate).getTime() + 7 * 86400000)
        .toISOString()
        .slice(0, 10)
    );

  if (fetchError) {
    return { error: "Không thể đọc kế hoạch tuần, thử lại sau." };
  }
  if (!entries || entries.length === 0) {
    return { error: "Tuần này chưa có kế hoạch nào để gom nguyên liệu." };
  }

  let { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!list) {
    const { data: created, error: createError } = await supabase
      .from("shopping_lists")
      .insert({ user_id: user.id })
      .select("id")
      .single();
    if (createError) return { error: "Không thể tạo danh sách đi chợ." };
    list = created;
  }

  for (const entry of entries) {
    const { error } = await supabase.rpc("add_recipe_to_shopping_list", {
      p_recipe_id: entry.recipe_id,
      p_list_id: list.id,
      p_target_servings: entry.servings,
    });
    if (error) {
      return { error: "Có lỗi khi gom một vài nguyên liệu, thử lại sau." };
    }
  }

  revalidatePath("/account/shopping-list");
  return { error: null, count: entries.length };
}
