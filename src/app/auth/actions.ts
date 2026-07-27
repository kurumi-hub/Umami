"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";

export type AuthState = {
  error?: string;
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
    return { error: "Email hoặc mật khẩu không đúng." };
  }

  redirect("/");
}

export async function signup(
  _prevState: AuthState,
  formData: FormData
): Promise<AuthState> {
  const supabase = await createClient();

  const name = String(formData.get("name") || "");
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  if (password.length < 6) {
    return { error: "Mật khẩu cần ít nhất 6 ký tự." };
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: name },
      // Không truyền emailRedirectTo -> Supabase gửi mã OTP 6 số
      // (đọc được qua biến {{ .Token }} trong Email Template) thay vì
      // link xác nhận (magic link).
    },
  });

  if (error) {
    return { error: "Không thể tạo tài khoản. Email có thể đã tồn tại." };
  }

  redirect(`/signup/verify?email=${encodeURIComponent(email)}`);
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

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
