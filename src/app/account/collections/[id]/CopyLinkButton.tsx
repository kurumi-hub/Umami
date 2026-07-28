"use client";

import { useState } from "react";

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Bỏ qua — trình duyệt không hỗ trợ Clipboard API (hiếm gặp).
    }
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="text-[12.5px] font-bold text-pink-600 hover:underline"
    >
      {copied ? "Đã sao chép!" : "Sao chép link chia sẻ"}
    </button>
  );
}
