import { Link, useNavigate, useLocation, Outlet } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { NotificationBell } from "@/components/NotificationBell";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  LogOut,
  PauseCircle,
  UserCircle2,
  Users,
  UserCog,
  Calendar as CalIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { getTrainerStatus } from "@/lib/staff-store";


function useStaffTrainersTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener("gym_staff_trainers_changed", bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener("gym_staff_trainers_changed", bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  return tick;
}

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const tick = useStaffTrainersTick();

  const activeTab = location.pathname.split("/").pop() || "schedule";

  const handleTabChange = (value: string) => {
    navigate(`/trainer/${value}`);
  };

  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [trainerProfile, setTrainerProfile] = useState<any>(null);
  const [profileTick, setProfileTick] = useState(0);
  const [accessChecked, setAccessChecked] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("user");
      setUser(raw ? JSON.parse(raw) : null);
    } catch {
      setUser(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (!user) return;

    async function loadProfile() {
      try {
        const response = await authApi.getMe();
        const data = response.data;

        if (!data?.trainer || data.trainer.is_active !== true) {
          toast.error("Tài khoản Trainer của bạn chưa được duyệt.");
          setAccessChecked(true);
          navigate("/trainer-join", { replace: true });
          return;
        }

        setTrainerProfile(data.trainer);
        setAccessChecked(true);
      } catch (error) {
        console.error("Failed to load trainer profile", error);
        setAccessChecked(true);
        navigate("/trainer-join", { replace: true });
      }
    }

    loadProfile();
  }, [user, tick, navigate, profileTick]);

  const trainer = useMemo(() => {
    if (trainerProfile) {
      return {
        id: String(trainerProfile.id),
        name: trainerProfile.user?.full_name || user?.full_name || "Trainer",
        email: trainerProfile.user?.email || user?.email || "",
        phone: trainerProfile.phone_number || user?.phone_number || "",
        title: trainerProfile.specialization || "HLV Cá nhân",
        photo:
          trainerProfile.avatar_url ||
          user?.avatar_url ||
          "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&q=80",
        bio: trainerProfile.bio || "",
        address: trainerProfile.address || "",
        idNumber: trainerProfile.identity_number || "",
        idPhoto: trainerProfile.identity_image_url || "",
        certification: trainerProfile.certificates?.[0]?.cert_name || "N/A",
        certificationIssuer:
          trainerProfile.certificates?.[0]?.issued_by || "N/A",
        certificationNumber:
          trainerProfile.certificates?.[0]?.certificate_number || "N/A",
        certificationIssuedAt:
          trainerProfile.certificates?.[0]?.issued_at || "",
        certificationExpiresAt:
          trainerProfile.certificates?.[0]?.expires_at || "",
        certificationPhoto: trainerProfile.certificates?.[0]?.image_url || "",
        cprCertified: true,
        cprExpiresAt: "2030-01-01",
        insuranceProvider: "N/A",
        insurancePolicyNumber: "N/A",
        insuranceExpiresAt: "2030-01-01",
        specialties: trainerProfile.specialization
          ? trainerProfile.specialization.split(", ")
          : [],
        yearsExperience: Number(trainerProfile.years_experience) || 0,
        hourlyRate: Number(trainerProfile.hourly_rate) || 0,
        monthlyEarnings: 0,
        monthlySessions: 0,
        active:
          trainerProfile.is_active !== undefined
            ? trainerProfile.is_active
            : true,
        createdAt: trainerProfile.created_at || new Date().toISOString(),
        approved: true,
      };
    }

    return {
      id: "diego",
      brandId: "demo",
      name: user?.full_name || "Diego Rivera",
      email: user?.email || "diego@omnigym.demo",
      phone: user?.phone_number || "+1 555 0100",
      title: "HIIT & Conditioning Coach",
      photo:
        user?.avatar_url ||
        "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&q=80",
      bio: "Demo trainer for UI/UX preview.",
      address: "123 Demo Street",
      idNumber: "DEMO-001",
      idPhoto: "https://placehold.co/200",
      certification: "NASM CPT",
      certificationIssuer: "NASM",
      certificationNumber: "NASM-001",
      certificationIssuedAt: "2017-01-01",
      certificationExpiresAt: "2030-01-01",
      certificationPhoto: "https://placehold.co/200",
      cprCertified: true,
      cprExpiresAt: "2030-01-01",
      insuranceProvider: "DemoIns",
      insurancePolicyNumber: "POL-001",
      insuranceExpiresAt: "2030-01-01",
      specialties: ["HIIT", "Fat Loss", "Boxing"],
      yearsExperience: 8,
      hourlyRate: 85,
      monthlyEarnings: 4200,
      monthlySessions: 32,
      active: true,
      createdAt: new Date().toISOString(),
      approved: true,
    };
  }, [user, trainerProfile]);

  const signOut = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      toast.success("Đăng xuất thành công");
      navigate("/login");
    }
  };

  if (!loaded || !accessChecked) return null;
  if (!trainerProfile) return <Navigate to="/trainer-join" replace />;

  const status = getTrainerStatus(trainer as any);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative">
      <div
        className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,138,116,0.10),transparent_55%)]"
        aria-hidden
      />

      <header className="relative border-b border-border bg-white/70 backdrop-blur-md z-20">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F8A74] hover:text-[#3f6e5d]"
          >
            <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
          </Link>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">
              {trainer.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={signOut}
              className="gap-2 text-red-500 hover:bg-red-50 hover:text-red-600"
            >
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl w-full space-y-6 px-4 py-8 sm:px-6 flex-1 z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b pb-6 border-slate-100">
          <div className="flex flex-col items-center text-center sm:flex-row sm:items-center sm:text-left gap-4">
            <img
              src={trainer.photo}
              alt={trainer.name}
              className="h-20 w-20 rounded-full object-cover ring-4 ring-[#4F8A74]/15 shadow-md shrink-0"
            />
            <div className="space-y-1">
              <h1 className="text-2xl font-black tracking-tight text-slate-800">
                {trainer.name}
              </h1>
              <p className="text-xs text-muted-foreground max-w-xl leading-relaxed">
                Các khung giờ 1h30 phút đều mặc định mở. Vui lòng đóng các khung
                giờ bạn bận kèm lý do để học viên được biết.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <StatusBadge status={status} />
          </div>
        </div>

        {!trainer.active && (
          <Card className="border-red-100 bg-red-50/50">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-red-800">
              <PauseCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
              <div>
                <div className="font-semibold text-red-950">
                  Tài khoản của bạn hiện đang bị tạm dừng
                </div>
                <div className="text-red-700 mt-0.5">
                  Phòng tập đã tạm dừng hoạt động của bạn. Vui lòng liên hệ quản
                  lý để kích hoạt lại lịch tập.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {status === "waiting" && (
          <Card className="border-amber-100 bg-amber-50/50">
            <CardContent className="flex items-start gap-3 p-4 text-sm text-amber-800">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              <div className="flex-1">
                <div className="font-semibold text-amber-950">
                  Hoàn thiện thông tin để bắt đầu nhận học viên
                </div>
                <div className="text-amber-700 mt-0.5">
                  Vui lòng cập nhật chứng chỉ, căn cước công dân và thông tin
                  bảo hiểm. Sau khi hoàn tất cập nhật hồ sơ, trạng thái của bạn
                  sẽ tự động chuyển sang <strong>Hoạt động</strong>.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs value={activeTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="bg-slate-100/80 p-1 border rounded-xl w-full flex overflow-x-auto flex-nowrap justify-start md:justify-center scrollbar-none">
            <TabsTrigger value="schedule" className="gap-1.5 rounded-lg shrink-0">
              <CalIcon className="h-3.5 w-3.5" /> Lịch làm việc
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5 rounded-lg shrink-0">
              <Users className="h-3.5 w-3.5" /> Lịch hẹn đặt
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1.5 rounded-lg shrink-0">
              <UserCircle2 className="h-3.5 w-3.5" /> Học viên của tôi
            </TabsTrigger>
            <TabsTrigger value="profile" className="gap-1.5 rounded-lg shrink-0">
              <UserCog className="h-3.5 w-3.5" /> Hồ sơ cá nhân
            </TabsTrigger>
          </TabsList>
          
          <div className="space-y-4 outline-none">
            <Outlet context={{ trainer, trainerProfile, setProfileTick }} />
          </div>
        </Tabs>
      </main>
    </div>
  );
}

function StatusBadge({ status }: { status: "active" | "waiting" }) {
  if (status === "active") {
    return (
      <Badge className="gap-1 bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/15 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full font-semibold">
        <CheckCircle2 className="h-3 w-3" /> Hoạt động
      </Badge>
    );
  }
  return (
    <Badge className="gap-1 bg-amber-500/15 text-amber-700 hover:bg-amber-500/15 dark:text-amber-400 border border-amber-500/20 px-2.5 py-1 rounded-full font-semibold">
      <Clock className="h-3 w-3" /> Chờ hoàn thiện thông tin
    </Badge>
  );
}
