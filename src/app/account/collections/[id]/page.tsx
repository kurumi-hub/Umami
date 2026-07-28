import Link from "next/link";
import { notFound } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import { IconBowl, IconClipboard, IconClock } from "@/app/icons";
import CollectionDetailActions from "./CollectionDetailActions";
import AddRecipesPanel from "./AddRecipesPanel";
import EditCollectionForm from "./EditCollectionForm";
import CollectionFollowButton from "./CollectionFollowButton";
import CopyLinkButton from "./CopyLinkButton";
import ReorderableRecipeGrid from "./ReorderableRecipeGrid";
import ReportButton from "@/app/cong-thuc/[slug]/ReportButton";

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

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // KHÔNG ép đăng nhập ở đây — bộ sưu tập công khai phải xem được cả
  // khi chưa đăng nhập (vào từ /bo-suu-tap). RLS "read collections" tự
  // trả về null nếu là bộ sưu tập riêng tư của người khác, khi đó
  // notFound() bên dưới sẽ tự kích hoạt.
  const { data: collection } = await supabase
    .from("collections")
    .select(
      "id, user_id, name, description, cover_url, is_public, recipe_count, follower_count"
    )
    .eq("id", id)
    .maybeSingle();

  if (!collection) {
    notFound();
  }

  const isOwner = Boolean(user) && collection.user_id === user!.id;

  const { data: isFollowingRow } = user && !isOwner
    ? await supabase
        .from("collection_followers")
        .select("collection_id")
        .eq("collection_id", id)
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  const { data: items } = await supabase
    .from("collection_recipes")
    .select(
      "recipe_id, position, recipes(id, title, slug, thumbnail_url, total_time_min, difficulty)"
    )
    .eq("collection_id", id)
    .order("position", { ascending: true });

  const recipes = (items ?? [])
    .map((it) => (Array.isArray(it.recipes) ? it.recipes[0] : it.recipes))
    .filter(Boolean) as {
    id: string;
    title: string;
    slug: string;
    thumbnail_url: string | null;
    total_time_min: number | null;
    difficulty: string | null;
  }[];

  // Chuẩn bị danh sách ứng viên để thêm vào bộ sưu tập: công thức của
  // chính mình + công thức đã lưu, gộp lại và loại trùng. Chỉ cần tải
  // khi là chủ sở hữu (người khác không có quyền thêm/bớt).
  let candidates: {
    id: string;
    title: string;
    slug: string;
    source: "mine" | "saved";
    in_collection: boolean;
  }[] = [];

  if (isOwner && user) {
    const inCollectionIds = new Set(recipes.map((r) => r.id));

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
    candidates = [];

    for (const r of mine ?? []) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      candidates.push({
        id: r.id,
        title: r.title,
        slug: r.slug,
        source: "mine",
        in_collection: inCollectionIds.has(r.id),
      });
    }
    for (const r of savedRecipes) {
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      candidates.push({
        id: r.id,
        title: r.title,
        slug: r.slug,
        source: "saved",
        in_collection: inCollectionIds.has(r.id),
      });
    }
  }

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

        {/* COVER */}
        <div className="relative h-[160px] sm:h-[200px] rounded-[24px] overflow-hidden bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center mb-7">
          {collection.cover_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={collection.cover_url}
              alt={collection.name}
              className="absolute inset-0 h-full w-full object-cover"
            />
          ) : (
            <IconClipboard className="w-16 h-16 text-pink-400" />
          )}
        </div>

        <div className="flex items-start justify-between gap-4 flex-wrap mb-3">
          <div className="max-w-[560px]">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="font-display font-extrabold text-[26px] sm:text-[34px]">
                {collection.name}
              </h1>
              {isOwner && (
                <EditCollectionForm
                  collectionId={collection.id}
                  initialName={collection.name}
                  initialDescription={collection.description ?? ""}
                />
              )}
            </div>
            {collection.description && (
              <p className="mt-2.5 text-ink-soft leading-relaxed">
                {collection.description}
              </p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-soft">
              <span>{collection.recipe_count} công thức</span>
              <span>·</span>
              <span>{collection.is_public ? "Công khai" : "Riêng tư"}</span>
              {collection.is_public && (
                <>
                  <span>·</span>
                  <span>{collection.follower_count} người theo dõi</span>
                  <span>·</span>
                  <CopyLinkButton />
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {isOwner ? (
              <>
                <AddRecipesPanel collectionId={collection.id} candidates={candidates} />
                <CollectionDetailActions
                  collectionId={collection.id}
                  initialIsPublic={collection.is_public}
                />
              </>
            ) : (
              <>
                {collection.is_public && (
                  <CollectionFollowButton
                    collectionId={collection.id}
                    initialFollowing={Boolean(isFollowingRow)}
                    isLoggedIn={Boolean(user)}
                  />
                )}
                <ReportButton
                  targetType="collection"
                  targetId={collection.id}
                  isLoggedIn={Boolean(user)}
                />
              </>
            )}
          </div>
        </div>

        <div className="mt-8">
          {recipes.length === 0 ? (
            <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
              Bộ sưu tập chưa có công thức nào.
              {isOwner && ' Bấm "Thêm công thức" ở trên để bắt đầu.'}
            </div>
          ) : isOwner ? (
            <ReorderableRecipeGrid collectionId={collection.id} initialRecipes={recipes} />
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {recipes.map((r) => (
                <Link
                  key={r.id}
                  href={`/cong-thuc/${r.slug}`}
                  className="bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)] block"
                >
                  <div className="h-[150px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
                    <IconBowl className="w-14 h-14 text-pink-400" />
                  </div>
                  <div className="p-4">
                    <h4 className="text-[15.5px] font-bold leading-snug line-clamp-2">
                      {r.title}
                    </h4>
                    <div className="mt-3 flex items-center justify-between text-[12.5px] text-ink-soft">
                      <span className="flex items-center gap-1">
                        <IconClock className="w-3.5 h-3.5" />
                        {formatMinutes(r.total_time_min)}
                      </span>
                      {r.difficulty && (
                        <span>{diffLabels[r.difficulty] ?? r.difficulty}</span>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
