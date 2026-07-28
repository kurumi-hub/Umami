import Link from "next/link";
import { IconBowl, IconCompass, IconUser, IconUsers } from "@/app/icons";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/auth/actions";
import ThemeToggle from "@/app/ThemeToggle";

export type NavKey = "discover" | "community" | "account";

const navItems: { key: NavKey; label: string; href: string; Icon: typeof IconCompass }[] = [
  { key: "discover", label: "Khám phá", href: "/", Icon: IconCompass },
  { key: "community", label: "Cộng đồng", href: "/cong-dong", Icon: IconUsers },
  { key: "account", label: "Cá nhân", href: "/account", Icon: IconUser },
];

function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 font-display font-extrabold text-[22px] text-pink-600"
    >
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-pink-100">
        <IconBowl className="h-4.5 w-4.5 text-pink-500" />
      </span>
      Umami
    </Link>
  );
}

export default async function AppHeader({ active }: { active: NavKey }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 bg-[rgba(255,246,248,0.85)] dark:bg-[rgba(32,17,24,0.85)] backdrop-blur-md border-b border-pink-500/15">
      <nav className="max-w-[1160px] mx-auto flex items-center justify-between px-6 py-4">
        <Logo />

        <div className="hidden md:flex gap-2 font-semibold text-[15px]">
          {navItems.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`flex items-center gap-1.5 rounded-full px-4 py-2 transition-colors ${
                active === item.key
                  ? "bg-pink-100 text-pink-600 dark:bg-pink-100/15"
                  : "text-ink hover:text-pink-600"
              }`}
            >
              <item.Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user ? (
            <div className="flex items-center gap-4">
              <span className="hidden sm:block text-[14px] font-semibold text-ink">
                Chào, {user.user_metadata?.full_name?.split(" ").pop() || "bạn"}
              </span>
              <form action={logout}>
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-full border-2 border-pink-300 px-5 py-2.5 text-[14px] font-bold text-pink-600 hover:bg-pink-50 dark:hover:bg-pink-100/10 transition-colors"
                >
                  Đăng xuất
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link
                href="/auth/login"
                className="hidden sm:inline-flex items-center justify-center rounded-full px-5 py-2.5 text-[14px] font-bold text-ink hover:text-pink-600 transition-colors"
              >
                Đăng nhập
              </Link>
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center rounded-full bg-pink-500 px-[22px] py-2.5 text-[14px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_14px_28px_-8px_rgba(255,111,145,0.75)]"
              >
                Đăng ký
              </Link>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
