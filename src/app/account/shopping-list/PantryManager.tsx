"use client";

import { useState, useTransition } from "react";
import { IconTrash } from "@/app/icons";
import { searchIngredients } from "@/app/account/settings/actions";
import { addPantryItem, removePantryItem } from "@/app/account/actions";

type Ingredient = { id: string; name: string };

type PantryItem = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  expires_on: string | null;
};

const units = [
  { value: "", label: "Đếm số (không đơn vị)" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "l" },
  { value: "tsp", label: "muỗng cà phê" },
  { value: "tbsp", label: "muỗng canh" },
  { value: "cup", label: "cup" },
  { value: "oz", label: "oz" },
  { value: "lb", label: "lb" },
];

function expiryStatus(expiresOn: string | null) {
  if (!expiresOn) return null;
  const days = Math.ceil(
    (new Date(expiresOn).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  if (days < 0) return { label: "Đã hết hạn", className: "bg-pink-500/15 text-pink-600" };
  if (days <= 3)
    return { label: `Còn ${days} ngày`, className: "bg-mango/20 text-amber-700" };
  return null;
}

export default function PantryManager({
  initialPantry,
}: {
  initialPantry: PantryItem[];
}) {
  const [pantry, setPantry] = useState(initialPantry);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Nguyên liệu đang được chọn để điền số lượng/đơn vị/hạn dùng trước
  // khi thêm hẳn vào tủ lạnh.
  const [staged, setStaged] = useState<Ingredient | null>(null);
  const [stagedQty, setStagedQty] = useState("");
  const [stagedUnit, setStagedUnit] = useState("");
  const [stagedExpiry, setStagedExpiry] = useState("");

  let searchTimeout: ReturnType<typeof setTimeout>;

  function handleQueryChange(value: string) {
    setQuery(value);
    clearTimeout(searchTimeout);
    if (value.trim().length < 2) {
      setResults([]);
      return;
    }
    searchTimeout = setTimeout(async () => {
      setSearching(true);
      const result = await searchIngredients(value);
      setSearching(false);
      if (!result.error) {
        setResults(result.ingredients as Ingredient[]);
      }
    }, 300);
  }

  function handleSelectIngredient(ing: Ingredient) {
    const existing = pantry.find((p) => p.id === ing.id);
    setStaged(ing);
    setStagedQty(existing?.quantity != null ? String(existing.quantity) : "");
    setStagedUnit(existing?.unit ?? "");
    setStagedExpiry(existing?.expires_on ?? "");
    setQuery("");
    setResults([]);
  }

  function handleConfirmAdd() {
    if (!staged) return;
    setError(null);
    const quantity = stagedQty.trim() ? parseFloat(stagedQty) : null;
    const unit = stagedUnit || null;
    const expiresOn = stagedExpiry || null;

    const newItem: PantryItem = {
      id: staged.id,
      name: staged.name,
      quantity,
      unit,
      expires_on: expiresOn,
    };
    setPantry((prev) => [newItem, ...prev.filter((p) => p.id !== staged.id)]);
    const stagedIngredient = staged;
    setStaged(null);
    setStagedQty("");
    setStagedUnit("");
    setStagedExpiry("");

    startTransition(async () => {
      const result = await addPantryItem(stagedIngredient.id, quantity, unit, expiresOn);
      if (result.error) {
        setError(result.error);
        setPantry((prev) => prev.filter((p) => p.id !== stagedIngredient.id));
      }
    });
  }

  function handleRemove(item: PantryItem) {
    setError(null);
    const prev = pantry;
    setPantry((cur) => cur.filter((p) => p.id !== item.id));
    startTransition(async () => {
      const result = await removePantryItem(item.id);
      if (result.error) {
        setError(result.error);
        setPantry(prev);
      }
    });
  }

  return (
    <div>
      <p className="mb-4 text-[13.5px] text-ink-soft leading-relaxed">
        Nguyên liệu bạn thêm ở đây sẽ được dùng để gợi ý công thức &quot;Từ
        tủ lạnh của bạn&quot; ở trang chủ (so cả số lượng nếu bạn điền), và
        tô xanh &quot;Có sẵn&quot; khi xem nguyên liệu ở trang chi tiết công
        thức.
      </p>

      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleQueryChange(e.target.value)}
          placeholder="Tìm nguyên liệu bạn đang có (vd: trứng, hành tây...)"
          className="w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
        {(searching || results.length > 0) && (
          <div className="absolute left-0 right-0 z-10 mt-1.5 rounded-xl border border-pink-500/15 bg-surface shadow-[0_14px_30px_-16px_rgba(58,31,43,0.3)]">
            {searching && (
              <p className="px-3.5 py-2.5 text-[13px] text-ink-soft">Đang tìm...</p>
            )}
            {!searching &&
              results.map((ing) => (
                <button
                  key={ing.id}
                  type="button"
                  onClick={() => handleSelectIngredient(ing)}
                  className="block w-full px-3.5 py-2.5 text-left text-[14px] hover:bg-pink-50 transition-colors"
                >
                  {ing.name}
                </button>
              ))}
          </div>
        )}
      </div>

      {staged && (
        <div className="mb-5 rounded-2xl border border-pink-500/15 bg-surface p-4">
          <p className="mb-3 text-[14px] font-bold">{staged.name}</p>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <label className="block">
              <span className="text-[12.5px] font-semibold text-ink-soft">Số lượng</span>
              <input
                type="number"
                min={0}
                step="any"
                value={stagedQty}
                onChange={(e) => setStagedQty(e.target.value)}
                placeholder="VD: 500"
                className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
              />
            </label>
            <label className="block">
              <span className="text-[12.5px] font-semibold text-ink-soft">Đơn vị</span>
              <select
                value={stagedUnit}
                onChange={(e) => setStagedUnit(e.target.value)}
                className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
              >
                {units.map((u) => (
                  <option key={u.value} value={u.value}>
                    {u.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block mb-3">
            <span className="text-[12.5px] font-semibold text-ink-soft">
              Hạn sử dụng (không bắt buộc)
            </span>
            <input
              type="date"
              value={stagedExpiry}
              onChange={(e) => setStagedExpiry(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmAdd}
              disabled={pending}
              className="rounded-full bg-pink-500 px-5 py-2 text-[13px] font-bold text-white disabled:opacity-50"
            >
              Thêm vào tủ lạnh
            </button>
            <button
              type="button"
              onClick={() => setStaged(null)}
              className="rounded-full border-2 border-pink-300 px-5 py-2 text-[13px] font-bold text-pink-600"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}

      {error && <p className="mb-3 text-[12.5px] text-pink-600">{error}</p>}

      {pantry.length === 0 ? (
        <p className="text-[13.5px] text-ink-soft">
          Tủ lạnh của bạn đang trống. Thêm nguyên liệu để nhận gợi ý công
          thức phù hợp hơn.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {pantry.map((item) => {
            const status = expiryStatus(item.expires_on);
            return (
              <div
                key={item.id}
                className="flex items-center gap-3 rounded-xl border border-pink-500/10 bg-surface px-4 py-2.5"
              >
                <button
                  type="button"
                  onClick={() => handleSelectIngredient({ id: item.id, name: item.name })}
                  className="min-w-0 flex-1 text-left"
                >
                  <span className="block text-[14px] font-semibold truncate">
                    {item.name}
                  </span>
                  {(item.quantity != null || item.unit) && (
                    <span className="text-[12px] text-ink-soft">
                      {item.quantity ?? ""} {item.unit || ""}
                    </span>
                  )}
                </button>
                {status && (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10.5px] font-bold ${status.className}`}
                  >
                    {status.label}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleRemove(item)}
                  aria-label={`Xoá ${item.name} khỏi tủ lạnh`}
                  className="shrink-0 text-ink-soft hover:text-pink-600"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
