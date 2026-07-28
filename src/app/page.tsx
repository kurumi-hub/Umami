import Link from "next/link";
import {
  IconApple,
  IconBookmark,
  IconBowl,
  IconBurger,
  IconCake,
  IconChefHat,
  IconClock,
  IconCup,
  IconFlame,
  IconLeaf,
  IconPizza,
  IconPlay,
  IconRiceBowl,
  IconSearch,
  IconStar,
  IconTakeoutBox,
} from "./icons";
import AppHeader from "@/app/components/AppHeader";

const categories = [
  { Icon: IconRiceBowl, name: "Cơm & Món chính", count: "1.200+ công thức", bg: "bg-pink-100" },
  { Icon: IconCup, name: "Trà & Nước uống", count: "480+ công thức", bg: "bg-[#fff0d9] dark:bg-[#4a3a1f]" },
  { Icon: IconLeaf, name: "Đồ chay lành", count: "360+ công thức", bg: "bg-[#e3f6e8] dark:bg-[#1f3a2b]" },
  { Icon: IconCake, name: "Tráng miệng", count: "520+ công thức", bg: "bg-pink-100" },
  { Icon: IconPizza, name: "Pizza & Fast food", count: "290+ công thức", bg: "bg-[#fff0d9] dark:bg-[#4a3a1f]" },
  { Icon: IconBowl, name: "Mì & Phở", count: "410+ công thức", bg: "bg-[#e3f6e8] dark:bg-[#1f3a2b]" },
  { Icon: IconTakeoutBox, name: "Ăn vặt", count: "630+ công thức", bg: "bg-pink-100" },
  { Icon: IconBurger, name: "Burger & Gà rán", count: "180+ công thức", bg: "bg-[#fff0d9] dark:bg-[#4a3a1f]" },
];

const featuredRecipes = [
  { title: "Phở bò truyền thống", author: "Cô Lan Bếp Việt", time: "3g 30p", rating: "4.9", saves: "2.4k", diff: "Khó" },
  { title: "Bún chả Hà Nội", author: "Chef Minh Đức", time: "45p", rating: "4.8", saves: "1.9k", diff: "Vừa" },
  { title: "Gỏi cuốn tôm thịt", author: "Bếp Của Mẹ", time: "30p", rating: "4.7", saves: "1.2k", diff: "Dễ" },
  { title: "Bánh xèo miền Tây", author: "Anh Tư Miền Tây", time: "50p", rating: "4.9", saves: "3.1k", diff: "Vừa" },
  { title: "Cơm tấm sườn bì chả", author: "Sài Gòn Food", time: "50p", rating: "4.8", saves: "2.7k", diff: "Vừa" },
  { title: "Bún bò Huế", author: "O Huế Bếp Xưa", time: "2g 25p", rating: "4.9", saves: "2.0k", diff: "Khó" },
  { title: "Chè đậu xanh nước cốt dừa", author: "Ngọt Bếp Nhà", time: "55p", rating: "4.6", saves: "980", diff: "Dễ" },
  { title: "Mì Ý sốt bò bằm", author: "Kitchen Ý", time: "55p", rating: "4.7", saves: "1.5k", diff: "Vừa" },
];

const cooks = [
  { name: "Cô Lan Bếp Việt", handle: "@colanbepviet", recipes: 128 },
  { name: "Chef Minh Đức", handle: "@chefminhduc", recipes: 96 },
  { name: "O Huế Bếp Xưa", handle: "@ohuebepxua", recipes: 74 },
  { name: "Sài Gòn Food", handle: "@saigonfood", recipes: 210 },
  { name: "Ngọt Bếp Nhà", handle: "@ngotbepnha", recipes: 65 },
];

function Stars() {
  return (
    <div className="flex gap-0.5 text-mango">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} className="w-3.5 h-3.5" />
      ))}
    </div>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2 font-display font-extrabold text-[22px] ${
        light ? "text-white" : "text-pink-600"
      }`}
    >
      <span className="inline-block w-3 h-3 rounded-full bg-mango" />
      Umami
    </div>
  );
}

function StoreBadge({ dark = true }: { dark?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl px-[18px] py-2.5 text-[13px] font-semibold ${
        dark ? "bg-[#2b1620] text-white" : "bg-white/15 text-white"
      }`}
    >
      <IconApple className="w-5 h-5" />
      <span className="flex flex-col leading-tight">
        <small className="font-normal opacity-70 text-[10px]">Tải trên</small>
        App Store
      </span>
    </div>
  );
}

