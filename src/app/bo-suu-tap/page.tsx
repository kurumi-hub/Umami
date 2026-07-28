import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import { IconClipboard, IconHeart } from "@/app/icons";
import CollectionFollowButton from "@/app/account/collections/[id]/CollectionFollowButton";

const PAGE_SIZE = 24;

type PublicCollection = {
  collection_id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  recipe_count: number;
  follower_count: number;
  owner_id: string;
  owner_name: string | null;
  owner_username: string;
  total_count: number;
};

export default async function DiscoverCollectionsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  const { q: qParam, page: pageParam } = await searchParams;
  const q = (qParam || "").trim();
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: results } = await supabase.rpc("search_public_collections", {
    q: q || null,
    lim: PAGE_SIZE,
    off: offset,
  });

  const collections = (results ?? []) as PublicCollection[];
  const total = collections[0]?.total_count ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  let followingIds = new Set<string>();
  if (user && collections.length > 0) {
    const { data: followRows } = await supabase
      .from("collection_followers")
      .select("collection_id")
      .eq("user_id", user.id)
      .in(
        "collection_id",
        collections.map((c) => c.collection_id)
      );
    followingIds = new Set((followRows ?? []).map((r) => r.collection_id));
  }

  function pageHref(nextPage: number) {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    params.set("page", String(nextPage));
    return `/bo-suu-tap?${params.toString()}`;
  }

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="discover" />

      <div className="max-w-[1160px] mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
            Khám phá
          </div>
          <h1 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
            Bộ sưu tập công khai
          </h1>
          <p className="mt-2.5 text-ink-soft leading-relaxed">
            Xem cách người khác nhóm công thức theo chủ đề, và theo dõi để
            nhận cập nhật khi có món mới.
          </p>
        </div>

        <form className="mb-8 max-w-[420px]">
          <input
            type="search"
            name="q"
            defaultValue={q}
            placeholder="Tìm bộ sưu tập theo tên..."
            className="w-full rounded-full border border-pink-300/70 bg-surface px-4 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15"
          />
        </form>

        {collections.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            {q
              ? "Không tìm thấy bộ sưu tập nào phù hợp."
              : "Chưa có bộ sưu tập công khai nào."}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {collections.map((c) => (
                <div
                  key={c.collection_id}
                  className="bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)]"
                >
                  <Link href={`/account/collections/${c.collection_id}`} className="block">
                    <div className="relative h-[130px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                      {c.cover_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={c.cover_url}
                          alt={c.name}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      ) : (
                        <IconClipboard className="w-10 h-10 text-pink-400" />
                      )}
                    </div>
                    <div className="p-4 pb-2">
                      <h4 className="text-[15px] font-bold leading-snug line-clamp-2">
                        {c.name}
                      </h4>
                      <p className="mt-1 text-[12px] text-ink-soft">
                        {c.owner_name || c.owner_username} · {c.recipe_count} công thức
                      </p>
                      <span className="mt-1.5 flex items-center gap-1 text-[11.5px] text-ink-soft">
                        <IconHeart className="h-3 w-3" />
                        {c.follower_count} người theo dõi
                      </span>
                    </div>
                  </Link>
                  <div className="px-4 pb-4">
                    <CollectionFollowButton
                      collectionId={c.collection_id}
                      initialFollowing={followingIds.has(c.collection_id)}
                      isLoggedIn={Boolean(user)}
                    />
                  </div>
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-10 flex items-center justify-center gap-3">
                <Link
                  href={pageHref(Math.max(1, page - 1))}
                  aria-disabled={page <= 1}
                  className={`rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 transition-colors ${
                    page <= 1 ? "pointer-events-none opacity-40" : "hover:bg-pink-50"
                  }`}
                >
                  ← Trước
                </Link>
                <span className="text-[13.5px] text-ink-soft">
                  Trang {page}/{totalPages}
                </span>
                <Link
                  href={pageHref(Math.min(totalPages, page + 1))}
                  aria-disabled={page >= totalPages}
                  className={`rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 transition-colors ${
                    page >= totalPages
                      ? "pointer-events-none opacity-40"
                      : "hover:bg-pink-50"
                  }`}
                >
                  Sau →
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
