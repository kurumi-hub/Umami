"use client";

import { useRef, useState, useTransition } from "react";
import Link from "next/link";
import { IconBowl, IconClock } from "@/app/icons";
import { reorderCollection } from "@/app/account/actions";
import RemoveRecipeButton from "./RemoveRecipeButton";

type Recipe = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  total_time_min: number | null;
  difficulty: string | null;
};

const diffLabels: Record<string, string> = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
};

function formatMinutes(min: number | null) {
  if (!min) return "—";
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}g ${m}p` : `${h} giờ`;
}

export default function ReorderableRecipeGrid({
  collectionId,
  initialRecipes,
}: {
  collectionId: string;
  initialRecipes: Recipe[];
}) {
  const [recipes, setRecipes] = useState(initialRecipes);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const dragIndex = useRef<number | null>(null);

  function handleDragStart(index: number) {
    dragIndex.current = index;
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault();
  }

  function handleDrop(targetIndex: number) {
    const from = dragIndex.current;
    dragIndex.current = null;
    if (from === null || from === targetIndex) return;

    const next = [...recipes];
    const [moved] = next.splice(from, 1);
    next.splice(targetIndex, 0, moved);
    setRecipes(next);
    setError(null);

    startTransition(async () => {
      const result = await reorderCollection(
        collectionId,
        next.map((r) => r.id)
      );
      if (result.error) {
        setRecipes(recipes);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <p className="mb-4 text-[12.5px] text-ink-soft">
        Kéo-thả để sắp xếp lại thứ tự công thức trong bộ sưu tập.
      </p>
      {error && <p className="mb-3 text-[12.5px] text-pink-600">{error}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
        {recipes.map((r, index) => (
          <div
            key={r.id}
            draggable
            onDragStart={() => handleDragStart(index)}
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(index)}
            className="relative bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 cursor-move transition-all hover:-translate-y-1 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)]"
          >
            <RemoveRecipeButton collectionId={collectionId} recipeId={r.id} />
            <Link href={`/cong-thuc/${r.slug}`} className="block">
              <div className="h-[150px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                <IconBowl className="w-14 h-14 text-pink-400" />
              </div>
              <div className="p-4">
                <h4 className="text-[15.5px] font-bold leading-snug line-clamp-2 min-h-[2.75em]">
                  {r.title}
                </h4>
                <div className="mt-3 flex items-center justify-between text-[12.5px] text-ink-soft">
                  <span className="flex items-center gap-1">
                    <IconClock className="w-3.5 h-3.5" />
                    {formatMinutes(r.total_time_min)}
                  </span>
                  {r.difficulty && (
                    <span>{diffLabels[r.difficulty] ?? r.difficulty}</span>
                  )}
                </div>
              </div>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
