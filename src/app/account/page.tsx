import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import {
  IconBookmark,
  IconChefHat,
  IconClipboard,
  IconHeart,
  IconUsers,
} from "@/app/icons";

const statusLabels: Record<string, { label: string; className: string }> = {
  published: { label: "Đã đăng", className: "bg-mint/25 text-emerald-700" },
  pending_review: { label: "Chờ duyệt", className: "bg-mango/20 text-amber-700" },
  draft: { label: "Bản nháp", className: "bg-pink-500/10 text-ink-soft" },
  rejected: { label: "Bị từ chối", className: "bg-pink-500/15 text-pink-600" },
  archived: { label: "Đã lưu trữ", className: "bg-pink-500/10 text-ink-soft" },
};

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
  const { data: myRecipes } = await supabase
    .from("recipes")
    .select("id, title, slug, status, created_at")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(20);

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

      <section className="max-w-[720px] mx-auto px-6 py-10 w-full">
        <div className="bg-surface rounded-[24px] p-6 sm:p-8 border border-pink-500/10 shadow-[0_14px_30px_-20px_rgba(58,31,43,0.2)]">
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

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <IconClipboard className="h-5 w-5 text-pink-500" />
            <h2 className="text-[17px] font-bold">Công thức của bạn</h2>
          </div>
          {myRecipes && myRecipes.length > 0 ? (
            <div className="flex flex-col gap-3">
              {myRecipes.map((r) => {
                const status = statusLabels[r.status] ?? {
                  label: r.status,
                  className: "bg-pink-500/10 text-ink-soft",
                };
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-[16px] border border-pink-500/10 bg-surface px-4 py-3"
                  >
                    <span className="text-[14px] font-semibold truncate">
                      {r.title}
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-3 py-1 text-[11.5px] font-bold ${status.className}`}
                    >
                      {status.label}
                    </span>
                  </div>
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

        <div className="mt-8">
          <div className="flex items-center gap-2 mb-4">
            <IconBookmark className="h-5 w-5 text-pink-500" />
            <h2 className="text-[17px] font-bold">Công thức đã lưu</h2>
          </div>
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Bạn chưa lưu công thức nào. Khám phá và bấm biểu tượng bookmark để
            lưu lại món yêu thích nhé.
          </div>
        </div>
      </section>
    </div>
  );
}
