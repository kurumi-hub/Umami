import AppHeader from "@/app/components/AppHeader";
import {
  IconBowl,
  IconChefHat,
  IconHeart,
  IconMessageCircle,
  IconPlus,
} from "@/app/icons";

const posts = [
  {
    author: "Cô Lan Bếp Việt",
    handle: "@colanbepviet",
    time: "2 giờ trước",
    recipe: "Phở bò truyền thống",
    content:
      "Bí quyết nước dùng trong veo: nướng gừng hành trước khi ninh và hớt bọt liên tục trong 20 phút đầu nhé mọi người!",
    likes: 128,
    comments: 24,
  },
  {
    author: "Chef Minh Đức",
    handle: "@chefminhduc",
    time: "5 giờ trước",
    recipe: "Bún chả Hà Nội",
    content:
      "Vừa thử nướng chả bằng nồi chiên không dầu, tiết kiệm thời gian mà vẫn giữ được vị khói nhẹ. Ai muốn mình quay clip hướng dẫn không?",
    likes: 96,
    comments: 31,
  },
  {
    author: "O Huế Bếp Xưa",
    handle: "@ohuebepxua",
    time: "1 ngày trước",
    recipe: "Bún bò Huế",
    content:
      "Mắm ruốc ngon là yếu tố quyết định nồi bún bò. Mình hay chọn mắm ruốc Huế xịn, lọc kỹ trước khi nêm để nước dùng không bị đục.",
    likes: 214,
    comments: 47,
  },
  {
    author: "Sài Gòn Food",
    handle: "@saigonfood",
    time: "2 ngày trước",
    recipe: "Cơm tấm sườn bì chả",
    content:
      "Mẹo nhỏ: ướp sườn qua đêm trong tủ lạnh sẽ thấm gia vị đều hơn hẳn so với ướp 1-2 tiếng trước khi nướng.",
    likes: 152,
    comments: 18,
  },
];

function PostCard({ p }: { p: (typeof posts)[number] }) {
  return (
    <article className="bg-surface rounded-[22px] p-5 sm:p-6 border border-pink-500/10 shadow-[0_14px_30px_-20px_rgba(58,31,43,0.2)]">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-pink-100">
          <IconChefHat className="h-5 w-5 text-pink-500" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <b className="text-[14.5px]">{p.author}</b>
            <span className="text-[12.5px] text-ink-soft">{p.handle}</span>
          </div>
          <span className="text-[12px] text-ink-soft">{p.time}</span>
        </div>
      </div>

      <p className="mt-4 text-[14.5px] leading-relaxed">{p.content}</p>

      <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-pink-50 px-3.5 py-2 text-[12.5px] font-bold text-pink-600">
        <IconBowl className="h-4 w-4" />
        {p.recipe}
      </div>

      <div className="mt-4 flex items-center gap-5 text-[13px] text-ink-soft">
        <button type="button" className="flex items-center gap-1.5 hover:text-pink-600 transition-colors">
          <IconHeart className="h-4 w-4" />
          {p.likes}
        </button>
        <button type="button" className="flex items-center gap-1.5 hover:text-pink-600 transition-colors">
          <IconMessageCircle className="h-4 w-4" />
          {p.comments}
        </button>
      </div>
    </article>
  );
}

export default function CommunityPage() {
  return (
    <div className="flex flex-col flex-1">
      <AppHeader active="community" />

      <section className="max-w-[720px] mx-auto px-6 py-10 w-full">
        <div className="mb-8">
          <div className="text-pink-600 font-bold text-[13px] uppercase tracking-wider">
            Cộng đồng
          </div>
          <h1 className="font-display font-extrabold text-[26px] sm:text-[34px] mt-2">
            Mẹo vào bếp mới nhất
          </h1>
          <p className="mt-2.5 text-ink-soft leading-relaxed">
            Theo dõi chia sẻ, mẹo nấu ăn và cảm nhận từ những người yêu bếp
            núc trong cộng đồng Umami.
          </p>
        </div>

        <div className="flex flex-col gap-5">
          {posts.map((p) => (
            <PostCard key={p.handle + p.time} p={p} />
          ))}
        </div>
      </section>

      <button
        type="button"
        aria-label="Đăng bài mới"
        className="fixed bottom-[104px] right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-pink-500 text-white shadow-[0_16px_32px_-10px_rgba(255,111,145,0.7)] transition-transform hover:-translate-y-0.5 md:bottom-8"
      >
        <IconPlus className="h-6 w-6" />
      </button>
    </div>
  );
}
