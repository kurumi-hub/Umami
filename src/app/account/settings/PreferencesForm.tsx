"use client";

import { useState, useTransition } from "react";
import { updatePreferences } from "./actions";

type DietTag = { id: string; name: string };

export default function PreferencesForm({
  initialUnits,
  initialMaxCookTime,
  initialDietTagIds,
  dietTags,
}: {
  initialUnits: "metric" | "imperial";
  initialMaxCookTime: number | null;
  initialDietTagIds: string[];
  dietTags: DietTag[];
}) {
  const [units, setUnits] = useState(initialUnits);
  const [maxCookTime, setMaxCookTime] = useState(
    initialMaxCookTime != null ? String(initialMaxCookTime) : ""
  );
  const [dietTagIds, setDietTagIds] = useState<string[]>(initialDietTagIds);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function toggleDietTag(id: string) {
    setDietTagIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    setError(null);
    setSaved(false);
    const parsed = maxCookTime.trim() ? parseInt(maxCookTime, 10) : null;
    startTransition(async () => {
      const result = await updatePreferences(units, parsed, dietTagIds);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-pink-500/10 bg-surface p-5 flex flex-col gap-5">
      <div>
        <span className="text-[13px] font-semibold text-ink block mb-2">
          Đơn vị đo
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setUnits("metric")}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
              units === "metric"
                ? "bg-pink-500 text-white"
                : "border-2 border-pink-300 text-pink-600"
            }`}
          >
            Metric (g, ml)
          </button>
          <button
            type="button"
            onClick={() => setUnits("imperial")}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
              units === "imperial"
                ? "bg-pink-500 text-white"
                : "border-2 border-pink-300 text-pink-600"
            }`}
          >
            Imperial (oz, cup)
          </button>
        </div>
      </div>

      <label className="block text-left">
        <span className="text-[13px] font-semibold text-ink">
          Thời gian nấu tối đa muốn thấy (phút)
        </span>
        <input
          type="number"
          min={1}
          value={maxCookTime}
          onChange={(e) => setMaxCookTime(e.target.value)}
          placeholder="Không giới hạn"
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
        <span className="mt-1 block text-[12px] text-ink-soft">
          Dùng để lọc bớt công thức mất nhiều thời gian trong mục &quot;Dành
          riêng cho bạn&quot;.
        </span>
      </label>

      <div>
        <span className="text-[13px] font-semibold text-ink block mb-2">
          Chế độ ăn ưu tiên
        </span>
        {dietTags.length === 0 ? (
          <p className="text-[13px] text-ink-soft">
            Chưa có tag chế độ ăn nào trong hệ thống.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {dietTags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => toggleDietTag(tag.id)}
                className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                  dietTagIds.includes(tag.id)
                    ? "bg-pink-500 text-white"
                    : "border-2 border-pink-300 text-pink-600"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <p className="text-[12.5px] text-pink-600">{error}</p>}
      {saved && !error && (
        <p className="text-[12.5px] font-semibold text-emerald-700">Đã lưu.</p>
      )}

      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}
