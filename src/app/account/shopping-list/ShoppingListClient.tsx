"use client";

import { useMemo, useState, useTransition } from "react";
import { IconTrash } from "@/app/icons";
import {
  addCustomShoppingItem,
  addPantryItem,
  clearAllItems,
  clearCheckedItems,
  removeShoppingItem,
  toggleShoppingItem,
} from "@/app/account/actions";

type Item = {
  id: string;
  ingredientId: string | null;
  name: string;
  aisle: string | null;
  quantity: number | null;
  unit: string | null;
  is_checked: boolean;
  recipe_title: string | null;
};

const AISLE_ORDER = ["thịt", "hải sản", "rau củ", "trứng & sữa", "tinh bột", "gia vị"];

function aisleLabel(aisle: string | null) {
  return aisle || "Khác";
}

function formatQty(qty: number | null, unit: string | null) {
  if (qty == null) return "";
  const rounded = Number.isInteger(qty) ? qty : Math.round(qty * 100) / 100;
  return `${rounded} ${unit || ""}`.trim();
}

function ItemRow({
  item,
  onToggle,
  onRemove,
}: {
  item: Item;
  onToggle: (item: Item) => void;
  onRemove: (id: string) => void;
}) {
  const [pantryOpen, setPantryOpen] = useState(false);
  const [addedToPantry, setAddedToPantry] = useState(false);
  const [qty, setQty] = useState(item.quantity != null ? String(item.quantity) : "");
  const [unit, setUnit] = useState(item.unit ?? "");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const canAddToPantry = item.is_checked && item.ingredientId && !addedToPantry;

  function handleConfirmPantry() {
    if (!item.ingredientId) return;
    setError(null);
    const quantity = qty.trim() ? parseFloat(qty) : null;
    startTransition(async () => {
      const result = await addPantryItem(
        item.ingredientId!,
        quantity,
        unit || null,
        expiry || null
      );
      if (result.error) {
        setError(result.error);
      } else {
        setAddedToPantry(true);
        setPantryOpen(false);
      }
    });
  }

  return (
    <li
      className={`rounded-xl border px-4 py-2.5 transition-colors ${
        item.is_checked
          ? "border-pink-500/10 bg-pink-500/5 opacity-80"
          : "border-pink-500/10 bg-surface"
      }`}
    >
      <div className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={item.is_checked}
          onChange={() => onToggle(item)}
          className="h-4.5 w-4.5 shrink-0 rounded border-pink-300/70 text-pink-500 focus:ring-pink-500/40"
        />
        <div className="flex-1 min-w-0">
          <span
            className={`text-[14px] font-semibold ${item.is_checked ? "line-through" : ""}`}
          >
            {formatQty(item.quantity, item.unit)} {item.name}
          </span>
          {item.recipe_title && (
            <span className="block text-[11.5px] text-ink-soft">
              Từ: {item.recipe_title}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label="Xoá món"
          className="shrink-0 text-ink-soft hover:text-pink-600 transition-colors"
        >
          <IconTrash className="h-4 w-4" />
        </button>
      </div>

      {canAddToPantry && !pantryOpen && (
        <button
          type="button"
          onClick={() => setPantryOpen(true)}
          className="mt-2 ml-7 text-[12px] font-bold text-emerald-700 hover:underline"
        >
          + Thêm vào tủ lạnh
        </button>
      )}

      {item.is_checked && addedToPantry && (
        <span className="mt-2 ml-7 block text-[12px] font-semibold text-emerald-700">
          Đã thêm vào tủ lạnh
        </span>
      )}

      {pantryOpen && (
        <div className="mt-2.5 ml-7 rounded-xl bg-mint/10 p-3">
          <div className="grid grid-cols-2 gap-2 mb-2">
            <input
              type="number"
              min={0}
              step="any"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="Số lượng"
              className="rounded-lg border border-pink-300/70 bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-pink-500"
            />
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="Đơn vị (g, ml...)"
              className="rounded-lg border border-pink-300/70 bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-pink-500"
            />
          </div>
          <input
            type="date"
            value={expiry}
            onChange={(e) => setExpiry(e.target.value)}
            className="mb-2 w-full rounded-lg border border-pink-300/70 bg-surface px-2.5 py-1.5 text-[13px] outline-none focus:border-pink-500"
          />
          {error && <p className="mb-2 text-[11.5px] text-pink-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleConfirmPantry}
              disabled={pending}
              className="rounded-full bg-emerald-600 px-4 py-1.5 text-[12px] font-bold text-white disabled:opacity-50"
            >
              Xác nhận
            </button>
            <button
              type="button"
              onClick={() => setPantryOpen(false)}
              className="rounded-full border-2 border-pink-300 px-4 py-1.5 text-[12px] font-bold text-pink-600"
            >
              Huỷ
            </button>
          </div>
        </div>
      )}
    </li>
  );
}

export default function ShoppingListClient({
  initialItems,
}: {
  initialItems: Item[];
}) {
  const [items, setItems] = useState(initialItems);
  const [newItemName, setNewItemName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const [pending, startTransition] = useTransition();

  const grouped = useMemo(() => {
    const map = new Map<string, Item[]>();
    for (const it of items) {
      const key = aisleLabel(it.aisle);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(it);
    }
    const entries = Array.from(map.entries());
    entries.sort((a, b) => {
      const ia = AISLE_ORDER.indexOf(a[0]);
      const ib = AISLE_ORDER.indexOf(b[0]);
      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    });
    return entries;
  }, [items]);

  const uncheckedCount = items.filter((i) => !i.is_checked).length;
  const checkedCount = items.length - uncheckedCount;

  function handleToggle(item: Item) {
    const next = !item.is_checked;
    setItems((prev) =>
      prev.map((it) => (it.id === item.id ? { ...it, is_checked: next } : it))
    );
    startTransition(async () => {
      const result = await toggleShoppingItem(item.id, next);
      if (result.error) {
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, is_checked: !next } : it))
        );
        setError(result.error);
      }
    });
  }

  function handleRemove(itemId: string) {
    const prev = items;
    setItems((cur) => cur.filter((it) => it.id !== itemId));
    startTransition(async () => {
      const result = await removeShoppingItem(itemId);
      if (result.error) {
        setItems(prev);
        setError(result.error);
      }
    });
  }

  function handleAdd() {
    const name = newItemName.trim();
    if (!name) return;
    setError(null);
    setNewItemName("");
    startTransition(async () => {
      const result = await addCustomShoppingItem(name);
      if (result.error) {
        setError(result.error);
      } else if (result.item) {
        setItems((prev) => [
          {
            id: result.item!.id,
            ingredientId: null,
            name: result.item!.custom_name || name,
            aisle: null,
            quantity: result.item!.quantity,
            unit: result.item!.unit,
            is_checked: result.item!.is_checked,
            recipe_title: null,
          },
          ...prev,
        ]);
      }
    });
  }

  function handleClearChecked() {
    const prev = items;
    setItems((cur) => cur.filter((it) => !it.is_checked));
    startTransition(async () => {
      const result = await clearCheckedItems();
      if (result.error) {
        setItems(prev);
        setError(result.error);
      }
    });
  }

  function handleClearAll() {
    if (!confirmClearAll) {
      setConfirmClearAll(true);
      return;
    }
    const prev = items;
    setItems([]);
    setConfirmClearAll(false);
    startTransition(async () => {
      const result = await clearAllItems();
      if (result.error) {
        setItems(prev);
        setError(result.error);
      }
    });
  }

  return (
    <div>
      <div className="mb-6 flex gap-2">
        <input
          type="text"
          value={newItemName}
          onChange={(e) => setNewItemName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Thêm món (vd: giấy ăn, nước rửa chén...)"
          className="flex-1 rounded-full border border-pink-300/70 bg-surface px-4 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15"
        />
        <button
          type="button"
          onClick={handleAdd}
          disabled={pending || !newItemName.trim()}
          className="rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          Thêm
        </button>
      </div>

      {error && <p className="mb-4 text-[12.5px] text-pink-600">{error}</p>}

      <div className="mb-5 flex items-center justify-between text-[13px] text-ink-soft flex-wrap gap-2">
        <span>
          {uncheckedCount} món cần mua · {checkedCount} đã mua
        </span>
        <div className="flex items-center gap-3">
          {checkedCount > 0 && (
            <button
              type="button"
              onClick={handleClearChecked}
              className="font-semibold text-pink-600 hover:underline"
            >
              Xoá các món đã mua
            </button>
          )}
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              className={`font-semibold hover:underline ${
                confirmClearAll ? "text-pink-600" : "text-ink-soft"
              }`}
            >
              {confirmClearAll ? "Bấm lần nữa để xoá tất cả" : "Xoá tất cả"}
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
          Danh sách đi chợ đang trống. Thêm món ở trên, hoặc bấm &quot;Thêm
          vào danh sách đi chợ&quot; ở trang chi tiết công thức.
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {grouped.map(([aisle, list]) => (
            <div key={aisle}>
              <h3 className="mb-2.5 text-[13.5px] font-bold uppercase tracking-wide text-pink-600">
                {aisle}
              </h3>
              <ul className="flex flex-col gap-2">
                {list.map((item) => (
                  <ItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onRemove={handleRemove}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
