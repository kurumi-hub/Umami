"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import AuthField from "@/app/auth/AuthField";
import AuthShell from "@/app/auth/AuthShell";

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, null);

  return (
    <AuthShell
      title="Chào bạn quay lại"
      subtitle="Đăng nhập để tiếp tục đặt món trên EatNow"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/signup" className="font-semibold text-pink-600">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <AuthField
          label="Email"
          name="email"
          type="email"
          placeholder="ban@email.com"
          autoComplete="email"
        />
        <AuthField
          label="Mật khẩu"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
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
          {pending ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </AuthShell>
  );
}
