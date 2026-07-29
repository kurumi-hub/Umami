"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCart, IconX } from "@/app/icons";
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
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [open]);

  function handleOpen() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setOpen(true);
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
    <>
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Thêm vào danh sách đi chợ"
        className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
          status === "added"
            ? "border-emerald-300 bg-emerald-50 text-emerald-600"
            : "border-pink-300 text-pink-600 hover:bg-pink-50"
        }`}
      >
        <IconCart className="h-[18px] w-[18px]" />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
              setOpen(false);
            }
          }}
        >
          <div
            ref={panelRef}
            className="w-full max-w-[300px] rounded-[24px] bg-surface p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]"
          >
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
        </div>
      )}
    </>
  );
}
