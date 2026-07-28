import Link from "next/link";
import {
  IconBookmark,
  IconBowl,
  IconCake,
  IconChefHat,
  IconClock,
  IconFlame,
  IconLeaf,
  IconPizza,
  IconRiceBowl,
  IconSearch,
  IconShuffle,
  IconStar,
  IconTakeoutBox,
  type IconProps,
} from "./icons";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";

// ---------------------------------------------------------------------
// Kiểu dữ liệu khớp với cột trả về của các RPC trong
// home_recommendation_rpcs.sql
// ---------------------------------------------------------------------
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

type FollowingRecipeRow = {
  recipe_id: string;
  title: string;
  slug: string;
  thumbnail_url: string | null;
  author_name: string | null;
  published_at: string;
};

type PopularTag = {
  tag_id: string;
  type: string;
  name: string;
  slug: string;
  recipe_count: number;
};

type CookProfile = {
  id: string;
  username: string;
  display_name: string | null;
  recipe_count: number;
};

const diffLabels: Record<string, string> = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
};

const tagIcons: Record<string, (props: IconProps) => React.ReactNode> = {
  breakfast: IconCake,
  lunch: IconRiceBowl,
  dinner: IconBowl,
  snack: IconTakeoutBox,
  dessert: IconCake,
  "viet-nam": IconLeaf,
  au: IconPizza,
};

