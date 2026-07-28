"use client";

import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  verifyResetOtp,
  resetPassword,
  resendResetOtp,
} from "@/app/auth/actions";
import AuthField from "@/app/auth/AuthField";

export default function ResetPasswordForm({ email }: { email: string }) {
  const [step, setStep] = useState<"otp" | "password">("otp");

  const [otpState, otpAction, otpPending] = useActionState(
    verifyResetOtp,
    null
  );
  const [pwState, pwAction, pwPending] = useActionState(resetPassword, null);

  const [resendState, setResendState] = useState<
    "idle" | "sending" | "sent"
  >("idle");

  // Mã đúng -> phiên "recovery" đã được thiết lập -> mới cho hiện form
  // đổi mật khẩu mới.
  useEffect(() => {
    if (otpState?.verified) {
      setStep("password");
    }
  }, [otpState]);

  async function handleResend() {
    setResendState("sending");
    await resendResetOtp(email);
    setResendState("sent");
  }

  if (step === "otp") {
    return (
      <form action={otpAction} className="flex flex-col gap-4">
        <input type="hidden" name="email" value={email} />

        <label className="block text-left">
          <span className="text-[13.5px] font-semibold text-ink">
            Mã xác nhận
          </span>
          <input
            name="token"
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={8}
            placeholder="00000000"
            required
            autoFocus
            className="mt-1.5 w-full rounded-2xl border border-pink-300/70 bg-surface px-4 py-3 text-center text-[22px] font-bold tracking-[0.35em] text-ink outline-none transition-colors placeholder:tracking-[0.35em] placeholder:text-ink-soft/40 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15"
          />
        </label>

        {otpState?.error && (
          <p className="rounded-xl bg-pink-50 px-3.5 py-2.5 text-[13.5px] font-medium text-pink-600">
            {otpState.error}
          </p>
        )}

        <button
          type="submit"
          disabled={otpPending}
          className="mt-1 inline-flex items-center justify-center rounded-full bg-pink-500 px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
        >
          {otpPending ? "Đang kiểm tra..." : "Xác nhận mã"}
        </button>

        <button
          type="button"
          onClick={handleResend}
          disabled={resendState !== "idle"}
          className="text-[13.5px] font-semibold text-pink-600 disabled:opacity-50"
        >
          {resendState === "idle" && "Chưa nhận được mã? Gửi lại"}
          {resendState === "sending" && "Đang gửi lại..."}
          {resendState === "sent" && "Đã gửi lại mã mới"}
        </button>

        <Link
          href="/auth/forgot-password"
          className="text-[13px] text-ink-soft hover:text-pink-600"
        >
          ← Dùng email khác
        </Link>
      </form>
    );
  }

  return (
    <form action={pwAction} className="flex flex-col gap-4">
      <p className="rounded-xl bg-mint/20 px-3.5 py-2.5 text-center text-[13.5px] font-medium text-emerald-700">
        Mã xác nhận đúng. Nhập mật khẩu mới của bạn.
      </p>

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

      {pwState?.error && (
        <p className="rounded-xl bg-pink-50 px-3.5 py-2.5 text-[13.5px] font-medium text-pink-600">
          {pwState.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pwPending}
        className="mt-1 inline-flex items-center justify-center rounded-full bg-pink-500 px-6 py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {pwPending ? "Đang lưu..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}
