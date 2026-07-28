import Link from "next/link";
import {
  IconApple,
  IconBike,
  IconBowl,
  IconBurger,
  IconCake,
  IconCheckCircle,
  IconClipboard,
  IconClock,
  IconCup,
  IconLeaf,
  IconPizza,
  IconPlay,
  IconRiceBowl,
  IconStar,
  IconTakeoutBox,
} from "./icons";
import { createClient } from "@/utils/supabase/server";
import { logout } from "@/app/auth/actions";
import ThemeToggle from "@/app/ThemeToggle";

const menuCategories = [
  { Icon: IconRiceBowl, name: "Cơm & Món chính", count: "450+ quán", bg: "bg-pink-100" },
  { Icon: IconCup, name: "Trà sữa & Nước", count: "320+ quán", bg: "bg-[#fff0d9] dark:bg-[#4a3a1f]" },
  { Icon: IconLeaf, name: "Đồ chay lành", count: "180+ quán", bg: "bg-[#e3f6e8] dark:bg-[#1f3a2b]" },
  { Icon: IconCake, name: "Tráng miệng", count: "210+ quán", bg: "bg-pink-100" },
  { Icon: IconPizza, name: "Pizza & Fast food", count: "260+ quán", bg: "bg-[#fff0d9] dark:bg-[#4a3a1f]" },
  { Icon: IconBowl, name: "Mì & Phở", count: "300+ quán", bg: "bg-[#e3f6e8] dark:bg-[#1f3a2b]" },
  { Icon: IconTakeoutBox, name: "Ăn vặt", count: "400+ quán", bg: "bg-pink-100" },
  { Icon: IconBurger, name: "Burger & Gà rán", count: "150+ quán", bg: "bg-[#fff0d9] dark:bg-[#4a3a1f]" },
];

const steps = [
  {
    num: "01",
    Icon: IconClipboard,
    title: "Chọn món",
    desc: "Lướt thực đơn theo món ăn, quán yêu thích hoặc mức giá. Thêm vào giỏ trong vài giây.",
  },
  {
    num: "02",
    Icon: IconCheckCircle,
    title: "Xác nhận đơn",
    desc: "Kiểm tra địa chỉ, chọn cách thanh toán và gửi đơn. Quán bắt đầu nấu ngay lập tức.",
  },
  {
    num: "03",
    Icon: IconBike,
    title: "Giao tận nơi",
    desc: "Theo dõi tài xế trên bản đồ theo thời gian thực, món ăn nóng hổi tới ngay cửa nhà.",
  },
];

