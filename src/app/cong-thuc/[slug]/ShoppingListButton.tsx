"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@/app/icons";
import { addToShoppingList } from "@/app/cong-thuc/actions";

export default function ShoppingListButton({
  recipeId,
  originalServings,
  isLoggedIn,
}: {
  recipeId: string;
  originalServings: number | null;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [servings, setServings] = useState(originalServings ?? 1);
  const [status, setStatus] = useState<"idle" | "added">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  function handleOpen() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setOpen((v) => !v);
  }

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result = await addToShoppingList(recipeId, servings);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("added");
        setOpen(false);
      }
    });
  }

  return (
    <div className="relative" ref={containerRef}>
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
      >
        {status === "added" ? "Đã thêm vào danh sách đi chợ" : "Thêm vào danh sách đi chợ"}
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[250px] rounded-2xl border border-pink-500/15 bg-surface p-4 shadow-[0_18px_40px_-16px_rgba(58,31,43,0.35)]">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-[13px] font-bold text-ink-soft">Số khẩu phần</span>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Đóng"
              className="text-ink-soft hover:text-pink-600"
            >
              <IconX className="h-4 w-4" />
            </button>
          </div>

          <div className="mb-4 flex items-center justify-center gap-3">
            <button
              type="button"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-pink-300 text-pink-600 font-bold"
              aria-label="Giảm khẩu phần"
            >
              −
            </button>
            <span className="min-w-[40px] text-center text-[16px] font-bold">
              {servings}
            </span>
            <button
              type="button"
              onClick={() => setServings((s) => s + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-pink-300 text-pink-600 font-bold"
              aria-label="Tăng khẩu phần"
            >
              +
            </button>
          </div>

          {originalServings && servings !== originalServings && (
            <p className="mb-3 text-[11.5px] text-ink-soft text-center">
              Số lượng nguyên liệu sẽ tự nhân/chia theo tỉ lệ so với công
              thức gốc ({originalServings} khẩu phần).
            </p>
          )}

          {error && <p className="mb-3 text-[12px] text-pink-600">{error}</p>}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={pending}
            className="w-full rounded-full bg-pink-500 px-5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
          >
            {pending ? "Đang thêm..." : "Thêm vào danh sách đi chợ"}
          </button>
        </div>
      )}
    </div>
  );
}
