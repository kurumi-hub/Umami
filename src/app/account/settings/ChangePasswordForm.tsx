"use client";

import { useState, useTransition } from "react";
import { updatePassword } from "./actions";

export default function ChangePasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSaved(false);

    if (password.length < 6) {
      setError("Mật khẩu cần ít nhất 6 ký tự.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Xác nhận mật khẩu không khớp.");
      return;
    }

    startTransition(async () => {
      const result = await updatePassword(password);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
        setPassword("");
        setConfirmPassword("");
      }
    });
  }

  return (
    <div className="rounded-2xl border border-pink-500/10 bg-surface p-5 flex flex-col gap-4">
      <label className="block text-left">
        <span className="text-[13px] font-semibold text-ink">Mật khẩu mới</span>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Tối thiểu 6 ký tự"
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      <label className="block text-left">
        <span className="text-[13px] font-semibold text-ink">Xác nhận mật khẩu mới</span>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      {error && <p className="text-[12.5px] text-pink-600">{error}</p>}
      {saved && !error && (
        <p className="text-[12.5px] font-semibold text-emerald-700">
          Đã đổi mật khẩu thành công.
        </p>
      )}

      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Đổi mật khẩu"}
        </button>
      </div>
    </div>
  );
}
