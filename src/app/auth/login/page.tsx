"use client";

import { Suspense, useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { login } from "@/app/auth/actions";
import AuthField from "@/app/auth/AuthField";
import AuthShell from "@/app/auth/AuthShell";

function LoginForm() {
  const [state, formAction, pending] = useActionState(login, null);
  const searchParams = useSearchParams();
  const justReset = searchParams.get("reset") === "success";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      {justReset && (
        <p className="rounded-xl bg-mint/20 px-3.5 py-2.5 text-[13.5px] font-medium text-emerald-700">
          Đặt lại mật khẩu thành công. Hãy đăng nhập lại.
        </p>
      )}

      <AuthField
        label="Email"
        name="email"
        type="email"
        placeholder="ban@email.com"
        autoComplete="email"
      />
      <div>
        <AuthField
          label="Mật khẩu"
          name="password"
          type="password"
          placeholder="••••••••"
          autoComplete="current-password"
        />
        <div className="mt-1.5 text-right">
          <Link
            href="/auth/forgot-password"
            className="text-[12.5px] font-semibold text-pink-600"
          >
            Quên mật khẩu?
          </Link>
        </div>
      </div>

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
  );
}

export default function LoginPage() {
  return (
    <AuthShell
      title="Chào bạn quay lại"
      subtitle="Đăng nhập để tiếp tục khám phá công thức trên Umami"
      footer={
        <>
          Chưa có tài khoản?{" "}
          <Link href="/auth/signup" className="font-semibold text-pink-600">
            Đăng ký ngay
          </Link>
        </>
      }
    >
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
