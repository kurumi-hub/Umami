"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconTrash } from "@/app/icons";
import { deleteRecipe } from "@/app/account/recipes/[id]/edit/actions";

export default function DeleteRecipeButton({ recipeId }: { recipeId: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await deleteRecipe(recipeId);
      if (result.error) {
        setError(result.error);
        setConfirmDelete(false);
      } else {
        router.push("/account/recipes");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${
          confirmDelete
            ? "bg-pink-500 text-white"
            : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
        }`}
      >
        <IconTrash className="h-4 w-4" />
        {confirmDelete ? "Bấm lần nữa để xoá" : "Xoá công thức"}
      </button>
      {error && <span className="text-[12px] text-pink-600">{error}</span>}
    </div>
  );
}
