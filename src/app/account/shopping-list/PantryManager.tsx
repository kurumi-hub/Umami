"use client";

import { useState, useTransition } from "react";
import { IconX } from "@/app/icons";
import { searchIngredients } from "@/app/account/settings/actions";
import { addPantryItem, removePantryItem } from "@/app/account/actions";

type Ingredient = { id: string; name: string };

export default function PantryManager({
  initialPantry,
}: {
  initialPantry: Ingredient[];
}) {
  const [pantry, setPantry] = useState(initialPantry);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  let searchTimeout: ReturnType<typeof setTimeout>;

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(searchTimeout);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimeout = setTimeout(async () => {
      setSearching(true);
      const result = await searchIngredients(value);
      setSearching(false);
      if (!result.error) {
        setResults(
          (result.ingredients as Ingredient[]).filter(
            (ing) => !pantry.some((p) => p.id === ing.id)
          )
        );
      }
    }, 300);
  }

  function handleAdd(ing: Ingredient) {
    setError(null);
    setResults((prev) => prev.filter((r) => r.id !== ing.id));
    setPantry((prev) => [...prev, ing]);
    setQuery("");
    startTransition(async () => {
      const result = await addPantryItem(ing.id);
      if (result.error) {
        setError(result.error);
        setPantry((prev) => prev.filter((p) => p.id !== ing.id));
      }
    });
  }

  function handleRemove(ing: Ingredient) {
    setError(null);
    const prev = pantry;
    setPantry((cur) => cur.filter((p) => p.id !== ing.id));
    startTransition(async () => {
      const result = await removePantryItem(ing.id);
      if (result.error) {
        setError(result.error);
        setPantry(prev);
      }
    });
  }

  return (
    <div>
      <p className="mb-4 text-[13.5px] text-ink-soft leading-relaxed">
        Nguyên liệu bạn thêm ở đây sẽ được dùng để gợi ý công thức &quot;Từ
        tủ lạnh của bạn&quot; ở trang chủ, và tô xanh &quot;Có sẵn&quot; khi
        xem nguyên liệu ở trang chi tiết công thức.
      </p>

      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Tìm nguyên liệu bạn đang có (vd: trứng, hành tây...)"
          className="w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
        {(searching || results.length > 0) && (
          <div className="absolute left-0 right-0 z-10 mt-1.5 rounded-xl border border-pink-500/15 bg-surface shadow-[0_14px_30px_-16px_rgba(58,31,43,0.3)]">
            {searching && (
              <p className="px-3.5 py-2.5 text-[13px] text-ink-soft">Đang tìm...</p>
            )}
            {!searching &&
              results.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => handleAdd(ing)}
                  className="block w-full px-3.5 py-2.5 text-left text-[14px] hover:bg-pink-50 transition-colors"
                >
                  {ing.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {error && <p className="mb-3 text-[12.5px] text-pink-600">{error}</p>}

      {pantry.length === 0 ? (
        <p className="text-[13.5px] text-ink-soft">
          Tủ lạnh của bạn đang trống. Thêm nguyên liệu để nhận gợi ý công
          thức phù hợp hơn.
        </p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {pantry.map((ing) => (
            <span
              key={ing.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-mint/20 px-3 py-1.5 text-[13px] font-semibold text-emerald-700"
            >
              {ing.name}
              <button
                type="button"
                onClick={() => handleRemove(ing)}
                disabled={pending}
                aria-label={`Xoá ${ing.name} khỏi tủ lạnh`}
                className="disabled:opacity-50"
              >
                <IconX className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
