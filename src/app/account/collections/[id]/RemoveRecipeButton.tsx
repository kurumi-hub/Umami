"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@/app/icons";
import { removeRecipeFromCollection } from "@/app/account/actions";

export default function RemoveRecipeButton({
  collectionId,
  recipeId,
}: {
  collectionId: string;
  recipeId: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await removeRecipeFromCollection(collectionId, recipeId);
      if (result.error) {
        setError(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="absolute top-3 left-3">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-label="Bỏ khỏi bộ sưu tập"
        className="flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-pink-600 shadow-sm disabled:opacity-60"
      >
        <IconX className="h-4 w-4" />
      </button>
      {error && (
        <span className="absolute top-9 left-0 w-[160px] text-[11px] text-pink-600">
          {error}
        </span>
      )}
    </div>
  );
}
