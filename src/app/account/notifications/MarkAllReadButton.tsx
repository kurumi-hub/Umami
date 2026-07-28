"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { markAllNotificationsRead } from "./actions";

export default function MarkAllReadButton() {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    startTransition(async () => {
      await markAllNotificationsRead();
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={pending}
      className="text-[13.5px] font-bold text-pink-600 hover:underline disabled:opacity-60"
    >
      {pending ? "Đang xử lý..." : "Đánh dấu tất cả đã đọc"}
    </button>
  );
}
