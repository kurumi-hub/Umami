"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import { IconLock, IconSearch, IconShield, IconSparkle } from "@/app/icons";
import {
  searchRecipesForFeaturing,
  searchUsersForModeration,
  setRecipeFeatured,
  setUserTrusted,
  suspendUser,
  unsuspendUser,
} from "./actions";

type ModUser = {
  id: string;
  username: string;
  display_name: string | null;
  avatar_url: string | null;
  is_trusted: boolean;
  suspended_until: string | null;
  roles: string[];
};

type FeaturableRecipe = {
  id: string;
  slug: string;
  title: string;
  thumbnail_url: string | null;
  is_featured: boolean;
  author_id: string | null;
};

const suspendOptions: { label: string; days: number | null }[] = [
  { label: "1 ngày", days: 1 },
  { label: "3 ngày", days: 3 },
  { label: "7 ngày", days: 7 },
  { label: "30 ngày", days: 30 },
  { label: "Vĩnh viễn", days: null },
];

function isCurrentlySuspended(until: string | null) {
  if (!until) return false;
  return new Date(until).getTime() > Date.now();
}

function formatUntil(until: string) {
  const d = new Date(until);
  // 'infinity' timestamptz thường trả về xa trong tương lai (năm 200000+),
  // Date không parse được chuẩn -> coi mọi năm quá xa là vĩnh viễn.
  if (Number.isNaN(d.getTime()) || d.getFullYear() > 9000) return "vĩnh viễn";
  return `tới ${d.toLocaleDateString("vi-VN")}`;
}

export default function UserModerationPanel() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <UserSuspendPanel />
      <FeaturedRecipePanel />
    </div>
  );
}

