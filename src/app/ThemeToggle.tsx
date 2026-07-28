"use client";

import { useEffect, useRef, useState } from "react";
import { IconMoon, IconSun } from "@/app/icons";

// Kiểu mở rộng tối thiểu cho View Transitions API (chưa có sẵn trong lib.dom.d.ts)
type ViewTransitionDocument = Document & {
  startViewTransition?: (callback: () => void) => {
    ready: Promise<void>;
  };
};

export default function ThemeToggle({ className = "" }: { className?: string }) {
  const [isDark, setIsDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setMounted(true);
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function applyTheme(next: boolean) {
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("umami-theme", next ? "dark" : "light");
  }

  function toggle() {
    const next = !isDark;
    const root = document.documentElement;
    const doc = document as ViewTransitionDocument;

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    // Không hỗ trợ View Transitions, hoặc người dùng tắt hiệu ứng chuyển động
    // -> chỉ toggle class, để CSS transition-colors lo phần fade mượt.
    if (!doc.startViewTransition || prefersReducedMotion) {
      applyTheme(next);
      return;
    }

    // Tính tâm và bán kính loang từ đúng vị trí nút bấm.
    const rect = btnRef.current?.getBoundingClientRect();
    const x = rect ? rect.left + rect.width / 2 : window.innerWidth - 40;
    const y = rect ? rect.top + rect.height / 2 : 40;
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    const transition = doc.startViewTransition(() => applyTheme(next));

    transition.ready.then(() => {
      root.animate(
        {
          clipPath: [
            `circle(0px at ${x}px ${y}px)`,
            `circle(${endRadius}px at ${x}px ${y}px)`,
          ],
        },
        {
          duration: 700,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          pseudoElement: "::view-transition-new(root)",
        }
      );
    });
  }

  // Tránh mismatch hydration: chỉ render icon sau khi đã mount ở client
  if (!mounted) {
    return (
      <span
        aria-hidden
        className={`inline-flex h-9 w-9 items-center justify-center rounded-full ${className}`}
      />
    );
  }

  return (
    <button
      ref={btnRef}
      type="button"
      onClick={toggle}
      aria-label={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-pink-300/60 text-ink transition-colors duration-300 hover:bg-pink-50 dark:hover:bg-pink-100/10 ${className}`}
    >
      {isDark ? (
        <IconSun className="h-[18px] w-[18px]" />
      ) : (
        <IconMoon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
