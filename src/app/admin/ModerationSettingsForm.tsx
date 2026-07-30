"use client";

import { useState, useTransition } from "react";
import { updateModerationSettings } from "./actions";

export default function ModerationSettingsForm({
  initialAutoHideThreshold,
  initialReportsPerDayLimit,
  initialRequireFirstPostReview,
}: {
  initialAutoHideThreshold: number;
  initialReportsPerDayLimit: number;
  initialRequireFirstPostReview: boolean;
}) {
  const [autoHide, setAutoHide] = useState(String(initialAutoHideThreshold));
  const [dailyLimit, setDailyLimit] = useState(String(initialReportsPerDayLimit));
  const [requireReview, setRequireReview] = useState(initialRequireFirstPostReview);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSave() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateModerationSettings(
        autoHide.trim() ? parseInt(autoHide, 10) : null,
        dailyLimit.trim() ? parseInt(dailyLimit, 10) : null,
        requireReview
      );
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-pink-500/10 bg-surface p-5 flex flex-col gap-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-[13px] font-semibold text-ink">
            Ngưỡng tự động ẩn (số báo cáo)
          </span>
          <input
            type="number"
            min={1}
            value={autoHide}
            onChange={(e) => setAutoHide(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
          />
        </label>
        <label className="block">
          <span className="text-[13px] font-semibold text-ink">
            Giới hạn báo cáo/ngày/người
          </span>
          <input
            type="number"
            min={1}
            value={dailyLimit}
            onChange={(e) => setDailyLimit(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
          />
        </label>
      </div>

      <label className="flex items-center justify-between gap-4 rounded-xl bg-pink-50 px-4 py-3">
        <div>
          <b className="text-[13.5px] block">Yêu cầu duyệt bài đầu tiên</b>
          <span className="text-[12px] text-ink-soft">
            Công thức đầu tiên của tài khoản chưa &quot;trusted&quot; sẽ vào hàng
            đợi duyệt thay vì đăng ngay.
          </span>
        </div>
        <button
          type="button"
          onClick={() => setRequireReview((v) => !v)}
          role="switch"
          aria-checked={requireReview}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${
            requireReview ? "bg-pink-500" : "bg-pink-500/20"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${
              requireReview ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </label>

      {error && <p className="text-[12.5px] text-pink-600">{error}</p>}
      {saved && !error && (
        <p className="text-[12.5px] font-semibold text-emerald-700">Đã lưu.</p>
      )}

      <div>
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </div>
  );
}
