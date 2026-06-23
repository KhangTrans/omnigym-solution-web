import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { authApi } from "@/api/auth";
import { toast } from "sonner";
import { FaceRegistrationCard } from "./components/FaceRegistrationCard";
import { FaceRegisterModal } from "./components/FaceRegisterModal";

export default function AdminFaceRegistrationPage() {
  const [loading, setLoading] = useState(true);
  const [faceModalOpen, setFaceModalOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getMe();
      const rawUser = response.data?.user || (response.data?.id ? response.data : null);
      if (rawUser) {
        setProfile(rawUser);
      }
    } catch (error: any) {
      console.error("Fetch profile error:", error);
      toast.error("Không thể tải thông tin xác thực khuôn mặt");
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Đăng ký gương mặt</h1>
        <p className="text-sm text-muted-foreground">
          Đăng ký dữ liệu khuôn mặt để thực hiện điểm danh tự động bằng camera tại chi nhánh.
        </p>
      </div>

      <FaceRegistrationCard
        isFaceRegistered={!!profile?.face_embedding}
        onOpenModal={() => setFaceModalOpen(true)}
      />

      <FaceRegisterModal
        open={faceModalOpen}
        onOpenChange={setFaceModalOpen}
        onSuccess={fetchProfile}
      />
    </div>
  );
}
