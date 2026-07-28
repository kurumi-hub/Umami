"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "./actions";

export default function ProfileForm({
  initialDisplayName,
  initialUsername,
  initialBio,
}: {
  initialDisplayName: string;
  initialUsername: string;
  initialBio: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile(displayName, username, bio);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-pink-500/10 bg-surface p-5 flex flex-col gap-4">
      <label className="block text-left">
        <span className="text-[13px] font-semibold text-ink">Tên hiển thị</span>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      <label className="block text-left">
        <span className="text-[13px] font-semibold text-ink">Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
        <span className="mt-1 block text-[12px] text-ink-soft">
          3-30 ký tự, chỉ chữ thường, số và dấu gạch dưới.
        </span>
      </label>

      <label className="block text-left">
        <span className="text-[13px] font-semibold text-ink">Giới thiệu</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={3}
          maxLength={500}
          className="mt-1.5 w-full rounded-xl border border-pink-300/70 bg-surface px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-pink-500"
        />
      </label>

      {error && <p className="text-[12.5px] text-pink-600">{error}</p>}
      {saved && !error && (
        <p className="text-[12.5px] font-semibold text-emerald-700">Đã lưu.</p>
      )}

      <div>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={pending}
          className="rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}
