"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconBookmark } from "@/app/icons";
import { toggleSaveRecipe } from "@/app/cong-thuc/actions";

export default function SaveButton({
  recipeId,
  slug,
  initialSaved,
  isLoggedIn,
}: {
  recipeId: string;
  slug: string;
  initialSaved: boolean;
  isLoggedIn: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }

    setError(null);
    // Cập nhật lạc quan trước, revert lại nếu server báo lỗi.
    const next = !saved;
    setSaved(next);

    startTransition(async () => {
      const result = await toggleSaveRecipe(recipeId, slug);
      if (result.error) {
        setSaved(!next);
        setError(result.error);
      } else {
        setSaved(result.saved);
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-1.5">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        aria-pressed={saved}
        className={`inline-flex items-center gap-2 rounded-full px-5 py-3 text-[14.5px] font-bold transition-colors disabled:opacity-60 ${
          saved
            ? "bg-pink-500 text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)]"
            : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
        }`}
      >
        <IconBookmark className="h-4.5 w-4.5" filled={saved} />
        {saved ? "Đã lưu" : "Lưu công thức"}
      </button>
      {error && <span className="text-[12px] text-pink-600">{error}</span>}
    </div>
  );
}
