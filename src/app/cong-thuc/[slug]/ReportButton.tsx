"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { IconFlag } from "@/app/icons";
import { reportContent } from "@/app/cong-thuc/actions";

const reasons: { value: string; label: string }[] = [
  { value: "spam", label: "Spam / quảng cáo" },
  { value: "inappropriate", label: "Nội dung không phù hợp" },
  { value: "copyright", label: "Vi phạm bản quyền" },
  { value: "dangerous", label: "Nguy hiểm / không an toàn" },
  { value: "harassment", label: "Quấy rối / xúc phạm" },
  { value: "other", label: "Khác" },
];

export default function ReportButton({
  targetType,
  targetId,
  isLoggedIn,
}: {
  targetType: "recipe" | "tip" | "reply" | "profile" | "collection";
  targetId: string;
  isLoggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState(reasons[0].value);
  const [detail, setDetail] = useState("");
  const [status, setStatus] = useState<"idle" | "sent">("idle");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  function handleOpen() {
    if (!isLoggedIn) {
      router.push("/auth/login");
      return;
    }
    setOpen(true);
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await reportContent(
        targetType,
        targetId,
        reason as "spam" | "inappropriate" | "copyright" | "dangerous" | "harassment" | "other",
        detail || undefined
      );
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("sent");
        setOpen(false);
      }
    });
  }

  if (status === "sent") {
    return (
      <span
        aria-label="Đã gửi báo cáo, cảm ơn bạn"
        title="Đã gửi báo cáo, cảm ơn bạn"
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-pink-300/60 text-ink-soft"
      >
        <IconFlag className="h-[18px] w-[18px]" />
      </span>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={handleOpen}
        aria-label="Báo cáo nội dung này"
        title="Báo cáo nội dung này"
        className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-pink-300 text-ink-soft hover:text-pink-600 hover:bg-pink-50 transition-colors"
      >
        <IconFlag className="h-[18px] w-[18px]" />
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-pink-500/15 bg-surface p-4 max-w-[360px]">
      <label className="block text-left mb-3">
        <span className="text-[13px] font-semibold text-ink">Lý do báo cáo</span>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-pink-500"
        >
          {reasons.map((r) => (
            <option key={r.value} value={r.value}>
              {r.label}
            </option>
          ))}
        </select>
      </label>
      <label className="block text-left mb-3">
        <span className="text-[13px] font-semibold text-ink">Chi tiết (không bắt buộc)</span>
        <textarea
          value={detail}
          onChange={(e) => setDetail(e.target.value)}
          rows={3}
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>
      {error && <p className="mb-2 text-[12.5px] text-pink-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="rounded-full bg-pink-500 px-4 py-2 text-[13px] font-bold text-white disabled:opacity-60"
        >
          {pending ? "Đang gửi..." : "Gửi báo cáo"}
        </button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600"
        >
          Huỷ
        </button>
      </div>
    </div>
  );
}
