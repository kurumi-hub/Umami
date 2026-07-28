"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { IconBowl, IconPlus, IconSearch, IconX } from "@/app/icons";
import {
  addMealPlanEntry,
  addWeekToShoppingList,
  removeMealPlanEntry,
} from "./actions";

type Entry = {
  id: string;
  plan_date: string;
  slot: string;
  servings: number | null;
  recipe_id: string;
  recipe_title: string;
  recipe_slug: string;
  recipe_thumbnail_url: string | null;
};

type Candidate = { id: string; title: string; slug: string };

const slots: { value: string; label: string }[] = [
  { value: "breakfast", label: "Sáng" },
  { value: "lunch", label: "Trưa" },
  { value: "dinner", label: "Tối" },
  { value: "snack", label: "Ăn vặt" },
  { value: "dessert", label: "Tráng miệng" },
];

const weekdayLabels = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ nhật"];

function formatDay(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}`;
}

export default function WeekGrid({
  weekDates,
  today,
  startDate,
  initialEntries,
  candidates,
}: {
  weekDates: string[];
  today: string;
  startDate: string;
  initialEntries: Entry[];
  candidates: Candidate[];
}) {
  const [entries, setEntries] = useState(initialEntries);
  const [modalCell, setModalCell] = useState<{ date: string; slot: string } | null>(
    null
  );
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Candidate | null>(null);
  const [servings, setServings] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [gomStatus, setGomStatus] = useState<"idle" | "done">("idle");
  const [pending, startTransition] = useTransition();

  const byCell = useMemo(() => {
    const map = new Map<string, Entry[]>();
    for (const e of entries) {
      const key = `${e.plan_date}__${e.slot}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    return map;
  }, [entries]);

  const filteredCandidates = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return candidates.slice(0, 30);
    return candidates.filter((c) => c.title.toLowerCase().includes(q)).slice(0, 30);
  }, [candidates, query]);

  function openModal(date: string, slot: string) {
    setModalCell({ date, slot });
    setQuery("");
    setSelected(null);
    setServings("");
    setError(null);
  }

  function closeModal() {
    setModalCell(null);
  }

  function handleConfirmAdd() {
    if (!modalCell || !selected) return;
    setError(null);
    const parsedServings = servings.trim() ? parseInt(servings, 10) : null;

    startTransition(async () => {
      const result = await addMealPlanEntry(
        selected.id,
        modalCell.date,
        modalCell.slot as never,
        parsedServings
      );
      if (result.error || !result.id) {
        setError(result.error || "Không thể thêm vào kế hoạch.");
        return;
      }
      setEntries((prev) => [
        ...prev,
        {
          id: result.id,
          plan_date: modalCell.date,
          slot: modalCell.slot,
          servings: parsedServings,
          recipe_id: selected.id,
          recipe_title: selected.title,
          recipe_slug: selected.slug,
          recipe_thumbnail_url: null,
        },
      ]);
      closeModal();
    });
  }

  function handleRemove(entryId: string) {
    const prev = entries;
    setEntries((cur) => cur.filter((e) => e.id !== entryId));
    startTransition(async () => {
      const result = await removeMealPlanEntry(entryId);
      if (result.error) {
        setEntries(prev);
      }
    });
  }

  function handleGomVaoDiCho() {
    setGomStatus("idle");
    startTransition(async () => {
      const result = await addWeekToShoppingList(startDate);
      if (!result.error) {
        setGomStatus("done");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-[13.5px] text-ink-soft">
          Lên kế hoạch nấu ăn cho tuần, rồi gom hết nguyên liệu vào danh
          sách đi chợ chỉ với 1 lần bấm.
        </p>
        <button
          type="button"
          onClick={handleGomVaoDiCho}
          disabled={pending}
          className="shrink-0 rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {gomStatus === "done" ? "Đã gom vào đi chợ!" : "Gom nguyên liệu cả tuần vào đi chợ"}
        </button>
      </div>

      {error && !modalCell && (
        <p className="mb-4 text-[12.5px] text-pink-600">{error}</p>
      )}

      <div className="overflow-x-auto">
        <div className="grid grid-cols-[90px_repeat(7,minmax(150px,1fr))] gap-2 min-w-[1200px]">
          <div />
          {weekDates.map((date, i) => (
            <div
              key={date}
              className={`rounded-xl px-3 py-2 text-center ${
                date === today ? "bg-pink-500 text-white" : "bg-pink-50"
              }`}
            >
              <div className="text-[12px] font-bold">{weekdayLabels[i]}</div>
              <div className="text-[11px] opacity-80">{formatDay(date)}</div>
            </div>
          ))}

          {slots.map((slot) => (
            <Fragment key={slot.value}>
              <div
                key={`${slot.value}-label`}
                className="flex items-center text-[13px] font-bold text-pink-600"
              >
                {slot.label}
              </div>
              {weekDates.map((date) => {
                const key = `${date}__${slot.value}`;
                const cellEntries = byCell.get(key) ?? [];
                return (
                  <div
                    key={key}
                    className="rounded-xl border border-pink-500/10 bg-surface p-2 flex flex-col gap-1.5 min-h-[70px]"
                  >
                    {cellEntries.map((e) => (
                      <div
                        key={e.id}
                        className="flex items-center gap-1.5 rounded-lg bg-pink-50 px-2 py-1.5"
                      >
                        <Link
                          href={`/cong-thuc/${e.recipe_slug}`}
                          className="min-w-0 flex-1 truncate text-[12px] font-semibold hover:text-pink-600"
                        >
                          {e.recipe_title}
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleRemove(e.id)}
                          aria-label="Bỏ khỏi kế hoạch"
                          className="shrink-0 text-ink-soft hover:text-pink-600"
                        >
                          <IconX className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => openModal(date, slot.value)}
                      className="flex items-center justify-center gap-1 rounded-lg border border-dashed border-pink-300/70 px-2 py-1.5 text-[11px] font-bold text-pink-500 hover:bg-pink-50"
                    >
                      <IconPlus className="h-3 w-3" />
                      Thêm
                    </button>
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>

      {modalCell && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/30 px-4 pt-16 pb-8 overflow-y-auto">
          <div className="w-full max-w-[420px] rounded-[24px] bg-surface p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)]">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-[15px] font-bold">
                Thêm món cho {formatDay(modalCell.date)} ·{" "}
                {slots.find((s) => s.value === modalCell.slot)?.label}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                aria-label="Đóng"
                className="text-ink-soft hover:text-pink-600"
              >
                <IconX className="h-5 w-5" />
              </button>
            </div>

            {!selected ? (
              <>
                <label className="relative mb-3 block">
                  <IconSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-soft" />
                  <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Tìm trong công thức của bạn và đã lưu..."
                    autoFocus
                    className="w-full rounded-full border border-pink-300/70 bg-surface pl-10 pr-4 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
                  />
                </label>
                <div className="max-h-[320px] overflow-y-auto flex flex-col gap-1">
                  {filteredCandidates.length === 0 ? (
                    <p className="py-6 text-center text-[13.5px] text-ink-soft">
                      Không tìm thấy công thức nào phù hợp.
                    </p>
                  ) : (
                    filteredCandidates.map((c) => (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setSelected(c)}
                        className="flex items-center gap-3 rounded-xl px-2.5 py-2 hover:bg-pink-50 text-left"
                      >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pink-100">
                          <IconBowl className="h-4 w-4 text-pink-500" />
                        </div>
                        <span className="text-[13.5px] font-semibold truncate">
                          {c.title}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </>
            ) : (
              <div>
                <p className="mb-3 text-[14px] font-bold">{selected.title}</p>
                <label className="block mb-4">
                  <span className="text-[12.5px] font-semibold text-ink-soft">
                    Số khẩu phần (không bắt buộc)
                  </span>
                  <input
                    type="number"
                    min={1}
                    value={servings}
                    onChange={(e) => setServings(e.target.value)}
                    placeholder="Để trống = theo công thức gốc"
                    className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
                  />
                </label>
                {error && <p className="mb-3 text-[12.5px] text-pink-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={handleConfirmAdd}
                    disabled={pending}
                    className="rounded-full bg-pink-500 px-5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
                  >
                    {pending ? "Đang thêm..." : "Thêm vào kế hoạch"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelected(null)}
                    className="rounded-full border-2 border-pink-300 px-5 py-2 text-[13px] font-bold text-pink-600"
                  >
                    Chọn lại
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