function StoreBadgePlay({ dark = true }: { dark?: boolean }) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-2xl px-[18px] py-2.5 text-[13px] font-semibold ${
        dark ? "bg-[#2b1620] text-white" : "bg-white/15 text-white"
      }`}
    >
      <IconPlay className="w-4 h-4" />
      <span className="flex flex-col leading-tight">
        <small className="font-normal opacity-70 text-[10px]">Tải trên</small>
        Google Play
      </span>
    </div>
  );
}

function RecipeCard({ r }: { r: (typeof featuredRecipes)[number] }) {
  return (
    <div className="group bg-surface rounded-[22px] overflow-hidden border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)]">
      <div className="relative h-[150px] bg-gradient-to-br from-pink-100 to-pink-50 dark:from-pink-100/10 dark:to-transparent flex items-center justify-center">
        <IconBowl className="w-14 h-14 text-pink-400" />
        <button
          type="button"
          aria-label="Lưu công thức"
          className="absolute top-3 right-3 flex h-8 w-8 items-center justify-center rounded-full bg-surface/90 text-pink-500 shadow-sm"
        >
          <IconBookmark className="w-4 h-4" />
        </button>
        <span className="absolute bottom-3 left-3 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-bold text-ink-soft">
          {r.diff}
        </span>
      </div>
      <div className="p-4">
        <h4 className="text-[15.5px] font-bold leading-snug line-clamp-2">{r.title}</h4>
        <p className="mt-1 text-[12.5px] text-ink-soft">{r.author}</p>
        <div className="mt-3 flex items-center justify-between text-[12.5px] text-ink-soft">
          <span className="flex items-center gap-1">
            <IconClock className="w-3.5 h-3.5" />
            {r.time}
          </span>
          <span className="flex items-center gap-1">
            <Stars />
            {r.rating}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="discover" />

      {/* HERO / SEARCH */}
      <section className="relative overflow-hidden pt-[52px] pb-[48px]">
        <div className="pointer-events-none absolute -top-[140px] -right-[120px] w-[420px] h-[420px] rounded-full bg-pink-100 opacity-55" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-[260px] h-[260px] rounded-full bg-mint opacity-35" />

        <div className="relative z-10 max-w-[1160px] mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[13px] font-bold text-pink-600 shadow-[0_6px_16px_-8px_rgba(255,111,145,0.4)] mb-5">
            <IconFlame className="w-4 h-4" />
            Hơn 4.500 công thức từ cộng đồng
          </div>
          <h1 className="font-display font-extrabold text-ink leading-[1.05] text-[32px] sm:text-[44px] lg:text-[56px]">
            Hôm nay ăn gì?
            <br />
            <span className="text-pink-500">Umami gợi ý cho bạn.</span>
          </h1>
          <p className="mt-5 text-lg text-ink-soft leading-relaxed max-w-[560px] mx-auto">
            Khám phá công thức nấu ăn từng bước, mẹo vào bếp và cộng đồng
            người yêu nấu nướng khắp Việt Nam.
          </p>

          <form className="mt-8 max-w-[560px] mx-auto">
            <label className="relative flex items-center">
              <IconSearch className="absolute left-5 w-5 h-5 text-ink-soft" />
              <input
                type="search"
                placeholder="Tìm công thức, nguyên liệu, đầu bếp..."
                className="w-full rounded-full border border-pink-300/70 bg-surface pl-14 pr-5 py-4 text-[15px] text-ink outline-none transition-colors placeholder:text-ink-soft/60 focus:border-pink-500 focus:ring-4 focus:ring-pink-500/15"
              />
            </label>
          </form>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-pink-500 py-3.5 overflow-hidden">
        <div className="animate-marquee flex gap-12 whitespace-nowrap font-display font-bold text-white text-base">
          <span>
            Phở bò · Bún chả · Gỏi cuốn · Bánh xèo · Cơm tấm · Bún bò Huế ·
            Chè · Mì Ý · Phở bò · Bún chả · Gỏi cuốn · Bánh xèo · Cơm tấm ·
            Bún bò Huế · Chè · Mì Ý ·
          </span>
        </div>
      </div>

      {/* CATEGORIES */}
      <section id="danh-muc" className="bg-pink-50 py-20">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-12">
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Danh mục
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Thèm gì, có nấy
            </h2>
            <p className="mt-3.5 text-ink-soft leading-relaxed">
              Từ cơm văn phòng đến trà sữa xế chiều, mọi cơn thèm đều có công
              thức.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {categories.map((c) => (
              <div
                key={c.name}
                className="bg-surface rounded-[22px] px-5 py-6 text-center border border-pink-500/10 transition-all hover:-translate-y-1.5 hover:shadow-[0_18px_34px_-18px_rgba(255,111,145,0.5)]"
              >
                <div
                  className={`w-16 h-16 rounded-[18px] mx-auto mb-3.5 flex items-center justify-center ${c.bg}`}
                >
                  <c.Icon className="w-7 h-7 text-ink" />
                </div>
                <h4 className="text-[15px] font-bold">{c.name}</h4>
                <span className="text-[12.5px] text-ink-soft">{c.count}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED RECIPES */}
      <section id="cong-thuc" className="py-20 max-w-[1160px] mx-auto px-6 w-full">
        <div className="flex items-end justify-between mb-10 flex-wrap gap-3">
          <div>
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Công thức nổi bật
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Được nấu nhiều nhất tuần này
            </h2>
          </div>
          <Link
            href="/cong-dong"
            className="text-[14px] font-bold text-pink-600 hover:underline"
          >
            Xem tất cả →
          </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {featuredRecipes.map((r) => (
            <RecipeCard key={r.title} r={r} />
          ))}
        </div>
      </section>

      {/* FEATURED COOKS */}
      <section className="bg-pink-50 py-20">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-12">
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Cộng đồng
            </div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] mt-2.5">
              Đầu bếp nổi bật
            </h2>
            <p className="mt-3.5 text-ink-soft leading-relaxed">
              Theo dõi những người chia sẻ công thức được yêu thích nhất.
            </p>
          </div>
          <div className="flex gap-5 overflow-x-auto pb-2 -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-5">
            {cooks.map((c) => (
              <div
                key={c.handle}
                className="shrink-0 w-[160px] md:w-auto bg-surface rounded-[20px] px-5 py-6 text-center border border-pink-500/10"
              >
                <div className="w-16 h-16 rounded-full mx-auto mb-3.5 flex items-center justify-center bg-pink-100">
                  <IconChefHat className="w-7 h-7 text-pink-500" />
                </div>
                <h4 className="text-[14.5px] font-bold">{c.name}</h4>
                <span className="text-[12px] text-ink-soft">{c.handle}</span>
                <div className="mt-2 text-[12px] font-semibold text-pink-600">
                  {c.recipes} công thức
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* APP CTA */}
      <section className="max-w-[1160px] mx-auto px-6 py-20 w-full">
        <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pink-500 to-pink-600 px-7 py-12 sm:px-12 sm:py-16 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-10 items-center text-white text-center md:text-left">
          <div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] leading-tight">
              Nấu ngon mỗi ngày,
              <br />
              cùng cộng đồng Umami.
            </h2>
            <p className="mt-3.5 opacity-90 max-w-[420px] mx-auto md:mx-0">
              Tải Umami để lưu công thức yêu thích, theo dõi đầu bếp và chia
              sẻ món ngon của riêng bạn.
            </p>
            <div className="flex gap-3.5 mt-7 flex-wrap justify-center md:justify-start">
              <StoreBadge dark={false} />
              <StoreBadgePlay dark={false} />
            </div>
          </div>
          <div className="flex justify-center">
            <div className="w-[190px] h-[380px] bg-surface rounded-[34px] p-2.5 shadow-[0_30px_60px_-18px_rgba(0,0,0,0.35)]">
              <div className="w-full h-full rounded-[26px] bg-gradient-to-b from-pink-50 to-surface flex flex-col items-center justify-center gap-3">
                <IconBowl className="w-14 h-14 text-pink-500" />
                <b className="font-display text-ink">Umami</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2b1620] text-white pt-14 pb-7 mt-6">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-9">
            <div>
              <Logo light />
              <p className="text-[#c7b3ba] text-sm leading-relaxed max-w-[280px] mt-3">
                Ứng dụng công thức nấu ăn và cộng đồng người yêu bếp núc, với
                hàng nghìn món ngon từ khắp mọi miền.
              </p>
            </div>
            <div>
              <h5 className="text-[13px] uppercase tracking-wider text-[#f0a9bd] mb-3.5">
                Khám phá
              </h5>
              <ul className="flex flex-col gap-2.5 text-[#e9d7dc] text-sm">
                <li>
                  <a href="#danh-muc" className="hover:text-white transition-colors">
                    Danh mục
                  </a>
                </li>
                <li>
                  <a href="#cong-thuc" className="hover:text-white transition-colors">
                    Công thức nổi bật
                  </a>
                </li>
                <li>
                  <Link href="/cong-dong" className="hover:text-white transition-colors">
                    Cộng đồng
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-[13px] uppercase tracking-wider text-[#f0a9bd] mb-3.5">
                Công ty
              </h5>
              <ul className="flex flex-col gap-2.5 text-[#e9d7dc] text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Về chúng tôi
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Tuyển dụng
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Đối tác đầu bếp
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <h5 className="text-[13px] uppercase tracking-wider text-[#f0a9bd] mb-3.5">
                Hỗ trợ
              </h5>
              <ul className="flex flex-col gap-2.5 text-[#e9d7dc] text-sm">
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Trung tâm trợ giúp
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Liên hệ
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-white transition-colors">
                    Điều khoản
                  </a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-11 pt-6 border-t border-white/10 flex justify-between flex-wrap gap-3 text-[13px] text-[#a98d95]">
            <span>© 2026 Umami. Nấu ngon mỗi ngày.</span>
            <span>Thiết kế tại Việt Nam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
