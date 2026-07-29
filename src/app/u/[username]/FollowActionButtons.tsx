"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFollowAuthor } from "@/app/cong-thuc/actions";
import { blockUser } from "@/app/account/connections/actions";

export default function FollowActionButtons({
  userId,
  initialFollowState,
  isLoggedIn,
}: {
  userId: string;
  initialFollowState: "accepted" | "pending" | null;
  isLoggedIn: boolean;
}) {
  const [followState, setFollowState] = useState(initialFollowState);
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleFollow() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setError(null);
    const prev = followState;
    setFollowState(followState ? null : "accepted");
    startTransition(async () => {
      // toggleFollowAuthor cần slug cho revalidatePath — không quan
      // trọng lắm ở đây nên truyền chuỗi rỗng.
      const result = await toggleFollowAuthor(userId, "");
      if (result.error) {
        setFollowState(prev);
        setError(result.error);
      } else {
        setFollowState(result.state as "accepted" | "pending" | null);
      }
    });
  }

  function handleBlock() {
    if (!confirm("Chặn người này? Họ sẽ không thấy được nội dung của bạn nữa.")) return;
    setError(null);
    startTransition(async () => {
      const result = await blockUser(userId);
      if (result.error) {
        setError(result.error);
      } else {
        setBlocked(true);
        router.refresh();
      }
    });
  }

  if (blocked) {
    return <span className="text-[13px] text-ink-soft">Đã chặn</span>;
  }

  const label =
    followState === "accepted"
      ? "Đang theo dõi"
      : followState === "pending"
      ? "Đã gửi yêu cầu"
      : "Theo dõi";

  return (
    <div className="flex flex-col items-end gap-1.5">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleFollow}
          disabled={pending}
          className={`inline-flex items-center justify-center rounded-full px-5 py-2.5 text-[13.5px] font-bold transition-colors disabled:opacity-60 ${
            followState
              ? "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
              : "bg-pink-500 text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)]"
          }`}
        >
          {label}
        </button>
        {isLoggedIn && (
          <button
            type="button"
            onClick={handleBlock}
            disabled={pending}
            className="text-[12.5px] font-semibold text-ink-soft hover:text-pink-600 disabled:opacity-50"
          >
            Chặn
          </button>
        )}
      </div>
      {error && <span className="text-[12px] text-pink-600">{error}</span>}
    </div>
  );
}
