import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import ShoppingListClient from "./ShoppingListClient";

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

  const { data: items } = list
    ? await supabase
        .from("shopping_list_items")
        .select(
          "id, quantity, unit, is_checked, custom_name, created_at, ingredients(name, aisle), recipes(title)"
        )
        .eq("list_id", list.id)
        .order("is_checked", { ascending: true })
        .order("created_at", { ascending: false })
    : { data: [] };

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
          Danh sách đi chợ
        </h1>

        <ShoppingListClient
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
        />
      </div>
    </div>
  );
}
