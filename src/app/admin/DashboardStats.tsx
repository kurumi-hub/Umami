import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import MiniBarChart from "./MiniBarChart";

type GrowthRow = {
  day: string;
  new_users: number;
  new_recipes: number;
  new_follows: number;
};

type ModerationStats = {
  reports_per_day: { day: string; count: number }[];
  reports_by_reason: { reason: string; count: number }[];
  approved_count: number;
  rejected_count: number;
  open_reports_count: number;
  pending_recipes_count: number;
  oldest_pending_days: number | null;
  suspended_users_count: number;
};

type EngagementStats = {
  top_recipes: {
    id: string;
    title: string;
    slug: string;
    view_count: number;
    save_count: number;
    avg_rating: number | string | null;
  }[];
  top_tags: { name: string; count: number }[];
  dead_recipes_count: number;
};

const reasonLabels: Record<string, string> = {
  spam: "Spam / quảng cáo",
  inappropriate: "Không phù hợp",
  copyright: "Vi phạm bản quyền",
  dangerous: "Nguy hiểm",
  harassment: "Quấy rối",
  other: "Khác",
};

function formatDay(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-[16px] bg-pink-50 px-3 py-4 text-center">
      <b className="font-display text-[20px] block">{value}</b>
      <span className="text-[11px] text-ink-soft">{label}</span>
    </div>
  );
}

