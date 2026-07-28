"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/utils/supabase/server";

export type AuthState = {
  error?: string;
  success?: string;
} | null;

// Dựng origin (vd: https://eatnow.app) từ header của request để build link
// redirect cho email (quên mật khẩu). Ưu tiên NEXT_PUBLIC_SITE_URL nếu có,
// vì header host có thể sai sau proxy/CDN.
async function getOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) {
    return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  }
  const h = await headers();
  const host = h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  return `${proto}://${host}`;
}

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
      // Không truyền emailRedirectTo -> Supabase gửi mã OTP 6 số
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
// Quên mật khẩu
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

  const origin = await getOrigin();

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?next=${encodeURIComponent(
      "/auth/reset-password"
    )}&type=recovery`,
  });

  // Không tiết lộ email có tồn tại hay không -> luôn báo thành công
  // để tránh dò email người dùng khác.
  if (error) {
    return {
      success:
        "Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi tới.",
    };
  }

  return {
    success:
      "Nếu email tồn tại trong hệ thống, một liên kết đặt lại mật khẩu đã được gửi tới.",
  };
}

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

  // Yêu cầu phải có phiên "recovery" hợp lệ (được thiết lập ở /auth/confirm
  // sau khi bấm link trong email). Nếu không còn phiên -> link đã hết hạn.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Liên kết đã hết hạn, vui lòng yêu cầu gửi lại." };
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
