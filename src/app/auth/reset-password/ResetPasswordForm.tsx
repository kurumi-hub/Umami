"use client";

import { useActionState } from "react";
import { resetPassword } from "@/app/auth/actions";
import AuthField from "@/app/auth/AuthField";

export default function ResetPasswordForm() {
  const [state, formAction, pending] = useActionState(resetPassword, null);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <AuthField
        label="Mật khẩu mới"
        name="password"
        type="password"
        placeholder="Tối thiểu 6 ký tự"
        autoComplete="new-password"
      />
      <AuthField
        label="Xác nhận mật khẩu mới"
        name="confirmPassword"
        type="password"
        placeholder="Nhập lại mật khẩu mới"
        autoComplete="new-password"
      />

      {state?.error && (
        <p className="rounded-xl bg-pink-50 px-3.5 py-2.5 text-[13.5px] font-medium text-pink-600">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-pink-500 px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pending ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}
