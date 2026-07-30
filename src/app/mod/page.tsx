import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import RecipeReviewCard, { type ReviewRecipe } from "./RecipeReviewCard";
import ReportQueueCard from "./ReportQueueCard";
import { loadReportQueue } from "./reports";
import TagIngredientManager from "./TagIngredientManager";
import UserModerationPanel from "./UserModerationPanel";
import HiddenRecipesManager from "./HiddenRecipesManager";

export default async function ModPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Tự kiểm tra lại quyền ngay trong trang — không chỉ dựa vào
  // middleware, phòng trường hợp matcher bị sót path nào đó. Query
  // thẳng user_roles thay vì đọc JWT để không bị trễ khi quyền vừa
  // được cấp/thu hồi.
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r) => r.role));
  const isModerator = roleSet.has("moderator") || roleSet.has("admin");
  const isAdmin = roleSet.has("admin");

  if (!isModerator) {
    redirect("/");
  }

  const { data: queueRaw, error: queueError } = await supabase.rpc(
    "mod_review_queue",
    { lim: 50 }
  );

  const queue = (queueRaw ?? []) as {
    id: string;
    slug: string;
    title: string;
    description: string | null;
    thumbnail_url: string | null;
    created_at: string;
    author_id: string | null;
  }[];

  const authorIds = Array.from(
    new Set(queue.map((r) => r.author_id).filter((id): id is string => Boolean(id)))
  );

  const { data: authors } = authorIds.length
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", authorIds)
    : { data: [] as { id: string; username: string; display_name: string | null }[] };

  const authorMap = new Map((authors ?? []).map((a) => [a.id, a]));

  const { groups: reportGroups, error: reportsError } = await loadReportQueue(supabase, "open", 100);

  const reviewRecipes: ReviewRecipe[] = queue.map((r) => {
    const author = r.author_id ? authorMap.get(r.author_id) : undefined;
    return {
      id: r.id,
      slug: r.slug,
      title: r.title,
      description: r.description,
      thumbnail_url: r.thumbnail_url,
      created_at: r.created_at,
      author_id: r.author_id,
      author_name: author?.display_name ?? null,
      author_username: author?.username ?? null,
    };
  });

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[880px] mx-auto px-6 py-10 w-full">
        <div className="mb-6 flex gap-2">
          <span className="rounded-full bg-pink-500 px-4 py-2 text-[13px] font-bold text-white">
            Quản trị nội dung
          </span>
          {isAdmin && (
            <Link
              href="/admin"
              className="rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
            >
              Quản trị hệ thống
            </Link>
          )}
        </div>

        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-2">
          Quản trị nội dung
        </h1>
        <p className="mb-8 text-[14px] text-ink-soft">
          Chỉ hiện với tài khoản có quyền moderator hoặc admin.
        </p>

        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2.5">
            <h2 className="font-display font-extrabold text-[19px]">
              Hàng đợi duyệt công thức
            </h2>
            <span className="rounded-full bg-pink-100 px-2.5 py-1 text-[12px] font-bold text-pink-600">
              {reviewRecipes.length}
            </span>
          </div>

          {queueError ? (
            <div className="rounded-[20px] border border-pink-300/60 px-6 py-10 text-center text-[14px] text-pink-600">
              Không tải được hàng đợi, thử tải lại trang.
            </div>
          ) : reviewRecipes.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
              Không có bài nào đang chờ duyệt 🎉
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reviewRecipes.map((r) => (
                <RecipeReviewCard key={r.id} recipe={r} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <div className="mb-4 flex items-center gap-2.5">
            <h2 className="font-display font-extrabold text-[19px]">
              Hàng đợi báo cáo vi phạm
            </h2>
            <span className="rounded-full bg-pink-100 px-2.5 py-1 text-[12px] font-bold text-pink-600">
              {reportGroups.length}
            </span>
          </div>

          {reportsError ? (
            <div className="rounded-[20px] border border-pink-300/60 px-6 py-10 text-center text-[14px] text-pink-600">
              Không tải được hàng đợi báo cáo, thử tải lại trang.
            </div>
          ) : reportGroups.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
              Không có báo cáo nào đang chờ xử lý 🎉
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {reportGroups.map((g) => (
                <ReportQueueCard key={g.key} group={g} />
              ))}
            </div>
          )}
        </section>

        <section className="mb-10">
          <TagIngredientManager />
        </section>

        <section className="mb-10">
          <UserModerationPanel />
        </section>

        <section>
          <HiddenRecipesManager />
        </section>
      </div>
    </div>
  );
}
