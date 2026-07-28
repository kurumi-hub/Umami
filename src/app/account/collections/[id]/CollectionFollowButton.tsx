"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconHeart } from "@/app/icons";
import { toggleCollectionFollow } from "@/app/account/actions";

export default function CollectionFollowButton({
  collectionId,
  initialFollowing,
  isLoggedIn,
}: {
  collectionId: string;
  initialFollowing: boolean;
  isLoggedIn: boolean;
}) {
  const [following, setFollowing] = useState(initialFollowing);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleClick() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setError(null);
    const next = !following;
    setFollowing(next);
    startTransition(async () => {
      const result = await toggleCollectionFollow(collectionId);
      if (result.error) {
        setFollowing(!next);
        setError(result.error);
      } else {
        setFollowing(result.following);
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${
          following
            ? "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
            : "bg-pink-500 text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)]"
        }`}
      >
        <IconHeart className="h-4 w-4" filled={following} />
        {following ? "Đang theo dõi" : "Theo dõi bộ sưu tập"}
      </button>
      {error && <span className="text-[12px] text-pink-600">{error}</span>}
    </div>
  );
}