export default async function DashboardStats({ days }: { days: number }) {
  const supabase = await createClient();

  const [{ data: growth }, { data: moderation }, { data: engagement }] = await Promise.all([
    supabase.rpc("admin_growth_stats", { p_days: days }),
    supabase.rpc("admin_moderation_stats", { p_days: days }),
    supabase.rpc("admin_engagement_stats", { p_days: days, lim: 6 }),
  ]);

  const growthRows = (growth ?? []) as GrowthRow[];
  const mod = moderation as ModerationStats | null;
  const eng = engagement as EngagementStats | null;

  return (
    <div className="flex flex-col gap-10">
      {/* CHỌN KHUNG THỜI GIAN */}
      <div className="flex gap-2">
        {[7, 30, 90].map((d) => (
          <Link
            key={d}
            href={`/admin?days=${d}`}
            className={`rounded-full px-4 py-2 text-[13px] font-bold transition-colors ${
              days === d
                ? "bg-pink-500 text-white"
                : "border-2 border-pink-300 text-pink-600 hover:bg-pink-50"
            }`}
          >
            {d} ngày
          </Link>
        ))}
      </div>

      {/* 1. TĂNG TRƯỞNG */}
      <section>
        <h2 className="mb-3 text-[16px] font-bold">Tăng trưởng</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-pink-500/10 bg-surface p-4">
            <span className="text-[12.5px] font-semibold text-ink-soft">
              User mới ({growthRows.reduce((s, r) => s + Number(r.new_users), 0)})
            </span>
            <div className="mt-2">
              <MiniBarChart
                data={growthRows.map((r) => ({ label: formatDay(r.day), value: Number(r.new_users) }))}
              />
            </div>
          </div>
          <div className="rounded-2xl border border-pink-500/10 bg-surface p-4">
            <span className="text-[12.5px] font-semibold text-ink-soft">
              Công thức mới ({growthRows.reduce((s, r) => s + Number(r.new_recipes), 0)})
            </span>
            <div className="mt-2">
              <MiniBarChart
                data={growthRows.map((r) => ({ label: formatDay(r.day), value: Number(r.new_recipes) }))}
                colorClass="bg-emerald-400"
              />
            </div>
          </div>
          <div className="rounded-2xl border border-pink-500/10 bg-surface p-4">
            <span className="text-[12.5px] font-semibold text-ink-soft">
              Lượt follow mới ({growthRows.reduce((s, r) => s + Number(r.new_follows), 0)})
            </span>
            <div className="mt-2">
              <MiniBarChart
                data={growthRows.map((r) => ({ label: formatDay(r.day), value: Number(r.new_follows) }))}
                colorClass="bg-amber-400"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 2. TẢI KIỂM DUYỆT */}
      {mod && (
        <section>
          <h2 className="mb-3 text-[16px] font-bold">Tải kiểm duyệt</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
            <StatBox label="Báo cáo đang mở" value={mod.open_reports_count} />
            <StatBox label="Công thức chờ duyệt" value={mod.pending_recipes_count} />
            <StatBox
              label="Bài chờ lâu nhất"
              value={mod.oldest_pending_days != null ? `${mod.oldest_pending_days} ngày` : "—"}
            />
            <StatBox label="Tài khoản đang khoá" value={mod.suspended_users_count} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-pink-500/10 bg-surface p-4">
              <span className="text-[12.5px] font-semibold text-ink-soft">
                Báo cáo theo ngày ({mod.reports_per_day.reduce((s, r) => s + Number(r.count), 0)})
              </span>
              <div className="mt-2">
                <MiniBarChart
                  data={mod.reports_per_day.map((r) => ({
                    label: formatDay(r.day),
                    value: Number(r.count),
                  }))}
                  colorClass="bg-red-400"
                />
              </div>
            </div>

            <div className="rounded-2xl border border-pink-500/10 bg-surface p-4">
              <span className="text-[12.5px] font-semibold text-ink-soft block mb-3">
                Báo cáo theo lý do
              </span>
              {mod.reports_by_reason.length === 0 ? (
                <p className="text-[13px] text-ink-soft">Chưa có báo cáo nào.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {mod.reports_by_reason.map((r) => (
                    <div key={r.reason} className="flex items-center justify-between text-[12.5px]">
                      <span>{reasonLabels[r.reason] ?? r.reason}</span>
                      <b>{r.count}</b>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-4 rounded-2xl bg-pink-50 px-4 py-3">
            <span className="text-[13px]">
              Đã duyệt: <b>{mod.approved_count}</b>
            </span>
            <span className="text-[13px]">
              Đã từ chối: <b>{mod.rejected_count}</b>
            </span>
          </div>
        </section>
      )}

      {/* 3. NỘI DUNG & TƯƠNG TÁC */}
      {eng && (
        <section>
          <h2 className="mb-3 text-[16px] font-bold">Nội dung &amp; tương tác</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-2xl border border-pink-500/10 bg-surface p-4">
              <span className="text-[12.5px] font-semibold text-ink-soft block mb-3">
                Top công thức theo lượt xem
              </span>
              {eng.top_recipes.length === 0 ? (
                <p className="text-[13px] text-ink-soft">Chưa có dữ liệu.</p>
              ) : (
                <div className="flex flex-col gap-2">
                  {eng.top_recipes.map((r) => (
                    <div key={r.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                      <Link
                        href={`/cong-thuc/${r.slug}`}
                        target="_blank"
                        className="truncate hover:text-pink-600"
                      >
                        {r.title}
                      </Link>
                      <span className="shrink-0 text-ink-soft">
                        {r.view_count} lượt xem
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-pink-500/10 bg-surface p-4">
              <span className="text-[12.5px] font-semibold text-ink-soft block mb-3">
                Tag phổ biến nhất
              </span>
              {eng.top_tags.length === 0 ? (
                <p className="text-[13px] text-ink-soft">Chưa có dữ liệu.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {eng.top_tags.map((t) => (
                    <span
                      key={t.name}
                      className="rounded-full bg-pink-100 px-3 py-1.5 text-[12px] font-semibold text-pink-600"
                    >
                      {t.name} · {t.count}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 rounded-2xl bg-pink-50 px-4 py-3">
            <span className="text-[13px]">
              Công thức chưa ai xem sau {days} ngày:{" "}
              <b>{eng.dead_recipes_count}</b>
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
