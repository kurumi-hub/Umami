# Đăng ký / Đăng nhập với Supabase

Cấu trúc trong bản này khớp với hướng dẫn chính thức hiện tại của Supabase
("Setting up Server-Side Auth for Next.js"): dùng thư mục `utils/supabase/`
ở gốc project, và file `proxy.ts` (thay cho `middleware.ts` cũ) ở gốc project.

## ⚠️ Lưu ý phiên bản Next.js 16+
Next.js đã đổi tên quy ước file từ `middleware.ts` sang `proxy.ts` (hàm export
cũng đổi từ `middleware` thành `proxy`). Nếu bạn đang dùng Next.js 15 trở
xuống, đổi ngược lại tên file thành `middleware.ts` và tên hàm export thành
`middleware`.

## ⚠️ Nếu project của bạn dùng thư mục `src/`
Tức là bạn có `src/app/...` thay vì `app/...` ở gốc. Khi đó:
- Di chuyển `utils/` vào trong `src/utils/`
- Di chuyển `proxy.ts` vào trong `src/proxy.ts`
- `app/` (chứa các trang) vẫn nằm trong `src/app/`

`proxy.ts` và `utils/` luôn phải nằm cùng cấp với `app/`.

## 1. Cài package
```bash
npm install @supabase/ssr @supabase/supabase-js
```

## 2. Cấu hình biến môi trường
Copy `.env.local.example` thành `.env.local` (đặt ở gốc project, ngang hàng
`package.json`) và điền URL + key lấy từ Supabase Dashboard → Project
Settings → API Keys.

**Sau khi tạo/sửa `.env.local`, luôn phải tắt và chạy lại `npm run dev`** —
Next.js chỉ đọc biến môi trường lúc khởi động.

Nếu gặp lỗi "Your project's URL and Key are required":
- Kiểm tra tên biến đúng `NEXT_PUBLIC_SUPABASE_URL` và
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (không phải file `.env.local.example`)
- Kiểm tra file `.env.local` nằm đúng thư mục gốc project
- Restart lại dev server

## 3. Xác nhận email bằng mã OTP (6 số)
Project này dùng **mã OTP 6 số** thay vì link xác nhận.

**Bắt buộc phải sửa Email Template** để email hiện được mã, nếu không email
sẽ chỉ có link (không có số nào để nhập):

Vào Supabase Dashboard → **Authentication → Email Templates → Confirm
signup**, sửa nội dung để dùng biến `{{ .Token }}`, ví dụ:
```html
<h2>Xác nhận đăng ký</h2>
<p>Nhập mã sau để xác nhận tài khoản EatNow của bạn:</p>
<p style="font-size:32px; font-weight:bold; letter-spacing:8px;">
  {{ .Token }}
</p>
```
Bấm **Save**.

⚠️ Nếu nút Save bị khóa/mờ: project của bạn thuộc free-tier, tạo sau
3/6/2026, và chưa cấu hình SMTP riêng — Supabase chặn sửa template trong
trường hợp này. Cần cấu hình Custom SMTP (Resend, SendGrid...) ở
Authentication → Emails → SMTP Settings trước, thì mới sửa template được.

Không cần cấu hình Redirect URLs cho luồng OTP này vì không dùng link.

## 4. Cấu trúc file

```
proxy.ts                          <- chạy trước mỗi request, refresh session
utils/supabase/
  client.ts                       <- Supabase client cho Client Component
  server.ts                       <- Supabase client cho Server Component/Action
  middleware.ts                   <- logic updateSession dùng trong proxy.ts
app/
  auth/
    actions.ts                    <- server action: login, signup, logout,
                                      verifySignupOtp, resendSignupOtp
    AuthField.tsx / AuthShell.tsx <- UI dùng chung cho form
  login/page.tsx
  signup/page.tsx
  signup/verify/page.tsx          <- nhập mã OTP 6 số sau khi đăng ký
  signup/verify/VerifyOtpForm.tsx
```

## 5. Các trang/route đã có sẵn
- `/login` — đăng nhập bằng email + mật khẩu
- `/signup` — đăng ký tài khoản mới
- `/signup/verify?email=...` — nhập mã OTP 6 số gửi qua email, có nút gửi lại mã
- `proxy.ts` — tự refresh session, bảo vệ các route bắt đầu bằng `/account`

Header ở `app/page.tsx` là Server Component, tự đọc session qua
`utils/supabase/server` và đổi giữa nút "Đăng nhập/Đăng ký" hoặc
"Chào {tên} + Đăng xuất".

## 6. Bước tiếp theo gợi ý
- Thêm đăng nhập bằng Google/Facebook (`supabase.auth.signInWithOAuth`)
- Tạo bảng `profiles` liên kết với `auth.users` để lưu thêm thông tin (số
  điện thoại, địa chỉ giao hàng...)
- Thêm trang `/account` để người dùng xem lịch sử đơn hàng
