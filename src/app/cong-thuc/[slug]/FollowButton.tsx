"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleFollowAuthor } from "@/app/cong-thuc/actions";

export default function FollowButton({
  authorId,
  slug,
  initialState,
  isLoggedIn,
}: {
  authorId: string;
  slug: string;
  initialState: "accepted" | "pending" | null;
  isLoggedIn: boolean;
}) {
  const [state, setState] = useState(initialState);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setError(null);
    const prev = state;
    // Cập nhật lạc quan: nếu đang null -> giả định accepted (đa số tài
    // khoản public); nếu đang có follow -> bỏ theo dõi.
    setState(prev ? null : "accepted");

    startTransition(async () => {
      const result = await toggleFollowAuthor(authorId, slug);
      if (result.error) {
        setState(prev);
        setError(result.error);
      } else {
        setState(result.state as "accepted" | "pending" | null);
      }
    });
  }

  const label =
    state === "accepted" ? "Đang theo dõi" : state === "pending" ? "Đã gửi yêu cầu" : "Theo dõi";

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${
          state
            ? "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
            : "bg-pink-500 text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)]"
        }`}
      >
        {label}
      </button>
      {error && <span className="text-[12px] text-pink-600">{error}</span>}
    </div>
  );
}
