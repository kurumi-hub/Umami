import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import WeekGrid from "./WeekGrid";

function toISODate(d: Date) {
  return d.toISOString().slice(0, 10);
}

// Thứ 2 của tuần chứa ngày `d` — tuần theo lịch thật (Thứ 2 -> Chủ nhật).
function mondayOf(d: Date) {
  const day = d.getDay(); // 0 = Chủ nhật, 1 = Thứ 2, ...
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

export default async function MealPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string }>;
}) {
  const { start } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const baseDate = start ? new Date(start + "T00:00:00") : new Date();
  const monday = mondayOf(isNaN(baseDate.getTime()) ? new Date() : baseDate);
  const startDate = toISODate(monday);

  const weekDates = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return toISODate(d);
  });

  const prevWeek = new Date(monday);
  prevWeek.setDate(monday.getDate() - 7);
  const nextWeek = new Date(monday);
  nextWeek.setDate(monday.getDate() + 7);

  const { data: entries } = await supabase.rpc("get_week_meal_plan", {
    p_start_date: startDate,
  });

  // Danh sách ứng viên để thêm vào kế hoạch: công thức của bạn + đã lưu,
  // gộp lại và loại trùng — giống cách làm cho "Thêm công thức" ở bộ
  // sưu tập.
  const [{ data: mine }, { data: savedRows }] = await Promise.all([
    supabase
      .from("recipes")
      .select("id, title, slug")
      .eq("author_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
    supabase
      .from("saved_recipes")
      .select("recipe_id, recipes(id, title, slug)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);

  const savedRecipes = (savedRows ?? [])
    .map((row) => (Array.isArray(row.recipes) ? row.recipes[0] : row.recipes))
    .filter(Boolean) as { id: string; title: string; slug: string }[];

  const seen = new Set<string>();
  const candidates: { id: string; title: string; slug: string }[] = [];
  for (const r of mine ?? []) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    candidates.push(r);
  }
  for (const r of savedRecipes) {
    if (seen.has(r.id)) continue;
    seen.add(r.id);
    candidates.push(r);
  }

  const today = toISODate(new Date());

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
            Kế hoạch bữa ăn
          </h1>
          <div className="flex items-center gap-2">
            <Link
              href={`/account/meal-plan?start=${toISODate(prevWeek)}`}
              className="rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
            >
              ← Tuần trước
            </Link>
            <Link
              href="/account/meal-plan"
              className="rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
            >
              Tuần này
            </Link>
            <Link
              href={`/account/meal-plan?start=${toISODate(nextWeek)}`}
              className="rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
            >
              Tuần sau →
            </Link>
          </div>
        </div>

        <WeekGrid
          weekDates={weekDates}
          today={today}
          startDate={startDate}
          initialEntries={entries ?? []}
          candidates={candidates}
        />
      </div>
    </div>
  );
}
