"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

export async function login(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Email tồn tại + mật khẩu đúng nhưng chưa xác minh -> đưa thẳng sang
    // màn nhập mã OTP thay vì báo lỗi chung chung "sai mật khẩu".
    if (error.code === "email_not_confirmed") {
      redirect(
        `/auth/signup/verify?email=${encodeURIComponent(email)}&unverified=1`
      );
    }

    return { error: "Email hoặc mật khẩu không đúng." };
  }

  redirect("/");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const name = String(formData.get("name") || "").trim();
  const username = String(formData.get("username") || "")
    .trim()
    .toLowerCase();
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (name.length < 2) {
    return { error: "Vui lòng nhập họ và tên." };
  }

  if (!/^[a-z0-9_]{3,30}$/.test(username)) {
    return {
      error:
        "Username cần 3-30 ký tự, chỉ gồm chữ thường, số và dấu gạch dưới.",
    };
  }

  if (password.length < 6) {
    return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  }

  if (password !== confirmPassword) {
    return { error: "Xác nhận mật khẩu không khớp." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: name,
        username,
        // Trigger handle_new_user() tự fallback sang user_<uuid> nếu
        // username này đã bị trùng, nên không cần kiểm tra trước ở đây.
      },
      // Không truyền emailRedirectTo -> Supabase gửi mã OTP 8 số
      // (đọc được qua biến {{ .Token }} trong Email Template) thay vì
      // link xác nhận (magic link).
    },
  });

  if (error) {
    return { error: "Không thể tạo tài khoản. Email có thể đã tồn tại." };
  }

  redirect(`/auth/signup/verify?email=${encodeURIComponent(email)}`);
}

export async function verifySignupOtp(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const email = String(formData.get("email") || "");
  const token = String(formData.get("token") || "");

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "signup",
  });

  if (error) {
    return { error: "Mã xác nhận không đúng hoặc đã hết hạn." };
  }

  redirect("/");
}

export async function resendSignupOtp(email: string): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resend({
    type: "signup",
    email,
  });

  if (error) {
    return { error: "Không thể gửi lại mã, thử lại sau ít phút." };
  }

  return null;
}

// ---------------------------------------------------------------------
// Quên mật khẩu — dùng mã OTP 8 số (email template dùng {{ .Token }}),
// không dùng magic link.
// ---------------------------------------------------------------------

export async function forgotPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();
  const email = String(formData.get("email") || "").trim();

  if (!email) {
    return { error: "Vui lòng nhập email." };
  }

  // Không truyền redirectTo -> Supabase gửi mã OTP 8 số qua email thay vì
  // link đặt lại mật khẩu.
  await supabase.auth.resetPasswordForEmail(email);

  // Luôn chuyển sang màn nhập mã dù email có tồn tại hay không, để tránh
  // lộ thông tin email nào đã đăng ký trong hệ thống.
  redirect(`/auth/reset-password?email=${encodeURIComponent(email)}`);
}

export async function resendResetOtp(email: string): Promise<AuthState> {
  const supabase = await createClient();

  const { error } = await supabase.auth.resetPasswordForEmail(email);

  if (error) {
    return { error: "Không thể gửi lại mã, thử lại sau ít phút." };
  }

  return null;
}

export type VerifyResetOtpState = {
  error?: string;
  verified?: boolean;
} | null;

// Bước 1: chỉ xác minh mã OTP. Nếu đúng, phiên "recovery" được thiết lập
// (qua cookie) và verified=true được trả về để client mới cho hiện form
// đổi mật khẩu — không cho nhập mật khẩu mới trước khi mã đã đúng.
export async function verifyResetOtp(
  _prevState: VerifyResetOtpState,
  formData: FormData
): Promise<VerifyResetOtpState> {
  const supabase = await createClient();

  const email = String(formData.get("email") || "").trim();
  const token = String(formData.get("token") || "").trim();

  const { error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "recovery",
  });

  if (error) {
    return { error: "Mã xác nhận không đúng hoặc đã hết hạn." };
  }

  return { verified: true };
}

// Bước 2: đổi mật khẩu, chỉ được gọi sau khi verifyResetOtp() đã thành
// công ở trên (dựa vào phiên "recovery" hiện có, không cần token nữa).
export async function resetPassword(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const password = String(formData.get("password") || "");
  const confirmPassword = String(formData.get("confirmPassword") || "");

  if (password.length < 6) {
    return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  }

  if (password !== confirmPassword) {
    return { error: "Xác nhận mật khẩu không khớp." };
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Phiên xác minh đã hết hạn, vui lòng nhập lại mã." };
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Không thể đặt lại mật khẩu, vui lòng thử lại." };
  }

  redirect("/auth/login?reset=success");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