function UserSuspendPanel() {
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<ModUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openSuspendFor, setOpenSuspendFor] = useState<string | null>(null);
  const [days, setDays] = useState<number | null>(7);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) {
      setUsers([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const result = await searchUsersForModeration(query);
      setLoading(false);
      if (result.error) setError(result.error);
      else {
        setError(null);
        setUsers(result.users as ModUser[]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function updateUser(id: string, patch: Partial<ModUser>) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, ...patch } : u)));
  }

  function handleToggleTrusted(u: ModUser) {
    setError(null);
    const next = !u.is_trusted;
    updateUser(u.id, { is_trusted: next });
    startTransition(async () => {
      const result = await setUserTrusted(u.id, next);
      if (result.error) {
        setError(result.error);
        updateUser(u.id, { is_trusted: u.is_trusted });
      }
    });
  }

  function handleOpenSuspend(u: ModUser) {
    setOpenSuspendFor(u.id);
    setDays(7);
    setReason("");
    setError(null);
  }

  function handleConfirmSuspend(u: ModUser) {
    if (!reason.trim()) {
      setError("Phải nêu lý do khoá tài khoản.");
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await suspendUser(u.id, days, reason);
      if (result.error) {
        setError(result.error);
      } else {
        updateUser(u.id, {
          suspended_until: days === null ? "9999-12-31T00:00:00Z" : new Date(Date.now() + days * 86400000).toISOString(),
        });
        setOpenSuspendFor(null);
      }
    });
  }

  function handleUnsuspend(u: ModUser) {
    setError(null);
    startTransition(async () => {
      const result = await unsuspendUser(u.id);
      if (result.error) setError(result.error);
      else updateUser(u.id, { suspended_until: null });
    });
  }

  return (
    <div className="rounded-[20px] border border-pink-100 bg-surface px-5 py-4">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100">
          <IconLock className="h-4 w-4 text-pink-500" />
        </div>
        <h2 className="font-display font-extrabold text-[17px]">
          Khoá tài khoản &amp; tin cậy
        </h2>
      </div>

      <div className="relative mb-3">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm user theo username..."
          className="w-full rounded-full border border-pink-200 bg-transparent py-2 pl-9 pr-3 text-[13.5px] outline-none focus:border-pink-400"
        />
      </div>

      {error && <p className="mb-2 text-[12.5px] text-pink-600">{error}</p>}

      {loading && <p className="text-[13px] text-ink-soft">Đang tìm...</p>}

      {!loading && query.trim().length >= 2 && users.length === 0 && (
        <p className="text-[13px] text-ink-soft">Không tìm thấy user nào.</p>
      )}

      <ul className="flex flex-col gap-2.5">
        {users.map((u) => {
          const suspended = isCurrentlySuspended(u.suspended_until);
          const hasRoles = u.roles.length > 0;
          return (
            <li key={u.id} className="rounded-[14px] border border-pink-100 px-3.5 py-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="min-w-0">
                  <Link
                    href={`/u/${u.username}`}
                    target="_blank"
                    className="font-bold text-[13.5px] hover:text-pink-600 transition-colors"
                  >
                    {u.display_name || u.username}
                  </Link>
                  <span className="ml-1.5 text-[12px] text-ink-soft">@{u.username}</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {hasRoles && (
                      <span className="rounded-full bg-ink-soft/10 px-2 py-0.5 text-[10.5px] font-bold text-ink-soft">
                        {u.roles.join(", ")}
                      </span>
                    )}
                    {u.is_trusted && (
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10.5px] font-bold text-emerald-700">
                        Tin cậy
                      </span>
                    )}
                    {suspended && (
                      <span className="rounded-full bg-pink-100 px-2 py-0.5 text-[10.5px] font-bold text-pink-600">
                        Đã khoá {u.suspended_until ? formatUntil(u.suspended_until) : ""}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {openSuspendFor === u.id ? (
                <div className="mt-2.5 flex flex-col gap-2">
                  <select
                    value={days === null ? "null" : String(days)}
                    onChange={(e) =>
                      setDays(e.target.value === "null" ? null : Number(e.target.value))
                    }
                    className="rounded-xl border border-pink-200 bg-transparent px-3 py-1.5 text-[13px] outline-none focus:border-pink-400"
                  >
                    {suspendOptions.map((o) => (
                      <option key={o.label} value={o.days === null ? "null" : o.days}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Lý do khoá (bắt buộc, user sẽ nhận được lý do này)..."
                    rows={2}
                    className="w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13px] outline-none focus:border-pink-400"
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleConfirmSuspend(u)}
                      disabled={pending}
                      className="rounded-full bg-pink-500 px-4 py-1.5 text-[12.5px] font-bold text-white hover:bg-pink-600 transition-colors disabled:opacity-60"
                    >
                      Xác nhận khoá
                    </button>
                    <button
                      type="button"
                      onClick={() => setOpenSuspendFor(null)}
                      className="rounded-full border-2 border-pink-300 px-4 py-1.5 text-[12.5px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleTrusted(u)}
                    disabled={pending}
                    className="rounded-full border-2 border-pink-300 px-3 py-1 text-[12px] font-bold text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-60"
                  >
                    {u.is_trusted ? "Bỏ tin cậy" : "Đánh dấu tin cậy"}
                  </button>
                  {suspended ? (
                    <button
                      type="button"
                      onClick={() => handleUnsuspend(u)}
                      disabled={pending}
                      className="rounded-full border-2 border-pink-300 px-3 py-1 text-[12px] font-bold text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-60"
                    >
                      Mở khoá
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenSuspend(u)}
                      disabled={pending || (hasRoles && u.roles.length > 0)}
                      title={
                        hasRoles
                          ? "Tài khoản có quyền — chỉ admin mới khoá được"
                          : undefined
                      }
                      className="rounded-full border-2 border-pink-300 px-3 py-1 text-[12px] font-bold text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-40"
                    >
                      Khoá tài khoản
                    </button>
                  )}
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function FeaturedRecipePanel() {
  const [query, setQuery] = useState("");
  const [recipes, setRecipes] = useState<FeaturableRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (query.trim().length < 2) {
      setRecipes([]);
      return;
    }
    const t = setTimeout(async () => {
      setLoading(true);
      const result = await searchRecipesForFeaturing(query);
      setLoading(false);
      if (result.error) setError(result.error);
      else {
        setError(null);
        setRecipes(result.recipes as FeaturableRecipe[]);
      }
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  function handleToggle(r: FeaturableRecipe) {
    setError(null);
    const next = !r.is_featured;
    setRecipes((prev) => prev.map((x) => (x.id === r.id ? { ...x, is_featured: next } : x)));
    startTransition(async () => {
      const result = await setRecipeFeatured(r.id, next);
      if (result.error) {
        setError(result.error);
        setRecipes((prev) =>
          prev.map((x) => (x.id === r.id ? { ...x, is_featured: r.is_featured } : x))
        );
      }
    });
  }

  return (
    <div className="rounded-[20px] border border-pink-100 bg-surface px-5 py-4">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100">
          <IconSparkle className="h-4 w-4 text-pink-500" />
        </div>
        <h2 className="font-display font-extrabold text-[17px]">Nội dung nổi bật</h2>
      </div>

      <div className="relative mb-3">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm công thức đã xuất bản theo tiêu đề..."
          className="w-full rounded-full border border-pink-200 bg-transparent py-2 pl-9 pr-3 text-[13.5px] outline-none focus:border-pink-400"
        />
      </div>

      {error && <p className="mb-2 text-[12.5px] text-pink-600">{error}</p>}

      {loading && <p className="text-[13px] text-ink-soft">Đang tìm...</p>}

      {!loading && query.trim().length >= 2 && recipes.length === 0 && (
        <p className="text-[13px] text-ink-soft">Không tìm thấy công thức nào.</p>
      )}

      <ul className="flex flex-col gap-2">
        {recipes.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-2 rounded-[14px] border border-pink-100 px-3.5 py-2.5"
          >
            <Link
              href={`/cong-thuc/${r.slug}`}
              target="_blank"
              className="min-w-0 flex-1 truncate text-[13.5px] font-semibold hover:text-pink-600 transition-colors"
            >
              {r.title}
            </Link>
            <button
              type="button"
              onClick={() => handleToggle(r)}
              disabled={pending}
              className={`shrink-0 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[12px] font-bold transition-colors disabled:opacity-60 ${
                r.is_featured
                  ? "bg-pink-500 text-white hover:bg-pink-600"
                  : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
              }`}
            >
              <IconShield className="h-3.5 w-3.5" />
              {r.is_featured ? "Đang nổi bật" : "Gắn nổi bật"}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
