import AuthShell from "@/app/auth/AuthShell";
import ResetPasswordForm from "./ResetPasswordForm";

export default function ResetPasswordPage() {
  return (
    <AuthShell
      title="Đặt lại mật khẩu"
      subtitle="Nhập mật khẩu mới cho tài khoản của bạn"
      footer={null}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
