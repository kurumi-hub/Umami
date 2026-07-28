"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconBowl, IconPlus, IconSearch, IconX } from "@/app/icons";
import { toggleCollectionRecipe } from "@/app/cong-thuc/actions";

type Candidate = {
  id: string;
  title: string;
  slug: string;
  source: "mine" | "saved";
  in_collection: boolean;
};

export default function AddRecipesPanel({
  collectionId,
  candidates,
}: {
  collectionId: string;
  candidates: Candidate[];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates;
    return candidates.filter((c) => c.title.toLowerCase().includes(q));
  }, [candidates, query]);

  function isIn(c: Candidate) {
    return overrides[c.id] ?? c.in_collection;
  }

  function handleToggle(c: Candidate) {
    const next = !isIn(c);
    setError(null);
    setOverrides((prev) => ({ ...prev, [c.id]: next }));

    startTransition(async () => {
      const result = await toggleCollectionRecipe(collectionId, c.id, !next, c.slug);
      if (result.error) {
        setOverrides((prev) => ({ ...prev, [c.id]: !next }));
        setError(result.error);
      }
    });
  }

  function handleClose() {
    setOpen(false);
    router.refresh();
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-2 text-[13px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)]"
      >
        <IconPlus className="h-4 w-4" />
        Thêm công thức
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-16 pb-8 overflow-y-auto">
      <div className="w-full max-w-[480px] rounded-[24px] bg-surface p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[16px] font-bold">Thêm công thức vào bộ sưu tập</h3>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Đóng"
            className="text-ink-soft hover:text-pink-600"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        <label className="relative mb-4 block">
          <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm trong công thức của bạn và đã lưu..."
            autoFocus
            className="w-full rounded-full border border-pink-300/70 bg-surface pl-10 pr-4 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
          />
        </label>

        {error && <p className="mb-3 text-[12.5px] text-pink-600">{error}</p>}

        <div className="max-h-[420px] overflow-y-auto flex flex-col gap-1.5">
          {filtered.length === 0 ? (
            <p className="py-6 text-center text-[13.5px] text-ink-soft">
              Không tìm thấy công thức nào phù hợp.
            </p>
          ) : (
            filtered.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-pink-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={isIn(c)}
                  disabled={pending}
                  onChange={() => handleToggle(c)}
                  className="h-4.5 w-4.5 shrink-0 rounded border-pink-300/70 text-pink-500 focus:ring-pink-500/40"
                />
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100">
                  <IconBowl className="h-4 w-4 text-pink-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-semibold truncate">
                    {c.title}
                  </span>
                  <span className="text-[11px] text-ink-soft">
                    {c.source === "mine" ? "Của bạn" : "Đã lưu"}
                  </span>
                </div>
              </label>
            ))
          )}
        </div>

        <button
          type="button"
          onClick={handleClose}
          className="mt-4 w-full rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white"
        >
          Xong
        </button>
      </div>
    </div>
  );
}
