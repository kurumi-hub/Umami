import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import {
  IconBowl,
  IconChefHat,
  IconClock,
  IconEye,
  IconFlame,
  IconUsers,
} from "@/app/icons";
import SaveButton from "./SaveButton";
import DeleteRecipeButton from "./DeleteRecipeButton";
import RatingWidget from "./RatingWidget";
import FollowButton from "./FollowButton";
import ShoppingListButton from "./ShoppingListButton";
import CollectionsMenu from "./CollectionsMenu";
import ReportButton from "./ReportButton";
import IngredientsPanel from "./IngredientsPanel";
import TipsSection from "./TipsSection";

type Ingredient = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  raw_text: string | null;
  is_optional: boolean;
  position: number;
  section_id: string | null;
  in_pantry: boolean;
  is_allergen: boolean;
};

type Section = { id: string; name: string | null; position: number };

type Step = {
  id: string;
  position: number;
  content: string;
  image_url: string | null;
  timer_seconds: number | null;
};

type Tag = { id: string; type: string; name: string; slug: string };

type UnitConversion = { from_unit: string; to_unit: string; factor: number };

type Nutrition = {
  calories: number | null;
  protein_g: number | null;
  fat_g: number | null;
  carbs_g: number | null;
  fiber_g: number | null;
  sugar_g: number | null;
  sodium_mg: number | null;
  per_serving: boolean;
} | null;

type Tip = {
  id: string;
  body: string;
  image_url: string | null;
  like_count: number;
  reply_count: number;
  created_at: string;
  author_id: string;
  author_name: string | null;
  author_username: string;
  author_avatar: string | null;
  liked_by_me: boolean;
};

type RecipeDetail = {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  thumbnail_url: string | null;
  prep_time_min: number | null;
  cook_time_min: number | null;
  total_time_min: number | null;
  servings: number | null;
  servings_unit: string | null;
  difficulty: string | null;
  status: string;
  avg_rating: number | string | null;
  rating_count: number;
  save_count: number;
  view_count: number;
  is_own_recipe: boolean;
  author: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
  follow_state: "accepted" | "pending" | null;
  ingredients: Ingredient[];
  sections: Section[];
  steps: Step[];
  tags: Tag[];
  unit_conversions: UnitConversion[];
  nutrition: Nutrition;
  recent_tips: Tip[];
  my_rating: number | null;
  is_saved: boolean;
  has_allergen_conflict: boolean;
};

const diffLabels: Record<string, string> = {
  easy: "Dễ",
  medium: "Vừa",
  hard: "Khó",
};

const statusNotices: Record<string, { label: string; className: string }> = {
  pending_review: {
    label: "Bài đang chờ duyệt — chỉ mình bạn thấy được lúc này.",
    className: "bg-mango/15 text-amber-700",
  },
  draft: {
    label: "Đây là bản nháp — chỉ mình bạn thấy được lúc này.",
    className: "bg-pink-500/10 text-ink-soft",
  },
  rejected: {
    label: "Bài đã bị từ chối duyệt — chỉ mình bạn thấy được lúc này.",
    className: "bg-pink-500/15 text-pink-600",
  },
  archived: {
    label: "Bài đã được lưu trữ — chỉ mình bạn thấy được lúc này.",
    className: "bg-pink-500/10 text-ink-soft",
  },
};

