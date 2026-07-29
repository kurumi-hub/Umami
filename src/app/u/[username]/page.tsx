import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import { IconBowl, IconChefHat, IconClipboard, IconClock, IconLock } from "@/app/icons";
import FollowActionButtons from "./FollowActionButtons";

type RecipeItem = {
  id: string;
  title: string;
  slug: string;
  total_time_min: number | null;
  difficulty: string | null;
};

type CollectionItem = {
  id: string;
  name: string;
  cover_url: string | null;
  recipe_count: number;
};

type PublicProfile = {
  id: string;
  username: string;
  display_name: string | null;
  bio?: string | null;
  avatar_url: string | null;
  is_private: boolean;
  recipe_count?: number;
  follower_count?: number;
  following_count?: number;
  can_view: boolean;
  is_own: boolean;
  follow_state: "accepted" | "pending" | null;
  is_blocked_by_me: boolean;
  recipes?: RecipeItem[];
  collections?: CollectionItem[];
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

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase.rpc("get_public_profile", {
    p_username: username,
  });

  if (!data) {
    notFound();
  }

  const profile = data as PublicProfile;

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="discover" />

      <div className="max-w-[880px] mx-auto px-6 py-10 w-full">
        <div className="bg-surface rounded-[24px] p-6 sm:p-8 border border-pink-500/10 shadow-[0_14px_30px_-20px_rgba(58,31,43,0.2)]">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-pink-100 mx-auto sm:mx-0">
                <IconChefHat className="h-9 w-9 text-pink-500" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="font-display font-extrabold text-[22px]">
                  {profile.display_name || profile.username}
                </h1>
                <span className="text-[13.5px] text-ink-soft">@{profile.username}</span>
                {profile.can_view && profile.bio && (
                  <p className="mt-2 text-[14px] text-ink-soft leading-relaxed max-w-[420px]">
                    {profile.bio}
                  </p>
                )}
              </div>
            </div>

            {!profile.is_own && (
              <FollowActionButtons
                userId={profile.id}
                initialFollowState={profile.follow_state}
                isLoggedIn={Boolean(user)}
              />
            )}
            {profile.is_own && (
              <Link
                href="/account/settings"
                className="rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
              >
                Sửa hồ sơ
              </Link>
            )}
          </div>

          {profile.can_view && (
            <div className="mt-7 grid grid-cols-3 gap-3">
              <div className="flex flex-col items-center gap-1 rounded-[18px] bg-pink-50 px-3 py-4 text-center">
                <IconClipboard className="h-5 w-5 text-pink-500" />
                <b className="font-display text-[18px]">{profile.recipe_count ?? 0}</b>
                <span className="text-[11.5px] text-ink-soft">Công thức</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-[18px] bg-pink-50 px-3 py-4 text-center">
                <b className="font-display text-[18px]">{profile.follower_count ?? 0}</b>
                <span className="text-[11.5px] text-ink-soft">Người theo dõi</span>
              </div>
              <div className="flex flex-col items-center gap-1 rounded-[18px] bg-pink-50 px-3 py-4 text-center">
                <b className="font-display text-[18px]">{profile.following_count ?? 0}</b>
                <span className="text-[11.5px] text-ink-soft">Đang theo dõi</span>
              </div>
            </div>
          )}
        </div>

        {!profile.can_view ? (
          <div className="mt-8 rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft flex flex-col items-center gap-2">
            <IconLock className="h-6 w-6 text-pink-400" />
            {profile.is_blocked_by_me
              ? "Bạn đã chặn người này."
              : "Tài khoản riêng tư — theo dõi để xem công thức và bộ sưu tập."}
          </div>
        ) : (
          <>
            <section className="mt-9">
              <h2 className="mb-4 text-[17px] font-bold">Công thức</h2>
              {!profile.recipes || profile.recipes.length === 0 ? (
                <p className="text-[14px] text-ink-soft">Chưa có công thức nào.</p>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {profile.recipes.map((r) => (
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
              )}
            </section>

            {profile.collections && profile.collections.length > 0 && (
              <section className="mt-9">
                <h2 className="mb-4 text-[17px] font-bold">Bộ sưu tập công khai</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {profile.collections.map((c) => (
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
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
