"use client";

import { useState, useTransition } from "react";
import { IconPlus, IconX } from "@/app/icons";
import { createRecipe, type RecipePayload } from "./actions";

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

let nextKey = 1;

export default function NewRecipeForm({ tags }: { tags: Tag[] }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");
  const [cookTime, setCookTime] = useState("");
  const [servings, setServings] = useState("4");
  const [servingsUnit, setServingsUnit] = useState("người ăn");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    { key: nextKey++, name: "", quantity: "", unit: "", isOptional: false },
  ]);
  const [steps, setSteps] = useState<StepRow[]>([
    { key: nextKey++, content: "", timerMinutes: "" },
  ]);

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

    const payload: RecipePayload = {
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
      const result = await createRecipe(payload);
      // createRecipe redirect() khi thành công nên chỉ còn nhánh lỗi ở đây.
      if (result?.error) {
        setError(result.error);
      }
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {/* THÔNG TIN CHUNG */}
      <section className="rounded-2xl border border-pink-500/10 bg-surface p-5 flex flex-col gap-4">
        <label className="block text-left">
          <span className="text-[13px] font-semibold text-ink">Tên công thức</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="VD: Phở bò truyền thống"
            className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
          />
        </label>

        <label className="block text-left">
          <span className="text-[13px] font-semibold text-ink">Mô tả ngắn</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Vài câu giới thiệu về món ăn..."
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

      {/* NGUYÊN LIỆU */}
      <section>
        <h2 className="mb-3 text-[16px] font-bold">Nguyên liệu</h2>
        <div className="flex flex-col gap-2.5">
          {ingredients.map((row) => (
            <div key={row.key} className="flex items-center gap-2">
              <input
                type="number"
                step="any"
                min={0}
                value={row.quantity}
                onChange={(e) => updateIngredient(row.key, { quantity: e.target.value })}
                placeholder="SL"
                className="w-[70px] rounded-xl border border-pink-300/70 bg-surface px-2 py-2 text-[13.5px] outline-none focus:border-pink-500"
              />
              <input
                type="text"
                value={row.unit}
                onChange={(e) => updateIngredient(row.key, { unit: e.target.value })}
                placeholder="Đơn vị"
                className="w-[90px] rounded-xl border border-pink-300/70 bg-surface px-2 py-2 text-[13.5px] outline-none focus:border-pink-500"
              />
              <input
                type="text"
                value={row.name}
                onChange={(e) => updateIngredient(row.key, { name: e.target.value })}
                placeholder="Tên nguyên liệu"
                className="flex-1 rounded-xl border border-pink-300/70 bg-surface px-3 py-2 text-[13.5px] outline-none focus:border-pink-500"
              />
              <label className="flex items-center gap-1 shrink-0 text-[11.5px] text-ink-soft">
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
                className="shrink-0 text-ink-soft hover:text-pink-600"
              >
                <IconX className="h-4 w-4" />
              </button>
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

      {/* CÁC BƯỚC */}
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
                  placeholder="Mô tả bước này..."
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

      {/* TAGS */}
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
        {pending ? "Đang đăng..." : "Đăng công thức"}
      </button>
    </div>
  );
}
