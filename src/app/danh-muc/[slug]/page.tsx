import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import { IconBowl, IconClock, IconStar } from "@/app/icons";

const PAGE_SIZE = 24;

type TagInfo = {
  tag_id: string;
  type: string;
  name: string;
  slug: string;
  recipe_count: number;
};

type RecipeRow = {
  recipe_id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  avg_rating: number | string | null;
  total_time_min: number | null;
  difficulty: string | null;
  author_name: string | null;
};

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

function formatRating(rating: number | string | null) {
  const n = typeof rating === "string" ? parseFloat(rating) : rating;
  return n && n > 0 ? n.toFixed(1) : "Chưa có";
}

function Stars() {
  return (
    <div className="flex gap-0.5 text-mango">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} className="w-3.5 h-3.5" />
      ))}
    </div>
  );
}

function RecipeCard({ r }: { r: RecipeRow }) {
  return (
    <Link
      href={`/cong-thuc/${r.slug}`}
      className="group bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)] block"
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
        <h4 className="text-[15.5px] font-bold leading-snug line-clamp-2">{r.title}</h4>
        <p className="mt-1 text-[12.5px] text-ink-soft">
          {r.author_name || "Cộng đồng Umami"}
        </p>
        <div className="mt-3 flex items-center justify-between text-[12.5px] text-ink-soft">
          <span className="flex items-center gap-1">
            <IconClock className="w-3.5 h-3.5" />
            {formatMinutes(r.total_time_min)}
          </span>
          <span className="flex items-center gap-1">
            <Stars />
            {formatRating(r.avg_rating)}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const { slug } = await params;
  const { type, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();

  const { data: tagData } = await supabase.rpc("get_tag_by_slug", {
    p_slug: slug,
    p_type: type ?? null,
  });

  const tag = (tagData as TagInfo[] | null)?.[0];

  if (!tag) {
    notFound();
  }

  const { data: recipes } = await supabase.rpc("recipes_by_tag", {
    p_slug: slug,
    p_type: type ?? null,
    lim: PAGE_SIZE,
    off: offset,
  });

  const list = (recipes as RecipeRow[] | null) ?? [];
  const totalPages = Math.max(1, Math.ceil((tag.recipe_count || 0) / PAGE_SIZE));

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="discover" />

      <div className="max-w-[1160px] mx-auto px-6 py-10 w-full">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về trang chủ
        </Link>

        <div className="mb-10">
          <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
            Danh mục
          </div>
          <h1 className="font-display font-extrabold text-[28px] sm:text-[38px] mt-2.5">
            {tag.name}
          </h1>
          <p className="mt-2.5 text-ink-soft">
            {tag.recipe_count} công thức
          </p>
        </div>

        {list.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Chưa có công thức nào trong danh mục này.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {list.map((r) => (
                <RecipeCard key={r.recipe_id} r={r} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Link
                  href={`/danh-muc/${slug}?${new URLSearchParams({
                    ...(type ? { type } : {}),
                    page: String(Math.max(1, page - 1)),
                  }).toString()}`}
                  aria-disabled={page <= 1}
                  className={`rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 transition-colors ${
                    page <= 1
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-pink-50"
                  }`}
                >
                  ← Trước
                </Link>
                <span className="text-[13.5px] text-ink-soft">
                  Trang {page}/{totalPages}
                </span>
                <Link
                  href={`/danh-muc/${slug}?${new URLSearchParams({
                    ...(type ? { type } : {}),
                    page: String(Math.min(totalPages, page + 1)),
                  }).toString()}`}
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
