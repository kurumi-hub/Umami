"use client";

import { useState } from "react";
import ShoppingListClient from "./ShoppingListClient";
import PantryManager from "./PantryManager";

type ShoppingItem = {
  id: string;
  name: string;
  aisle: string | null;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  recipe_title: string | null;
};

type Ingredient = { id: string; name: string };

export default function ShoppingPantryTabs({
  initialItems,
  initialPantry,
}: {
  initialItems: ShoppingItem[];
  initialPantry: Ingredient[];
}) {
  const [tab, setTab] = useState<"shopping" | "pantry">("shopping");

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("shopping")}
          className={`rounded-full px-4 py-2 text-[13.5px] font-bold transition-colors ${
            tab === "shopping"
              ? "bg-pink-500 text-white"
              : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
          }`}
        >
          Đi chợ
        </button>
        <button
          type="button"
          onClick={() => setTab("pantry")}
          className={`rounded-full px-4 py-2 text-[13.5px] font-bold transition-colors ${
            tab === "pantry"
              ? "bg-pink-500 text-white"
              : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
          }`}
        >
          Tủ lạnh của tôi
        </button>
      </div>

      {tab === "shopping" ? (
        <ShoppingListClient initialItems={initialItems} />
      ) : (
        <PantryManager initialPantry={initialPantry} />
      )}
    </div>
  );
}
