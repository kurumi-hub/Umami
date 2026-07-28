"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus, IconX } from "@/app/icons";
import { createCollection } from "@/app/account/actions";

export default function CollectionCreateForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await createCollection(name, description, isPublic);
      if (result.error) {
        setError(result.error);
      } else if (result.id) {
        setOpen(false);
        setName("");
        setDescription("");
        setIsPublic(false);
        router.push(`/account/collections/${result.id}`);
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-2 text-[13px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)]"
      >
        <IconPlus className="h-4 w-4" />
        Tạo bộ sưu tập
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-500/15 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-bold">Bộ sưu tập mới</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          aria-label="Đóng"
          className="text-ink-soft hover:text-pink-600"
        >
          <IconX className="h-4 w-4" />
        </button>
      </div>

      <label className="block text-left mb-3">
        <span className="text-[13px] font-semibold text-ink">Tên bộ sưu tập</span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="VD: Món cho bé, Ăn chay tuần..."
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      <label className="block text-left mb-3">
        <span className="text-[13px] font-semibold text-ink">Mô tả (không bắt buộc)</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      <label className="mb-3 flex items-center gap-2.5">
        <input
          type="checkbox"
          checked={isPublic}
          onChange={(e) => setIsPublic(e.target.checked)}
          className="h-4 w-4 rounded border-pink-300/70 text-pink-500 focus:ring-pink-500/40"
        />
        <span className="text-[13px] text-ink-soft">Công khai (ai có link cũng xem được)</span>
      </label>

      {error && <p className="mb-2 text-[12.5px] text-pink-600">{error}</p>}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending || !name.trim()}
        className="rounded-full bg-pink-500 px-5 py-2 text-[13.5px] font-bold text-white disabled:opacity-50"
      >
        {pending ? "Đang tạo..." : "Tạo bộ sưu tập"}
      </button>
    </div>
  );
}
