"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/utils/supabase/server";
import { createUploadUrl, publicUrlFor } from "@/utils/r2/r2";

const RULES = {
  image: { types: ["image/jpeg", "image/png", "image/webp"], maxMB: 5 },
  video: { types: ["video/mp4", "video/webm"], maxMB: 100 },
} as const;

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

// folder: "recipes" | "avatars" | "tips" | "collections"
export async function requestUpload(
  kind: "image" | "video",
  folder: "recipes" | "avatars" | "tips" | "collections",
  contentType: string,
  size: number
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." as const };

  const rule = RULES[kind];
  if (!(rule.types as readonly string[]).includes(contentType)) {
    return { error: "Định dạng file không được hỗ trợ." as const };
  }
  if (size <= 0 || size > rule.maxMB * 1024 * 1024) {
    return { error: `File tối đa ${rule.maxMB}MB.` as const };
  }

  // Key luôn bắt đầu bằng user.id → có thể kiểm tra quyền sở hữu khi lưu DB
  const key = `${user.id}/${folder}/${randomUUID()}.${EXT[contentType]}`;
  const uploadUrl = await createUploadUrl(key, contentType, size);

  return { error: null, uploadUrl, publicUrl: publicUrlFor(key) };
}