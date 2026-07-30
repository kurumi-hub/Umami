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
