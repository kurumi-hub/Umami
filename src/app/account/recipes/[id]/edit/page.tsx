import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import EditRecipeForm from "./EditRecipeForm";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: recipe } = await supabase
    .from("recipes")
    .select(
      "id, author_id, title, description, prep_time_min, cook_time_min, servings, servings_unit, difficulty"
    )
    .eq("id", id)
    .maybeSingle();

  if (!recipe || recipe.author_id !== user.id) {
    notFound();
  }

  const [{ data: ingredientRows }, { data: stepRows }, { data: tagRows }, { data: tags }] =
    await Promise.all([
      supabase
        .from("recipe_ingredients")
        .select("quantity, unit, is_optional, position, ingredients(name)")
        .eq("recipe_id", id)
        .order("position", { ascending: true }),
      supabase
        .from("recipe_steps")
        .select("content, timer_seconds, position")
        .eq("recipe_id", id)
        .order("position", { ascending: true }),
      supabase.from("recipe_tags").select("tag_id").eq("recipe_id", id),
      supabase
        .from("tags")
        .select("id, type, name")
        .in("type", ["cuisine", "meal_type", "diet"])
        .order("type", { ascending: true })
        .order("position", { ascending: true })
        .limit(60),
    ]);

  const ingredients = (ingredientRows ?? []).map((row) => {
    const ing = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
    return {
      name: ing?.name ?? "",
      quantity: row.quantity,
      unit: row.unit,
      isOptional: row.is_optional,
    };
  });

  const steps = (stepRows ?? []).map((row) => ({
    content: row.content,
    timerSeconds: row.timer_seconds,
  }));

  const tagIds = (tagRows ?? []).map((row) => row.tag_id as string);

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[720px] mx-auto px-6 py-10 w-full">
        <Link
          href="/account/recipes"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về danh sách công thức
        </Link>

        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-8">
          Sửa công thức
        </h1>

        <EditRecipeForm
          recipeId={recipe.id}
          tags={tags ?? []}
          initialTitle={recipe.title}
          initialDescription={recipe.description ?? ""}
          initialPrepTime={recipe.prep_time_min}
          initialCookTime={recipe.cook_time_min}
          initialServings={recipe.servings}
          initialServingsUnit={recipe.servings_unit ?? "người ăn"}
          initialDifficulty={(recipe.difficulty as "easy" | "medium" | "hard") ?? "easy"}
          initialIngredients={ingredients}
          initialSteps={steps}
          initialTagIds={tagIds}
        />
      </div>
    </div>
  );
}
