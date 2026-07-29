import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";

export default async function ModPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // Tự kiểm tra lại quyền ngay trong trang — không chỉ dựa vào
  // middleware, phòng trường hợp matcher bị sót path nào đó. Query
  // thẳng user_roles thay vì đọc JWT để không bị trễ khi quyền vừa
  // được cấp/thu hồi.
  const { data: roles } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id);

  const roleSet = new Set((roles ?? []).map((r) => r.role));
  const isModerator = roleSet.has("moderator") || roleSet.has("admin");
  const isAdmin = roleSet.has("admin");

  if (!isModerator) {
    redirect("/");
  }

  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="account" />

      <div className="max-w-[880px] mx-auto px-6 py-10 w-full">
        <h1 className="font-display font-extrabold text-[26px] sm:text-[32px] mb-2">
          Quản trị nội dung
        </h1>
        <p className="mb-8 text-[14px] text-ink-soft">
          Chỉ hiện với tài khoản có quyền moderator hoặc admin.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Hàng đợi duyệt công thức — sắp có
            <br />
            <span className="text-[12px]">(mod_review_queue)</span>
          </div>
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Hàng đợi báo cáo vi phạm — sắp có
            <br />
            <span className="text-[12px]">(mod_report_queue, mod_resolve_report)</span>
          </div>
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Quản lý tag & nguyên liệu — sắp có
            <br />
            <span className="text-[12px]">(mod_upsert_tag, mod_upsert_ingredient)</span>
          </div>
          <div className="rounded-[20px] border border-dashed border-pink-300/60 px-6 py-10 text-center text-[14px] text-ink-soft">
            Khoá/mở khoá tài khoản, đánh dấu tin cậy — sắp có
            <br />
            <span className="text-[12px]">
              (mod_suspend_user, mod_set_trusted, mod_set_featured)
            </span>
          </div>
        </div>

        {isAdmin && (
          <div className="mt-8">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white"
            >
              Sang trang Admin →
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
