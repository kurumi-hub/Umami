"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  IconBell,
  IconChefHat,
  IconFlame,
  IconHeart,
  IconMessageCircle,
  IconStar,
  IconUsers,
} from "@/app/icons";
import { markNotificationRead } from "./actions";

type Notification = {
  id: string;
  type: string;
  target_type: string | null;
  payload: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
  actor_name: string | null;
  actor_username: string | null;
  link: string | null;
};

const typeIcons: Record<string, (props: { className?: string }) => React.ReactNode> = {
  new_follower: IconUsers,
  follow_request: IconUsers,
  follow_accepted: IconUsers,
  recipe_rated: IconStar,
  recipe_tip: IconMessageCircle,
  tip_liked: IconHeart,
  tip_replied: IconMessageCircle,
  recipe_approved: IconChefHat,
  recipe_rejected: IconChefHat,
  recipe_featured: IconFlame,
  content_hidden: IconBell,
  account_suspended: IconBell,
  collection_followed: IconHeart,
  system: IconBell,
};

function buildMessage(n: Notification): string {
  const actor = n.actor_name || n.actor_username || "Ai đó";
  switch (n.type) {
    case "new_follower":
      return `${actor} đã bắt đầu theo dõi bạn`;
    case "follow_request":
      return `${actor} muốn theo dõi bạn`;
    case "follow_accepted":
      return `${actor} đã chấp nhận yêu cầu theo dõi của bạn`;
    case "recipe_rated":
      return `${actor} đã đánh giá ${n.payload?.rating ?? ""} sao cho công thức của bạn`;
    case "recipe_tip":
      return `${actor} đã bình luận về công thức của bạn`;
    case "tip_liked":
      return `${actor} đã thích bình luận của bạn`;
    case "tip_replied":
      return `${actor} đã trả lời bình luận của bạn`;
    case "recipe_approved":
      return "Công thức của bạn đã được duyệt và xuất bản";
    case "recipe_rejected":
      return `Công thức của bạn bị từ chối duyệt${n.payload?.reason ? `: ${n.payload.reason}` : ""}`;
    case "recipe_featured":
      return "Công thức của bạn được đề cử nổi bật";
    case "content_hidden":
      return `Một nội dung của bạn đã bị ẩn${n.payload?.reason ? `: ${n.payload.reason}` : ""}`;
    case "account_suspended":
      return "Tài khoản của bạn đã bị tạm khoá";
    case "collection_followed":
      return `${actor} đã theo dõi bộ sưu tập của bạn`;
    default:
      return "Thông báo từ Umami";
  }
}

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

export default function NotificationRow({ notification }: { notification: Notification }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const Icon = typeIcons[notification.type] ?? IconBell;

  function handleClick() {
    if (!notification.is_read) {
      startTransition(async () => {
        await markNotificationRead(notification.id);
      });
    }
    if (notification.link) {
      router.push(notification.link);
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className={`flex w-full items-start gap-3 rounded-[16px] border px-4 py-3.5 text-left transition-colors disabled:opacity-70 ${
        notification.is_read
          ? "border-pink-500/10 bg-surface"
          : "border-pink-500/20 bg-pink-500/5"
      } ${notification.link ? "hover:border-pink-500/30 cursor-pointer" : "cursor-default"}`}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pink-100">
        <Icon className="h-4.5 w-4.5 text-pink-500" />
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[14px] ${notification.is_read ? "" : "font-semibold"}`}>
          {buildMessage(notification)}
        </p>
        <span className="text-[12px] text-ink-soft">{timeAgo(notification.created_at)}</span>
      </div>
      {!notification.is_read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-pink-500" />
      )}
    </button>
  );
}
