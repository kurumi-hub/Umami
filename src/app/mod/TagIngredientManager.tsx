"use client";

import { useEffect, useState, useTransition } from "react";
import { IconCheckCircle, IconSearch, IconTag } from "@/app/icons";
import {
  searchIngredients,
  searchTags,
  upsertIngredient,
  upsertTag,
  type TagType,
} from "./actions";

function slugify(input: string) {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

const tagTypeLabels: Record<TagType, string> = {
  cuisine: "Ẩm thực vùng miền",
  meal_type: "Bữa ăn",
  diet: "Chế độ ăn",
  occasion: "Dịp/sự kiện",
  technique: "Kỹ thuật nấu",
  main_ingredient: "Nguyên liệu chính",
};

const tagTypes = Object.keys(tagTypeLabels) as TagType[];

type Tag = {
  id: string;
  type: TagType;
  name: string;
  slug: string;
  image_url: string | null;
  position: number;
};

type Ingredient = {
  id: string;
  name: string;
  slug: string;
  aisle: string | null;
  image_url: string | null;
  is_allergen: boolean;
};

const emptyTagForm = { type: "cuisine" as TagType, name: "", slug: "", imageUrl: "", position: 0 };
const emptyIngredientForm = {
  name: "",
  slug: "",
  aisle: "",
  imageUrl: "",
  isAllergen: false,
};

export default function TagIngredientManager() {
  const [tab, setTab] = useState<"tag" | "ingredient">("tag");

  return (
    <div className="rounded-[20px] border border-pink-100 bg-surface px-5 py-4">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-pink-100">
          <IconTag className="h-4 w-4 text-pink-500" />
        </div>
        <h2 className="font-display font-extrabold text-[19px]">Quản lý tag & nguyên liệu</h2>
      </div>

      <div className="mb-4 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("tag")}
          className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors ${
            tab === "tag"
              ? "bg-pink-500 text-white"
              : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
          }`}
        >
          Tag
        </button>
        <button
          type="button"
          onClick={() => setTab("ingredient")}
          className={`rounded-full px-4 py-1.5 text-[13px] font-bold transition-colors ${
            tab === "ingredient"
              ? "bg-pink-500 text-white"
              : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
          }`}
        >
          Nguyên liệu
        </button>
      </div>

      {tab === "tag" ? <TagPanel /> : <IngredientPanel />}
    </div>
  );
}

function TagPanel() {
  const [query, setQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<TagType | "">("");
  const [results, setResults] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyTagForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function runSearch() {
    setLoading(true);
    setListError(null);
    const result = await searchTags(query, typeFilter || undefined);
    setLoading(false);
    if (result.error) setListError(result.error);
    else setResults(result.tags as Tag[]);
  }

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, typeFilter]);

  function loadIntoForm(tag: Tag) {
    setForm({
      type: tag.type,
      name: tag.name,
      slug: tag.slug,
      imageUrl: tag.image_url ?? "",
      position: tag.position,
    });
    setSlugTouched(true);
    setSuccess(null);
    setFormError(null);
  }

  function resetForm() {
    setForm(emptyTagForm);
    setSlugTouched(false);
    setSuccess(null);
    setFormError(null);
  }

  function handleNameChange(value: string) {
    setForm((f) => ({ ...f, name: value, slug: slugTouched ? f.slug : slugify(value) }));
  }

  function handleSubmit() {
    setFormError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await upsertTag(
        form.type,
        form.name,
        form.slug,
        form.imageUrl || null,
        form.position
      );
      if (result.error) {
        setFormError(result.error);
      } else {
        setSuccess(`Đã lưu tag "${form.name}".`);
        runSearch();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px]">
          <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Tìm tag theo tên..."
            className="w-full rounded-full border border-pink-200 bg-transparent py-2 pl-9 pr-3 text-[13.5px] outline-none focus:border-pink-400"
          />
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as TagType | "")}
          className="rounded-full border border-pink-200 bg-transparent px-3 py-2 text-[13px] outline-none focus:border-pink-400"
        >
          <option value="">Tất cả loại</option>
          {tagTypes.map((t) => (
            <option key={t} value={t}>
              {tagTypeLabels[t]}
            </option>
          ))}
        </select>
      </div>

      {listError && <p className="text-[12.5px] text-pink-600">{listError}</p>}

      <div className="max-h-[280px] overflow-y-auto rounded-[14px] border border-pink-100">
        {loading ? (
          <p className="px-4 py-6 text-center text-[13px] text-ink-soft">Đang tải...</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-ink-soft">Không có tag nào.</p>
        ) : (
          <ul className="divide-y divide-pink-100">
            {results.map((tag) => (
              <li
                key={tag.id}
                className="flex items-center justify-between gap-2 px-4 py-2.5 text-[13.5px]"
              >
                <div className="min-w-0">
                  <b className="block truncate">{tag.name}</b>
                  <span className="text-[12px] text-ink-soft">
                    {tagTypeLabels[tag.type]} · /{tag.slug} · vị trí {tag.position}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => loadIntoForm(tag)}
                  className="shrink-0 rounded-full border-2 border-pink-300 px-3 py-1 text-[12px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
                >
                  Sửa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[16px] border border-dashed border-pink-300/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <b className="text-[13.5px]">
            {slugTouched && form.slug ? "Sửa tag" : "Thêm tag mới"}
          </b>
          {(form.name || form.slug) && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[12px] font-semibold text-pink-600"
            >
              Làm mới form
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink">Loại tag</span>
            <select
              value={form.type}
              onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as TagType }))}
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            >
              {tagTypes.map((t) => (
                <option key={t} value={t}>
                  {tagTypeLabels[t]}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink">Vị trí hiển thị</span>
            <input
              type="number"
              value={form.position}
              onChange={(e) => setForm((f) => ({ ...f, position: Number(e.target.value) }))}
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink">Tên</span>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="vd: Món Huế"
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink">Slug</span>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
              }}
              placeholder="mon-hue"
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            />
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[12.5px] font-semibold text-ink">Ảnh (URL, không bắt buộc)</span>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            />
          </label>
        </div>

        {formError && <p className="mt-3 text-[12.5px] text-pink-600">{formError}</p>}
        {success && (
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600">
            <IconCheckCircle className="h-3.5 w-3.5" />
            {success}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="mt-3 rounded-full bg-pink-500 px-5 py-2 text-[13px] font-bold text-white hover:bg-pink-600 transition-colors disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Lưu tag"}
        </button>
        <p className="mt-2 text-[11.5px] text-ink-soft">
          Cùng loại + slug đã tồn tại sẽ được cập nhật thay vì tạo trùng.
        </p>
      </div>
    </div>
  );
}

function IngredientPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Ingredient[]>([]);
  const [loading, setLoading] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyIngredientForm);
  const [slugTouched, setSlugTouched] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  async function runSearch() {
    setLoading(true);
    setListError(null);
    const result = await searchIngredients(query);
    setLoading(false);
    if (result.error) setListError(result.error);
    else setResults(result.ingredients as Ingredient[]);
  }

  useEffect(() => {
    const t = setTimeout(runSearch, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  function loadIntoForm(ingredient: Ingredient) {
    setForm({
      name: ingredient.name,
      slug: ingredient.slug,
      aisle: ingredient.aisle ?? "",
      imageUrl: ingredient.image_url ?? "",
      isAllergen: ingredient.is_allergen,
    });
    setSlugTouched(true);
    setSuccess(null);
    setFormError(null);
  }

  function resetForm() {
    setForm(emptyIngredientForm);
    setSlugTouched(false);
    setSuccess(null);
    setFormError(null);
  }

  function handleNameChange(value: string) {
    setForm((f) => ({ ...f, name: value, slug: slugTouched ? f.slug : slugify(value) }));
  }

  function handleSubmit() {
    setFormError(null);
    setSuccess(null);
    startTransition(async () => {
      const result = await upsertIngredient(
        form.name,
        form.slug,
        form.aisle || null,
        form.isAllergen,
        form.imageUrl || null
      );
      if (result.error) {
        setFormError(result.error);
      } else {
        setSuccess(`Đã lưu nguyên liệu "${form.name}".`);
        runSearch();
      }
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-ink-soft" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm nguyên liệu theo tên..."
          className="w-full rounded-full border border-pink-200 bg-transparent py-2 pl-9 pr-3 text-[13.5px] outline-none focus:border-pink-400"
        />
      </div>

      {listError && <p className="text-[12.5px] text-pink-600">{listError}</p>}

      <div className="max-h-[280px] overflow-y-auto rounded-[14px] border border-pink-100">
        {loading ? (
          <p className="px-4 py-6 text-center text-[13px] text-ink-soft">Đang tải...</p>
        ) : results.length === 0 ? (
          <p className="px-4 py-6 text-center text-[13px] text-ink-soft">
            Không có nguyên liệu nào.
          </p>
        ) : (
          <ul className="divide-y divide-pink-100">
            {results.map((ing) => (
              <li
                key={ing.id}
                className="flex items-center justify-between gap-2 px-4 py-2.5 text-[13.5px]"
              >
                <div className="min-w-0">
                  <b className="block truncate">{ing.name}</b>
                  <span className="text-[12px] text-ink-soft">
                    /{ing.slug}
                    {ing.aisle ? ` · ${ing.aisle}` : ""}
                    {ing.is_allergen ? " · dị ứng" : ""}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => loadIntoForm(ing)}
                  className="shrink-0 rounded-full border-2 border-pink-300 px-3 py-1 text-[12px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
                >
                  Sửa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-[16px] border border-dashed border-pink-300/60 p-4">
        <div className="mb-3 flex items-center justify-between">
          <b className="text-[13.5px]">
            {slugTouched && form.slug ? "Sửa nguyên liệu" : "Thêm nguyên liệu mới"}
          </b>
          {(form.name || form.slug) && (
            <button
              type="button"
              onClick={resetForm}
              className="text-[12px] font-semibold text-pink-600"
            >
              Làm mới form
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink">Tên</span>
            <input
              value={form.name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="vd: Hành lá"
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink">Slug</span>
            <input
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true);
                setForm((f) => ({ ...f, slug: slugify(e.target.value) }));
              }}
              placeholder="hanh-la"
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink">Gian hàng (aisle)</span>
            <input
              value={form.aisle}
              onChange={(e) => setForm((f) => ({ ...f, aisle: e.target.value }))}
              placeholder="vd: rau củ"
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            />
          </label>
          <label className="mt-6 flex items-center gap-1.5">
            <input
              type="checkbox"
              checked={form.isAllergen}
              onChange={(e) => setForm((f) => ({ ...f, isAllergen: e.target.checked }))}
              className="accent-pink-500"
            />
            <span className="text-[13px] text-ink">Là chất gây dị ứng</span>
          </label>
          <label className="block sm:col-span-2">
            <span className="text-[12.5px] font-semibold text-ink">Ảnh (URL, không bắt buộc)</span>
            <input
              value={form.imageUrl}
              onChange={(e) => setForm((f) => ({ ...f, imageUrl: e.target.value }))}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
            />
          </label>
        </div>

        {formError && <p className="mt-3 text-[12.5px] text-pink-600">{formError}</p>}
        {success && (
          <p className="mt-3 flex items-center gap-1.5 text-[12.5px] font-semibold text-emerald-600">
            <IconCheckCircle className="h-3.5 w-3.5" />
            {success}
          </p>
        )}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="mt-3 rounded-full bg-pink-500 px-5 py-2 text-[13px] font-bold text-white hover:bg-pink-600 transition-colors disabled:opacity-60"
        >
          {pending ? "Đang lưu..." : "Lưu nguyên liệu"}
        </button>
        <p className="mt-2 text-[11.5px] text-ink-soft">
          Slug đã tồn tại sẽ được cập nhật thay vì tạo trùng.
        </p>
      </div>
    </div>
  );
}
