import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import { IconBowl, IconClock } from "@/app/icons";

const PAGE_SIZE = 20;

const statusLabels: Record<string, { label: string; className: string }> = {
  published: { label: "Đã đăng", className: "bg-mint/25 text-emerald-700" },
  pending_review: { label: "Chờ duyệt", className: "bg-mango/20 text-amber-700" },
  draft: { label: "Bản nháp", className: "bg-pink-500/10 text-ink-soft" },
  rejected: { label: "Bị từ chối", className: "bg-pink-500/15 text-pink-600" },
  archived: { label: "Đã lưu trữ", className: "bg-pink-500/10 text-ink-soft" },
};

const diffLabels: Record<string, string> = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
};

const statusTabs: { value: string; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: "published", label: "Đã đăng" },
  { value: "pending_review", label: "Chờ duyệt" },
  { value: "draft", label: "Bản nháp" },
  { value: "rejected", label: "Bị từ chối" },
  { value: "archived", label: "Lưu trữ" },
];

function formatMinutes(min: number | null) {
  if (!min) return "—";
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}g ${m}p` : `${h} giờ`;
}

export default async function MyRecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; page?: string }>;
}) {
  const { status: statusParam, page: pageParam } = await searchParams;
  const status = statusParam || "all";
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  let query = supabase
    .from("recipes")
    .select("id, title, slug, status, total_time_min, difficulty", {
      count: "exact",
    })
    .eq("author_id", user.id);

  if (status !== "all") {
    query = query.eq("status", status);
  }

  const { data: recipes, count } = await query
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (status !== "all") params.set("status", status);
    params.set("page", String(nextPage));
    return `/account/recipes?${params.toString()}`;
  }

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[1160px] mx-auto px-6 py-10 w-full">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về trang Cá nhân
        </Link>

        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="font-display font-extrabold text-[26px] sm:text-[32px]">
            Công thức của bạn {count ? `(${count})` : ""}
          </h1>
          <Link
            href="/account/recipes/new"
            className="rounded-full bg-pink-500 px-4 py-2 text-[13px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)]"
          >
            + Đăng công thức mới
          </Link>
        </div>

        <div className="mb-6 flex flex-wrap gap-2">
          {statusTabs.map((tab) => (
            <Link
              key={tab.value}
              href={
                tab.value === "all"
                  ? "/account/recipes"
                  : `/account/recipes?status=${tab.value}`
              }
              className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
                status === tab.value
                  ? "bg-pink-500 text-white"
                  : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {!recipes || recipes.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Không có công thức nào ở trạng thái này.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {recipes.map((r) => {
                const s = statusLabels[r.status] ?? {
                  label: r.status,
                  className: "bg-pink-500/10 text-ink-soft",
                };
                return (
                  <Link
                    key={r.id}
                    href={`/cong-thuc/${r.slug}`}
                    className="bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)] block"
                  >
                    <div className="relative h-[150px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                      <IconBowl className="w-14 h-14 text-pink-400" />
                      <span
                        className={`absolute top-3 left-3 rounded-full px-2.5 py-1 text-[11px] font-bold ${s.className}`}
                      >
                        {s.label}
                      </span>
                      {r.difficulty && (
                        <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-ink-soft">
                          {diffLabels[r.difficulty] ?? r.difficulty}
                        </span>
                      )}
                    </div>
                    <div className="p-4">
                      <h4 className="text-[15.5px] font-bold leading-snug line-clamp-2 min-h-[2.75em]">
                        {r.title}
                      </h4>
                      <span className="mt-3 flex items-center gap-1 text-[12.5px] text-ink-soft">
                        <IconClock className="w-3.5 h-3.5" />
                        {formatMinutes(r.total_time_min)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Link
                  href={pageHref(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={`rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 transition-colors ${
                    page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-pink-50"
                  }`}
                >
                  ← Trước
                </Link>
                <span className="text-[13.5px] text-ink-soft">
                  Trang {page}/{totalPages}
                </span>
                <Link
                  href={pageHref(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                  className={`rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 transition-colors ${
                    page >= totalPages
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-pink-50"
                  }`}
                >
                  Sau →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
