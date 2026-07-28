import AuthShell from "@/app/auth/AuthShell";
import VerifyOtpForm from "./VerifyOtpForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; unverified?: string }>;
}) {
  const { email = "", unverified } = await searchParams;

  return (
    <AuthShell
      title="Nhập mã xác nhận"
      subtitle={
        email
          ? `EatNow đã gửi mã 8 số tới ${email}`
          : "Kiểm tra email để lấy mã 8 số"
      }
      footer={null}
    >
      {unverified === "1" && (
        <p className="mb-4 rounded-xl bg-mango/15 px-3.5 py-2.5 text-center text-[13.5px] font-medium text-amber-700">
          Email của bạn chưa được xác minh. Nhập mã đã gửi tới email (hoặc bấm
          &quot;Gửi lại&quot; nếu chưa nhận được) để hoàn tất đăng nhập.
        </p>
      )}
      <VerifyOtpForm email={email} />
    </AuthShell>
  );
}
