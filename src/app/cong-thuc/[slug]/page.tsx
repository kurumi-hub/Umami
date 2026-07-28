import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import {
  IconBowl,
  IconChefHat,
  IconClock,
  IconFlame,
  IconStar,
  IconUsers,
} from "@/app/icons";
import SaveButton from "./SaveButton";

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
  created_at: string;
  author_name: string | null;
  author_username: string | null;
  author_avatar: string | null;
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
  ingredients: Ingredient[];
  sections: Section[];
  steps: Step[];
  tags: Tag[];
  nutrition: Nutrition;
  recent_tips: Tip[];
  is_saved: boolean;
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

function formatQuantity(q: number | null) {
  if (q === null) return "";
  return Number.isInteger(q) ? String(q) : String(q).replace(/\.?0+$/, "");
}

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <div className="flex gap-0.5 text-mango">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} className="w-4 h-4" filled={i < rounded} />
      ))}
    </div>
  );
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

  const ingredientsBySection = new Map<string | null, Ingredient[]>();
  for (const ing of recipe.ingredients) {
    const key = ing.section_id;
    if (!ingredientsBySection.has(key)) ingredientsBySection.set(key, []);
    ingredientsBySection.get(key)!.push(ing);
  }
  const sectionName = new Map(recipe.sections.map((s) => [s.id, s.name]));

  const statusNotice = statusNotices[recipe.status];

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

        {recipe.is_own_recipe && statusNotice && (
          <div
            className={`mb-6 rounded-2xl px-4 py-3 text-[13.5px] font-semibold ${statusNotice.className}`}
          >
            {statusNotice.label}
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
            isLoggedIn={Boolean(user)}
          />
        </div>

        {/* AUTHOR */}
        {recipe.author && (
          <div className="mt-5 flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100">
              <IconChefHat className="h-5 w-5 text-pink-500" />
            </div>
            <div>
              <b className="text-[14px]">
                {recipe.author.display_name || recipe.author.username}
              </b>
              <span className="ml-2 text-[13px] text-ink-soft">
                @{recipe.author.username}
              </span>
            </div>
          </div>
        )}

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
            <div className="flex items-center justify-center mb-1">
              <Stars rating={avgRating} />
            </div>
            <b className="block text-[14px]">
              {avgRating > 0 ? avgRating.toFixed(1) : "Chưa có"}
            </b>
            <span className="text-[11.5px] text-ink-soft">
              {recipe.rating_count} đánh giá
            </span>
          </div>
          <div className="rounded-[16px] bg-pink-50 px-3 py-4 text-center">
            <IconFlame className="h-5 w-5 text-pink-500 mx-auto mb-1" />
            <b className="block text-[14px]">{recipe.save_count}</b>
            <span className="text-[11.5px] text-ink-soft">Lượt lưu</span>
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
          {recipe.ingredients.length === 0 ? (
            <p className="text-[14px] text-ink-soft">
              Công thức chưa có danh sách nguyên liệu.
            </p>
          ) : (
            <div className="flex flex-col gap-6">
              {Array.from(ingredientsBySection.entries()).map(([secId, items]) => (
                <div key={secId ?? "none"}>
                  {secId && sectionName.get(secId) && (
                    <h3 className="mb-2.5 text-[14.5px] font-bold text-pink-600">
                      {sectionName.get(secId)}
                    </h3>
                  )}
                  <ul className="flex flex-col gap-2">
                    {items
                      .sort((a, b) => a.position - b.position)
                      .map((ing) => (
                        <li
                          key={ing.id}
                          className="flex items-baseline gap-2 text-[14.5px] rounded-xl bg-surface border border-pink-500/10 px-4 py-2.5"
                        >
                          <span className="font-bold text-ink min-w-[70px]">
                            {formatQuantity(ing.quantity)} {ing.unit || ""}
                          </span>
                          <span>{ing.raw_text || ing.name}</span>
                          {ing.is_optional && (
                            <span className="text-[12px] text-ink-soft">
                              (tuỳ chọn)
                            </span>
                          )}
                        </li>
                      ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
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

        {/* TIPS */}
        <section className="mt-10">
          <h2 className="font-display font-extrabold text-[20px] mb-4">
            Mẹo từ cộng đồng
          </h2>
          {recipe.recent_tips.length === 0 ? (
            <p className="text-[14px] text-ink-soft">
              Chưa có mẹo nào cho công thức này. Hãy là người đầu tiên chia sẻ!
            </p>
          ) : (
            <div className="flex flex-col gap-4">
              {recipe.recent_tips.map((tip) => (
                <div
                  key={tip.id}
                  className="rounded-[18px] border border-pink-500/10 bg-surface px-4 py-3.5"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <b className="text-[13.5px]">
                      {tip.author_name || tip.author_username}
                    </b>
                    <span className="text-[12px] text-ink-soft">
                      @{tip.author_username}
                    </span>
                  </div>
                  <p className="text-[14px] leading-relaxed">{tip.body}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
