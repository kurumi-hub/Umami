import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import { IconBowl, IconChefHat, IconClock, IconSparkle } from "@/app/icons";
import FeedTipCard from "./FeedTipCard";
import FollowButton from "@/app/cong-thuc/[slug]/FollowButton";

type FeedRow = {
  event_id: string;
  actor_id: string;
  actor_name: string | null;
  actor_username: string;
  actor_avatar: string | null;
  type: "published_recipe" | "tipped_recipe";
  created_at: string;
  recipe_id: string;
  recipe_slug: string;
  recipe_title: string;
  recipe_thumbnail_url: string | null;
  tip_id: string | null;
  tip_body: string | null;
  tip_like_count: number | null;
  tip_reply_count: number | null;
  liked_by_me: boolean | null;
  is_discover: boolean;
};

type SuggestedUser = {
  user_id: string;
  username: string;
  display_name: string | null;
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

function PublishedRecipeCard({ row, isDiscover }: { row: FeedRow; isDiscover: boolean }) {
  return (
    <article className="bg-surface rounded-[22px] p-5 sm:p-6 border border-pink-500/10 shadow-[0_14px_30px_-20px_rgba(58,31,43,0.2)]">
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-3">
          <Link href={`/u/${row.actor_username}`} className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100">
              <IconChefHat className="h-5 w-5 text-pink-500" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <b className="text-[14.5px] group-hover:text-pink-600 transition-colors">
                  {row.actor_name || row.actor_username}
                </b>
                <span className="text-[12.5px] text-ink-soft">@{row.actor_username}</span>
              </div>
              <span className="text-[12px] text-ink-soft">{timeAgo(row.created_at)}</span>
            </div>
          </Link>
        </div>
        {isDiscover && (
          <span className="shrink-0 flex items-center gap-1 rounded-full bg-mango/20 px-2.5 py-1 text-[10.5px] font-bold text-amber-700">
            <IconSparkle className="h-3 w-3" />
            Gợi ý cho bạn
          </span>
        )}
      </div>

      <p className="mb-3 text-[14.5px]">
        Vừa đăng công thức mới
      </p>

      <Link
        href={`/cong-thuc/${row.recipe_slug}`}
        className="block rounded-[18px] overflow-hidden border border-pink-500/10 hover:border-pink-500/30 transition-colors"
      >
        <div className="h-[140px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
          <IconBowl className="w-12 h-12 text-pink-400" />
        </div>
        <div className="p-4">
          <h4 className="text-[15px] font-bold">{row.recipe_title}</h4>
          <span className="mt-1.5 flex items-center gap-1 text-[12px] text-ink-soft">
            <IconClock className="w-3.5 h-3.5" />
            Xem công thức đầy đủ
          </span>
        </div>
      </Link>
    </article>
  );
}

function SuggestedUsersBlock({
  users,
  isLoggedIn,
}: {
  users: SuggestedUser[];
  isLoggedIn: boolean;
}) {
  if (users.length === 0) return null;
  return (
    <div className="bg-pink-50 rounded-[22px] p-5 sm:p-6">
      <h3 className="mb-4 text-[15px] font-bold">Gợi ý theo dõi</h3>
      <div className="flex flex-col gap-3">
        {users.map((u) => (
          <div key={u.user_id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface">
                <IconChefHat className="h-4 w-4 text-pink-500" />
              </div>
              <div className="min-w-0">
                <span className="block text-[13.5px] font-semibold truncate">
                  {u.display_name || u.username}
                </span>
                <span className="text-[11.5px] text-ink-soft">@{u.username}</span>
              </div>
            </div>
            <FollowButton
              authorId={u.user_id}
              slug=""
              initialState={null}
              isLoggedIn={isLoggedIn}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isLoggedIn = Boolean(user);

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

  const { data: feedData } = isLoggedIn
    ? await supabase.rpc("community_feed", { lim: 21 })
    : { data: null };

  const feed = (feedData as FeedRow[] | null) ?? [];

  let suggested: SuggestedUser[] = [];
  if (isLoggedIn) {
    const { data: sug } = await supabase.rpc("suggested_users", { lim: 5 });
    suggested = (sug as SuggestedUser[]) ?? [];

    // suggested_users() dựa trên bạn chung — tài khoản mới chưa follow ai
    // sẽ luôn trả về rỗng đúng lúc cần gợi ý nhất. Fallback: đầu bếp có
    // nhiều công thức nhất.
    if (suggested.length === 0) {
      const { data: fallback } = await supabase
        .from("profiles")
        .select("id, username, display_name")
        .gt("recipe_count", 0)
        .order("recipe_count", { ascending: false })
        .limit(5);
      suggested = (fallback ?? []).map((p) => ({
        user_id: p.id,
        username: p.username,
        display_name: p.display_name,
      }));
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="community" />

      <section className="max-w-[720px] mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
            Cộng đồng
          </div>
          <h1 className="font-display font-extrabold text-[26px] sm:text-[34px] mt-2">
            Công thức &amp; mẹo mới nhất
          </h1>
          <p className="mt-2.5 text-ink-soft leading-relaxed">
            Công thức mới đăng và mẹo vào bếp từ những người bạn theo dõi,
            xen lẫn vài gợi ý từ cộng đồng.
          </p>
        </div>

        {!isLoggedIn ? (
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            <Link href="/auth/login" className="font-bold text-pink-600 hover:underline">
              Đăng nhập
            </Link>{" "}
            để xem hoạt động từ cộng đồng và những người bạn theo dõi.
          </div>
        ) : (
          <div className="flex flex-col gap-5">
            {feed.length === 0 && <SuggestedUsersBlock users={suggested} isLoggedIn={isLoggedIn} />}

            {feed.map((row, i) => (
              <div key={row.event_id} className="flex flex-col gap-5">
                {row.type === "published_recipe" ? (
                  <PublishedRecipeCard row={row} isDiscover={row.is_discover} />
                ) : (
                  <FeedTipCard
                    tipId={row.tip_id!}
                    recipeSlug={row.recipe_slug}
                    recipeTitle={row.recipe_title}
                    authorName={row.actor_name}
                    authorUsername={row.actor_username}
                    createdAt={timeAgo(row.created_at)}
                    body={row.tip_body!}
                    likeCount={row.tip_like_count ?? 0}
                    replyCount={row.tip_reply_count ?? 0}
                    likedByMe={row.liked_by_me ?? false}
                    isDiscover={row.is_discover}
                    isLoggedIn={isLoggedIn}
                    myUsername={myUsername}
                    myDisplayName={myDisplayName}
                  />
                )}
                {/* Chèn gợi ý theo dõi giữa feed, ngay sau vài mục đầu */}
                {i === 4 && <SuggestedUsersBlock users={suggested} isLoggedIn={isLoggedIn} />}
              </div>
            ))}

            {feed.length === 0 && (
              <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
                Chưa có hoạt động nào để hiện. Theo dõi vài đầu bếp ở trên
                hoặc quay lại sau nhé!
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
