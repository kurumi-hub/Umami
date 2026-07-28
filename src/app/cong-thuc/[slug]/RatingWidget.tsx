"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconStar } from "@/app/icons";
import { rateRecipe } from "@/app/cong-thuc/actions";

export default function RatingWidget({
  recipeId,
  slug,
  avgRating,
  ratingCount,
  initialMyRating,
  isLoggedIn,
}: {
  recipeId: string;
  slug: string;
  avgRating: number;
  ratingCount: number;
  initialMyRating: number | null;
  isLoggedIn: boolean;
}) {
  const [myRating, setMyRating] = useState(initialMyRating);
  const [hover, setHover] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleRate(value: number) {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setError(null);
    const prev = myRating;
    setMyRating(value);
    startTransition(async () => {
      const result = await rateRecipe(recipeId, slug, value);
      if (result.error) {
        setMyRating(prev);
        setError(result.error);
      }
    });
  }

  const displayValue = hover ?? myRating ?? 0;

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5" onMouseLeave={() => setHover(null)}>
          {Array.from({ length: 5 }).map((_, i) => {
            const value = i + 1;
            return (
              <button
                key={value}
                type="button"
                disabled={pending}
                onMouseEnter={() => setHover(value)}
                onClick={() => handleRate(value)}
                aria-label={`Đánh giá ${value} sao`}
                className="text-mango disabled:opacity-60"
              >
                <IconStar className="w-5 h-5" filled={value <= displayValue} />
              </button>
            );
          })}
        </div>
        <span className="text-[13.5px] text-ink-soft">
          {avgRating > 0 ? avgRating.toFixed(1) : "Chưa có"} ({ratingCount} đánh giá)
        </span>
      </div>
      {myRating && (
        <p className="mt-1 text-[12.5px] font-semibold text-pink-600">
          Bạn đã đánh giá {myRating} sao
        </p>
      )}
      {error && <p className="mt-1 text-[12.5px] text-pink-600">{error}</p>}
    </div>
  );
}
