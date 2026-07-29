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

  // Bảo vệ /mod và /admin — luôn query thẳng bảng user_roles ở ĐÂY thay
  // vì đọc role từ JWT claim, vì JWT bị revoke chậm (chỉ cập nhật ở lần
  // refresh token kế tiếp — xem ghi chú trong is_active()/my_role() ở
  // schema). Nhờ vậy quyền vừa bị thu hồi có hiệu lực NGAY, không phải
  // đợi JWT hết hạn. Đây chỉ là lớp UX (ẩn trang khỏi người không có
  // quyền) — lớp bảo mật thật nằm ở chỗ mọi RPC mod_*/admin_* đều tự
  // gọi require_moderator()/require_admin() ngay trong Postgres, luôn
  // tự kiểm tra lại bất kể middleware có bị bỏ qua hay không.
  const isModRoute = request.nextUrl.pathname.startsWith("/mod");
  const isAdminRoute = request.nextUrl.pathname.startsWith("/admin");

  if (isModRoute || isAdminRoute) {
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = "/auth/login";
      return NextResponse.redirect(url);
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id);

    const roleSet = new Set((roles ?? []).map((r) => r.role));
    const isModerator = roleSet.has("moderator") || roleSet.has("admin");
    const isAdmin = roleSet.has("admin");

    if (isModRoute && !isModerator) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
    if (isAdminRoute && !isAdmin) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
