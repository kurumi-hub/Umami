"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/app/auth/actions";
import AuthField from "@/app/auth/AuthField";
import AuthShell from "@/app/auth/AuthShell";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState(forgotPassword, null);

  return (
    <AuthShell
      title="Quên mật khẩu?"
      subtitle="Nhập email để nhận liên kết đặt lại mật khẩu"
      footer={
        <Link href="/auth/login" className="font-semibold text-pink-600">
          ← Quay lại đăng nhập
        </Link>
      }
    >
      {state?.success ? (
        <p className="rounded-xl bg-mint/20 px-3.5 py-2.5 text-center text-[13.5px] font-medium text-emerald-700">
          {state.success}
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-4">
          <AuthField
            label="Email"
            name="email"
            type="email"
            placeholder="ban@email.com"
            autoComplete="email"
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
            {pending ? "Đang gửi..." : "Gửi liên kết đặt lại"}
          </button>
        </form>
      )}
    </AuthShell>
  );
}
