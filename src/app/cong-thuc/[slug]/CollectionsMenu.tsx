"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconPlus } from "@/app/icons";
import {
  getMyCollectionsForRecipe,
  toggleCollectionRecipe,
} from "@/app/cong-thuc/actions";
import { createCollection } from "@/app/account/actions";

type Collection = {
  id: string;
  name: string;
  cover_url: string | null;
  recipe_count: number;
  is_public: boolean;
  contains: boolean;
};

export default function CollectionsMenu({
  recipeId,
  slug,
  isLoggedIn,
}: {
  recipeId: string;
  slug: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [collections, setCollections] = useState<Collection[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  async function handleOpen() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setOpen((v) => !v);
    if (!collections) {
      setLoading(true);
      const result = await getMyCollectionsForRecipe(recipeId);
      setLoading(false);
      if (result.error) {
        setError(result.error);
      } else {
        setCollections(result.collections as Collection[]);
      }
    }
  }

  function handleToggle(c: Collection) {
    setError(null);
    setCollections((prev) =>
      prev
        ? prev.map((x) => (x.id === c.id ? { ...x, contains: !x.contains } : x))
        : prev
    );
    startTransition(async () => {
      const result = await toggleCollectionRecipe(c.id, recipeId, c.contains, slug);
      if (result.error) {
        setError(result.error);
        setCollections((prev) =>
          prev
            ? prev.map((x) => (x.id === c.id ? { ...x, contains: c.contains } : x))
            : prev
        );
      }
    });
  }

  function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setError(null);

    startTransition(async () => {
      // Bộ sưu tập mới tạo từ đây mặc định riêng tư — người dùng có thể
      // đổi thành công khai sau ở trang chi tiết bộ sưu tập.
      const result = await createCollection(name, "", false);
      if (result.error || !result.id) {
        setError(result.error || "Không thể tạo bộ sưu tập.");
        return;
      }

      const addResult = await toggleCollectionRecipe(result.id, recipeId, false, slug);
      if (addResult.error) {
        setError(addResult.error);
      }

      setCollections((prev) => [
        {
          id: result.id!,
          name,
          cover_url: null,
          recipe_count: 1,
          is_public: false,
          contains: !addResult.error,
        },
        ...(prev ?? []),
      ]);
      setNewName("");
      setCreating(false);
    });
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="inline-flex items-center justify-center rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
      >
        Thêm vào bộ sưu tập
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-2 w-[270px] rounded-2xl border border-pink-500/15 bg-surface p-3 shadow-[0_18px_40px_-16px_rgba(58,31,43,0.35)]">
          {loading && (
            <p className="px-2 py-3 text-[13px] text-ink-soft">Đang tải...</p>
          )}
          {error && <p className="px-2 py-1 text-[12.5px] text-pink-600">{error}</p>}
          {!loading && collections && collections.length === 0 && !creating && (
            <p className="px-2 py-3 text-[13px] text-ink-soft">
              Bạn chưa có bộ sưu tập nào.
            </p>
          )}
          {!loading &&
            collections?.map((c) => (
              <label
                key={c.id}
                className="flex items-center gap-2.5 rounded-xl px-2 py-2 hover:bg-pink-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={c.contains}
                  disabled={pending}
                  onChange={() => handleToggle(c)}
                  className="h-4 w-4 rounded border-pink-300/70 text-pink-500 focus:ring-pink-500/40"
                />
                <span className="text-[13.5px] font-semibold flex-1 truncate">
                  {c.name}
                </span>
                <span className="text-[11.5px] text-ink-soft">{c.recipe_count}</span>
              </label>
            ))}

          <div className="mt-1 border-t border-pink-500/10 pt-2">
            {creating ? (
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="Tên bộ sưu tập mới"
                  autoFocus
                  className="flex-1 rounded-full border border-pink-300/70 bg-surface px-3 py-1.5 text-[13px] outline-none focus:border-pink-500"
                />
                <button
                  type="button"
                  onClick={handleCreate}
                  disabled={pending || !newName.trim()}
                  className="rounded-full bg-pink-500 px-3 py-1.5 text-[12.5px] font-bold text-white disabled:opacity-50"
                >
                  Tạo
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="flex w-full items-center gap-1.5 rounded-xl px-2 py-2 text-[13px] font-semibold text-pink-600 hover:bg-pink-50"
              >
                <IconPlus className="h-4 w-4" />
                Tạo bộ sưu tập mới
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