const tagBgs = [
  "bg-pink-100",
  "bg-[#fff0d9] dark:bg-[#4a3a1f]",
  "bg-[#e3f6e8] dark:bg-[#1f3a2b]",
  "bg-pink-100",
];

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

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 font-display font-extrabold text-[22px] ${
        light ? "text-white" : "text-pink-600"
      }`}
    >
      <span className="inline-block w-3 h-3 rounded-full bg-mango" />
      Umami
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
        <span
          aria-hidden
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-pink-500 shadow-sm"
        >
          <IconBookmark className="w-4 h-4" />
        </span>
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

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
      {children}
    </div>
  );
}

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: trending },
    { data: quick },
    { data: popularTags },
    { data: randomPicks },
    { count: totalPublished },
  ] = await Promise.all([
    supabase.rpc("trending_recipes", { lim: 8 }),
    supabase.rpc("quick_recipes", { max_minutes: 30, lim: 4 }),
    supabase.rpc("popular_tags", { lim: 8 }),
    supabase.rpc("random_recipes", { lim: 4 }),
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("status", "published")
      .eq("is_hidden", false),
  ]);

  let forYou: RecipeRow[] | null = null;
  let newFollowing: FollowingRecipeRow[] | null = null;

  if (user) {
    const [{ data: fy }, { data: nf }] = await Promise.all([
      supabase.rpc("recommended_for_you", { lim: 8 }),
      supabase.rpc("new_from_following_recipes", { lim: 6 }),
    ]);
    forYou = fy;
    newFollowing = nf;
  }

  const { data: cooks } = await supabase
    .from("profiles")
    .select("id, username, display_name, recipe_count")
    .gt("recipe_count", 0)
    .order("recipe_count", { ascending: false })
    .limit(5);

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="discover" />

      {/* HERO / SEARCH */}
      <section className="relative overflow-hidden pt-[52px] pb-[48px]">
        <div className="pointer-events-none absolute -top-[140px] -right-[120px] w-[420px] h-[420px] rounded-full bg-pink-100 opacity-55" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-[260px] h-[260px] rounded-full bg-mint opacity-35" />

        <div className="relative z-10 max-w-[1160px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[13px] font-bold text-pink-600 shadow-[0_6px_16px_-8px_rgba(255,111,145,0.4)] mb-5">
            <IconFlame className="w-4 h-4" />
            {totalPublished ? `${totalPublished}+ công thức từ cộng đồng` : "Kho công thức từ cộng đồng"}
          </div>
          <h1 className="font-display font-extrabold text-ink leading-[1.05] text-[32px] sm:text-[44px] lg:text-[56px]">
            Hôm nay ăn gì?
            <br />
            <span className="text-pink-500">Umami gợi ý cho bạn.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-soft leading-relaxed max-w-[560px] mx-auto">
            Khám phá công thức nấu ăn từng bước, mẹo vào bếp và cộng đồng
            người yêu nấu nướng khắp Việt Nam.
          </p>

          <form className="mt-8 max-w-[560px] mx-auto">
            <label className="relative flex items-center">
              <IconSearch className="absolute left-5 w-5 h-5 text-ink-soft" />
              <input
                type="search"
                placeholder="Tìm công thức, nguyên liệu, đầu bếp..."
                className="w-full rounded-full border border-pink-300/70 bg-surface pl-14 pr-5 py-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15"
              />
            </label>
          </form>
        </div>
      </section>

      {/* CATEGORIES */}
      <section id="danh-muc" className="bg-pink-50 py-20">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-12">
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Danh mục
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Thèm gì, có nấy
            </h2>
            <p className="mt-3.5 text-ink-soft leading-relaxed">
              Từ cơm văn phòng đến trà sữa xế chiều, mọi cơn thèm đều có công
              thức.
            </p>
          </div>
          {popularTags && popularTags.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {(popularTags as PopularTag[]).map((tag, i) => {
                const Icon = tagIcons[tag.slug] ?? IconBowl;
                return (
                  <div
                    key={tag.tag_id}
                    className="bg-surface rounded-[22px] px-5 py-6 text-center border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)]"
                  >
                    <div
                      className={`w-16 h-16 rounded-[18px] mx-auto mb-3.5 flex items-center justify-center ${tagBgs[i % tagBgs.length]}`}
                    >
                      <Icon className="w-7 h-7 text-ink" />
                    </div>
                    <h4 className="text-[15px] font-bold">{tag.name}</h4>
                    <span className="text-[12.5px] text-ink-soft">
                      {tag.recipe_count}+ công thức
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyState>
              Chưa có danh mục nào — hãy là người đầu tiên đăng công thức và
              gắn thẻ cho món ăn của bạn.
            </EmptyState>
          )}
        </div>
      </section>

      {/* RECOMMENDED FOR YOU (chỉ hiện khi đã đăng nhập và có dữ liệu) */}
      {user && forYou && forYou.length > 0 && (
        <section className="py-20 max-w-[1160px] mx-auto px-6 w-full">
          <div className="mb-10">
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Dành riêng cho bạn
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Đề xuất theo khẩu vị của bạn
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {forYou.map((r) => (
              <RecipeCard key={r.recipe_id} r={r} />
            ))}
          </div>
        </section>
      )}

      {/* FEATURED RECIPES (trending) */}
      <section id="cong-thuc" className="py-20 max-w-[1160px] mx-auto px-6 w-full">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
          <div>
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Công thức nổi bật
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Được nấu nhiều nhất tuần này
            </h2>
          </div>
          <Link
            href="/cong-dong"
            className="text-[14px] font-bold text-pink-600 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>
        {trending && trending.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {(trending as RecipeRow[]).map((r) => (
              <RecipeCard key={r.recipe_id} r={r} />
            ))}
          </div>
        ) : (
          <EmptyState>
            Chưa có công thức nào được xuất bản. Hãy là người đầu tiên chia
            sẻ món ngon của bạn!
          </EmptyState>
        )}
      </section>

      {/* QUICK RECIPES */}
      <section className="bg-pink-50 py-20">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="mb-10">
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Nấu nhanh hôm nay
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Xong bữa trong 30 phút
            </h2>
          </div>
          {quick && quick.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {(quick as RecipeRow[]).map((r) => (
                <RecipeCard key={r.recipe_id} r={r} />
              ))}
            </div>
          ) : (
            <EmptyState>
              Chưa có công thức nào dưới 30 phút. Hãy thêm thời gian nấu khi
              đăng công thức để món của bạn xuất hiện ở đây.
            </EmptyState>
          )}
        </div>
      </section>

      {/* RANDOM PICKS */}
      <section className="max-w-[1160px] mx-auto px-6 py-20 w-full">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
          <div>
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider flex items-center gap-2">
              <IconShuffle className="w-4 h-4" />
              Thử vận may
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Hôm nay nấu thử món này xem sao?
            </h2>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
          >
            <IconShuffle className="w-4 h-4" />
            Xáo lại
          </Link>
        </div>
        {randomPicks && randomPicks.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {(randomPicks as RecipeRow[]).map((r) => (
              <RecipeCard key={r.recipe_id} r={r} />
            ))}
          </div>
        ) : (
          <EmptyState>
            Chưa có công thức nào để xổ ngẫu nhiên — hãy đăng công thức đầu
            tiên của bạn!
          </EmptyState>
        )}
      </section>

      {/* NEW FROM FOLLOWING (chỉ hiện khi đã đăng nhập và có dữ liệu) */}
      {user && newFollowing && newFollowing.length > 0 && (
        <section className="py-20 max-w-[1160px] mx-auto px-6 w-full">
          <div className="mb-10">
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Người bạn theo dõi
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Công thức mới nhất
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {newFollowing.map((r) => (
              <Link
                key={r.recipe_id}
                href={`/cong-thuc/${r.slug}`}
                className="block bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)]"
              >
                <div className="h-[150px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                  <IconBowl className="w-14 h-14 text-pink-400" />
                </div>
                <div className="p-4">
                  <h4 className="text-[15.5px] font-bold leading-snug line-clamp-2">
                    {r.title}
                  </h4>
                  <p className="mt-1 text-[12.5px] text-ink-soft">
                    {r.author_name || "Ẩn danh"}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* FEATURED COOKS */}
      <section className="bg-pink-50 py-20">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-12">
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Cộng đồng
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Đầu bếp nổi bật
            </h2>
            <p className="mt-3.5 text-ink-soft leading-relaxed">
              Theo dõi những người chia sẻ công thức được yêu thích nhất.
            </p>
          </div>
          {cooks && cooks.length > 0 ? (
            <div className="flex gap-5 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-5">
              {(cooks as CookProfile[]).map((c) => (
                <div
                  key={c.id}
                  className="shrink-0 w-[160px] md:w-auto bg-surface rounded-[20px] px-5 py-6 text-center border border-pink-500/10"
                >
                  <div className="w-16 h-16 rounded-full mx-auto mb-3.5 flex items-center justify-center bg-pink-100">
                    <IconChefHat className="w-7 h-7 text-pink-500" />
                  </div>
                  <h4 className="text-[14.5px] font-bold">
                    {c.display_name || c.username}
                  </h4>
                  <span className="text-[12px] text-ink-soft">@{c.username}</span>
                  <div className="mt-2 text-[12px] font-semibold text-pink-600">
                    {c.recipe_count} công thức
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState>
              Chưa có đầu bếp nổi bật — công thức đầu tiên được duyệt sẽ xuất
              hiện ở đây.
            </EmptyState>
          )}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2b1620] text-white pt-14 pb-7 mt-6">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-9">
            <div>
              <Logo light />
              <p className="text-[#c7b3ba] text-sm leading-relaxed max-w-[280px] mt-3">
                Ứng dụng công thức nấu ăn và cộng đồng người yêu bếp núc, với
                hàng nghìn món ngon từ khắp mọi miền.
              </p>
            </div>
            <div>
              <h5 className="text-[13px] uppercase tracking-wider text-[#f0a9bd] mb-3.5">
                Khám phá
              </h5>
              <ul className="flex flex-col gap-2.5 text-[#e9d7dc] text-sm">
                <li>
                  <a href="#danh-muc" className="hover:text-white transition-colors">
                    Danh mục
                  </a>
                </li>
                <li>
                  <a href="#cong-thuc" className="hover:text-white transition-colors">
                    Công thức nổi bật
                  </a>
                </li>
                <li>
                  <Link href="/cong-dong" className="hover:text-white transition-colors">
                    Cộng đồng
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-[13px] uppercase tracking-wider text-[#f0a9bd] mb-3.5">
                Công ty
              </h5>
              <ul className="flex flex-col gap-2.5 text-[#e9d7dc] text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Tuyển dụng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Đối tác đầu bếp
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-[13px] uppercase tracking-wider text-[#f0a9bd] mb-3.5">
                Hỗ trợ
              </h5>
              <ul className="flex flex-col gap-2.5 text-[#e9d7dc] text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Trung tâm trợ giúp
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Liên hệ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Điều khoản
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-11 pt-6 border-t border-white/10 flex justify-between flex-wrap gap-3 text-[13px] text-[#a98d95]">
            <span>© 2026 Umami. Nấu ngon mỗi ngày.</span>
            <span>Thiết kế tại Việt Nam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
