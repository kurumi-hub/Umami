import Link from "next/link";
import { IconBowl } from "@/app/icons";
import ThemeToggle from "@/app/ThemeToggle";

export default function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 py-16">
      <div className="pointer-events-none absolute -top-32 -right-24 h-[380px] w-[380px] rounded-full bg-pink-100 opacity-60" />
      <div className="pointer-events-none absolute -bottom-24 -left-20 h-[260px] w-[260px] rounded-full bg-mint opacity-35" />

      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-[420px]">
        <Link
          href="/"
          className="mb-8 flex items-center justify-center gap-2 font-display text-[22px] font-extrabold text-pink-600"
        >
          <span className="inline-block h-3 w-3 rounded-full bg-mango" />
          Umami
        </Link>

        <div className="rounded-[28px] bg-surface p-8 shadow-[0_24px_60px_-24px_rgba(58,31,43,0.3)]">
          <div className="mb-7 flex flex-col items-center text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-pink-100">
              <IconBowl className="h-7 w-7 text-pink-500" />
            </div>
            <h1 className="font-display text-[26px] font-extrabold text-ink">
              {title}
            </h1>
            <p className="mt-1.5 text-[14.5px] text-ink-soft">{subtitle}</p>
          </div>

          {children}
        </div>

        <p className="mt-6 text-center text-[14px] text-ink-soft">{footer}</p>
      </div>
    </div>
  );
}
