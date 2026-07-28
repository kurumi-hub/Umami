"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconGlobe, IconLock, IconTrash } from "@/app/icons";
import { deleteCollection, updateCollectionVisibility } from "@/app/account/actions";

export default function CollectionDetailActions({
  collectionId,
  initialIsPublic,
}: {
  collectionId: string;
  initialIsPublic: boolean;
}) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleToggleVisibility() {
    const next = !isPublic;
    setIsPublic(next);
    startTransition(async () => {
      const result = await updateCollectionVisibility(collectionId, next);
      if (result.error) {
        setIsPublic(!next);
        setError(result.error);
      }
    });
  }

  function handleDelete() {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    startTransition(async () => {
      const result = await deleteCollection(collectionId);
      if (result.error) {
        setError(result.error);
        setConfirmDelete(false);
      } else {
        router.push("/account");
      }
    });
  }

  return (
    <div className="flex flex-col items-end gap-2">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleToggleVisibility}
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-60"
        >
          {isPublic ? <IconGlobe className="h-4 w-4" /> : <IconLock className="h-4 w-4" />}
          {isPublic ? "Công khai" : "Riêng tư"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${
            confirmDelete
              ? "bg-pink-500 text-white"
              : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
          }`}
        >
          <IconTrash className="h-4 w-4" />
          {confirmDelete ? "Bấm lần nữa để xoá" : "Xoá bộ sưu tập"}
        </button>
      </div>
      {error && <span className="text-[12px] text-pink-600">{error}</span>}
    </div>
  );
}
