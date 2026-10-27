"use client";

import { useState, useTransition } from "react";
import { updateProfile } from "./actions";
import { uploadMedia } from "@/utils/r2/upload-client";

export default function ProfileForm({
  initialDisplayName,
  initialUsername,
  initialBio,
  initialAvatarUrl,
}: {
  initialDisplayName: string;
  initialUsername: string;
  initialBio: string;
  initialAvatarUrl: string;
}) {
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [username, setUsername] = useState(initialUsername);
  const [bio, setBio] = useState(initialBio);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const [avatarUrl, setAvatarUrl] = useState(initialAvatarUrl);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);

  async function handleChange(file: File) {
   setUploading(true);
  setError(null);

  try {
      setFileName(file.name);
    const result = await uploadMedia(file, "image", "avatars");

    if (result.error) {
      setError(result.error);
      return;
    }

    setAvatarUrl(result.url ?? "");
  } catch {
    setError("Không thể tải ảnh lên.");
  } finally {
    setUploading(false);
  }
  }

  function handleSubmit() {
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const result = await updateProfile(displayName, username, bio, avatarUrl);
      if (result.error) {
        setError(result.error);
      } else {
        setSaved(true);
      }
    });
  }

  return (
    <div className="rounded-2xl border border-pink-500/10 bg-surface p-5 flex flex-col gap-4">

      <div className="rounded-xl border border-dashed border-pink-300 bg-pink-50/40 p-4">
        <p className="text-[13px] font-semibold text-ink">Ảnh đại diện</p>
        <p className="mt-1 text-[12px] text-ink-soft">
          JPG, PNG hoặc WebP, tối đa 5MB.
        </p>

        <label className="mt-3 inline-flex cursor-pointer items-center rounded-full bg-pink-500 px-4 py-2 text-[13px] font-semibold text-white transition hover:bg-pink-600">
          {uploading ? "Đang tải ảnh..." : "Chọn ảnh"}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="sr-only"
            disabled={uploading}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleChange(file);
              event.currentTarget.value = "";
            }}
          />
        </label>

        {fileName && !uploading && (
          <p className="mt-2 truncate text-[12px] text-ink-soft">{fileName}</p>
        )}

        {avatarUrl && (
          <img
            src={avatarUrl}
            alt="Ảnh đại diện xem trước"
            className="mt-3 h-24 w-24 rounded-full object-cover ring-2 ring-pink-200"
          />
        )}
      </div>

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
          disabled={pending || uploading}
          className="rounded-full bg-pink-500 px-5 py-2.5 text-[13.5px] font-bold text-white disabled:opacity-50"
        >
          {pending ? "Đang lưu..." : "Lưu thay đổi"}
        </button>
      </div>
    </div>
  );
}
