import AuthShell from "@/app/auth/AuthShell";
import ResetPasswordForm from "./ResetPasswordForm";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;

  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      subtitle={
        email
          ? `Nhập mã 8 số đã gửi tới ${email} và mật khẩu mới`
          : "Nhập mã xác nhận và mật khẩu mới"
      }
      footer={null}
    >
      <ResetPasswordForm email={email} />
    </AuthShell>
  );
}
