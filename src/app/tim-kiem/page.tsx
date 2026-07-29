import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import {
  IconBowl,
  IconChefHat,
  IconClipboard,
  IconClock,
  IconSearch,
  IconStar,
  IconTag,
} from "@/app/icons";

type RecipeResult = {
  id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  avg_rating: number | string | null;
  total_time_min: number | null;
  difficulty: string | null;
  matched_ingredient: string | null;
};

type AuthorResult = {
  id: string;
  username: string;
  display_name: string | null;
  recipe_count: number;
};

type CollectionResult = {
  id: string;
  name: string;
  cover_url: string | null;
  recipe_count: number;
};

type TagResult = {
  id: string;
  type: string;
  name: string;
  slug: string;
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

function SectionHeader({
  icon: Icon,
  label,
}: {
  icon: (props: { className?: string }) => React.ReactNode;
  label: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <Icon className="h-5 w-5 text-pink-500" />
      <h2 className="text-[17px] font-bold">{label}</h2>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: qParam } = await searchParams;
  const q = (qParam || "").trim();

  const supabase = await createClient();

  const { data } = q
    ? await supabase.rpc("search_all", { q, lim: 8 })
    : { data: null };

  const recipes = (data?.recipes as RecipeResult[]) ?? [];
  const authors = (data?.authors as AuthorResult[]) ?? [];
  const collections = (data?.collections as CollectionResult[]) ?? [];
  const tags = (data?.tags as TagResult[]) ?? [];

  const hasAnyResult =
    recipes.length > 0 || authors.length > 0 || collections.length > 0 || tags.length > 0;

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="discover" />

      <div className="max-w-[880px] mx-auto px-6 py-10 w-full">
        <form action="/tim-kiem" method="GET" className="mb-10">
          <label className="relative flex items-center">
            <IconSearch className="absolute left-5 w-5 h-5 text-ink-soft" />
            <input
              type="search"
              name="q"
              defaultValue={q}
              placeholder="Tìm công thức, nguyên liệu, đầu bếp, bộ sưu tập, tag..."
              autoFocus
              className="w-full rounded-full border border-pink-300/70 bg-surface pl-14 pr-5 py-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15"
            />
          </label>
        </form>

        {!q ? (
          <p className="text-center text-[14px] text-ink-soft">
            Gõ từ khoá ở trên để bắt đầu tìm kiếm.
          </p>
        ) : !hasAnyResult ? (
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Không tìm thấy kết quả nào cho &quot;{q}&quot;. Thử từ khoá khác xem
            sao.
          </div>
        ) : (
          <div className="flex flex-col gap-12">
            {recipes.length > 0 && (
              <section>
                <SectionHeader icon={IconBowl} label="Công thức" />
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
                        {r.matched_ingredient && (
                          <span className="mt-1 inline-block rounded-full bg-mint/20 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                            Có: {r.matched_ingredient}
                          </span>
                        )}
                        <div className="mt-3 flex items-center justify-between text-[12.5px] text-ink-soft">
                          <span className="flex items-center gap-1">
                            <IconClock className="w-3.5 h-3.5" />
                            {formatMinutes(r.total_time_min)}
                          </span>
                          <span className="flex items-center gap-1">
                            <IconStar className="w-3.5 h-3.5 text-mango" />
                            {formatRating(r.avg_rating)}
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {authors.length > 0 && (
              <section>
                <SectionHeader icon={IconChefHat} label="Tác giả" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {authors.map((a) => (
                    <Link
                      key={a.id}
                      href={`/u/${a.username}`}
                      className="flex items-center gap-3 rounded-[18px] border border-pink-500/10 bg-surface px-4 py-3 hover:border-pink-500/30 transition-colors"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100">
                        <IconChefHat className="h-5 w-5 text-pink-500" />
                      </div>
                      <div className="min-w-0">
                        <span className="block text-[13.5px] font-semibold truncate">
                          {a.display_name || a.username}
                        </span>
                        <span className="text-[11.5px] text-ink-soft">
                          @{a.username} · {a.recipe_count} công thức
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {collections.length > 0 && (
              <section>
                <SectionHeader icon={IconClipboard} label="Bộ sưu tập" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                  {collections.map((c) => (
                    <Link
                      key={c.id}
                      href={`/account/collections/${c.id}`}
                      className="bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)] block"
                    >
                      <div className="relative h-[110px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                        {c.cover_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={c.cover_url}
                            alt={c.name}
                            className="absolute inset-0 h-full w-full object-cover"
                          />
                        ) : (
                          <IconClipboard className="w-9 h-9 text-pink-400" />
                        )}
                      </div>
                      <div className="p-3.5">
                        <h4 className="text-[13.5px] font-bold leading-snug line-clamp-2 min-h-[2.2em] truncate">
                          {c.name}
                        </h4>
                        <span className="text-[11.5px] text-ink-soft">
                          {c.recipe_count} công thức
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {tags.length > 0 && (
              <section>
                <SectionHeader icon={IconTag} label="Tag" />
                <div className="flex flex-wrap gap-2.5">
                  {tags.map((t) => (
                    <Link
                      key={t.id}
                      href={`/danh-muc/${t.slug}?type=${t.type}`}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
                    >
                      <IconTag className="h-3.5 w-3.5" />
                      {t.name}
                    </Link>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
