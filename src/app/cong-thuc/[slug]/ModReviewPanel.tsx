"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconCheckCircle, IconX } from "@/app/icons";
import { approveRecipe, rejectRecipe } from "@/app/mod/actions";

export default function ModReviewPanel({ recipeId }: { recipeId: string }) {
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [trustAuthor, setTrustAuthor] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<"approved" | "rejected" | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveRecipe(recipeId, trustAuthor);
      if (result.error) {
        setError(result.error);
      } else {
        setDone("approved");
        router.refresh();
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
      const result = await rejectRecipe(recipeId, reason);
      if (result.error) {
        setError(result.error);
      } else {
        setDone("rejected");
        router.refresh();
      }
    });
  }

  if (done === "approved") {
    return (
      <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-[13.5px] font-semibold text-emerald-700">
        Đã duyệt bài này.
      </div>
    );
  }

  if (done === "rejected") {
    return (
      <div className="rounded-2xl bg-pink-50 px-4 py-3 text-[13.5px] font-semibold text-pink-600">
        Đã từ chối bài này.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-200 px-4 py-3.5">
      {rejecting && (
        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Lý do từ chối (bắt buộc, tác giả sẽ nhận được lý do này)..."
          rows={2}
          className="mb-3 w-full rounded-[14px] border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
        />
      )}

      {error && <p className="mb-2 text-[12.5px] text-pink-600">{error}</p>}

      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleApprove}
          disabled={pending || rejecting}
          className="inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-4 py-2 text-[13px] font-bold text-white hover:bg-pink-600 transition-colors disabled:opacity-60"
        >
          <IconCheckCircle className="h-4 w-4" />
          Duyệt bài
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
            Tin cậy tác giả
          </label>
        )}
      </div>
    </div>
  );
}
