import AuthShell from "@/app/auth/AuthShell";
import VerifyOtpForm from "./VerifyOtpForm";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const { email = "" } = await searchParams;

  return (
    <AuthShell
      title="Nhập mã xác nhận"
      subtitle={
        email
          ? `EatNow đã gửi mã 6 số tới ${email}`
          : "Kiểm tra email để lấy mã 6 số"
      }
      footer={null}
    >
      <VerifyOtpForm email={email} />
    </AuthShell>
  );
}
