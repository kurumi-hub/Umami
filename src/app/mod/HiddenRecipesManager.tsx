"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { IconEye, IconSearch } from "@/app/icons";
import { searchHiddenRecipes, unhideRecipe } from "./actions";

type HiddenRecipe = {
  recipe_id: string;
  title: string;
  slug: string;
  created_at: string;
  author_name: string | null;
  author_username: string | null;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

export default function HiddenRecipesManager() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<HiddenRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedOnce, setLoadedOnce] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    const t = setTimeout(async () => {
      setLoading(true);
      const result = await searchHiddenRecipes(query);
      setLoading(false);
      setLoadedOnce(true);
      if (result.error) setError(result.error);
      else {
        setError(null);
        setRecipes(result.recipes as HiddenRecipe[]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function handleUnhide(r: HiddenRecipe) {
    setError(null);
    const prev = recipes;
    setRecipes((cur) => cur.filter((x) => x.recipe_id !== r.recipe_id));
    startTransition(async () => {
      const result = await unhideRecipe(r.recipe_id);
      if (result.error) {
        setError(result.error);
        setRecipes(prev);
      }
    });
  }

  return (
    <div className="rounded-[20px] border border-pink-100 bg-surface px-5 py-4">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100">
          <IconEye className="h-4 w-4 text-pink-500" />
        </div>
        <h2 className="font-display font-extrabold text-[17px]">Công thức đã ẩn</h2>
      </div>

      <div className="relative mb-3">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm theo tên (để trống để xem tất cả)..."
          className="w-full rounded-full border border-pink-200 bg-transparent py-2 pl-9 pr-3 text-[13.5px] outline-none focus:border-pink-400"
        />
      </div>

      {error && <p className="mb-2 text-[12.5px] text-pink-600">{error}</p>}
      {loading && <p className="text-[13px] text-ink-soft">Đang tải...</p>}

      {!loading && loadedOnce && recipes.length === 0 && (
        <p className="text-[13px] text-ink-soft">Không có công thức nào đang bị ẩn.</p>
      )}

      <ul className="flex flex-col gap-2">
        {recipes.map((r) => (
          <li
            key={r.recipe_id}
            className="flex items-center justify-between gap-2 rounded-[14px] border border-pink-100 px-3.5 py-2.5"
          >
            <div className="min-w-0 flex-1">
              <Link
                href={`/cong-thuc/${r.slug}`}
                target="_blank"
                className="block truncate text-[13.5px] font-semibold hover:text-pink-600 transition-colors"
              >
                {r.title}
              </Link>
              <span className="text-[11.5px] text-ink-soft">
                {r.author_name || r.author_username || "Không rõ"} · Thêm ngày{" "}
                {formatDate(r.created_at)}
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleUnhide(r)}
              disabled={pending}
              className="shrink-0 rounded-full border-2 border-pink-300 px-3 py-1 text-[12px] font-bold text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-60"
            >
              Hiện lại
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
