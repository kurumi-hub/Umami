"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { IconCheckCircle, IconChefHat, IconX } from "@/app/icons";
import { approveRecipe, rejectRecipe } from "./actions";

export type ReviewRecipe = {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  created_at: string;
  author_id: string | null;
  author_name: string | null;
  author_username: string | null;
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function RecipeReviewCard({ recipe }: { recipe: ReviewRecipe }) {
  const [status, setStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [trustAuthor, setTrustAuthor] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveRecipe(recipe.id, trustAuthor);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("approved");
      }
    });
  }

  function handleReject() {
    if (!rejecting) {
      setRejecting(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await rejectRecipe(recipe.id, reason);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("rejected");
      }
    });
  }

  if (status === "approved") {
    return (
      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[13.5px] font-semibold text-emerald-700">
        Đã duyệt: {recipe.title}
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="rounded-[20px] border border-pink-200 bg-pink-50 px-5 py-4 text-[13.5px] font-semibold text-pink-600">
        Đã từ chối: {recipe.title}
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-pink-100 bg-surface px-5 py-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <Link
          href={`/cong-thuc/${recipe.slug}`}
          target="_blank"
          className="min-w-0 flex-1 group"
        >
          <b className="block truncate text-[15px] group-hover:text-pink-600 transition-colors">
            {recipe.title}
          </b>
          {recipe.description && (
            <p className="mt-1 line-clamp-2 text-[13px] text-ink-soft">
              {recipe.description}
            </p>
          )}
        </Link>
        <span className="shrink-0 text-[12px] text-ink-soft">
          {formatDate(recipe.created_at)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-100">
          <IconChefHat className="h-3.5 w-3.5 text-pink-500" />
        </div>
        {recipe.author_username ? (
          <Link
            href={`/u/${recipe.author_username}`}
            target="_blank"
            className="text-[13px] font-semibold hover:text-pink-600 transition-colors"
          >
            {recipe.author_name || recipe.author_username}
          </Link>
        ) : (
          <span className="text-[13px] text-ink-soft">Người dùng đã xoá</span>
        )}
      </div>

      {rejecting && (
        <div className="mt-3">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Lý do từ chối (bắt buộc, tác giả sẽ nhận được lý do này)..."
            rows={2}
            className="w-full rounded-[14px] border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
          />
        </div>
      )}

      {error && <p className="mt-2 text-[12.5px] text-pink-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending || rejecting}
          className="inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-pink-600 transition-colors disabled:opacity-60"
        >
          <IconCheckCircle className="h-4 w-4" />
          Duyệt
        </button>
        <button
          type="button"
          onClick={handleReject}
          disabled={pending}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${
            rejecting
              ? "bg-pink-600 text-white"
              : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
          }`}
        >
          <IconX className="h-4 w-4" />
          {rejecting ? "Xác nhận từ chối" : "Từ chối"}
        </button>
        {!rejecting && (
          <label className="ml-auto flex items-center gap-1.5 text-[12.5px] text-ink-soft">
            <input
              type="checkbox"
              checked={trustAuthor}
              onChange={(e) => setTrustAuthor(e.target.checked)}
              className="accent-pink-500"
            />
            Tin cậy tác giả (bài sau khỏi cần duyệt)
          </label>
        )}
      </div>
    </div>
  );
}
