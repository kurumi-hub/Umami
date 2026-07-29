"use client";

import { useState, useTransition } from "react";
import { unblockUser } from "./actions";

type Blocked = { id: string; username: string; display_name: string | null };

export default function BlockedUsersManager({
  initialBlocked,
}: {
  initialBlocked: Blocked[];
}) {
  const [blocked, setBlocked] = useState(initialBlocked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleUnblock(userId: string) {
    setError(null);
    const prev = blocked;
    setBlocked((b) => b.filter((x) => x.id !== userId));
    startTransition(async () => {
      const result = await unblockUser(userId);
      if (result.error) {
        setError(result.error);
        setBlocked(prev);
      }
    });
  }

  if (blocked.length === 0) {
    return (
      <p className="text-[13.5px] text-ink-soft">
        Bạn chưa chặn ai. Chặn ai đó ở trang Kết nối hoặc trang hồ sơ của họ.
      </p>
    );
  }

  return (
    <div>
      {error && <p className="mb-3 text-[12.5px] text-pink-600">{error}</p>}
      <div className="flex flex-col gap-2.5">
        {blocked.map((b) => (
          <div
            key={b.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-pink-500/10 bg-surface px-4 py-2.5"
          >
            <div>
              <span className="block text-[14px] font-semibold">
                {b.display_name || b.username}
              </span>
              <span className="text-[12px] text-ink-soft">@{b.username}</span>
            </div>
            <button
              type="button"
              onClick={() => handleUnblock(b.id)}
              disabled={pending}
              className="rounded-full border-2 border-pink-300 px-3.5 py-1.5 text-[12px] font-bold text-pink-600 hover:bg-pink-50 disabled:opacity-50"
            >
              Bỏ chặn
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
