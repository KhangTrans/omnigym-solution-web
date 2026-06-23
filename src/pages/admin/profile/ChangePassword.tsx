import { useState } from "react";
import { authApi } from "@/api/auth";
import { toast } from "sonner";
import { PasswordCard } from "./components/PasswordCard";

export default function AdminChangePasswordPage() {
  const [changingPass, setChangingPass] = useState(false);

  const handleChangePassword = async (passwords: any): Promise<boolean> => {
    setChangingPass(true);
    try {
      await authApi.changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      toast.success("Đổi mật khẩu thành công");
      return true;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
      return false;
    } finally {
      setChangingPass(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Đổi mật khẩu</h1>
        <p className="text-sm text-muted-foreground">
          Cập nhật mật khẩu mới để tăng cường bảo mật tài khoản.
        </p>
      </div>

      <PasswordCard
        changingPass={changingPass}
        onSubmit={handleChangePassword}
      />
    </div>
  );
}
