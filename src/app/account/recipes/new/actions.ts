"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

type IngredientInput = {
  name: string;
  quantity: number | null;
  unit: string | null;
  isOptional: boolean;
};

type StepInput = {
  content: string;
  timerSeconds: number | null;
};

export type NutritionInput = {
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  perServing: boolean;
} | null;

export type RecipePayload = {
  title: string;
  description: string;
  prepTimeMin: number | null;
  cookTimeMin: number | null;
  servings: number | null;
  servingsUnit: string;
  difficulty: "easy" | "medium" | "hard";
  ingredients: IngredientInput[];
  steps: StepInput[];
  tagIds: string[];
  nutrition: NutritionInput;
};

export async function createRecipe(payload: RecipePayload) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const title = payload.title.trim();
  if (title.length < 3) {
    return { error: "Tên công thức cần ít nhất 3 ký tự." };
  }

  const ingredients = payload.ingredients.filter((i) => i.name.trim());
  if (ingredients.length === 0) {
    return { error: "Cần ít nhất 1 nguyên liệu." };
  }

  const steps = payload.steps.filter((s) => s.content.trim());
  if (steps.length === 0) {
    return { error: "Cần ít nhất 1 bước thực hiện." };
  }

  // Tạo slug duy nhất — thử tối đa 3 lần, mỗi lần thêm hậu tố ngẫu nhiên
  // nếu bị trùng (unique constraint trên recipes.slug).
  const baseSlug = slugify(title) || "cong-thuc";
  let recipeId: string | null = null;
  let finalSlug = baseSlug;

  for (let attempt = 0; attempt < 3 && !recipeId; attempt++) {
    const candidateSlug =
      attempt === 0 ? baseSlug : `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;

    const totalTimeMin =
      (payload.prepTimeMin ?? 0) + (payload.cookTimeMin ?? 0) || null;

    const { data, error } = await supabase
      .from("recipes")
      .insert({
        author_id: user.id,
        title,
        slug: candidateSlug,
        description: payload.description.trim() || null,
        prep_time_min: payload.prepTimeMin,
        cook_time_min: payload.cookTimeMin,
        total_time_min: totalTimeMin,
        servings: payload.servings,
        servings_unit: payload.servingsUnit.trim() || null,
        difficulty: payload.difficulty,
        status: "published", // trigger tự hạ về pending_review nếu tác giả chưa trusted
      })
      .select("id, slug")
      .single();

    if (!error && data) {
      recipeId = data.id;
      finalSlug = data.slug;
    } else if (error && error.code !== "23505") {
      // TẠM THỜI: in lỗi Postgres thật ra để xác định nguyên nhân, thay
      // vì thông báo chung chung. Bỏ dòng debug này lại sau khi tìm ra
      // lỗi thật.
      return {
        error: `Không thể tạo công thức [debug: ${error.code} - ${error.message}]`,
      };
    }
  }

  if (!recipeId) {
    return { error: "Không thể tạo slug duy nhất, thử đổi tên công thức." };
  }

  // Nguyên liệu: tìm theo slug, chưa có thì tạo mới (RLS "insert ingredients"
  // đã cho phép user đã đăng nhập thêm nguyên liệu dùng chung).
  const ingredientRows: { id: string; position: number; item: IngredientInput }[] = [];

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    const ingSlug = slugify(ing.name);

    const { data: existing } = await supabase
      .from("ingredients")
      .select("id")
      .eq("slug", ingSlug)
      .maybeSingle();

    let ingredientId = existing?.id as string | undefined;

    if (!ingredientId) {
      const { data: created, error: createError } = await supabase
        .from("ingredients")
        .insert({ name: ing.name.trim(), slug: ingSlug })
        .select("id")
        .single();

      if (createError) {
        // Có thể bị đụng do người khác vừa tạo cùng lúc — thử lấy lại.
        const { data: retry } = await supabase
          .from("ingredients")
          .select("id")
          .eq("slug", ingSlug)
          .maybeSingle();
        if (!retry) {
          return { error: `Không thể tạo nguyên liệu "${ing.name}".` };
        }
        ingredientId = retry.id;
      } else {
        ingredientId = created.id;
      }
    }

    if (!ingredientId) {
      return { error: `Không thể xử lý nguyên liệu "${ing.name}".` };
    }

    ingredientRows.push({ id: ingredientId, position: i + 1, item: ing });
  }

  const { error: riError } = await supabase.from("recipe_ingredients").insert(
    ingredientRows.map((r) => ({
      recipe_id: recipeId,
      ingredient_id: r.id,
      quantity: r.item.quantity,
      unit: r.item.unit,
      is_optional: r.item.isOptional,
      position: r.position,
    }))
  );
  if (riError) {
    return { error: "Không thể lưu nguyên liệu, thử lại sau." };
  }

  const { error: stepError } = await supabase.from("recipe_steps").insert(
    steps.map((s, i) => ({
      recipe_id: recipeId,
      position: i + 1,
      content: s.content.trim(),
      timer_seconds: s.timerSeconds,
    }))
  );
  if (stepError) {
    return { error: "Không thể lưu các bước thực hiện, thử lại sau." };
  }

  if (payload.tagIds.length > 0) {
    const { error: tagError } = await supabase.from("recipe_tags").insert(
      payload.tagIds.map((tagId) => ({ recipe_id: recipeId, tag_id: tagId }))
    );
    if (tagError) {
      return { error: "Không thể lưu thẻ phân loại, thử lại sau." };
    }
  }

  if (payload.nutrition) {
    const n = payload.nutrition;
    const { error: nutritionError } = await supabase.from("recipe_nutrition").insert({
      recipe_id: recipeId,
      calories: n.calories,
      protein_g: n.proteinG,
      fat_g: n.fatG,
      carbs_g: n.carbsG,
      fiber_g: n.fiberG,
      sugar_g: n.sugarG,
      sodium_mg: n.sodiumMg,
      per_serving: n.perServing,
    });
    if (nutritionError) {
      return { error: "Không thể lưu thông tin dinh dưỡng, thử lại sau." };
    }
  }

  revalidatePath("/account/recipes");
  revalidatePath("/");
  redirect(`/cong-thuc/${finalSlug}`);
}
