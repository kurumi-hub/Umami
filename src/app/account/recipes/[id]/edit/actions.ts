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

export type RecipeEditPayload = {
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
};

export async function updateRecipe(recipeId: string, payload: RecipeEditPayload) {
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

  // Xác nhận đây đúng là công thức của mình trước khi sửa (RLS cũng đã
  // chặn ở tầng DB, đây là lớp kiểm tra sớm để báo lỗi rõ ràng hơn).
  const { data: existing } = await supabase
    .from("recipes")
    .select("id, slug, author_id")
    .eq("id", recipeId)
    .maybeSingle();

  if (!existing || existing.author_id !== user.id) {
    return { error: "Không tìm thấy công thức hoặc bạn không có quyền sửa." };
  }

  const totalTimeMin = (payload.prepTimeMin ?? 0) + (payload.cookTimeMin ?? 0) || null;

  const { error: updateError } = await supabase
    .from("recipes")
    .update({
      title,
      description: payload.description.trim() || null,
      prep_time_min: payload.prepTimeMin,
      cook_time_min: payload.cookTimeMin,
      total_time_min: totalTimeMin,
      servings: payload.servings,
      servings_unit: payload.servingsUnit.trim() || null,
      difficulty: payload.difficulty,
    })
    .eq("id", recipeId);

  if (updateError) {
    return { error: "Không thể lưu thay đổi, thử lại sau." };
  }

  // Nguyên liệu: tìm-hoặc-tạo theo slug (giống logic khi đăng công thức
  // mới), rồi xoá hết dòng cũ và chèn lại toàn bộ — đơn giản hơn nhiều
  // so với so khớp từng dòng đã đổi/thêm/xoá.
  const ingredientRows: { id: string; position: number; item: IngredientInput }[] = [];

  for (let i = 0; i < ingredients.length; i++) {
    const ing = ingredients[i];
    const ingSlug = slugify(ing.name);

    const { data: found } = await supabase
      .from("ingredients")
      .select("id")
      .eq("slug", ingSlug)
      .maybeSingle();

    let ingredientId = found?.id as string | undefined;

    if (!ingredientId) {
      const { data: created, error: createError } = await supabase
        .from("ingredients")
        .insert({ name: ing.name.trim(), slug: ingSlug })
        .select("id")
        .single();

      if (createError) {
        const { data: retry } = await supabase
          .from("ingredients")
          .select("id")
          .eq("slug", ingSlug)
          .maybeSingle();
        if (!retry) {
          return { error: `Không thể xử lý nguyên liệu "${ing.name}".` };
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

  await supabase.from("recipe_ingredients").delete().eq("recipe_id", recipeId);
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

  await supabase.from("recipe_steps").delete().eq("recipe_id", recipeId);
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

  await supabase.from("recipe_tags").delete().eq("recipe_id", recipeId);
  if (payload.tagIds.length > 0) {
    const { error: tagError } = await supabase
      .from("recipe_tags")
      .insert(payload.tagIds.map((tagId) => ({ recipe_id: recipeId, tag_id: tagId })));
    if (tagError) {
      return { error: "Không thể lưu thẻ phân loại, thử lại sau." };
    }
  }

  revalidatePath(`/cong-thuc/${existing.slug}`);
  revalidatePath("/account/recipes");
  redirect(`/cong-thuc/${existing.slug}`);
}

export async function deleteRecipe(recipeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase
    .from("recipes")
    .delete()
    .eq("id", recipeId)
    .eq("author_id", user.id);

  if (error) {
    return { error: "Không thể xoá công thức, thử lại sau." };
  }

  revalidatePath("/account/recipes");
  revalidatePath("/account");
  return { error: null };
}
