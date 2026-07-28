import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import ShoppingPantryTabs from "./ShoppingPantryTabs";

export default async function ShoppingListPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: list } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  const [{ data: items }, { data: pantryRows }] = await Promise.all([
    list
      ? supabase
          .from("shopping_list_items")
          .select(
            "id, quantity, unit, is_checked, custom_name, created_at, ingredients(name, aisle), recipes(title)"
          )
          .eq("list_id", list.id)
          .order("is_checked", { ascending: true })
          .order("created_at", { ascending: false })
      : Promise.resolve({ data: [] }),
    supabase
      .from("user_pantry")
      .select("ingredient_id, quantity, unit, expires_on, ingredients(id, name)")
      .eq("user_id", user.id),
  ]);

  const pantry = (pantryRows ?? [])
    .map((row) => {
      const ingredient = Array.isArray(row.ingredients) ? row.ingredients[0] : row.ingredients;
      if (!ingredient) return null;
      return {
        id: ingredient.id,
        name: ingredient.name,
        quantity: row.quantity,
        unit: row.unit,
        expires_on: row.expires_on,
      };
    })
    .filter(Boolean) as { id: string; name: string; quantity: number | null; unit: string | null; expires_on: string | null }[];

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[720px] mx-auto px-6 py-10 w-full">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về trang Cá nhân
        </Link>

        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-6">
          Đi chợ &amp; Tủ lạnh
        </h1>

        <ShoppingPantryTabs
          initialItems={(items ?? []).map((it) => {
            const ingredient = Array.isArray(it.ingredients)
              ? it.ingredients[0]
              : it.ingredients;
            const recipe = Array.isArray(it.recipes) ? it.recipes[0] : it.recipes;
            return {
              id: it.id,
              name: it.custom_name || ingredient?.name || "Nguyên liệu",
              aisle: ingredient?.aisle ?? null,
              quantity: it.quantity,
              unit: it.unit,
              is_checked: it.is_checked,
              recipe_title: recipe?.title ?? null,
            };
          })}
          initialPantry={pantry}
        />
      </div>
    </div>
  );
}
