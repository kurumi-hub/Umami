"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconX } from "@/app/icons";
import { updateCollectionDetails } from "@/app/account/actions";

export default function EditCollectionForm({
  collectionId,
  initialName,
  initialDescription,
}: {
  collectionId: string;
  initialName: string;
  initialDescription: string;
}) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const result = await updateCollectionDetails(collectionId, name, description);
      if (result.error) {
        setError(result.error);
      } else {
        setEditing(false);
        router.refresh();
      }
    });
  }

  if (!editing) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="text-[12.5px] font-bold text-pink-600 hover:underline"
      >
        Sửa tên/mô tả
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-500/15 bg-surface p-4 max-w-[420px]">
      <div className="mb-3 flex items-center justify-between">
        <span className="text-[14px] font-bold">Sửa bộ sưu tập</span>
        <button
          type="button"
          onClick={() => setEditing(false)}
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
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      <label className="block text-left mb-3">
        <span className="text-[13px] font-semibold text-ink">Mô tả</span>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      {error && <p className="mb-2 text-[12.5px] text-pink-600">{error}</p>}

      <button
        type="button"
        onClick={handleSave}
        disabled={pending || !name.trim()}
        className="rounded-full bg-pink-500 px-5 py-2 text-[13.5px] font-bold text-white disabled:opacity-50"
      >
        {pending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  );
}
