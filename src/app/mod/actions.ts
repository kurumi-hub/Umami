"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

function requireLogin(user: unknown) {
  if (!user) return { error: "Cần đăng nhập để thực hiện thao tác này." };
  return null;
}

export async function approveRecipe(recipeId: string, trustAuthor: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("mod_approve_recipe", {
    p_recipe_id: recipeId,
    p_trust_author: trustAuthor,
  });

  if (error) {
    return { error: error.message || "Không thể duyệt bài, thử lại sau." };
  }

  revalidatePath("/mod");
  revalidatePath("/cong-thuc/[slug]", "page");
  return { error: null };
}

// Bỏ qua toàn bộ report `open` đang gộp trên 1 target — không đụng tới
// nội dung, chỉ đóng report lại (state = dismissed).
export async function dismissReports(reportIds: string[], reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  for (const reportId of reportIds) {
    const { error } = await supabase.rpc("mod_resolve_report", {
      p_report_id: reportId,
      p_state: "dismissed",
      p_resolution: reason?.trim() || null,
    });
    if (error) {
      return { error: error.message || "Không thể bỏ qua báo cáo." };
    }
  }

  revalidatePath("/mod");
  return { error: null };
}

type ReportTargetType = "recipe" | "tip" | "reply" | "profile" | "collection";

// Xử lý toàn bộ report `open` đang gộp trên 1 target: tuỳ chọn ẩn nội
// dung trước (không áp dụng cho target "profile" — dùng mod_suspend_user
// cho tài khoản), sau đó đóng từng report state = resolved.
export async function resolveReports(
  reportIds: string[],
  targetType: ReportTargetType,
  targetId: string,
  hide: boolean,
  reason: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  if (hide) {
    if (!reason.trim()) {
      return { error: "Phải nêu lý do khi ẩn nội dung." };
    }

    const hideRpc =
      targetType === "recipe"
        ? supabase.rpc("mod_set_recipe_hidden", {
            p_recipe_id: targetId,
            p_hidden: true,
            p_reason: reason.trim(),
          })
        : targetType === "tip"
          ? supabase.rpc("mod_set_tip_hidden", {
              p_tip_id: targetId,
              p_hidden: true,
              p_reason: reason.trim(),
            })
          : targetType === "reply"
            ? supabase.rpc("mod_set_reply_hidden", {
                p_reply_id: targetId,
                p_hidden: true,
                p_reason: reason.trim(),
              })
            : targetType === "collection"
              ? supabase.rpc("mod_set_collection_hidden", {
                  p_collection_id: targetId,
                  p_hidden: true,
                  p_reason: reason.trim(),
                })
              : null;

    if (hideRpc) {
      const { error: hideError } = await hideRpc;
      if (hideError) {
        return { error: hideError.message || "Không thể ẩn nội dung." };
      }
    }
  }

  for (const reportId of reportIds) {
    const { error } = await supabase.rpc("mod_resolve_report", {
      p_report_id: reportId,
      p_state: "resolved",
      p_resolution: reason.trim() || null,
    });
    if (error) {
      return { error: error.message || "Không thể xử lý báo cáo." };
    }
  }

  revalidatePath("/mod");
  revalidatePath("/cong-thuc/[slug]", "page");
  return { error: null };
}

// ---------------------------------------------------------------------
// Quản lý tag & nguyên liệu
// ---------------------------------------------------------------------

export type TagType =
  | "cuisine"
  | "meal_type"
  | "diet"
  | "occasion"
  | "technique"
  | "main_ingredient";

export async function searchTags(query: string, type?: TagType) {
  const supabase = await createClient();
  let q = supabase
    .from("tags")
    .select("id, type, name, slug, image_url, position")
    .order("type")
    .order("position")
    .limit(30);

  if (type) q = q.eq("type", type);
  if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);

  const { data, error } = await q;
  if (error) return { error: error.message || "Không tìm được tag.", tags: [] };
  return { error: null, tags: data ?? [] };
}

export async function searchIngredients(query: string) {
  const supabase = await createClient();
  let q = supabase
    .from("ingredients")
    .select("id, name, slug, aisle, image_url, is_allergen")
    .order("name")
    .limit(30);

  if (query.trim()) q = q.ilike("name", `%${query.trim()}%`);

  const { data, error } = await q;
  if (error) {
    return { error: error.message || "Không tìm được nguyên liệu.", ingredients: [] };
  }
  return { error: null, ingredients: data ?? [] };
}

// on conflict (type, slug) do update — cùng type + slug sẽ được coi là
// sửa tag hiện có thay vì tạo mới, giống hệt cách mod_upsert_tag hoạt
// động ở DB. UI không cần API "edit" riêng.
export async function upsertTag(
  type: TagType,
  name: string,
  slug: string,
  imageUrl: string | null,
  position: number
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  if (!name.trim() || !slug.trim()) {
    return { error: "Phải nhập tên và slug." };
  }

  const { error } = await supabase.rpc("mod_upsert_tag", {
    p_type: type,
    p_name: name.trim(),
    p_slug: slug.trim(),
    p_image_url: imageUrl?.trim() || null,
    p_position: position,
  });

  if (error) return { error: error.message || "Không thể lưu tag." };

  revalidatePath("/mod");
  return { error: null };
}

