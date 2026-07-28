"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";

export async function markNotificationRead(notificationId: string) {
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_notification_read", {
    p_id: notificationId,
  });

  if (error) {
    return { error: "Không thể đánh dấu đã đọc." };
  }

  revalidatePath("/account/notifications");
  return { error: null };
}

export async function markAllNotificationsRead() {
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_all_notifications_read");

  if (error) {
    return { error: "Không thể đánh dấu tất cả đã đọc." };
  }

  revalidatePath("/account/notifications");
  return { error: null };
}
