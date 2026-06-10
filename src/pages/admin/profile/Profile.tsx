import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck } from "lucide-react";
import { authApi } from "@/api/auth";
import { toast } from "sonner";

// Import subcomponents
import { ProfileInfoCard } from "./components/ProfileInfoCard";
import { WorkInfoCard } from "./components/WorkInfoCard";
import { FaceRegistrationCard } from "./components/FaceRegistrationCard";
import { PasswordCard } from "./components/PasswordCard";
import { FaceRegisterModal } from "./components/FaceRegisterModal";

function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialProfile, setInitialProfile] = useState<any>(null);
  const [changingPass, setChangingPass] = useState(false);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const isStaff = String(profile?.role?.role_name || profile?.role || "").toLowerCase() === "staff";

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getMe();
      const rawUser = response.data?.user || (response.data?.id ? response.data : null);
      if (rawUser) {
        const user = {
          ...rawUser,
          role: typeof rawUser.role === 'object' ? rawUser.role.role_name : rawUser.role,
          role_id: rawUser.role_id || (typeof rawUser.role === 'object' ? rawUser.role.id : undefined)
        };
        setProfile(user);
        setInitialProfile(user);
        // Cập nhật lại localStorage để đồng bộ với server
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-login'));
      }
    } catch (error: any) {
      console.error("Fetch profile error:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn");
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        toast.error("Không thể kết nối máy chủ để cập nhật dữ liệu mới nhất");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      const response = await authApi.updateProfile({
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        avatar_url: profile.avatar_url,
        bio: profile.bio
      });
      
      const rawUpdatedUser = response.data?.user || response.data || profile;
      const updatedUser = {
        ...rawUpdatedUser,
        role: typeof rawUpdatedUser.role === 'object' ? rawUpdatedUser.role.role_name : rawUpdatedUser.role,
        role_id: rawUpdatedUser.role_id || (typeof rawUpdatedUser.role === 'object' ? rawUpdatedUser.role.id : undefined)
      };
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfile(updatedUser);
      setInitialProfile(updatedUser);
      window.dispatchEvent(new Event('user-login'));
      
      toast.success("Đã cập nhật hồ sơ thành công");
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Cập nhật hồ sơ thất bại";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const isDirty = 
    profile?.full_name !== initialProfile?.full_name ||
    profile?.phone_number !== (initialProfile?.phone_number || "") ||
    profile?.avatar_url !== initialProfile?.avatar_url ||
    profile?.bio !== (initialProfile?.bio || "");

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

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin cá nhân và thiết lập tài khoản của bạn.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 px-3 py-1 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" /> 
          {profile?.role === 'Admin' ? 'Quản trị viên' : (profile?.role === 'BranchManager' ? 'Quản lý chi nhánh' : 'Nhân viên')}
        </Badge>
      </div>

      {/* Profile Info Card component */}
      <ProfileInfoCard
        profile={profile}
        onUpdate={handleUpdate}
        saving={saving}
        isDirty={isDirty}
        onCancel={fetchProfile}
        onSave={save}
      />

      {/* Work Info Card component (Staff only) */}
      {isStaff && (
        <WorkInfoCard profile={profile} />
      )}

      {/* Face Registration status Card */}
      <FaceRegistrationCard
        isFaceRegistered={!!profile?.face_embedding}
        onOpenModal={() => setFaceModalOpen(true)}
      />

      {/* Security/Password change Card */}
      <PasswordCard
        changingPass={changingPass}
        onSubmit={handleChangePassword}
      />

      {/* Face Registration Camera Modal */}
      <FaceRegisterModal
        open={faceModalOpen}
        onOpenChange={setFaceModalOpen}
        onSuccess={fetchProfile}
      />
    </div>
  );
}

export default AdminProfilePage;
