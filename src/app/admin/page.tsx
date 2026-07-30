import { redirect } from "next/navigation";
import Link from "next/link";
import AppHeader from "@/app/components/AppHeader";
import { createClient } from "@/utils/supabase/server";
import ModerationSettingsForm from "./ModerationSettingsForm";
import RoleManager from "./RoleManager";
import DeleteRecipeForm from "./DeleteRecipeForm";

const actionLabels: Record<string, string> = {
  grant_role: "Cấp quyền",
  revoke_role: "Thu hồi quyền",
  delete_recipe: "Xoá công thức",
  update_moderation_settings: "Sửa cài đặt kiểm duyệt",
  approve_recipe: "Duyệt công thức",
  reject_recipe: "Từ chối công thức",
  hide_recipe: "Ẩn công thức",
  hide_tip: "Ẩn bình luận",
  hide_reply: "Ẩn trả lời",
  hide_collection: "Ẩn bộ sưu tập",
  suspend_user: "Khoá tài khoản",
  unsuspend_user: "Mở khoá tài khoản",
  set_trusted: "Đánh dấu tin cậy",
  set_featured: "Đề cử nổi bật",
  resolve_report: "Xử lý báo cáo",
};

function timeAgo(iso: string) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "Vừa xong";
  if (mins < 60) return `${mins} phút trước`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} giờ trước`;
  const days = Math.floor(hours / 24);
  return `${days} ngày trước`;
}

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

  const [{ data: settings }, { data: logRows }] = await Promise.all([
    supabase
      .from("moderation_settings")
      .select("auto_hide_threshold, reports_per_day_limit, require_first_post_review")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("audit_log")
      .select(
        "id, action, target_type, target_id, reason, metadata, created_at, actor_id, profiles(username, display_name)"
      )
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const logs = (logRows ?? []).map((row) => {
    const actor = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;
    return {
      id: row.id,
      action: row.action,
      target_type: row.target_type,
      reason: row.reason,
      created_at: row.created_at,
      actor_name: actor?.display_name || actor?.username || "Hệ thống",
    };
  });

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

        <div className="flex flex-col gap-10">
          <section>
            <h2 className="mb-3 text-[16px] font-bold">Cài đặt kiểm duyệt</h2>
            <ModerationSettingsForm
              initialAutoHideThreshold={settings?.auto_hide_threshold ?? 3}
              initialReportsPerDayLimit={settings?.reports_per_day_limit ?? 20}
              initialRequireFirstPostReview={settings?.require_first_post_review ?? true}
            />
          </section>

          <section>
            <h2 className="mb-3 text-[16px] font-bold">Phân quyền user</h2>
            <RoleManager />
          </section>

          <section>
            <h2 className="mb-3 text-[16px] font-bold">Xoá vĩnh viễn công thức</h2>
            <DeleteRecipeForm />
          </section>

          <section>
            <h2 className="mb-3 text-[16px] font-bold">Nhật ký hành động quản trị</h2>
            {logs.length === 0 ? (
              <p className="text-[14px] text-ink-soft">Chưa có hành động nào được ghi lại.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-pink-500/10 bg-surface px-4 py-3"
                  >
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <span className="text-[13.5px] font-semibold">
                        {actionLabels[log.action] ?? log.action}
                      </span>
                      <span className="text-[11.5px] text-ink-soft">
                        {timeAgo(log.created_at)}
                      </span>
                    </div>
                    <p className="mt-1 text-[12.5px] text-ink-soft">
                      Bởi {log.actor_name}
                      {log.target_type ? ` · đối tượng: ${log.target_type}` : ""}
                    </p>
                    {log.reason && (
                      <p className="mt-1 text-[12.5px] italic text-ink-soft">
                        Lý do: {log.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
