import type { Metadata } from "next";
import { Baloo_2, Be_Vietnam_Pro } from "next/font/google";
import "./globals.css";
import BottomNav from "@/app/components/BottomNav";

const baloo = Baloo_2({
  variable: "--font-baloo",
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
});

const beVietnamPro = Be_Vietnam_Pro({
  variable: "--font-be-vietnam",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Umami — Nấu ngon mỗi ngày",
  description:
    "Umami — kho công thức nấu ăn, mẹo vào bếp và cộng đồng người yêu nấu nướng. Khám phá, học hỏi và chia sẻ món ngon mỗi ngày.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="vi"
      className={`${baloo.variable} ${beVietnamPro.variable} h-full antialiased`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  var stored = localStorage.getItem("umami-theme");
                  var prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
                  var isDark = stored ? stored === "dark" : prefersDark;
                  if (isDark) document.documentElement.classList.add("dark");
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-full flex flex-col font-sans bg-background text-foreground pb-[84px] md:pb-0">
        {children}
        <BottomNav />
      </body>
    </html>
  );
}
