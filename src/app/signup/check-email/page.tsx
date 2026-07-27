import Link from "next/link";
import AuthShell from "@/app/auth/AuthShell";

export default function CheckEmailPage() {
  return (
    <AuthShell
      title="Kiểm tra email của bạn"
      subtitle="EatNow đã gửi một liên kết xác nhận"
      footer={
        <Link href="/login" className="font-semibold text-pink-600">
          Quay lại đăng nhập
        </Link>
      }
    >
      <p className="text-center text-[14.5px] leading-relaxed text-ink-soft">
        Bấm vào liên kết trong email để kích hoạt tài khoản. Không thấy
        email? Kiểm tra thư mục spam hoặc thử đăng ký lại sau ít phút.
      </p>
    </AuthShell>
  );
}
