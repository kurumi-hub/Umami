"use client";

import { useState, useTransition } from "react";
import { togglePrivateAccount } from "./actions";

export default function PrivateAccountToggle({
  initialIsPrivate,
}: {
  initialIsPrivate: boolean;
}) {
  const [isPrivate, setIsPrivate] = useState(initialIsPrivate);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleToggle() {
    setError(null);
    const next = !isPrivate;
    setIsPrivate(next);
    startTransition(async () => {
      const result = await togglePrivateAccount(next);
      if (result.error) {
        setIsPrivate(!next);
        setError(result.error);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-pink-500/10 bg-surface p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <b className="text-[14px] block">Tài khoản riêng tư</b>
          <span className="text-[12.5px] text-ink-soft">
            Khi bật, yêu cầu theo dõi mới cần bạn duyệt trước khi được xem
            công thức và bộ sưu tập của bạn.
          </span>
        </div>
        <button
          type="button"
          onClick={handleToggle}
          disabled={pending}
          role="switch"
          aria-checked={isPrivate}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-50 ${
            isPrivate ? "bg-pink-500" : "bg-pink-500/20"
          }`}
        >
          <span
            className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform ${
              isPrivate ? "translate-x-5" : "translate-x-0"
            }`}
          />
        </button>
      </div>
      {error && <p className="mt-2 text-[12.5px] text-pink-600">{error}</p>}
    </div>
  );
}