const testimonials = [
  {
    quote:
      "Giao nhanh không tưởng, đặt lúc đói xíu là có cơm nóng trước mặt luôn.",
    name: "Minh Anh",
    place: "Quận 3, TP.HCM",
    initials: "MA",
  },
  {
    quote:
      "Giao diện dễ thương, đặt đồ chay cực dễ tìm, có hẳn mục riêng.",
    name: "Quốc Bảo",
    place: "Cầu Giấy, Hà Nội",
    initials: "QB",
  },
  {
    quote:
      "Theo dõi tài xế realtime, biết chính xác khi nào món tới, khỏi phải đợi.",
    name: "Thuỳ Linh",
    place: "Hải Châu, Đà Nẵng",
    initials: "TL",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5 text-mango">
      {Array.from({ length: 5 }).map((_, i) => (
        <IconStar key={i} className="w-4 h-4" />
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
      EatNow
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

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex flex-col flex-1">
      {/* NAV */}
      <header className="sticky top-0 z-50 bg-[rgba(255,246,248,0.85)] dark:bg-[rgba(32,17,24,0.85)] backdrop-blur-md border-b border-pink-500/15">
        <nav className="max-w-[1160px] mx-auto flex items-center justify-between px-6 py-4">
          <Logo />
          <div className="hidden md:flex gap-9 font-semibold text-[15px] text-ink">
            <a href="#thuc-don" className="hover:text-pink-600 transition-colors">
              Thực đơn
            </a>
            <a href="#cach-hoat-dong" className="hover:text-pink-600 transition-colors">
              Cách hoạt động
            </a>
            <a href="#danh-gia" className="hover:text-pink-600 transition-colors">
              Đánh giá
            </a>
            <a href="#tai-app" className="hover:text-pink-600 transition-colors">
              Tải app
            </a>
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

      {/* HERO */}
      <section className="relative overflow-hidden pt-[88px] pb-[60px]">
        <div className="pointer-events-none absolute -top-[140px] -right-[120px] w-[420px] h-[420px] rounded-full bg-pink-100 opacity-55" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 w-[260px] h-[260px] rounded-full bg-mint opacity-35" />

        <div className="relative z-10 max-w-[1160px] mx-auto px-6 grid grid-cols-1 md:grid-cols-[1.05fr_0.95fr] gap-12 items-center text-center md:text-left">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-surface px-4 py-2 text-[13px] font-bold text-pink-600 shadow-[0_6px_16px_-8px_rgba(255,111,145,0.4)] mb-5">
              <IconClock className="w-4 h-4" />
              Giao trung bình 15 phút
            </div>
            <h1 className="font-display font-extrabold text-ink leading-[1.05] text-[38px] sm:text-[48px] lg:text-[62px]">
              Đói bụng?
              <br />
              <span className="text-pink-500">EatNow lo hết.</span>
            </h1>
            <p className="mt-5 text-lg text-ink-soft leading-relaxed max-w-[460px] mx-auto md:mx-0">
              Hơn 2.000 quán ăn ngon trong khu vực của bạn, đặt vài chạm là
              món nóng hổi tới tận cửa. Không cần suy nghĩ, chỉ cần đói.
            </p>

            <div className="flex gap-3.5 mt-8 flex-wrap justify-center md:justify-start">
              <a
                href="#tai-app"
                className="inline-flex items-center justify-center rounded-full bg-pink-500 px-[26px] py-3 text-[15px] font-bold text-white shadow-[0_10px_24px_-8px_rgba(255,111,145,0.65)] transition-transform hover:-translate-y-0.5"
              >
                Tải app miễn phí
              </a>
              <a
                href="#thuc-don"
                className="inline-flex items-center justify-center rounded-full border-2 border-pink-300 px-[26px] py-3 text-[15px] font-bold text-pink-600 hover:bg-pink-50 transition-colors"
              >
                Xem thực đơn
              </a>
            </div>

            <div className="flex gap-3 mt-6 flex-wrap justify-center md:justify-start">
              <StoreBadge />
              <StoreBadgePlay />
            </div>

            <div className="flex gap-7 mt-9 flex-wrap justify-center md:justify-start">
              <div>
                <b className="block font-display text-[26px] text-pink-600">2.000+</b>
                <span className="text-[13px] text-ink-soft">quán ăn đối tác</span>
              </div>
              <div>
                <b className="block font-display text-[26px] text-pink-600">15 phút</b>
                <span className="text-[13px] text-ink-soft">giao trung bình</span>
              </div>
              <div>
                <b className="block font-display text-[26px] text-pink-600">4.9★</b>
                <span className="text-[13px] text-ink-soft">đánh giá người dùng</span>
              </div>
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="relative w-[300px] h-[300px] sm:w-[340px] sm:h-[340px] rounded-full bg-gradient-to-br from-surface to-pink-50 flex items-center justify-center shadow-[0_30px_60px_-20px_rgba(255,111,145,0.45)]">
              <span className="animate-steam absolute w-1.5 rounded-md bg-white/90 blur-[1px] left-[44%] top-[6%] h-10" />
              <span className="animate-steam absolute w-1.5 rounded-md bg-white/90 blur-[1px] left-[52%] top-[2%] h-[52px] [animation-delay:0.6s]" />
              <span className="animate-steam absolute w-1.5 rounded-md bg-white/90 blur-[1px] left-[60%] top-[8%] h-[34px] [animation-delay:1.2s]" />
              <IconBowl className="w-[150px] h-[150px] sm:w-[170px] sm:h-[170px] text-pink-500" />
            </div>
            <div className="animate-bob absolute top-[8%] -left-[6%] flex items-center gap-2 bg-surface rounded-[18px] px-4 py-2.5 shadow-[0_14px_30px_-12px_rgba(58,31,43,0.25)] font-bold text-[13px]">
              <IconClock className="w-4 h-4 text-pink-500" />
              Giao sau 12 phút
            </div>
            <div className="animate-bob absolute bottom-[6%] -right-[8%] flex items-center gap-1.5 bg-surface rounded-[18px] px-4 py-2.5 shadow-[0_14px_30px_-12px_rgba(58,31,43,0.25)] font-bold text-[13px] [animation-delay:1.3s]">
              <IconStar className="w-4 h-4 text-mango" />
              4.9 · 800 đánh giá
            </div>
          </div>
        </div>
      </section>

      {/* MARQUEE */}
      <div className="bg-pink-500 py-3.5 overflow-hidden">
        <div className="animate-marquee flex gap-12 whitespace-nowrap font-display font-bold text-white text-base">
          <span>
            Pizza · Trà sữa · Burger · Lẩu · Đồ chay · Cơm văn phòng ·
            Tráng miệng · Pizza · Trà sữa · Burger · Lẩu · Đồ chay · Cơm
            văn phòng · Tráng miệng ·
          </span>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section id="cach-hoat-dong" className="py-24 max-w-[1160px] mx-auto px-6 w-full">
        <div className="text-center max-w-[600px] mx-auto mb-14">
          <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
            Cách hoạt động
          </div>
          <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] mt-2.5">
            Ba bước, xong luôn
          </h2>
          <p className="mt-3.5 text-ink-soft leading-relaxed">
            Đơn hàng của bạn được xử lý như một tấm vé — rõ ràng từng bước,
            không hồi hộp.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
          {steps.map((s) => (
            <div
              key={s.num}
              className="ticket-edge relative bg-surface rounded-[20px] px-6 pt-[34px] pb-[30px] shadow-[0_16px_40px_-20px_rgba(58,31,43,0.25)]"
            >
              <span className="inline-flex items-center justify-center w-[34px] h-[34px] rounded-[10px] bg-pink-100 text-pink-600 font-display font-extrabold text-sm mb-4">
                {s.num}
              </span>
              <s.Icon className="w-8 h-8 text-pink-500 mb-3.5" />
              <h3 className="text-[19px] font-bold mb-2">{s.title}</h3>
              <p className="text-ink-soft text-[14.5px] leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* MENU */}
      <section id="thuc-don" className="bg-pink-50 py-24">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="text-center max-w-[600px] mx-auto mb-14">
            <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
              Thực đơn
            </div>
            <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] mt-2.5">
              Thèm gì, có nấy
            </h2>
            <p className="mt-3.5 text-ink-soft leading-relaxed">
              Từ cơm văn phòng đến trà sữa xế chiều, mọi cơn thèm đều có chỗ
              đứng.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
            {menuCategories.map((c) => (
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

      {/* APP CTA */}
      <section className="max-w-[1160px] mx-auto px-6 py-24 w-full">
        <div
          id="tai-app"
          className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-pink-500 to-pink-600 px-7 py-12 sm:px-12 sm:py-16 grid grid-cols-1 md:grid-cols-[1.1fr_0.9fr] gap-10 items-center text-white text-center md:text-left"
        >
          <div>
            <h2 className="font-display font-extrabold text-[26px] sm:text-[36px] leading-tight">
              Đói là mở app,
              <br />
              không đói cũng mở app.
            </h2>
            <p className="mt-3.5 opacity-90 max-w-[420px] mx-auto md:mx-0">
              Tải EatNow ngay để nhận ưu đãi miễn phí giao hàng cho đơn đầu
              tiên.
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
                <b className="font-display text-ink">EatNow</b>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="danh-gia" className="py-24 max-w-[1160px] mx-auto px-6 w-full">
        <div className="text-center max-w-[600px] mx-auto mb-14">
          <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
            Đánh giá
          </div>
          <h2 className="font-display font-extrabold text-[28px] sm:text-[40px] mt-2.5">
            Người dùng nói gì
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="bg-surface rounded-[20px] p-7 shadow-[0_14px_30px_-18px_rgba(58,31,43,0.2)]"
            >
              <div className="mb-3">
                <Stars />
              </div>
              <p className="text-[14.5px] leading-relaxed mb-4">“{t.quote}”</p>
              <div className="flex items-center gap-2.5">
                <div className="w-[38px] h-[38px] rounded-full bg-pink-100 flex items-center justify-center text-[12px] font-bold text-pink-600">
                  {t.initials}
                </div>
                <div>
                  <b className="text-[13.5px] block">{t.name}</b>
                  <span className="text-xs text-ink-soft">{t.place}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#2b1620] text-white pt-14 pb-7 mt-10">
        <div className="max-w-[1160px] mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-9">
            <div>
              <Logo light />
              <p className="text-[#c7b3ba] text-sm leading-relaxed max-w-[280px] mt-3">
                Ứng dụng đặt đồ ăn giao nhanh, thực đơn phong phú từ hàng
                nghìn quán ăn quanh bạn.
              </p>
            </div>
            <div>
              <h5 className="text-[13px] uppercase tracking-wider text-[#f0a9bd] mb-3.5">
                Sản phẩm
              </h5>
              <ul className="flex flex-col gap-2.5 text-[#e9d7dc] text-sm">
                <li>
                  <a href="#thuc-don" className="hover:text-white transition-colors">
                    Thực đơn
                  </a>
                </li>
                <li>
                  <a href="#cach-hoat-dong" className="hover:text-white transition-colors">
                    Cách hoạt động
                  </a>
                </li>
                <li>
                  <a href="#tai-app" className="hover:text-white transition-colors">
                    Tải app
                  </a>
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
                    Đối tác quán ăn
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
            <span>© 2026 EatNow. Đói bụng, có ngay.</span>
            <span>Thiết kế tại Việt Nam</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
