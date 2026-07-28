import Link from "next/link";
import { redirect } from "next/navigation";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import NotificationRow from "./NotificationRow";
import MarkAllReadButton from "./MarkAllReadButton";

export default async function NotificationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: notifications } = await supabase.rpc("get_my_notifications", {
    lim: 50,
  });

  const hasUnread = (notifications ?? []).some((n: { is_read: boolean }) => !n.is_read);

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[640px] mx-auto px-6 py-10 w-full">
        <Link
          href="/account"
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] font-semibold text-ink-soft hover:text-pink-600 transition-colors"
        >
          ← Về trang Cá nhân
        </Link>

        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
          <h1 className="font-display font-extrabold text-[26px] sm:text-[32px]">
            Thông báo
          </h1>
          {hasUnread && <MarkAllReadButton />}
        </div>

        {!notifications || notifications.length === 0 ? (
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Bạn chưa có thông báo nào.
          </div>
        ) : (
          <div className="flex flex-col gap-2.5">
            {notifications.map((n: Parameters<typeof NotificationRow>[0]["notification"]) => (
              <NotificationRow key={n.id} notification={n} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
