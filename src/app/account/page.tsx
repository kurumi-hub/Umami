import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import {
  IconBookmark,
  IconBowl,
  IconCart,
  IconChefHat,
  IconClipboard,
  IconClock,
  IconGlobe,
  IconHeart,
  IconLock,
  IconSettings,
  IconUsers,
} from "@/app/icons";
import CollectionCreateForm from "./CollectionCreateForm";

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

function formatMinutes(min: number | null) {
  if (!min) return "—";
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}g ${m}p` : `${h} giờ`;
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware đã chặn /account khi chưa đăng nhập, đây là lớp bảo vệ dự
  // phòng cho trường hợp gọi trực tiếp Server Component.
  if (!user) {
    redirect("/auth/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "username, display_name, bio, avatar_url, recipe_count, follower_count, following_count"
    )
    .eq("id", user.id)
    .maybeSingle();

  // Công thức của chính mình PHẢI luôn hiển thị được với bản thân, kể cả
  // khi chưa 'published' (đang chờ duyệt/nháp/bị từ chối) — khác với các
  // RPC trang chủ (trending_recipes, quick_recipes...) chỉ show công khai
  // những bài đã published, vì đó là feed công khai chứ không phải của
  // riêng tác giả.
  // Chỉ lấy 6 cái mới nhất để xem trước — danh sách đầy đủ (có lọc theo
  // trạng thái + phân trang) nằm ở /account/recipes, tránh trang Cá nhân
  // dài vô tận khi có nhiều công thức.
  const [{ data: myRecipes }, { count: myRecipesCount }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, slug, status, total_time_min, difficulty")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("recipes")
      .select("id", { count: "exact", head: true })
      .eq("author_id", user.id),
  ]);

  // Chỉ xem trước 6 công thức đã lưu gần nhất — danh sách đầy đủ có phân
  // trang nằm ở /account/saved.
  const [{ data: savedRows }, { count: savedCount }] = await Promise.all([
    supabase
      .from("saved_recipes")
      .select("recipe_id, created_at, recipes(id, title, slug, total_time_min, difficulty)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(6),
    supabase
      .from("saved_recipes")
      .select("recipe_id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const savedRecipes = (savedRows ?? [])
    .map((row) => (Array.isArray(row.recipes) ? row.recipes[0] : row.recipes))
    .filter(Boolean) as {
    id: string;
    title: string;
    slug: string;
    total_time_min: number | null;
    difficulty: string | null;
  }[];

  // Chỉ xem trước 4 bộ sưu tập gần cập nhật nhất — danh sách đầy đủ nằm
  // ở /account/collections.
  const [{ data: collections }, { count: collectionsCount }] = await Promise.all([
    supabase
      .from("collections")
      .select("id, name, is_public, recipe_count, cover_url")
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(4),
    supabase
      .from("collections")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id),
  ]);

  const { data: shoppingList } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  let uncheckedShoppingCount = 0;
  if (shoppingList) {
    const { count } = await supabase
      .from("shopping_list_items")
      .select("id", { count: "exact", head: true })
      .eq("list_id", shoppingList.id)
      .eq("is_checked", false);
    uncheckedShoppingCount = count ?? 0;
  }

  const displayName =
    profile?.display_name || user.user_metadata?.full_name || "Bạn";
  const username = profile?.username ? `@${profile.username}` : user.email;

  const stats = [
    { label: "Công thức", value: profile?.recipe_count ?? 0, Icon: IconClipboard },
    { label: "Người theo dõi", value: profile?.follower_count ?? 0, Icon: IconUsers },
    { label: "Đang theo dõi", value: profile?.following_count ?? 0, Icon: IconHeart },
  ];

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <section className="max-w-[880px] mx-auto px-6 py-10 w-full">
        <div className="relative bg-surface rounded-[24px] p-6 sm:p-8 border border-pink-500/10 shadow-[0_14px_30px_-20px_rgba(58,31,43,0.2)]">
          <Link
            href="/account/settings"
            aria-label="Cài đặt"
            className="absolute top-5 right-5 flex h-9 w-9 items-center justify-center rounded-full border-2 border-pink-300 text-pink-600 hover:bg-pink-50 transition-colors"
          >
            <IconSettings className="h-4.5 w-4.5" />
          </Link>

          <div className="flex flex-col sm:flex-row sm:items-center gap-5">
            <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-pink-100 mx-auto sm:mx-0">
              <IconChefHat className="h-9 w-9 text-pink-500" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-display font-extrabold text-[22px]">
                {displayName}
              </h1>
              <span className="text-[13.5px] text-ink-soft">{username}</span>
              {profile?.bio && (
                <p className="mt-2 text-[14px] text-ink-soft leading-relaxed max-w-[420px]">
                  {profile.bio}
                </p>
              )}
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-3">
            {stats.map((s) => (
              <div
                key={s.label}
                className="flex flex-col items-center gap-1 rounded-[18px] bg-pink-50 px-3 py-4 text-center"
              >
                <s.Icon className="h-5 w-5 text-pink-500" />
                <b className="font-display text-[18px]">{s.value}</b>
                <span className="text-[11.5px] text-ink-soft">{s.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* SHOPPING LIST SUMMARY */}
        <Link
          href="/account/shopping-list"
          className="mt-6 flex items-center justify-between gap-3 rounded-[20px] border border-pink-500/10 bg-surface px-5 py-4 hover:border-pink-500/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100">
              <IconCart className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <b className="text-[14.5px] block">Đi chợ &amp; Tủ lạnh</b>
              <span className="text-[12.5px] text-ink-soft">
                {uncheckedShoppingCount > 0
                  ? `Còn ${uncheckedShoppingCount} món chưa mua`
                  : "Chưa có món nào cần mua"}
              </span>
            </div>
          </div>
          <span className="text-pink-600 font-bold text-[13.5px]">Xem →</span>
        </Link>

        {/* MEAL PLAN SUMMARY */}
        <Link
          href="/account/meal-plan"
          className="mt-3 flex items-center justify-between gap-3 rounded-[20px] border border-pink-500/10 bg-surface px-5 py-4 hover:border-pink-500/30 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100">
              <IconClipboard className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <b className="text-[14.5px] block">Kế hoạch bữa ăn</b>
              <span className="text-[12.5px] text-ink-soft">
                Lên lịch nấu ăn cho tuần
              </span>
            </div>
          </div>
          <span className="text-pink-600 font-bold text-[13.5px]">Xem →</span>
        </Link>

        {/* MY RECIPES */}
        <div className="mt-9">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconClipboard className="h-5 w-5 text-pink-500" />
              <h2 className="text-[17px] font-bold">
                Công thức của bạn
                {myRecipesCount ? ` (${myRecipesCount})` : ""}
              </h2>
            </div>
            {(myRecipesCount ?? 0) > 6 && (
              <Link
                href="/account/recipes"
                className="text-[13.5px] font-bold text-pink-600 hover:underline"
              >
                Xem tất cả →
              </Link>
            )}
          </div>
          {myRecipes && myRecipes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {myRecipes.map((r) => {
                const status = statusLabels[r.status] ?? {
                  label: r.status,
                  className: "bg-pink-500/10 text-ink-soft",
                };
                return (
                  <Link
                    key={r.id}
                    href={`/cong-thuc/${r.slug}`}
                    className="bg-surface rounded-[20px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1 hover:shadow-[0_16px_30px_-18px_rgba(255,111,145,0.5)] block"
                  >
                    <div className="relative h-[110px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                      <IconBowl className="w-10 h-10 text-pink-400" />
                      <span
                        className={`absolute top-2.5 left-2.5 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </div>
                    <div className="p-3.5">
                      <h4 className="text-[13.5px] font-bold leading-snug line-clamp-2">
                        {r.title}
                      </h4>
                      <div className="mt-2 flex items-center justify-between text-[11.5px] text-ink-soft">
                        <span className="flex items-center gap-1">
                          <IconClock className="w-3 h-3" />
                          {formatMinutes(r.total_time_min)}
                        </span>
                        {r.difficulty && <span>{diffLabels[r.difficulty] ?? r.difficulty}</span>}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
              Bạn chưa đăng công thức nào. Hãy chia sẻ món ngon đầu tiên của
              bạn với cộng đồng!
            </div>
          )}
        </div>

        {/* SAVED RECIPES */}
        <div className="mt-9">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconBookmark className="h-5 w-5 text-pink-500" />
              <h2 className="text-[17px] font-bold">
                Công thức đã lưu{savedCount ? ` (${savedCount})` : ""}
              </h2>
            </div>
            {(savedCount ?? 0) > 6 && (
              <Link
                href="/account/saved"
                className="text-[13.5px] font-bold text-pink-600 hover:underline"
              >
                Xem tất cả →
              </Link>
            )}
          </div>
          {savedRecipes.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {savedRecipes.map((r) => (
                <Link
                  key={r.id}
                  href={`/cong-thuc/${r.slug}`}
                  className="bg-surface rounded-[20px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1 hover:shadow-[0_16px_30px_-18px_rgba(255,111,145,0.5)] block"
                >
                  <div className="relative h-[110px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                    <IconBowl className="w-10 h-10 text-pink-400" />
                    {r.difficulty && (
                      <span className="absolute bottom-2.5 left-2.5 rounded-full bg-surface/90 px-2.5 py-1 text-[10.5px] font-bold text-ink-soft">
                        {diffLabels[r.difficulty] ?? r.difficulty}
                      </span>
                    )}
                  </div>
                  <div className="p-3.5">
                    <h4 className="text-[13.5px] font-bold leading-snug line-clamp-2">
                      {r.title}
                    </h4>
                    <span className="mt-2 flex items-center gap-1 text-[11.5px] text-ink-soft">
                      <IconClock className="w-3 h-3" />
                      {formatMinutes(r.total_time_min)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
              Bạn chưa lưu công thức nào. Khám phá và bấm biểu tượng bookmark
              để lưu lại món yêu thích nhé.
            </div>
          )}
        </div>

        {/* COLLECTIONS */}
        <div className="mt-9">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <IconClipboard className="h-5 w-5 text-pink-500" />
              <h2 className="text-[17px] font-bold">
                Bộ sưu tập của bạn{collectionsCount ? ` (${collectionsCount})` : ""}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              {(collectionsCount ?? 0) > 4 && (
                <Link
                  href="/account/collections"
                  className="text-[13.5px] font-bold text-pink-600 hover:underline"
                >
                  Xem tất cả →
                </Link>
              )}
              <CollectionCreateForm />
            </div>
          </div>
          {collections && collections.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {collections.map((c) => (
                <Link
                  key={c.id}
                  href={`/account/collections/${c.id}`}
                  className="bg-surface rounded-[20px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1 hover:shadow-[0_16px_30px_-18px_rgba(255,111,145,0.5)] block"
                >
                  <div className="relative h-[90px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                    {c.cover_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={c.cover_url}
                        alt={c.name}
                        className="absolute inset-0 h-full w-full object-cover"
                      />
                    ) : (
                      <IconClipboard className="w-8 h-8 text-pink-400" />
                    )}
                    <span className="absolute top-2.5 right-2.5 flex items-center gap-1 rounded-full bg-surface/90 px-2 py-1 text-[10px] font-bold text-ink-soft">
                      {c.is_public ? (
                        <IconGlobe className="h-3 w-3" />
                      ) : (
                        <IconLock className="h-3 w-3" />
                      )}
                    </span>
                  </div>
                  <div className="p-3.5">
                    <h4 className="text-[13.5px] font-bold leading-snug line-clamp-1">
                      {c.name}
                    </h4>
                    <span className="text-[11.5px] text-ink-soft">
                      {c.recipe_count} công thức
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
              Bạn chưa có bộ sưu tập nào. Tạo bộ sưu tập để nhóm các công
              thức theo chủ đề của riêng bạn.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
