# Umami

Umami là ứng dụng công thức nấu ăn và cộng đồng người yêu bếp núc, phong
cách tương tự Tasty — khám phá công thức, lưu/lên kế hoạch nấu ăn, quản
lý tủ lạnh & danh sách đi chợ, và tương tác với cộng đồng.

## Tech stack

- **Next.js** (App Router, Server Components + Server Actions)
- **Supabase** (Postgres + Auth + RLS) — toàn bộ logic nghiệp vụ nằm ở
  tầng database (RPC, trigger, RLS policy), frontend chủ yếu gọi thẳng
  `supabase-js` qua Server Component/Server Action, hạn chế route API
  riêng.
- **Tailwind CSS v4** (theme qua CSS variables, xem `src/app/globals.css`)
- Icon tự vẽ tay dạng SVG thuần trong `src/app/icons.tsx` (không dùng
  thư viện icon ngoài)

## Cài đặt

```bash
npm install
cp .env.example .env.local   # điền NEXT_PUBLIC_SUPABASE_URL và NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
npm run dev
```

## Cấu trúc thư mục chính

```
src/app/
├── page.tsx                  # Trang chủ (Khám phá)
├── cong-dong/                 # Cộng đồng — feed hoạt động
├── danh-muc/[slug]/           # Trang danh mục (theo tag)
├── bo-suu-tap/                 # Khám phá bộ sưu tập công khai
├── u/[username]/               # Xem hồ sơ công khai người khác
├── cong-thuc/[slug]/           # Trang chi tiết công thức
├── auth/                       # Đăng nhập/đăng ký/quên mật khẩu (OTP)
├── account/                    # Toàn bộ khu vực Cá nhân
│   ├── recipes/                #   công thức của bạn (+ new, [id]/edit)
│   ├── saved/                  #   công thức đã lưu
│   ├── collections/            #   bộ sưu tập (+ [id] chi tiết)
│   ├── shopping-list/          #   đi chợ + tủ lạnh (2 tab)
│   ├── meal-plan/              #   kế hoạch bữa ăn theo tuần
│   ├── connections/             #   người theo dõi / đang theo dõi / yêu cầu chờ duyệt
│   ├── notifications/           #   thông báo
│   └── settings/                #   hồ sơ, bảo mật, sở thích, dị ứng, chặn
└── components/                 # AppHeader, BottomNav dùng chung
```

## Tính năng theo khu vực

### Khám phá (trang chủ)
Tìm kiếm (chưa nối — để sau), danh mục, đề xuất cá nhân hoá, gợi ý từ
tủ lạnh, công thức nổi bật, nấu nhanh, ngẫu nhiên, công thức mới từ
người theo dõi, đầu bếp nổi bật, bộ sưu tập nổi bật.

### Cộng đồng
Feed trộn 2 (theo dõi) : 1 (khám phá ngẫu nhiên trong 14 ngày), chỉ 2
loại hoạt động có nội dung để đọc (đăng công thức, bình luận) — like/
trả lời bình luận ngay trong feed. Gợi ý theo dõi khi feed rỗng.

### Cá nhân
Hồ sơ (sửa thông tin, avatar, đổi mật khẩu, tài khoản riêng tư), công
thức của bạn (đăng/sửa/xoá), đã lưu, bộ sưu tập (tạo/sửa/xoá/kéo-thả
sắp xếp/công khai+follow/chia sẻ/báo cáo), đi chợ (nhóm theo khu vực
chợ, thêm/tick/xoá, thêm vào tủ lạnh khi mua xong), tủ lạnh (số lượng +
đơn vị + hạn dùng, ảnh hưởng gợi ý trang chủ), kế hoạch bữa ăn theo
tuần (gom nguyên liệu cả tuần vào đi chợ), sở thích ăn uống & dị ứng,
thông báo, kết nối (follow/chặn/duyệt yêu cầu), xem hồ sơ người khác.

### Trang chi tiết công thức
Đánh giá sao, bình luận (có avatar, like, trả lời), thêm vào bộ sưu
tập, thêm vào đi chợ (chọn khẩu phần, tự scale số lượng), theo dõi tác
giả, cảnh báo dị ứng, tô "có sẵn" theo tủ lạnh, đổi đơn vị đo, scale
khẩu phần, báo cáo nội dung, sửa/xoá (nếu là công thức của bạn).
