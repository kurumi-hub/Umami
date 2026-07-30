"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { IconX } from "@/app/icons";
import { adminDeleteRecipe, searchRecipeForDeletion } from "./actions";

type RecipeResult = {
  id: string;
  title: string;
  slug: string;
  status: string;
  created_at: string;
  author_name: string;
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}/${d.getFullYear()}`;
}

export default function DeleteRecipeForm() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<RecipeResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<RecipeResult | null>(null);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();
  const panelRef = useRef<HTMLDivElement>(null);

  let searchTimeout: ReturnType<typeof setTimeout>;

  useEffect(() => {
    if (!selected) return;
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") handleClose();
    }
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected]);

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(searchTimeout);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimeout = setTimeout(async () => {
      setSearching(true);
      const result = await searchRecipeForDeletion(value);
      setSearching(false);
      if (!result.error) setResults(result.recipes as RecipeResult[]);
    }, 300);
  }

  function handleClose() {
    setSelected(null);
    setReason("");
    setConfirmed(false);
    setError(null);
  }

  function handleDelete() {
    if (!selected) return;
    if (!confirmed) {
      setConfirmed(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await adminDeleteRecipe(selected.id, reason);
      if (result.error) {
        setError(result.error);
        setConfirmed(false);
      } else {
        setDone(true);
        setQuery("");
        setResults([]);
        handleClose();
      }
    });
  }

  return (
    <div className="rounded-2xl border border-pink-500/10 bg-surface p-5">
      <p className="mb-4 text-[12.5px] text-ink-soft">
        Xoá vĩnh viễn, không thể hoàn tác. Dữ liệu vẫn được lưu snapshot
        trong nhật ký hành động trước khi xoá.
      </p>

      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        placeholder="Tìm công thức theo tên..."
        className="w-full rounded-full border border-pink-300/70 bg-surface px-4 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
      />
      {searching && <p className="mt-2 text-[13px] text-ink-soft">Đang tìm...</p>}
      {!searching && results.length > 0 && (
        <div className="mt-2 flex flex-col gap-1.5">
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setSelected(r)}
              className="rounded-xl px-3 py-2 text-left text-[14px] hover:bg-pink-50"
            >
              <span className="block">
                {r.title}{" "}
                <span className="text-[11.5px] text-ink-soft">({r.status})</span>
              </span>
              <span className="text-[12px] text-ink-soft">
                Tác giả: {r.author_name} · Thêm ngày {formatDate(r.created_at)}
              </span>
            </button>
          ))}
        </div>
      )}

      {done && (
        <p className="mt-3 text-[12.5px] font-semibold text-emerald-700">
          Đã xoá công thức.
        </p>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 px-4"
          onClick={(e) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
              handleClose();
            }
          }}
        >
          <div
            ref={panelRef}
            className="w-full max-w-[380px] rounded-[24px] bg-surface p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[13px] font-bold text-ink-soft">
                Xoá vĩnh viễn công thức
              </span>
              <button
                type="button"
                onClick={handleClose}
                aria-label="Đóng"
                className="text-ink-soft hover:text-pink-600"
              >
                <IconX className="h-4 w-4" />
              </button>
            </div>

            <p className="mb-1 text-[14px] font-bold">{selected.title}</p>
            <p className="mb-4 text-[12.5px] text-ink-soft">
              Tác giả: {selected.author_name} · Thêm ngày{" "}
              {formatDate(selected.created_at)}
            </p>

            <label className="block mb-3">
              <span className="text-[12.5px] font-semibold text-ink-soft">
                Lý do xoá (bắt buộc)
              </span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                autoFocus
                className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
              />
            </label>

            {error && <p className="mb-3 text-[12.5px] text-pink-600">{error}</p>}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleDelete}
                disabled={pending || !reason.trim()}
                className={`rounded-full px-5 py-2 text-[13px] font-bold text-white disabled:opacity-50 ${
                  confirmed ? "bg-red-600" : "bg-pink-500"
                }`}
              >
                {pending
                  ? "Đang xoá..."
                  : confirmed
                  ? "Bấm lần nữa để xoá vĩnh viễn"
                  : "Xoá công thức"}
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rounded-full border-2 border-pink-300 px-5 py-2 text-[13px] font-bold text-pink-600"
              >
                Huỷ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