// on conflict (slug) do update — cùng slug sẽ sửa nguyên liệu hiện có.
export async function upsertIngredient(
  name: string,
  slug: string,
  aisle: string | null,
  isAllergen: boolean,
  imageUrl: string | null
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  if (!name.trim() || !slug.trim()) {
    return { error: "Phải nhập tên và slug." };
  }

  const { error } = await supabase.rpc("mod_upsert_ingredient", {
    p_name: name.trim(),
    p_slug: slug.trim(),
    p_aisle: aisle?.trim() || null,
    p_is_allergen: isAllergen,
    p_image_url: imageUrl?.trim() || null,
  });

  if (error) return { error: error.message || "Không thể lưu nguyên liệu." };

  revalidatePath("/mod");
  return { error: null };
}

// ---------------------------------------------------------------------
// Khoá/mở khoá tài khoản, đánh dấu tin cậy
// ---------------------------------------------------------------------

export async function searchUsersForModeration(query: string) {
  const supabase = await createClient();
  const q = query.trim();
  if (q.length < 2) return { error: null, users: [] };

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, username, display_name, avatar_url, is_trusted, suspended_until")
    .ilike("username", `%${q}%`)
    .limit(8);

  if (error) return { error: error.message || "Không thể tìm user.", users: [] };

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
      ...p,
      roles: rolesByUser.get(p.id) ?? [],
    })),
  };
}

// p_days = null nghĩa là khoá vĩnh viễn, theo đúng mod_suspend_user().
// RPC tự chặn: không tự khoá bản thân, và moderator (không phải admin)
// không được khoá tài khoản đã có role (moderator/admin khác).
export async function suspendUser(userId: string, days: number | null, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  if (!reason.trim()) return { error: "Phải nêu lý do khoá tài khoản." };

  const { error } = await supabase.rpc("mod_suspend_user", {
    p_user_id: userId,
    p_days: days,
    p_reason: reason.trim(),
  });

  if (error) return { error: error.message || "Không thể khoá tài khoản." };

  revalidatePath("/mod");
  return { error: null };
}

export async function unsuspendUser(userId: string, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("mod_unsuspend_user", {
    p_user_id: userId,
    p_reason: reason?.trim() || null,
  });

  if (error) return { error: error.message || "Không thể mở khoá tài khoản." };

  revalidatePath("/mod");
  return { error: null };
}

export async function setUserTrusted(userId: string, trusted: boolean, reason?: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("mod_set_trusted", {
    p_user_id: userId,
    p_trusted: trusted,
    p_reason: reason?.trim() || null,
  });

  if (error) return { error: error.message || "Không thể cập nhật trạng thái tin cậy." };

  revalidatePath("/mod");
  return { error: null };
}

// ---------------------------------------------------------------------
// Nội dung nổi bật
// ---------------------------------------------------------------------

export async function searchRecipesForFeaturing(query: string) {
  const supabase = await createClient();
  const q = query.trim();
  if (q.length < 2) return { error: null, recipes: [] };

  const { data, error } = await supabase
    .from("recipes")
    .select("id, slug, title, thumbnail_url, is_featured, author_id")
    .eq("status", "published")
    .ilike("title", `%${q}%`)
    .limit(8);

  if (error) return { error: error.message || "Không thể tìm công thức.", recipes: [] };
  return { error: null, recipes: data ?? [] };
}

export async function setRecipeFeatured(recipeId: string, featured: boolean) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("mod_set_featured", {
    p_recipe_id: recipeId,
    p_featured: featured,
  });

  if (error) return { error: error.message || "Không thể cập nhật nội dung nổi bật." };

  revalidatePath("/mod");
  revalidatePath("/cong-thuc/[slug]", "page");
  revalidatePath("/");
  return { error: null };
}

export async function rejectRecipe(recipeId: string, reason: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  if (!reason.trim()) {
    return { error: "Phải nêu lý do từ chối." };
  }

  const { error } = await supabase.rpc("mod_reject_recipe", {
    p_recipe_id: recipeId,
    p_reason: reason.trim(),
  });

  if (error) {
    return { error: error.message || "Không thể từ chối bài, thử lại sau." };
  }

  revalidatePath("/mod");
  revalidatePath("/cong-thuc/[slug]", "page");
  return { error: null };
}

// ---------------------------------------------------------------------
// Công thức đã ẩn — tìm lại và hiện lại
// ---------------------------------------------------------------------

export async function searchHiddenRecipes(query: string) {
  const supabase = await createClient();

  const { data, error } = await supabase.rpc("mod_search_hidden_recipes", {
    q: query.trim() || null,
    lim: 20,
  });

  if (error) {
    return { error: error.message || "Không thể tải danh sách công thức đã ẩn.", recipes: [] };
  }

  return { error: null, recipes: data ?? [] };
}

export async function unhideRecipe(recipeId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const guard = requireLogin(user);
  if (guard) return guard;

  const { error } = await supabase.rpc("mod_set_recipe_hidden", {
    p_recipe_id: recipeId,
    p_hidden: false,
  });

  if (error) return { error: error.message || "Không thể hiện lại công thức." };

  revalidatePath("/mod");
  revalidatePath("/cong-thuc/[slug]", "page");
  return { error: null };
}
