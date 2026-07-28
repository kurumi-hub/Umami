import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Bắt buộc phải gọi getUser() ở đây để Supabase tự refresh token nếu cần.
  // Không được bỏ qua bước này hoặc chèn logic giữa createServerClient và getUser().
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Bảo vệ các route cần đăng nhập, ví dụ /account — TRỪ trang chi tiết
  // 1 bộ sưu tập (/account/collections/[id]) vì đó có thể là bộ sưu tập
  // CÔNG KHAI mà khách chưa đăng nhập cũng cần xem được (từ trang khám
  // phá /bo-suu-tap). Trang đó tự xử lý quyền riêng qua RLS + kiểm tra
  // is_public ở phía server, không cần middleware chặn trước.
  const isAccountRoute = request.nextUrl.pathname.startsWith("/account");
  const isPublicCollectionDetail = /^\/account\/collections\/[^/]+$/.test(
    request.nextUrl.pathname
  );

  if (!user && isAccountRoute && !isPublicCollectionDetail) {
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}
