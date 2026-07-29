import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Tự kiểm tra lại quyền admin ngay trong trang (không chỉ dựa
  // middleware), query thẳng user_roles thay vì JWT để luôn phản ánh
  // đúng quyền hiện tại, không bị trễ.
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const isAdmin = (roles ?? []).some((r) => r.role === "admin");

  if (!isAdmin) {
    redirect("/");
  }

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[880px] mx-auto px-6 py-10 w-full">
        <div className="mb-6 flex gap-2">
          <Link
            href="/mod"
            className="rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
          >
            Quản trị nội dung
          </Link>
          <span className="rounded-full bg-pink-500 px-4 py-2 text-[13px] font-bold text-white">
            Quản trị hệ thống
          </span>
        </div>

        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-2">
          Quản trị hệ thống
        </h1>
        <p className="mb-8 text-[14px] text-ink-soft">
          Chỉ hiện với tài khoản có quyền admin.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Phân quyền user (cấp/thu hồi moderator, admin) — sắp có
            <br />
            <span className="text-[12px]">(admin_grant_role, admin_revoke_role)</span>
          </div>
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Xoá vĩnh viễn nội dung — sắp có
            <br />
            <span className="text-[12px]">(admin_delete_recipe)</span>
          </div>
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Cài đặt kiểm duyệt hệ thống — sắp có
            <br />
            <span className="text-[12px]">(admin_update_moderation_settings)</span>
          </div>
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Nhật ký hành động quản trị (audit log) — sắp có
          </div>
        </div>
      </div>
    </div>
  );
}
