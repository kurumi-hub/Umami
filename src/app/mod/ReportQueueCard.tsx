"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { IconCheckCircle, IconEye, IconFlag, IconX } from "@/app/icons";
import { dismissReports, resolveReports } from "./actions";
import type { ReportGroup } from "./reports";

const reasonLabels: Record<string, string> = {
  spam: "Spam / quảng cáo",
  inappropriate: "Nội dung không phù hợp",
  copyright: "Vi phạm bản quyền",
  dangerous: "Nguy hiểm / không an toàn",
  harassment: "Quấy rối / xúc phạm",
  other: "Khác",
};

const targetTypeLabels: Record<string, string> = {
  recipe: "Công thức",
  tip: "Mẹo",
  reply: "Phản hồi",
  profile: "Tài khoản",
  collection: "Bộ sưu tập",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ReportQueueCard({ group }: { group: ReportGroup }) {
  const [status, setStatus] = useState<"pending" | "dismissed" | "resolved">("pending");
  const [expanded, setExpanded] = useState(false);
  const [resolving, setResolving] = useState(false);
  const [hideContent, setHideContent] = useState(group.targetType !== "profile");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const reportIds = group.reports.map((r) => r.id);
  const canHide = group.targetType !== "profile";

  function handleDismiss() {
    setError(null);
    startTransition(async () => {
      const result = await dismissReports(reportIds, reason || undefined);
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("dismissed");
      }
    });
  }

  function handleResolve() {
    if (!resolving) {
      setResolving(true);
      return;
    }
    setError(null);
    startTransition(async () => {
      const result = await resolveReports(
        reportIds,
        group.targetType,
        group.targetId,
        canHide && hideContent,
        reason
      );
      if (result.error) {
        setError(result.error);
      } else {
        setStatus("resolved");
      }
    });
  }

  if (status === "dismissed") {
    return (
      <div className="rounded-[20px] border border-ink-soft/20 bg-surface-2 px-5 py-4 text-[13.5px] font-semibold text-ink-soft">
        Đã bỏ qua báo cáo: {group.title}
      </div>
    );
  }

  if (status === "resolved") {
    return (
      <div className="rounded-[20px] border border-emerald-200 bg-emerald-50 px-5 py-4 text-[13.5px] font-semibold text-emerald-700">
        Đã xử lý: {group.title}
      </div>
    );
  }

  return (
    <div className="rounded-[20px] border border-pink-100 bg-surface px-5 py-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex items-center gap-2 flex-wrap">
            <span className="rounded-full bg-ink-soft/10 px-2.5 py-0.5 text-[11px] font-bold text-ink-soft">
              {targetTypeLabels[group.targetType]}
            </span>
            {group.isHidden && (
              <span className="rounded-full bg-pink-100 px-2.5 py-0.5 text-[11px] font-bold text-pink-600">
                Đã bị ẩn
              </span>
            )}
            <span className="inline-flex items-center gap-1 rounded-full bg-pink-500/10 px-2.5 py-0.5 text-[11px] font-bold text-pink-600">
              <IconFlag className="h-3 w-3" />
              {group.openCount} báo cáo
            </span>
          </div>
          {group.href ? (
            <Link href={group.href} target="_blank" className="group min-w-0">
              <b className="block truncate text-[15px] group-hover:text-pink-600 transition-colors">
                {group.title}
              </b>
            </Link>
          ) : (
            <b className="block truncate text-[15px]">{group.title}</b>
          )}
          {group.subtitle && (
            <p className="mt-0.5 truncate text-[13px] text-ink-soft">{group.subtitle}</p>
          )}
        </div>
        <span className="shrink-0 text-[12px] text-ink-soft">
          Mới nhất: {formatDate(group.reports[group.reports.length - 1].createdAt)}
        </span>
      </div>

      <div className="mt-3 flex items-center gap-2">
        {group.authorUsername ? (
          <Link
            href={`/u/${group.authorUsername}`}
            target="_blank"
            className="text-[13px] font-semibold hover:text-pink-600 transition-colors"
          >
            Tác giả: {group.authorName || group.authorUsername}
          </Link>
        ) : group.authorId ? (
          <span className="text-[13px] text-ink-soft">Tác giả: người dùng đã xoá</span>
        ) : null}
      </div>

      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-3 inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-pink-600"
      >
        <IconEye className="h-3.5 w-3.5" />
        {expanded ? "Ẩn chi tiết báo cáo" : `Xem chi tiết (${group.reports.length})`}
      </button>

      {expanded && (
        <ul className="mt-2.5 flex flex-col gap-2 rounded-[14px] bg-surface-2 px-3.5 py-3">
          {group.reports.map((r) => (
            <li key={r.id} className="text-[12.5px] text-ink-soft">
              <span className="font-bold text-ink">{reasonLabels[r.reason] ?? r.reason}</span>
              {" — "}
              {r.reporterUsername ? (
                <Link href={`/u/${r.reporterUsername}`} target="_blank" className="font-semibold">
                  {r.reporterName || r.reporterUsername}
                </Link>
              ) : (
                "người dùng đã xoá"
              )}
              {" · "}
              {formatDate(r.createdAt)}
              {r.detail && <div className="mt-0.5 italic">“{r.detail}”</div>}
            </li>
          ))}
        </ul>
      )}

      {resolving && (
        <div className="mt-3 flex flex-col gap-2">
          {canHide && (
            <label className="flex items-center gap-1.5 text-[12.5px] text-ink-soft">
              <input
                type="checkbox"
                checked={hideContent}
                onChange={(e) => setHideContent(e.target.checked)}
                className="accent-pink-500"
              />
              Ẩn nội dung này khi xử lý
            </label>
          )}
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              canHide && hideContent
                ? "Lý do ẩn nội dung (bắt buộc, tác giả sẽ nhận được lý do này)..."
                : "Ghi chú xử lý (không bắt buộc)..."
            }
            rows={2}
            className="w-full rounded-[14px] border border-pink-200 bg-transparent px-3 py-2 text-[13.5px] outline-none focus:border-pink-400"
          />
        </div>
      )}

      {error && <p className="mt-2 text-[12.5px] text-pink-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          onClick={handleResolve}
          disabled={pending}
          className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold transition-colors disabled:opacity-60 ${
            resolving
              ? "bg-pink-500 text-white hover:bg-pink-600"
              : "bg-pink-500 text-white hover:bg-pink-600"
          }`}
        >
          <IconCheckCircle className="h-4 w-4" />
          {resolving ? "Xác nhận xử lý" : "Xử lý"}
        </button>
        {!resolving && (
          <button
            type="button"
            onClick={handleDismiss}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-60"
          >
            <IconX className="h-4 w-4" />
            Bỏ qua
          </button>
        )}
        {resolving && (
          <button
            type="button"
            onClick={() => setResolving(false)}
            disabled={pending}
            className="inline-flex items-center gap-1.5 rounded-full border-2 border-pink-300 px-4 py-2 text-[13px] font-bold text-pink-600 hover:bg-pink-50 transition-colors disabled:opacity-60"
          >
            Huỷ
          </button>
        )}
      </div>
    </div>
  );
}
