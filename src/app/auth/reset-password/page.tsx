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
          ? `Nhập mã 8 số đã gửi tới ${email}`
          : "Nhập mã xác nhận đã gửi tới email của bạn"
      }
      footer={null}
    >
      <ResetPasswordForm email={email} />
    </AuthShell>
  );
}
