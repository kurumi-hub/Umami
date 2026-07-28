"use client";

import { useActionState } from "react";
import Link from "next/link";
import { signup } from "@/app/auth/actions";
import AuthField from "@/app/auth/AuthField";
import AuthShell from "@/app/auth/AuthShell";

export default function SignupPage() {
  const [state, formAction, pending] = useActionState(signup, null);

  return (
    <AuthShell
      title="Tạo tài khoản EatNow"
      subtitle="Chỉ mất chưa đầy một phút"
      footer={
        <>
          Đã có tài khoản?{" "}
          <Link href="/auth/login" className="font-semibold text-pink-600">
            Đăng nhập
          </Link>
        </>
      }
    >
      <form action={formAction} className="flex flex-col gap-4">
        <AuthField label="Họ và tên" name="name" placeholder="Nguyễn Văn A" autoComplete="name" />
        <AuthField
          label="Username"
          name="username"
          placeholder="nguyenvana"
          autoComplete="username"
          hint="3-30 ký tự, chỉ chữ thường, số và dấu gạch dưới."
        />
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
          placeholder="Tối thiểu 6 ký tự"
          autoComplete="new-password"
        />
        <AuthField
          label="Xác nhận mật khẩu"
          name="confirmPassword"
          type="password"
          placeholder="Nhập lại mật khẩu"
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
          {pending ? "Đang tạo tài khoản..." : "Tạo tài khoản"}
        </button>

        <p className="text-center text-[12.5px] leading-relaxed text-ink-soft">
          Bằng việc đăng ký, bạn đồng ý với Điều khoản dịch vụ và Chính sách
          bảo mật của EatNow.
        </p>
      </form>
    </AuthShell>
  );
}
