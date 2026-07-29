"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function unfollowUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", user.id)
    .eq("followee_id", userId);

  if (error) return { error: "Không thể bỏ theo dõi, thử lại sau." };

  revalidatePath("/account/connections");
  revalidatePath("/account");
  return { error: null };
}

export async function approveFollowRequest(followerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase
    .from("follows")
    .update({ state: "accepted" })
    .eq("follower_id", followerId)
    .eq("followee_id", user.id);

  if (error) return { error: "Không thể chấp nhận, thử lại sau." };

  revalidatePath("/account/connections");
  revalidatePath("/account");
  return { error: null };
}

export async function rejectFollowRequest(followerId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase
    .from("follows")
    .delete()
    .eq("follower_id", followerId)
    .eq("followee_id", user.id);

  if (error) return { error: "Không thể từ chối, thử lại sau." };

  revalidatePath("/account/connections");
  return { error: null };
}

export async function blockUser(userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Cần đăng nhập." };

  const { error } = await supabase
    .from("blocks")
    .insert({ blocker_id: user.id, blocked_id: userId });

  if (error) return { error: "Không thể chặn, thử lại sau." };

  // Dọn luôn quan hệ follow 2 chiều — chặn rồi thì không nên còn theo
  // dõi nhau nữa, dù is_blocked_with() đã tự ẩn nội dung ở mọi nơi khác.
  await supabase
    .from("follows")
    .delete()
    .or(
      `and(follower_id.eq.${user.id},followee_id.eq.${userId}),and(follower_id.eq.${userId},followee_id.eq.${user.id})`
    );

  revalidatePath("/account/connections");
  revalidatePath("/account/settings");
  return { error: null };
}
