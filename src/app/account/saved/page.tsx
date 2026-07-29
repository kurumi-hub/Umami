import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import { IconBowl, IconClock } from "@/app/icons";

const PAGE_SIZE = 24;

const diffLabels: Record<string, string> = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
};

function formatMinutes(min: number | null) {
  if (!min) return "—";
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}g ${m}p` : `${h} giờ`;
}

export default async function SavedRecipesPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: rows, count } = await supabase
    .from("saved_recipes")
    .select(
      "recipe_id, created_at, recipes(id, title, slug, total_time_min, difficulty)",
      { count: "exact" }
    )
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const recipes = (rows ?? [])
    .map((row) => (Array.isArray(row.recipes) ? row.recipes[0] : row.recipes))
    .filter(Boolean) as {
    id: string;
    title: string;
    slug: string;
    total_time_min: number | null;
    difficulty: string | null;
  }[];

  const totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));

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

        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-8">
          Công thức đã lưu {count ? `(${count})` : ""}
        </h1>

        {recipes.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Bạn chưa lưu công thức nào.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {recipes.map((r) => (
                <Link
                  key={r.id}
                  href={`/cong-thuc/${r.slug}`}
                  className="bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)] block"
                >
                  <div className="relative h-[150px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                    <IconBowl className="w-14 h-14 text-pink-400" />
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
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Link
                  href={`/account/saved?page=${Math.max(1, page - 1)}`}
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
                  href={`/account/saved?page=${Math.min(totalPages, page + 1)}`}
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
