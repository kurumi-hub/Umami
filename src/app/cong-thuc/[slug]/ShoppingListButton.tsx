"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addToShoppingList } from "@/app/cong-thuc/actions";

export default function ShoppingListButton({
  recipeId,
  isLoggedIn,
}: {
  recipeId: string;
  isLoggedIn: boolean;
}) {
  const [status, setStatus] = useState<"idle" | "added">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await addToShoppingList(recipeId);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("added");
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-60"
      >
        {status === "added" ? "Đã thêm vào danh sách đi chợ" : "Thêm vào danh sách đi chợ"}
      </button>
      {error && <span className="text-[12px] text-pink-600">{error}</span>}
    </div>
  );
}