function formatMinutes(min: number | null) {
  if (!min) return "—";
  if (min < 60) return `${min} phút`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}g ${m}p` : `${h} giờ`;
}

export default async function RecipeDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.rpc("get_recipe_detail", { p_slug: slug });

  if (!data) {
    notFound();
  }

  const recipe = data as RecipeDetail;

  // Ghi nhận lượt xem — không chặn render nếu lỗi (vd bị rate-limit).
  await supabase.rpc("log_recipe_view", {
    p_recipe_id: recipe.id,
    p_source: "detail_page",
  });

  const avgRating =
    typeof recipe.avg_rating === "string"
      ? parseFloat(recipe.avg_rating)
      : recipe.avg_rating ?? 0;

  const statusNotice = statusNotices[recipe.status];
  const isLoggedIn = Boolean(user);

  // Lấy username/tên hiển thị thật của người đang xem, để bình luận/trả
  // lời vừa gửi (cập nhật lạc quan) link đúng /u/[username] thay vì
  // placeholder giả "Bạn"/"ban".
  let myUsername = "";
  let myDisplayName = "";
  if (user) {
    const { data: myProfile } = await supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .maybeSingle();
    myUsername = myProfile?.username ?? "";
    myDisplayName = myProfile?.display_name ?? "";
  }

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="discover" />

      <div className="max-w-[880px] mx-auto px-6 py-10 w-full">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về trang chủ
        </Link>

        {recipe.is_own_recipe && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            {statusNotice ? (
              <div
                className={`rounded-2xl px-4 py-3 text-[13.5px] font-semibold ${statusNotice.className}`}
              >
                {statusNotice.label}
              </div>
            ) : (
              <span />
            )}
            <div className="flex items-center gap-2.5">
              <Link
                href={`/account/recipes/${recipe.id}/edit`}
                className="inline-flex items-center justify-center rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
              >
                Sửa công thức
              </Link>
              <DeleteRecipeButton recipeId={recipe.id} />
            </div>
          </div>
        )}

        {recipe.has_allergen_conflict && (
          <div className="mb-6 rounded-2xl bg-pink-500/15 px-4 py-3 text-[13.5px] font-semibold text-pink-600">
            ⚠️ Công thức này chứa nguyên liệu bạn đã khai báo dị ứng. Xem kỹ
            danh sách nguyên liệu bên dưới trước khi nấu.
          </div>
        )}

        {/* HERO */}
        <div className="relative h-[240px] sm:h-[320px] rounded-[28px] overflow-hidden bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center mb-7">
          <IconBowl className="w-20 h-20 text-pink-400" />
          {recipe.difficulty && (
            <span className="absolute top-4 left-4 rounded-full bg-surface/90 px-3 py-1.5 text-[12.5px] font-bold text-ink-soft">
              {diffLabels[recipe.difficulty] ?? recipe.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-[560px]">
            <h1 className="font-display font-extrabold text-[26px] sm:text-[34px] leading-tight">
              {recipe.title}
            </h1>
            {recipe.description && (
              <p className="mt-3 text-[15px] text-ink-soft leading-relaxed">
                {recipe.description}
              </p>
            )}
          </div>
          <SaveButton
            recipeId={recipe.id}
            slug={recipe.slug}
            initialSaved={recipe.is_saved}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* RATING */}
        <div className="mt-4">
          <RatingWidget
            recipeId={recipe.id}
            slug={recipe.slug}
            avgRating={avgRating}
            ratingCount={recipe.rating_count}
            initialMyRating={recipe.my_rating}
            isLoggedIn={isLoggedIn}
          />
        </div>

        {/* AUTHOR */}
        {recipe.author && (
          <div className="mt-5 flex items-center justify-between gap-3 flex-wrap">
            <Link
              href={`/u/${recipe.author.username}`}
              className="flex items-center gap-3 group"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100">
                <IconChefHat className="h-5 w-5 text-pink-500" />
              </div>
              <div>
                <b className="text-[14px] group-hover:text-pink-600 transition-colors">
                  {recipe.author.display_name || recipe.author.username}
                </b>
                <span className="ml-2 text-[13px] text-ink-soft">
                  @{recipe.author.username}
                </span>
              </div>
            </Link>
            {!recipe.is_own_recipe && (
              <FollowButton
                authorId={recipe.author.id}
                slug={recipe.slug}
                initialState={recipe.follow_state}
                isLoggedIn={isLoggedIn}
              />
            )}
          </div>
        )}

        {/* ACTIONS: shopping list / collection / report */}
        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <ShoppingListButton
            recipeId={recipe.id}
            originalServings={recipe.servings}
            isLoggedIn={isLoggedIn}
          />
          <CollectionsMenu
            recipeId={recipe.id}
            slug={recipe.slug}
            isLoggedIn={isLoggedIn}
          />
          <div className="ml-auto">
            <ReportButton
              targetType="recipe"
              targetId={recipe.id}
              isLoggedIn={isLoggedIn}
            />
          </div>
        </div>

        {/* META */}
        <div className="mt-7 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-[16px] bg-pink-50 px-3 py-4 text-center">
            <IconClock className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <b className="block text-[14px]">{formatMinutes(recipe.total_time_min)}</b>
            <span className="text-[11.5px] text-ink-soft">Tổng thời gian</span>
          </div>
          <div className="rounded-[16px] bg-pink-50 px-3 py-4 text-center">
            <IconUsers className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <b className="block text-[14px]">
              {recipe.servings ?? "—"} {recipe.servings_unit || ""}
            </b>
            <span className="text-[11.5px] text-ink-soft">Khẩu phần</span>
          </div>
          <div className="rounded-[16px] bg-pink-50 px-3 py-4 text-center">
            <IconFlame className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <b className="block text-[14px]">{recipe.save_count}</b>
            <span className="text-[11.5px] text-ink-soft">Lượt lưu</span>
          </div>
          <div className="rounded-[16px] bg-pink-50 px-3 py-4 text-center">
            <IconEye className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <b className="block text-[14px]">{recipe.view_count}</b>
            <span className="text-[11.5px] text-ink-soft">Lượt xem</span>
          </div>
        </div>

        {/* TAGS */}
        {recipe.tags.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {recipe.tags.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-pink-100 px-3 py-1.5 text-[12.5px] font-semibold text-pink-600"
              >
                {t.name}
              </span>
            ))}
          </div>
        )}

        {/* INGREDIENTS */}
        <section className="mt-10">
          <h2 className="font-display font-extrabold text-[20px] mb-4">
            Nguyên liệu
          </h2>
          <IngredientsPanel
            ingredients={recipe.ingredients}
            sections={recipe.sections}
            originalServings={recipe.servings}
            servingsUnit={recipe.servings_unit}
            unitConversions={recipe.unit_conversions}
          />
        </section>

        {/* STEPS */}
        <section className="mt-10">
          <h2 className="font-display font-extrabold text-[20px] mb-4">
            Các bước thực hiện
          </h2>
          {recipe.steps.length === 0 ? (
            <p className="text-[14px] text-ink-soft">
              Công thức chưa có hướng dẫn các bước.
            </p>
          ) : (
            <ol className="flex flex-col gap-5">
              {recipe.steps
                .sort((a, b) => a.position - b.position)
                .map((step) => (
                  <li key={step.id} className="flex gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-500 text-[14px] font-bold text-white">
                      {step.position}
                    </span>
                    <div className="pt-0.5">
                      <p className="text-[14.5px] leading-relaxed">{step.content}</p>
                      {step.timer_seconds && (
                        <span className="mt-1.5 inline-flex items-center gap-1 text-[12.5px] font-semibold text-pink-600">
                          <IconClock className="w-3.5 h-3.5" />
                          {Math.round(step.timer_seconds / 60)} phút
                        </span>
                      )}
                    </div>
                  </li>
                ))}
            </ol>
          )}
        </section>

        {/* NUTRITION */}
        {recipe.nutrition && (
          <section className="mt-10">
            <h2 className="font-display font-extrabold text-[20px] mb-4">
              Dinh dưỡng {recipe.nutrition.per_serving ? "(mỗi khẩu phần)" : "(cả món)"}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ["Calo", recipe.nutrition.calories, "kcal"],
                ["Đạm", recipe.nutrition.protein_g, "g"],
                ["Béo", recipe.nutrition.fat_g, "g"],
                ["Tinh bột", recipe.nutrition.carbs_g, "g"],
              ].map(([label, value, unit]) => (
                <div
                  key={label as string}
                  className="rounded-[16px] bg-pink-50 px-3 py-4 text-center"
                >
                  <b className="block text-[15px]">
                    {value != null ? `${value}${unit}` : "—"}
                  </b>
                  <span className="text-[11.5px] text-ink-soft">{label}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* TIPS / COMMENTS */}
        <section className="mt-10">
          <h2 className="font-display font-extrabold text-[20px] mb-4">
            Mẹo từ cộng đồng
          </h2>
          <TipsSection
            recipeId={recipe.id}
            slug={recipe.slug}
            initialTips={recipe.recent_tips}
            isLoggedIn={isLoggedIn}
            myUsername={myUsername}
            myDisplayName={myDisplayName}
          />
        </section>
      </div>
    </div>
  );
}
