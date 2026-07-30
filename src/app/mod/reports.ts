import type { createClient } from "@/utils/supabase/server";

type SupabaseClient = Awaited<ReturnType<typeof createClient>>;

export type ReportTargetType = "recipe" | "tip" | "reply" | "profile" | "collection";
export type ReportReason =
  | "spam"
  | "inappropriate"
  | "copyright"
  | "dangerous"
  | "harassment"
  | "other";

export type ReportEntry = {
  id: string;
  reason: ReportReason;
  detail: string | null;
  reporterId: string | null;
  reporterName: string | null;
  reporterUsername: string | null;
  createdAt: string;
};

export type ReportGroup = {
  key: string;
  targetType: ReportTargetType;
  targetId: string;
  openCount: number;
  reports: ReportEntry[];
  title: string;
  subtitle: string | null;
  href: string | null;
  authorId: string | null;
  authorName: string | null;
  authorUsername: string | null;
  isHidden: boolean;
};

type ReportRow = {
  report_id: string;
  target_type: ReportTargetType;
  target_id: string;
  reason: ReportReason;
  detail: string | null;
  reporter_id: string | null;
  open_count: number | string;
  created_at: string;
};

type ProfileLite = {
  id: string;
  username: string;
  display_name: string | null;
};

// Gom report theo (target_type, target_id) rồi nạp preview nội dung bị
// báo cáo (title/body/tác giả) cho từng nhóm. mod_report_queue chỉ trả
// report thô, không join nội dung — trang review recipe đã làm tương tự
// (join profiles riêng), ở đây làm thêm cho 4 loại target còn lại.
export async function loadReportQueue(
  supabase: SupabaseClient,
  state: "open" | "reviewing" | "resolved" | "dismissed" = "open",
  lim = 100
): Promise<{ groups: ReportGroup[]; error: string | null }> {
  const { data: rowsRaw, error } = await supabase.rpc("mod_report_queue", {
    p_state: state,
    lim,
  });

  if (error) {
    return { groups: [], error: error.message || "Không tải được hàng đợi báo cáo." };
  }

  const rows = (rowsRaw ?? []) as ReportRow[];
  if (rows.length === 0) return { groups: [], error: null };

  // Gom theo target, giữ thứ tự report cũ nhất trước (mod_report_queue
  // đã order by created_at).
  const groupMap = new Map<string, ReportGroup>();
  for (const r of rows) {
    const key = `${r.target_type}:${r.target_id}`;
    let g = groupMap.get(key);
    if (!g) {
      g = {
        key,
        targetType: r.target_type,
        targetId: r.target_id,
        openCount: Number(r.open_count),
        reports: [],
        title: "",
        subtitle: null,
        href: null,
        authorId: null,
        authorName: null,
        authorUsername: null,
        isHidden: false,
      };
      groupMap.set(key, g);
    }
    g.reports.push({
      id: r.report_id,
      reason: r.reason,
      detail: r.detail,
      reporterId: r.reporter_id,
      reporterName: null,
      reporterUsername: null,
      createdAt: r.created_at,
    });
  }
  const groups = Array.from(groupMap.values());

  const idsByType = (t: ReportTargetType) =>
    groups.filter((g) => g.targetType === t).map((g) => g.targetId);

  const recipeIds = idsByType("recipe");
  const tipIds = idsByType("tip");
  const replyIds = idsByType("reply");
  const profileIds = idsByType("profile");
  const collectionIds = idsByType("collection");

  const [recipesRes, tipsRes, repliesRes, profilesTargetRes, collectionsRes] = await Promise.all([
    recipeIds.length
      ? supabase
          .from("recipes")
          .select("id, slug, title, author_id, is_hidden")
          .in("id", recipeIds)
      : Promise.resolve({ data: [] }),
    tipIds.length
      ? supabase
          .from("recipe_tips")
          .select("id, body, recipe_id, user_id, is_hidden")
          .in("id", tipIds)
      : Promise.resolve({ data: [] }),
    replyIds.length
      ? supabase
          .from("tip_replies")
          .select("id, body, tip_id, user_id, is_hidden")
          .in("id", replyIds)
      : Promise.resolve({ data: [] }),
    profileIds.length
      ? supabase.from("profiles").select("id, username, display_name").in("id", profileIds)
      : Promise.resolve({ data: [] }),
    collectionIds.length
      ? supabase
          .from("collections")
          .select("id, name, user_id, is_hidden")
          .in("id", collectionIds)
      : Promise.resolve({ data: [] }),
  ]);

  const recipesData = (recipesRes.data ?? []) as {
    id: string;
    slug: string;
    title: string;
    author_id: string | null;
    is_hidden: boolean;
  }[];
  const tipsData = (tipsRes.data ?? []) as {
    id: string;
    body: string;
    recipe_id: string;
    user_id: string;
    is_hidden: boolean;
  }[];
  const repliesData = (repliesRes.data ?? []) as {
    id: string;
    body: string;
    tip_id: string;
    user_id: string;
    is_hidden: boolean;
  }[];
  const profilesTargetData = (profilesTargetRes.data ?? []) as ProfileLite[];
  const collectionsData = (collectionsRes.data ?? []) as {
    id: string;
    name: string;
    user_id: string;
    is_hidden: boolean;
  }[];

  // Tip cần slug công thức cha để dựng link -> lấy recipe_id từ tip,
  // reply cần đi qua tip -> recipe (2 chặng).
  const tipRecipeIds = Array.from(new Set(tipsData.map((t) => t.recipe_id)));
  const replyTipIds = Array.from(new Set(repliesData.map((r) => r.tip_id)));

  const [extraRecipesForTipsRes, tipsForRepliesRes] = await Promise.all([
    tipRecipeIds.length
      ? supabase.from("recipes").select("id, slug, title").in("id", tipRecipeIds)
      : Promise.resolve({ data: [] }),
    replyTipIds.length
      ? supabase.from("recipe_tips").select("id, recipe_id").in("id", replyTipIds)
      : Promise.resolve({ data: [] }),
  ]);

  const extraRecipesForTips = (extraRecipesForTipsRes.data ?? []) as {
    id: string;
    slug: string;
    title: string;
  }[];
  const tipsForReplies = (tipsForRepliesRes.data ?? []) as { id: string; recipe_id: string }[];

  const replyRecipeIds = Array.from(
    new Set(
      tipsForReplies
        .filter((t) => replyTipIds.includes(t.id))
        .map((t) => t.recipe_id)
    )
  );
  const extraRecipesForRepliesRes = replyRecipeIds.length
    ? await supabase.from("recipes").select("id, slug, title").in("id", replyRecipeIds)
    : { data: [] };
  const extraRecipesForReplies = (extraRecipesForRepliesRes.data ?? []) as {
    id: string;
    slug: string;
    title: string;
  }[];

  const recipeById = new Map(
    [...recipesData, ...extraRecipesForTips, ...extraRecipesForReplies].map((r) => [r.id, r])
  );
  const tipParentRecipeId = new Map(tipsForReplies.map((t) => [t.id, t.recipe_id]));

  // Toàn bộ author_id / user_id / reporter_id cần lấy tên hiển thị.
  const allProfileIds = new Set<string>();
  recipesData.forEach((r) => r.author_id && allProfileIds.add(r.author_id));
  tipsData.forEach((t) => allProfileIds.add(t.user_id));
  repliesData.forEach((r) => allProfileIds.add(r.user_id));
  collectionsData.forEach((c) => allProfileIds.add(c.user_id));
  profilesTargetData.forEach((p) => allProfileIds.add(p.id));
  rows.forEach((r) => r.reporter_id && allProfileIds.add(r.reporter_id));

  const { data: allProfilesRaw } = allProfileIds.size
    ? await supabase
        .from("profiles")
        .select("id, username, display_name")
        .in("id", Array.from(allProfileIds))
    : { data: [] as ProfileLite[] };
  const profileById = new Map((allProfilesRaw ?? []).map((p) => [p.id, p]));

  const recipeById2 = new Map(recipesData.map((r) => [r.id, r]));
  const tipById = new Map(tipsData.map((t) => [t.id, t]));
  const replyById = new Map(repliesData.map((r) => [r.id, r]));
  const profileTargetById = new Map(profilesTargetData.map((p) => [p.id, p]));
  const collectionById = new Map(collectionsData.map((c) => [c.id, c]));

  function truncate(text: string, n: number) {
    return text.length > n ? `${text.slice(0, n).trim()}…` : text;
  }

  for (const g of groups) {
    for (const rep of g.reports) {
      const reporter = rep.reporterId ? profileById.get(rep.reporterId) : undefined;
      rep.reporterName = reporter?.display_name ?? null;
      rep.reporterUsername = reporter?.username ?? null;
    }

    if (g.targetType === "recipe") {
      const recipe = recipeById2.get(g.targetId);
      const author = recipe?.author_id ? profileById.get(recipe.author_id) : undefined;
      g.title = recipe?.title ?? "Công thức đã bị xoá";
      g.href = recipe ? `/cong-thuc/${recipe.slug}` : null;
      g.authorId = recipe?.author_id ?? null;
      g.authorName = author?.display_name ?? null;
      g.authorUsername = author?.username ?? null;
      g.isHidden = recipe?.is_hidden ?? false;
    } else if (g.targetType === "tip") {
      const tip = tipById.get(g.targetId);
      const author = tip ? profileById.get(tip.user_id) : undefined;
      const parentRecipe = tip ? recipeById.get(tip.recipe_id) : undefined;
      g.title = tip ? truncate(tip.body, 140) : "Mẹo đã bị xoá";
      g.subtitle = parentRecipe ? `Trong công thức: ${parentRecipe.title}` : null;
      g.href = parentRecipe ? `/cong-thuc/${parentRecipe.slug}` : null;
      g.authorId = tip?.user_id ?? null;
      g.authorName = author?.display_name ?? null;
      g.authorUsername = author?.username ?? null;
      g.isHidden = tip?.is_hidden ?? false;
    } else if (g.targetType === "reply") {
      const reply = replyById.get(g.targetId);
      const author = reply ? profileById.get(reply.user_id) : undefined;
      const parentRecipeId = reply ? tipParentRecipeId.get(reply.tip_id) : undefined;
      const parentRecipe = parentRecipeId ? recipeById.get(parentRecipeId) : undefined;
      g.title = reply ? truncate(reply.body, 140) : "Phản hồi đã bị xoá";
      g.subtitle = parentRecipe ? `Trong công thức: ${parentRecipe.title}` : null;
      g.href = parentRecipe ? `/cong-thuc/${parentRecipe.slug}` : null;
      g.authorId = reply?.user_id ?? null;
      g.authorName = author?.display_name ?? null;
      g.authorUsername = author?.username ?? null;
      g.isHidden = reply?.is_hidden ?? false;
    } else if (g.targetType === "profile") {
      const profile = profileTargetById.get(g.targetId);
      g.title = profile?.display_name || profile?.username || "Người dùng đã xoá";
      g.subtitle = profile ? `@${profile.username}` : null;
      g.href = profile ? `/u/${profile.username}` : null;
      g.authorId = profile?.id ?? null;
      g.authorName = profile?.display_name ?? null;
      g.authorUsername = profile?.username ?? null;
    } else if (g.targetType === "collection") {
      const collection = collectionById.get(g.targetId);
      const author = collection ? profileById.get(collection.user_id) : undefined;
      g.title = collection?.name ?? "Bộ sưu tập đã bị xoá";
      g.authorId = collection?.user_id ?? null;
      g.authorName = author?.display_name ?? null;
      g.authorUsername = author?.username ?? null;
      g.isHidden = collection?.is_hidden ?? false;
    }
  }

  // Nhóm nào có report mới nhất lâu nhất (report đầu tiên cũ nhất) lên trước.
  groups.sort(
    (a, b) =>
      new Date(a.reports[0].createdAt).getTime() - new Date(b.reports[0].createdAt).getTime()
  );

  return { groups, error: null };
}
