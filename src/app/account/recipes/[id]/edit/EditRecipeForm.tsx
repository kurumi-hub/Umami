"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconX } from "@/app/icons";
import { updateRecipe, type RecipeEditPayload } from "./actions";

type Tag = { id: string; type: string; name: string };

type IngredientRow = {
  key: number;
  name: string;
  quantity: string;
  unit: string;
  isOptional: boolean;
};

type StepRow = {
  key: number;
  content: string;
  timerMinutes: string;
};

const tagTypeLabels: Record<string, string> = {
  cuisine: "Ẩm thực",
  meal_type: "Bữa ăn",
  diet: "Chế độ ăn",
};

type NutritionValue = {
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  fiberG: number | null;
  sugarG: number | null;
  sodiumMg: number | null;
  perServing: boolean;
} | null;

let nextKey = 1;

export default function EditRecipeForm({
  recipeId,
  tags,
  initialTitle,
  initialDescription,
  initialPrepTime,
  initialCookTime,
  initialServings,
  initialServingsUnit,
  initialDifficulty,
  initialIngredients,
  initialSteps,
  initialTagIds,
  initialNutrition,
}: {
  recipeId: string;
  tags: Tag[];
  initialTitle: string;
  initialDescription: string;
  initialPrepTime: number | null;
  initialCookTime: number | null;
  initialServings: number | null;
  initialServingsUnit: string;
  initialDifficulty: "easy" | "medium" | "hard";
  initialIngredients: { name: string; quantity: number | null; unit: string | null; isOptional: boolean }[];
  initialSteps: { content: string; timerSeconds: number | null }[];
  initialTagIds: string[];
  initialNutrition: NutritionValue;
}) {
  const [title, setTitle] = useState(initialTitle);
  const [description, setDescription] = useState(initialDescription);
  const [prepTime, setPrepTime] = useState(initialPrepTime != null ? String(initialPrepTime) : "");
  const [cookTime, setCookTime] = useState(initialCookTime != null ? String(initialCookTime) : "");
  const [servings, setServings] = useState(initialServings != null ? String(initialServings) : "");
  const [servingsUnit, setServingsUnit] = useState(initialServingsUnit);
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">(initialDifficulty);
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagIds);

  const [calories, setCalories] = useState(
    initialNutrition?.calories != null ? String(initialNutrition.calories) : ""
  );
  const [proteinG, setProteinG] = useState(
    initialNutrition?.proteinG != null ? String(initialNutrition.proteinG) : ""
  );
  const [fatG, setFatG] = useState(
    initialNutrition?.fatG != null ? String(initialNutrition.fatG) : ""
  );
  const [carbsG, setCarbsG] = useState(
    initialNutrition?.carbsG != null ? String(initialNutrition.carbsG) : ""
  );
  const [fiberG, setFiberG] = useState(
    initialNutrition?.fiberG != null ? String(initialNutrition.fiberG) : ""
  );
  const [sugarG, setSugarG] = useState(
    initialNutrition?.sugarG != null ? String(initialNutrition.sugarG) : ""
  );
  const [sodiumMg, setSodiumMg] = useState(
    initialNutrition?.sodiumMg != null ? String(initialNutrition.sodiumMg) : ""
  );
  const [perServing, setPerServing] = useState(initialNutrition?.perServing ?? true);

  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    initialIngredients.length > 0
      ? initialIngredients.map((i) => ({
          key: nextKey++,
          name: i.name,
          quantity: i.quantity != null ? String(i.quantity) : "",
          unit: i.unit ?? "",
          isOptional: i.isOptional,
        }))
      : [{ key: nextKey++, name: "", quantity: "", unit: "", isOptional: false }]
  );
  const [steps, setSteps] = useState<StepRow[]>(
    initialSteps.length > 0
      ? initialSteps.map((s) => ({
          key: nextKey++,
          content: s.content,
          timerMinutes: s.timerSeconds != null ? String(Math.round(s.timerSeconds / 60)) : "",
        }))
      : [{ key: nextKey++, content: "", timerMinutes: "" }]
  );

  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const tagsByType = tags.reduce<Record<string, Tag[]>>((acc, t) => {
    (acc[t.type] ??= []).push(t);
    return acc;
  }, {});

  function updateIngredient(key: number, patch: Partial<IngredientRow>) {
    setIngredients((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function updateStep(key: number, patch: Partial<StepRow>) {
    setSteps((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function toggleTag(id: string) {
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  function handleSubmit() {
    setError(null);

    const payload: RecipeEditPayload = {
      title,
      description,
      prepTimeMin: prepTime.trim() ? parseInt(prepTime, 10) : null,
      cookTimeMin: cookTime.trim() ? parseInt(cookTime, 10) : null,
      servings: servings.trim() ? parseInt(servings, 10) : null,
      servingsUnit,
      difficulty,
      ingredients: ingredients.map((r) => ({
        name: r.name,
        quantity: r.quantity.trim() ? parseFloat(r.quantity) : null,
        unit: r.unit.trim() || null,
        isOptional: r.isOptional,
      })),
      steps: steps.map((r) => ({
        content: r.content,
        timerSeconds: r.timerMinutes.trim() ? parseInt(r.timerMinutes, 10) * 60 : null,
      })),
      tagIds: selectedTags,
      nutrition: (() => {
        const vals = {
          calories: calories.trim() ? parseFloat(calories) : null,
          proteinG: proteinG.trim() ? parseFloat(proteinG) : null,
          fatG: fatG.trim() ? parseFloat(fatG) : null,
          carbsG: carbsG.trim() ? parseFloat(carbsG) : null,
          fiberG: fiberG.trim() ? parseFloat(fiberG) : null,
          sugarG: sugarG.trim() ? parseFloat(sugarG) : null,
          sodiumMg: sodiumMg.trim() ? parseFloat(sodiumMg) : null,
          perServing,
        };
        const hasAny = Object.entries(vals).some(
          ([k, v]) => k !== "perServing" && v !== null
        );
        return hasAny ? vals : null;
      })(),
    };

    if (payload.title.trim().length < 3) {
      setError("Tên công thức cần ít nhất 3 ký tự.");
      return;
    }
    if (!payload.ingredients.some((i) => i.name.trim())) {
      setError("Cần ít nhất 1 nguyên liệu.");
      return;
    }
    if (!payload.steps.some((s) => s.content.trim())) {
      setError("Cần ít nhất 1 bước thực hiện.");
      return;
    }

    startTransition(async () => {
      const result = await updateRecipe(recipeId, payload);
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-2xl border border-pink-500/10 bg-surface p-5 flex flex-col gap-4">
        <label className="block text-left">
          <span className="text-[13px] font-semibold text-ink">Tên công thức</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
          />
        </label>

        <label className="block text-left">
          <span className="text-[13px] font-semibold text-ink">Mô tả ngắn</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
          />
        </label>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Sơ chế (phút)</span>
            <input
              type="number"
              min={0}
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Nấu (phút)</span>
            <input
              type="number"
              min={0}
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Khẩu phần</span>
            <input
              type="number"
              min={1}
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Độ khó</span>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value as typeof difficulty)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            >
              <option value="easy">Dễ</option>
              <option value="medium">Vừa</option>
              <option value="hard">Khó</option>
            </select>
          </label>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-[16px] font-bold">Nguyên liệu</h2>
        <div className="flex flex-col gap-2.5">
          {ingredients.map((row) => (
            <div
              key={row.key}
              className="rounded-xl border border-pink-500/10 bg-pink-50/60 p-2.5 flex flex-col gap-2"
            >
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="any"
                  min={0}
                  value={row.quantity}
                  onChange={(e) => updateIngredient(row.key, { quantity: e.target.value })}
                  placeholder="SL"
                  className="w-[62px] shrink-0 rounded-xl border border-pink-300/70 bg-surface px-2 py-2 text-[13.5px] outline-none focus:border-pink-500"
                />
                <input
                  type="text"
                  value={row.unit}
                  onChange={(e) => updateIngredient(row.key, { unit: e.target.value })}
                  placeholder="Đơn vị"
                  className="w-[78px] shrink-0 rounded-xl border border-pink-300/70 bg-surface px-2 py-2 text-[13.5px] outline-none focus:border-pink-500"
                />
                <input
                  type="text"
                  value={row.name}
                  onChange={(e) => updateIngredient(row.key, { name: e.target.value })}
                  placeholder="Tên nguyên liệu"
                  className="flex-1 min-w-0 rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[13.5px] outline-none focus:border-pink-500"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-1.5 text-[11.5px] text-ink-soft">
                  <input
                    type="checkbox"
                    checked={row.isOptional}
                    onChange={(e) => updateIngredient(row.key, { isOptional: e.target.checked })}
                    className="h-3.5 w-3.5 rounded border-pink-300/70 text-pink-500"
                  />
                  Tuỳ chọn
                </label>
                <button
                  type="button"
                  onClick={() => setIngredients((prev) => prev.filter((r) => r.key !== row.key))}
                  aria-label="Xoá nguyên liệu"
                  className="flex items-center gap-1 text-[11.5px] font-semibold text-ink-soft hover:text-pink-600"
                >
                  <IconX className="h-3.5 w-3.5" />
                  Xoá
                </button>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setIngredients((prev) => [
              ...prev,
              { key: nextKey++, name: "", quantity: "", unit: "", isOptional: false },
            ])
          }
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-pink-600 hover:underline"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Thêm nguyên liệu
        </button>
      </section>

      <section>
        <h2 className="mb-3 text-[16px] font-bold">Các bước thực hiện</h2>
        <div className="flex flex-col gap-3">
          {steps.map((row, i) => (
            <div key={row.key} className="flex gap-2.5">
              <span className="mt-2 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-pink-500 text-[13px] font-bold text-white">
                {i + 1}
              </span>
              <div className="flex-1">
                <textarea
                  value={row.content}
                  onChange={(e) => updateStep(row.key, { content: e.target.value })}
                  rows={2}
                  className="w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[13.5px] outline-none focus:border-pink-500"
                />
                <div className="mt-1.5 flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={row.timerMinutes}
                    onChange={(e) => updateStep(row.key, { timerMinutes: e.target.value })}
                    placeholder="Phút hẹn giờ (không bắt buộc)"
                    className="w-[220px] rounded-xl border border-pink-300/70 bg-surface px-3 py-1.5 text-[12.5px] outline-none focus:border-pink-500"
                  />
                  <button
                    type="button"
                    onClick={() => setSteps((prev) => prev.filter((r) => r.key !== row.key))}
                    className="text-[12px] font-semibold text-ink-soft hover:text-pink-600"
                  >
                    Xoá bước
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() =>
            setSteps((prev) => [...prev, { key: nextKey++, content: "", timerMinutes: "" }])
          }
          className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-bold text-pink-600 hover:underline"
        >
          <IconPlus className="h-3.5 w-3.5" />
          Thêm bước
        </button>
      </section>

      {/* DINH DƯỠNG */}
      <section>
        <h2 className="mb-1 text-[16px] font-bold">Dinh dưỡng</h2>
        <p className="mb-3 text-[12.5px] text-ink-soft">
          Không bắt buộc — để trống nếu bạn chưa có số liệu chính xác.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Calo (kcal)</span>
            <input
              type="number"
              min={0}
              value={calories}
              onChange={(e) => setCalories(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Đạm (g)</span>
            <input
              type="number"
              min={0}
              value={proteinG}
              onChange={(e) => setProteinG(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Béo (g)</span>
            <input
              type="number"
              min={0}
              value={fatG}
              onChange={(e) => setFatG(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Tinh bột (g)</span>
            <input
              type="number"
              min={0}
              value={carbsG}
              onChange={(e) => setCarbsG(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Chất xơ (g)</span>
            <input
              type="number"
              min={0}
              value={fiberG}
              onChange={(e) => setFiberG(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Đường (g)</span>
            <input
              type="number"
              min={0}
              value={sugarG}
              onChange={(e) => setSugarG(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-soft">Natri (mg)</span>
            <input
              type="number"
              min={0}
              value={sodiumMg}
              onChange={(e) => setSodiumMg(e.target.value)}
              className="mt-1 w-full rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[14px] outline-none focus:border-pink-500"
            />
          </label>
        </div>
        <label className="flex items-center gap-2.5">
          <input
            type="checkbox"
            checked={perServing}
            onChange={(e) => setPerServing(e.target.checked)}
            className="h-4 w-4 rounded border-pink-300/70 text-pink-500"
          />
          <span className="text-[13px] text-ink-soft">
            Số liệu trên tính cho mỗi khẩu phần (bỏ tick nếu tính cho cả món)
          </span>
        </label>
      </section>

      {Object.keys(tagsByType).length > 0 && (
        <section>
          <h2 className="mb-3 text-[16px] font-bold">Phân loại</h2>
          <div className="flex flex-col gap-3">
            {Object.entries(tagsByType).map(([type, list]) => (
              <div key={type}>
                <span className="mb-1.5 block text-[12.5px] font-semibold text-ink-soft">
                  {tagTypeLabels[type] ?? type}
                </span>
                <div className="flex flex-wrap gap-2">
                  {list.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`rounded-full px-3.5 py-1.5 text-[12.5px] font-bold transition-colors ${
                        selectedTags.includes(tag.id)
                          ? "bg-pink-500 text-white"
                          : "border-2 border-pink-300 text-pink-600"
                      }`}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {error && (
        <p className="rounded-xl bg-pink-50 px-3.5 py-2.5 text-[13.5px] font-medium text-pink-600">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={pending}
        className="rounded-full bg-pink-500 px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)] disabled:opacity-60"
      >
        {pending ? "Đang lưu..." : "Lưu thay đổi"}
      </button>
    </div>
  );
}
