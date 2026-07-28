"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconCompass, IconUser, IconUsers } from "@/app/icons";

const items = [
  { key: "discover", label: "Khám phá", href: "/", Icon: IconCompass },
  { key: "community", label: "Cộng đồng", href: "/cong-dong", Icon: IconUsers },
  { key: "account", label: "Cá nhân", href: "/account", Icon: IconUser },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function BottomNav() {
  const pathname = usePathname();

  // Ẩn thanh điều hướng ở các trang xác thực (đăng nhập/đăng ký...) vì đó
  // là luồng riêng, không thuộc 3 mục chính của app.
  if (pathname.startsWith("/auth")) {
    return null;
  }

  return (
    <nav
      aria-label="Điều hướng chính"
      className="fixed inset-x-0 bottom-0 z-50 flex justify-center pb-[max(14px,env(safe-area-inset-bottom))] px-4 md:hidden"
    >
      <div className="flex items-center gap-1 rounded-full bg-surface/95 px-2 py-2 shadow-[0_18px_40px_-14px_rgba(58,31,43,0.45)] ring-1 ring-pink-500/10 backdrop-blur-md">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          return (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={`flex min-w-[76px] flex-col items-center gap-0.5 rounded-full px-4 py-2 text-[11.5px] font-bold transition-colors ${
                active
                  ? "bg-pink-500 text-white shadow-[0_8px_18px_-6px_rgba(255,111,145,0.65)]"
                  : "text-ink-soft hover:text-pink-600"
              }`}
            >
              <item.Icon className="h-5 w-5" />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
