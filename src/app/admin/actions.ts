"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

async function requireAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false as const, error: "Cần đăng nhập." };

  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);
  const isAdmin = (roles ?? []).some((r) => r.role === "admin");
  if (!isAdmin) return { ok: false as const, error: "Bạn không có quyền admin." };

  return { ok: true as const, userId: user.id };
}

// ---------------------------------------------------------------------
// 1. Cài đặt kiểm duyệt hệ thống
// ---------------------------------------------------------------------
export async function updateModerationSettings(
  autoHideThreshold: number | null,
  reportsPerDayLimit: number | null,
  requireFirstPostReview: boolean | null
) {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if (!guard.ok) return { error: guard.error };

  const { error } = await supabase.rpc("admin_update_moderation_settings", {
    p_auto_hide_threshold: autoHideThreshold,
    p_reports_per_day_limit: reportsPerDayLimit,
    p_require_first_post_review: requireFirstPostReview,
  });

  if (error) return { error: "Không thể lưu cài đặt, thử lại sau." };

  revalidatePath("/admin");
  return { error: null };
}

// ---------------------------------------------------------------------
// 2. Phân quyền user
// ---------------------------------------------------------------------
export async function searchUserByUsername(query: string) {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if (!guard.ok) return { error: guard.error, users: [] };

  const q = query.trim();
  if (q.length < 2) return { error: null, users: [] };

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, display_name")
    .ilike("username", `%${q}%`)
    .limit(8);

  if (error) return { error: "Không thể tìm user.", users: [] };

  const ids = (profiles ?? []).map((p) => p.id);
  const { data: roles } = ids.length
    ? await supabase.from("user_roles").select("user_id, role").in("user_id", ids)
    : { data: [] };

  const rolesByUser = new Map<string, string[]>();
  for (const r of roles ?? []) {
    const list = rolesByUser.get(r.user_id) ?? [];
    list.push(r.role);
    rolesByUser.set(r.user_id, list);
  }

  return {
    error: null,
    users: (profiles ?? []).map((p) => ({
      id: p.id,
      username: p.username,
      display_name: p.display_name,
      roles: rolesByUser.get(p.id) ?? [],
    })),
  };
}

export async function grantRole(userId: string, role: "moderator" | "admin") {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if (!guard.ok) return { error: guard.error };

  const { error } = await supabase.rpc("admin_grant_role", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) return { error: "Không thể cấp quyền, thử lại sau." };

  revalidatePath("/admin");
  return { error: null };
}

export async function revokeRole(userId: string, role: "moderator" | "admin") {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if (!guard.ok) return { error: guard.error };

  const { error } = await supabase.rpc("admin_revoke_role", {
    p_user_id: userId,
    p_role: role,
  });

  if (error) {
    // RPC tự chặn 2 trường hợp và raise message tiếng Việt rõ ràng —
    // hiện thẳng message đó thay vì lời chung chung, vì nó đã dễ hiểu.
    return { error: error.message || "Không thể thu hồi quyền, thử lại sau." };
  }

  revalidatePath("/admin");
  return { error: null };
}

// ---------------------------------------------------------------------
// 3. Xoá vĩnh viễn công thức
// ---------------------------------------------------------------------
export async function searchRecipeForDeletion(query: string) {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if (!guard.ok) return { error: guard.error, recipes: [] };

  const q = query.trim();
  if (q.length < 2) return { error: null, recipes: [] };

  const { data, error } = await supabase.rpc("admin_search_recipes", {
    q,
    lim: 8,
  });

  if (error) return { error: "Không thể tìm công thức.", recipes: [] };

  const recipes = (data ?? []).map(
    (r: {
      recipe_id: string;
      title: string;
      slug: string;
      status: string;
      created_at: string;
      author_name: string | null;
      author_username: string | null;
    }) => ({
      id: r.recipe_id,
      title: r.title,
      slug: r.slug,
      status: r.status,
      created_at: r.created_at,
      author_name: r.author_name || r.author_username || "Không rõ",
    })
  );

  return { error: null, recipes };
}

export async function adminDeleteRecipe(recipeId: string, reason: string) {
  const supabase = await createClient();
  const guard = await requireAdmin(supabase);
  if (!guard.ok) return { error: guard.error };

  if (!reason.trim()) return { error: "Phải nêu lý do xoá." };

  const { error } = await supabase.rpc("admin_delete_recipe", {
    p_recipe_id: recipeId,
    p_reason: reason.trim(),
  });

  if (error) return { error: "Không thể xoá công thức, thử lại sau." };

  revalidatePath("/admin");
  return { error: null };
}
