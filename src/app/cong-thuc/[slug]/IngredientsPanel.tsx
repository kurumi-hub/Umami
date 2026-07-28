"use client";

import { useMemo, useState } from "react";

type Ingredient = {
  id: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  raw_text: string | null;
  is_optional: boolean;
  position: number;
  section_id: string | null;
  in_pantry: boolean;
  is_allergen: boolean;
};

type Section = { id: string; name: string | null; position: number };
type UnitConversion = { from_unit: string; to_unit: string; factor: number };

function formatQuantity(q: number) {
  if (!Number.isFinite(q)) return "";
  const rounded = Math.round(q * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : String(rounded);
}

export default function IngredientsPanel({
  ingredients,
  sections,
  originalServings,
  servingsUnit,
  unitConversions,
}: {
  ingredients: Ingredient[];
  sections: Section[];
  originalServings: number | null;
  servingsUnit: string | null;
  unitConversions: UnitConversion[];
}) {
  const [servings, setServings] = useState(originalServings ?? 1);
  const [useConverted, setUseConverted] = useState(false);

  const hasConversions = unitConversions.length > 0;
  const scale = originalServings ? servings / originalServings : 1;

  const sectionName = useMemo(
    () => new Map(sections.map((s) => [s.id, s.name])),
    [sections]
  );

  const bySection = useMemo(() => {
    const map = new Map<string | null, Ingredient[]>();
    for (const ing of ingredients) {
      const key = ing.section_id;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ing);
    }
    return map;
  }, [ingredients]);

  function displayFor(ing: Ingredient) {
    const scaledQty = ing.quantity != null ? ing.quantity * scale : null;

    if (useConverted && ing.unit) {
      const conv = unitConversions.find((c) => c.from_unit === ing.unit);
      if (conv && scaledQty != null) {
        return { qty: formatQuantity(scaledQty * conv.factor), unit: conv.to_unit };
      }
    }
    return { qty: scaledQty != null ? formatQuantity(scaledQty) : "", unit: ing.unit || "" };
  }

  return (
    <div>
      {/* Điều khiển khẩu phần + đơn vị */}
      <div className="mb-5 flex flex-wrap items-center gap-4">
        {originalServings && (
          <div className="flex items-center gap-2">
            <span className="text-[13.5px] font-semibold text-ink-soft">
              Khẩu phần:
            </span>
            <button
              type="button"
              onClick={() => setServings((s) => Math.max(1, s - 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-pink-300 text-pink-600 font-bold"
              aria-label="Giảm khẩu phần"
            >
              −
            </button>
            <span className="min-w-[70px] text-center text-[14.5px] font-bold">
              {servings} {servingsUnit || ""}
            </span>
            <button
              type="button"
              onClick={() => setServings((s) => s + 1)}
              className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-pink-300 text-pink-600 font-bold"
              aria-label="Tăng khẩu phần"
            >
              +
            </button>
          </div>
        )}

        {hasConversions && (
          <button
            type="button"
            onClick={() => setUseConverted((v) => !v)}
            className="rounded-full border-2 border-pink-300 px-4 py-1.5 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
          >
            {useConverted ? "Đổi về đơn vị gốc" : "Đổi đơn vị đo"}
          </button>
        )}
      </div>

      {ingredients.length === 0 ? (
        <p className="text-[14px] text-ink-soft">
          Công thức chưa có danh sách nguyên liệu.
        </p>
      ) : (
        <div className="flex flex-col gap-6">
          {Array.from(bySection.entries()).map(([secId, items]) => (
            <div key={secId ?? "none"}>
              {secId && sectionName.get(secId) && (
                <h3 className="mb-2.5 text-[14.5px] font-bold text-pink-600">
                  {sectionName.get(secId)}
                </h3>
              )}
              <ul className="flex flex-col gap-2">
                {items
                  .sort((a, b) => a.position - b.position)
                  .map((ing) => {
                    const d = displayFor(ing);
                    return (
                      <li
                        key={ing.id}
                        className={`flex items-baseline gap-2 text-[14.5px] rounded-xl border px-4 py-2.5 ${
                          ing.is_allergen
                            ? "border-pink-500/30 bg-pink-500/10"
                            : "border-pink-500/10 bg-surface"
                        }`}
                      >
                        <span className="font-bold text-ink min-w-[70px]">
                          {d.qty} {d.unit}
                        </span>
                        <span className="flex-1">{ing.raw_text || ing.name}</span>
                        {ing.is_optional && (
                          <span className="text-[12px] text-ink-soft">(tuỳ chọn)</span>
                        )}
                        {ing.in_pantry && (
                          <span className="rounded-full bg-mint/25 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
                            Có sẵn
                          </span>
                        )}
                        {ing.is_allergen && (
                          <span className="rounded-full bg-pink-500/15 px-2 py-0.5 text-[11px] font-bold text-pink-600">
                            Dị ứng
                          </span>
                        )}
                      </li>
                    );
                  })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
