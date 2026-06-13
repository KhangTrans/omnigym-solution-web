import { Link, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Ban,
  Calendar as CalIcon,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Lock,
  LogOut,
  Mail,
  MoreHorizontal,
  PauseCircle,
  Phone,
  RotateCcw,
  StickyNote,
  UserCircle2,
  Users,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { getTrainerStatus } from "@/lib/staff-store";
import {
  SCHEDULE_SLOTS,
  SESSION_LEN_MIN,
  useTrainerClosures,
  useTrainerDaysOff,
  type TrainerClosure,
  type TrainerDayOff,
} from "@/lib/trainer-schedule-store";
import {
  BOOKINGS_EVT,
  getBookings,
  updateBooking,
  type PTBooking,
} from "@/lib/pt-membership";

// ---------------------------------------------------------------------------
// Date helpers
// ---------------------------------------------------------------------------

function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60).toString().padStart(2, "0");
  const nm = (total % 60).toString().padStart(2, "0");
  return `${nh}:${nm}`;
}

function startOfWeek(d: Date) {
  const x = new Date(d);
  const day = x.getDay();
  const diff = (day + 6) % 7; // Monday = 0
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x;
}

type DayCell = {
  iso: string;
  weekday: string;
  day: number;
  month: string;
  isPast: boolean;
  isToday: boolean;
};

function weekDays(start: Date): DayCell[] {
  const today = new Date(new Date().setHours(0, 0, 0, 0));
  return Array.from({ length: 7 }).map((_, i) => {
    const x = new Date(start);
    x.setDate(start.getDate() + i);
    return {
      iso: x.toISOString().slice(0, 10),
      weekday: x.toLocaleDateString(undefined, { weekday: "short" }),
      day: x.getDate(),
      month: x.toLocaleDateString(undefined, { month: "short" }),
      isPast: x < today,
      isToday: x.getTime() === today.getTime(),
    };
  });
}

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

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TrainerDashboard() {
  const navigate = useNavigate();
  const tick = useStaffTrainersTick();

  const [user, setUser] = useState<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [trainerProfile, setTrainerProfile] = useState<any>(null);

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
        if (data && data.trainer) {
          setTrainerProfile(data.trainer);
        }
      } catch (error) {
        console.error("Failed to load trainer profile", error);
      }
    }
    loadProfile();
  }, [user, tick]);

  const trainer = useMemo(() => {
    if (trainerProfile) {
      return {
        id: String(trainerProfile.id),
        name: trainerProfile.user?.full_name || user?.full_name || "Trainer",
        email: trainerProfile.user?.email || user?.email || "",
        phone: trainerProfile.phone_number || user?.phone_number || "",
        title: trainerProfile.specialization || "HLV Cá nhân",
        photo: trainerProfile.avatar_url || user?.avatar_url || "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&q=80",
        bio: trainerProfile.bio || "",
        address: trainerProfile.address || "",
        idNumber: trainerProfile.identity_number || "",
        idPhoto: trainerProfile.identity_image_url || "",
        certification: trainerProfile.certificates?.[0]?.cert_name || "N/A",
        certificationIssuer: trainerProfile.certificates?.[0]?.issued_by || "N/A",
        certificationNumber: trainerProfile.certificates?.[0]?.certificate_number || "N/A",
        certificationIssuedAt: trainerProfile.certificates?.[0]?.issued_at || "",
        certificationExpiresAt: trainerProfile.certificates?.[0]?.expires_at || "",
        certificationPhoto: trainerProfile.certificates?.[0]?.image_url || "",
        cprCertified: true,
        cprExpiresAt: "2030-01-01",
        insuranceProvider: "N/A",
        insurancePolicyNumber: "N/A",
        insuranceExpiresAt: "2030-01-01",
        specialties: trainerProfile.specialization ? trainerProfile.specialization.split(", ") : [],
        yearsExperience: Number(trainerProfile.years_experience) || 0,
        hourlyRate: Number(trainerProfile.hourly_rate) || 0,
        monthlyEarnings: 0,
        monthlySessions: 0,
        active: trainerProfile.is_active !== undefined ? trainerProfile.is_active : true,
        createdAt: trainerProfile.created_at || new Date().toISOString(),
        approved: true,
      };
    }

    // UI/UX preview fallback — surface a demo trainer so the dashboard
    // always renders even without an authenticated trainer account in DB.
    return {
      id: "diego",
      brandId: "demo",
      name: user?.full_name || "Diego Rivera",
      email: user?.email || "diego@omnigym.demo",
      phone: user?.phone_number || "+1 555 0100",
      title: "HIIT & Conditioning Coach",
      photo: user?.avatar_url || "https://images.unsplash.com/photo-1567013127542-490d757e51fc?w=800&q=80",
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

  if (!loaded) return null;

  // Cast trainer object to match StaffTrainer type structure in staff-store
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

      <header className="relative border-b border-border bg-white/70 backdrop-blur-md z-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-[#4F8A74] hover:text-[#3f6e5d]">
            <ArrowLeft className="h-4 w-4" /> Quay lại trang chủ
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden text-sm font-medium text-slate-600 sm:inline">
              {trainer.name}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut} className="gap-2 text-red-500 hover:bg-red-50 hover:text-red-600">
              <LogOut className="h-4 w-4" /> Đăng xuất
            </Button>
          </div>
        </div>
      </header>

      <main className="relative mx-auto max-w-6xl w-full space-y-6 px-4 py-8 sm:px-6 flex-1 z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <img
              src={trainer.photo}
              alt={trainer.name}
              className="h-16 w-16 rounded-full object-cover ring-2 ring-primary/20 shadow-md"
            />
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                {trainer.name}
              </h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Các khung giờ 1h30 phút đều mặc định mở. Vui lòng đóng các khung giờ bạn bận kèm lý do để học viên được biết.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
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
                  Phòng tập đã tạm dừng hoạt động của bạn. Vui lòng liên hệ quản lý để kích hoạt lại lịch tập.
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
                  Vui lòng cập nhật chứng chỉ, căn cước công dân và thông tin bảo hiểm. Sau khi hoàn tất cập nhật hồ sơ, trạng thái của bạn sẽ tự động chuyển sang <strong>Hoạt động</strong>.
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="schedule" className="space-y-4">
          <TabsList className="bg-slate-100/80 p-1 border rounded-xl">
            <TabsTrigger value="schedule" className="gap-1.5 rounded-lg">
              <CalIcon className="h-3.5 w-3.5" /> Lịch làm việc
            </TabsTrigger>
            <TabsTrigger value="bookings" className="gap-1.5 rounded-lg">
              <Users className="h-3.5 w-3.5" /> Lịch hẹn đặt
            </TabsTrigger>
            <TabsTrigger value="clients" className="gap-1.5 rounded-lg">
              <UserCircle2 className="h-3.5 w-3.5" /> Học viên của tôi
            </TabsTrigger>
          </TabsList>
          <TabsContent value="schedule" className="space-y-4 outline-none">
            <ScheduleManager trainerId={trainer.id} />
          </TabsContent>
          <TabsContent value="bookings" className="space-y-4 outline-none">
            <ClientBookings trainerId={trainer.id} />
          </TabsContent>
          <TabsContent value="clients" className="space-y-4 outline-none">
            <ClientsList trainerId={trainer.id} />
          </TabsContent>
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

// ---------------------------------------------------------------------------
// Schedule manager — default OPEN, click to CLOSE with a reason
// ---------------------------------------------------------------------------

type SlotState =
  | { kind: "past" }
  | { kind: "booked"; booking: PTBooking }
  | { kind: "dayOff"; dayOff: TrainerDayOff }
  | { kind: "closed"; closure: TrainerClosure }
  | { kind: "open" };

const QUICK_REASONS = [
  "Phòng tập đóng cửa",
  "Nghỉ phép cá nhân",
  "Nghỉ ốm",
  "Đào tạo bên ngoài",
  "Ngày nghỉ lễ",
] as const;

function ScheduleManager({ trainerId }: { trainerId: string }) {
  const { closures, close, reopen, reopenMany } = useTrainerClosures(trainerId);
  const { daysOff, setDayOff, removeDayOff } = useTrainerDaysOff(trainerId);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date()),
  );

  // Close-slot dialog state
  const [closing, setClosing] = useState<{ date: string; time: string } | null>(
    null,
  );
  const [editing, setEditing] = useState<TrainerClosure | null>(null);
  const [reasonDraft, setReasonDraft] = useState("");

  // Days-off bulk dialog
  const [daysOffOpen, setDaysOffOpen] = useState(false);
  const [daysOffSelected, setDaysOffSelected] = useState<Set<string>>(new Set());
  const [daysOffReason, setDaysOffReason] = useState("");

  // Live-refresh on booking changes from elsewhere (customers booking).
  const [bookingsTick, setBookingsTick] = useState(0);
  useEffect(() => {
    const sync = () => setBookingsTick((t) => t + 1);
    window.addEventListener("storage", sync);
    window.addEventListener(BOOKINGS_EVT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(BOOKINGS_EVT, sync);
    };
  }, []);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);
  const bookings = useMemo(() => getBookings(trainerId), [trainerId, bookingsTick]);

  const closureMap = useMemo(() => {
    const map = new Map<string, TrainerClosure>();
    for (const c of closures) map.set(`${c.date}_${c.time}`, c);
    return map;
  }, [closures]);

  const bookingMap = useMemo(() => {
    const map = new Map<string, PTBooking>();
    for (const b of bookings) map.set(`${b.date}_${b.time}`, b);
    return map;
  }, [bookings]);

  const dayOffMap = useMemo(() => {
    const map = new Map<string, TrainerDayOff>();
    for (const d of daysOff) map.set(d.date, d);
    return map;
  }, [daysOff]);

  function cellState(date: string, time: string, isPast: boolean): SlotState {
    if (isPast) return { kind: "past" };
    const k = `${date}_${time}`;
    const b = bookingMap.get(k);
    if (b) return { kind: "booked", booking: b };
    const off = dayOffMap.get(date);
    if (off) return { kind: "dayOff", dayOff: off };
    const c = closureMap.get(k);
    if (c) return { kind: "closed", closure: c };
    return { kind: "open" };
  }

  // Week-scoped sets
  const weekKeys = new Set(
    days.flatMap((d) => SCHEDULE_SLOTS.map((t) => `${d.iso}_${t}`)),
  );
  const totalFutureSlots = days.reduce(
    (n, d) => n + (d.isPast ? 0 : SCHEDULE_SLOTS.length),
    0,
  );
  const weekClosed = closures.filter((c) =>
    weekKeys.has(`${c.date}_${c.time}`),
  ).length;
  const weekBooked = bookings.filter((b) =>
    weekKeys.has(`${b.date}_${b.time}`),
  ).length;
  const weekDaysOff = daysOff.filter((d) =>
    days.some((day) => day.iso === d.date && !day.isPast),
  );
  const weekDaysOffSlots = weekDaysOff.reduce((n, d) => {
    const day = days.find((x) => x.iso === d.date);
    if (!day || day.isPast) return n;
    const bookedOnDay = bookings.filter((b) => b.date === d.date).length;
    return n + SCHEDULE_SLOTS.length - bookedOnDay;
  }, 0);
  const weekOpen = Math.max(
    0,
    totalFutureSlots - weekClosed - weekBooked - weekDaysOffSlots,
  );

  // Per-day counts for column header chips
  const perDay = days.map((d) => ({
    closed: closures.filter((c) => c.date === d.iso).length,
    booked: bookings.filter((b) => b.date === d.iso).length,
    dayOff: !!dayOffMap.get(d.iso),
  }));

  const shiftWeek = (delta: number) => {
    const x = new Date(weekStart);
    x.setDate(x.getDate() + delta * 7);
    setWeekStart(x);
  };

  const weekLabel = `${days[0].day} Thg ${days[0].iso.slice(5, 7)} – ${days[6].day} Thg ${days[6].iso.slice(5, 7)}`;

  const handleCellClick = (
    date: string,
    time: string,
    state: SlotState,
  ) => {
    if (state.kind === "past") return;
    if (state.kind === "booked") {
      toast.info(
        `Đã đặt lịch · ${date} ${time}–${addMinutes(time, SESSION_LEN_MIN)}`,
        { description: "Khung giờ này đã được học viên đặt chỗ." }
      );
      return;
    }
    if (state.kind === "dayOff") {
      toast.info(
        `Ngày nghỉ · ${new Date(date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "short" })}`,
        {
          description: `${state.dayOff.reason} — vui lòng xóa ngày nghỉ để cập nhật từng khung giờ.`,
        }
      );
      return;
    }
    if (state.kind === "closed") {
      // One-tap reopen
      reopen(state.closure.id);
      toast.success(`Đã mở lại khung giờ ${time}–${addMinutes(time, SESSION_LEN_MIN)}`);
      return;
    }
    // open → ask for a reason before closing
    setClosing({ date, time });
    setReasonDraft("");
  };

  const reopenAllWeek = () => {
    const targets = closures.filter((c) =>
      weekKeys.has(`${c.date}_${c.time}`),
    );
    if (targets.length === 0) {
      toast.info("Không có khung giờ nào đang bị đóng trong tuần này.");
      return;
    }
    reopenMany((c) => weekKeys.has(`${c.date}_${c.time}`));
    toast.success(`Đã mở lại ${targets.length} khung giờ.`);
  };

  const commitClose = () => {
    if (!closing) return;
    const reason = reasonDraft.trim();
    if (!reason) {
      toast.error("Vui lòng điền lý do đóng khung giờ để học viên được biết.");
      return;
    }
    close(trainerId, closing.date, closing.time, reason);
    toast.success(`Đã đóng khung giờ ${closing.time}–${addMinutes(closing.time, SESSION_LEN_MIN)}`);
    setClosing(null);
    setReasonDraft("");
  };

  const commitEditReason = () => {
    if (!editing) return;
    const reason = reasonDraft.trim();
    if (!reason) {
      toast.error("Lý do đóng không được để trống.");
      return;
    }
    close(trainerId, editing.date, editing.time, reason);
    toast.success("Cập nhật thành công.");
    setEditing(null);
    setReasonDraft("");
  };

  const toggleDayOff = (iso: string) => {
    setDaysOffSelected((prev) => {
      const next = new Set(prev);
      if (next.has(iso)) next.delete(iso);
      else next.add(iso);
      return next;
    });
  };

  const commitDaysOff = () => {
    const reason = daysOffReason.trim();
    if (daysOffSelected.size === 0) {
      toast.error("Vui lòng chọn ít nhất một ngày.");
      return;
    }
    if (!reason) {
      toast.error("Vui lòng điền lý do nghỉ để học viên được biết.");
      return;
    }
    let bookedDays = 0;
    for (const iso of daysOffSelected) {
      const hasBooking = bookings.some((b) => b.date === iso);
      if (hasBooking) {
        bookedDays++;
        continue;
      }
      setDayOff(trainerId, iso, reason);
    }
    const lockedCount = daysOffSelected.size - bookedDays;
    if (lockedCount > 0) {
      toast.success(`Đã khóa lịch ${lockedCount} ngày nghỉ.`);
    }
    if (bookedDays > 0) {
      toast.error(`${bookedDays} ngày bị bỏ qua do đã có lịch hẹn đặt trước.`);
    }
    setDaysOffOpen(false);
    setDaysOffSelected(new Set());
    setDaysOffReason("");
  };

  return (
    <div className="space-y-4">
      {/* Stat strip */}
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Giờ rảnh trong tuần"
          value={String(weekOpen)}
          hint="Học viên có thể đăng ký"
        />
        <StatCard
          label="Giờ đã được đặt"
          value={String(weekBooked)}
          hint="Học viên đã xác nhận lịch"
        />
        <StatCard
          label="Giờ tạm đóng"
          value={String(weekClosed)}
          hint="Trainer bận hoặc tạm đóng"
        />
      </div>

      <Card className="border-primary/10 shadow-card">
        <CardContent className="space-y-5 p-5">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="inline-flex items-center gap-2 text-lg font-bold text-[#4F8A74]">
                <CalIcon className="h-4 w-4" /> Tuần · {weekLabel}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Tất cả khung giờ mặc định mở · Click vào khung giờ để tạm đóng · <span className="font-semibold text-slate-800">1h30 phút</span> mỗi ca tập.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => shiftWeek(-1)}
                aria-label="Tuần trước"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setWeekStart(startOfWeek(new Date()))}
              >
                Hiện tại
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => shiftWeek(1)}
                aria-label="Tuần sau"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Legend and actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-gradient-to-r from-emerald-500 to-teal-600" />
                Giờ rảnh (Open)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded border border-dashed border-red-200 bg-red-50" />
                Tạm đóng (Closed)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-3 w-3 rounded bg-emerald-50 ring-1 ring-emerald-500/30" />
                Đã đặt (Booked)
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Lock className="h-3 w-3 text-slate-400" /> Đã qua
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="gap-1.5 bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  setDaysOffSelected(new Set());
                  setDaysOffReason("");
                  setDaysOffOpen(true);
                }}
              >
                <Ban className="h-3.5 w-3.5" /> Báo ngày nghỉ phép
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5"
                onClick={reopenAllWeek}
              >
                <RotateCcw className="h-3.5 w-3.5" /> Mở lại cả tuần
              </Button>
            </div>
          </div>

          {/* Weekly grid */}
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <div className="min-w-[760px]">
              {/* Header row */}
              <div className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-border bg-slate-50/50">
                <div className="px-3 py-3 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center">
                  Giờ
                </div>
                {days.map((d, i) => {
                  const counts = perDay[i];
                  return (
                    <div
                      key={d.iso}
                      className={`px-2 py-3 text-center ${d.isPast ? "opacity-50" : ""} ${
                        d.isToday ? "bg-[#4F8A74]/5" : ""
                      }`}
                    >
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold">
                        {d.weekday}
                      </div>
                      <div
                        className={`mt-0.5 inline-flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-sm font-bold ${
                          d.isToday ? "bg-[#4F8A74] text-white" : "text-slate-800"
                        }`}
                      >
                        {d.day}
                      </div>
                      <div className="mt-1 flex items-center justify-center gap-1">
                        {counts.booked > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-1.5 py-0.5 text-[9px] font-bold text-emerald-800">
                            <Users className="h-2 w-2" />
                            {counts.booked}
                          </span>
                        )}
                        {counts.closed > 0 && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-1.5 py-0.5 text-[9px] font-bold text-red-800">
                            <Ban className="h-2 w-2" />
                            {counts.closed}
                          </span>
                        )}
                        {counts.dayOff && (
                          <button
                            onClick={() => {
                              const off = dayOffMap.get(d.iso);
                              if (off) {
                                removeDayOff(off.id);
                                toast.success("Đã xóa ngày nghỉ phép.");
                              }
                            }}
                            className="inline-flex items-center gap-1 rounded-full bg-slate-200 px-1.5 py-0.5 text-[9px] font-bold text-slate-700 hover:bg-slate-300"
                            title="Xóa ngày nghỉ phép"
                          >
                            <Lock className="h-2 w-2" />
                            Nghỉ
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Slot rows */}
              {SCHEDULE_SLOTS.map((slot) => (
                <div
                  key={slot}
                  className="grid grid-cols-[72px_repeat(7,1fr)] border-b border-slate-100 last:border-b-0"
                >
                  <div className="px-3 py-3 text-xs font-semibold text-slate-500 flex flex-col justify-center">
                    <div>{slot}</div>
                    <div className="text-[9px] font-normal opacity-70">
                      – {addMinutes(slot, SESSION_LEN_MIN)}
                    </div>
                  </div>
                  {days.map((d) => {
                    const state = cellState(d.iso, slot, d.isPast);
                    return (
                      <div
                        key={`${d.iso}_${slot}`}
                        className={`p-1.5 ${d.isToday ? "bg-[#4F8A74]/[0.02]" : ""}`}
                      >
                        <SlotCell
                          state={state}
                          onClick={() => handleCellClick(d.iso, slot, state)}
                          onEditReason={
                            state.kind === "closed"
                              ? () => {
                                  setEditing(state.closure);
                                  setReasonDraft(state.closure.reason);
                                }
                              : undefined
                          }
                          dateLabel={`${d.weekday} ${d.day} · ${slot}`}
                        />
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Week summary lists */}
          {(weekClosed > 0 || weekBooked > 0) && (
            <div className="grid gap-4 md:grid-cols-2 pt-2">
              {weekBooked > 0 && (
                <div className="rounded-2xl border border-emerald-100 bg-emerald-50/20 p-4">
                  <h3 className="text-sm font-bold inline-flex items-center gap-2 text-emerald-950">
                    <Users className="h-4 w-4 text-emerald-600" /> Đã đặt trong tuần
                  </h3>
                  <ul className="mt-3 space-y-1.5">
                    {bookings
                      .filter((b) => weekKeys.has(`${b.date}_${b.time}`))
                      .sort((a, b) =>
                        (a.date + a.time).localeCompare(b.date + b.time),
                      )
                      .map((b) => {
                        const d = days.find((x) => x.iso === b.date)!;
                        return (
                          <li
                            key={b.id}
                            className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs shadow-sm border border-slate-100"
                          >
                            <span className="font-semibold text-slate-700">
                              {d.weekday} {d.day} Thg {d.iso.slice(5, 7)}
                            </span>
                            <span className="font-mono text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                              {b.time} – {addMinutes(b.time, SESSION_LEN_MIN)}
                            </span>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
              {weekClosed > 0 && (
                <div className="rounded-2xl border border-red-100 bg-red-50/20 p-4">
                  <h3 className="text-sm font-bold inline-flex items-center gap-2 text-red-950">
                    <Ban className="h-4 w-4 text-red-600" /> Tạm đóng trong tuần
                  </h3>
                  <ul className="mt-3 space-y-1.5">
                    {closures
                      .filter((c) => weekKeys.has(`${c.date}_${c.time}`))
                      .sort((a, b) =>
                        (a.date + a.time).localeCompare(b.date + b.time),
                      )
                      .map((c) => {
                        const d = days.find((x) => x.iso === c.date)!;
                        return (
                          <li
                            key={c.id}
                            className="flex items-center justify-between gap-2 rounded-lg bg-white px-3 py-2 text-xs shadow-sm border border-slate-100"
                          >
                            <div className="min-w-0 flex-1">
                              <div className="font-semibold text-slate-700">
                                {d.weekday} {d.day} Thg {d.iso.slice(5, 7)} · {c.time}–
                                {addMinutes(c.time, SESSION_LEN_MIN)}
                              </div>
                              <div className="mt-0.5 truncate text-slate-500 italic">
                                {c.reason}
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                reopen(c.id);
                                toast.success("Đã mở lại khung giờ.");
                              }}
                              className="rounded p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
                              aria-label="Mở lại khung giờ"
                              title="Mở lại khung giờ"
                            >
                              <RotateCcw className="h-3.5 w-3.5" />
                            </button>
                          </li>
                        );
                      })}
                  </ul>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Close-slot dialog (asks for reason) */}
      <Dialog
        open={!!closing}
        onOpenChange={(o) => {
          if (!o) {
            setClosing(null);
            setReasonDraft("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tạm đóng khung giờ này</DialogTitle>
          </DialogHeader>
          {closing && (
            <div className="grid gap-4">
              <div className="rounded-lg border border-border bg-slate-50 p-3 text-sm">
                <div className="font-bold text-slate-800">
                  {new Date(closing.date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {closing.time} – {addMinutes(closing.time, SESSION_LEN_MIN)} · 1h30 phút
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold text-slate-600">
                  Lý do tạm đóng khung giờ là gì?
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReasonDraft(r)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        reasonDraft === r
                          ? "border-[#4F8A74] bg-[#4F8A74]/10 text-[#4F8A74] font-semibold"
                          : "border-border hover:bg-secondary text-slate-600"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={3}
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                  placeholder="Ví dụ: Nghỉ phép, đi công tác, phòng tập bảo trì..."
                  className="mt-1"
                />
                <p className="text-[10px] text-muted-foreground">
                  Học viên sẽ thấy lý do này khi tìm lịch hẹn tập của bạn.
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setClosing(null);
                setReasonDraft("");
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={commitClose}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              <Ban className="mr-2 h-4 w-4" /> Đóng khung giờ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit-reason dialog */}
      <Dialog
        open={!!editing}
        onOpenChange={(o) => {
          if (!o) {
            setEditing(null);
            setReasonDraft("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Lý do tạm đóng</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="grid gap-4">
              <div className="rounded-lg border border-border bg-slate-50 p-3 text-sm">
                <div className="font-bold text-slate-800">
                  {new Date(editing.date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {editing.time} – {addMinutes(editing.time, SESSION_LEN_MIN)} · 1h30 phút
                </div>
              </div>
              <div className="grid gap-2">
                <Label className="text-xs font-semibold text-slate-600">
                  Lý do
                </Label>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_REASONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setReasonDraft(r)}
                      className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                        reasonDraft === r
                          ? "border-[#4F8A74] bg-[#4F8A74]/10 text-[#4F8A74] font-semibold"
                          : "border-border hover:bg-secondary text-slate-600"
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
                <Textarea
                  rows={3}
                  value={reasonDraft}
                  onChange={(e) => setReasonDraft(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="ghost"
              className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 px-2"
              onClick={() => {
                if (!editing) return;
                reopen(editing.id);
                setEditing(null);
                setReasonDraft("");
                toast.success("Đã mở lại khung giờ.");
              }}
            >
              <RotateCcw className="mr-2 h-4 w-4" /> Mở lại khung giờ
            </Button>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => {
                  setEditing(null);
                  setReasonDraft("");
                }}
              >
                Hủy
              </Button>
              <Button onClick={commitEditReason} className="bg-[#4F8A74] hover:bg-[#3f6e5d] text-white">Lưu thay đổi</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Days-off bulk dialog */}
      <Dialog
        open={daysOffOpen}
        onOpenChange={(o) => {
          if (!o) {
            setDaysOffOpen(false);
            setDaysOffSelected(new Set());
            setDaysOffReason("");
          }
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Khai báo nghỉ phép · {weekLabel}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <Label className="text-xs font-semibold text-slate-600">
                Chọn những ngày bạn muốn nghỉ phép trong tuần này
              </Label>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mt-1">
                {days.map((d) => {
                  const checked = daysOffSelected.has(d.iso);
                  return (
                    <label
                      key={d.iso}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2.5 text-sm transition-colors ${
                        d.isPast
                          ? "cursor-not-allowed opacity-50 bg-slate-50 border-slate-200"
                          : checked
                            ? "border-[#4F8A74] bg-[#4F8A74]/5"
                            : "border-border hover:bg-secondary"
                      }`}
                    >
                      <Checkbox
                        checked={checked}
                        disabled={d.isPast}
                        onCheckedChange={() => toggleDayOff(d.iso)}
                      />
                      <div className="leading-tight">
                        <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                          {d.weekday}
                        </div>
                        <div className="font-bold text-slate-700">
                          {d.day} Thg {d.iso.slice(5, 7)}
                        </div>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="grid gap-2">
              <Label className="text-xs font-semibold text-slate-600">
                Lý do nghỉ phép
              </Label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setDaysOffReason(r)}
                    className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                      daysOffReason === r
                        ? "border-[#4F8A74] bg-[#4F8A74]/10 text-[#4F8A74] font-semibold"
                        : "border-border hover:bg-secondary text-slate-600"
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
              <Textarea
                rows={3}
                value={daysOffReason}
                onChange={(e) => setDaysOffReason(e.target.value)}
                placeholder="Ví dụ: Đi du lịch, có việc gia đình, đi học..."
                className="mt-1"
              />
              <p className="text-[10px] text-muted-foreground">
                Tất cả các khung giờ tự do trong ngày được chọn sẽ tự động chuyển sang tạm đóng. Lịch đã có học viên đặt trước sẽ không bị ảnh hưởng.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => {
                setDaysOffOpen(false);
                setDaysOffSelected(new Set());
                setDaysOffReason("");
              }}
            >
              Hủy
            </Button>
            <Button
              onClick={commitDaysOff}
              className="bg-red-600 hover:bg-red-700 text-white animate-pulse"
            >
              <Ban className="mr-2 h-4 w-4" /> Xác nhận nghỉ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ---------------------------------------------------------------------------
// One cell — open / closed / booked / past
// ---------------------------------------------------------------------------

function SlotCell({
  state,
  onClick,
  onEditReason,
  dateLabel,
}: {
  state: SlotState;
  onClick: () => void;
  onEditReason?: () => void;
  dateLabel: string;
}) {
  if (state.kind === "past") {
    return (
      <button
        disabled
        className="flex h-14 w-full items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50/50 text-slate-400"
        title={`${dateLabel} · Đã qua`}
      >
        <Lock className="h-3.5 w-3.5 opacity-60" />
      </button>
    );
  }

  if (state.kind === "booked") {
    return (
      <button
        onClick={onClick}
        className="relative flex h-14 w-full flex-col items-center justify-center rounded-lg border border-emerald-500/20 bg-emerald-50 px-1 text-[11px] font-bold text-emerald-800 shadow-sm transition hover:bg-emerald-100"
        title={`${dateLabel} · Đã đặt`}
      >
        <Users className="h-4 w-4 text-emerald-600" />
        <span className="mt-0.5 text-[8px] uppercase tracking-wide font-extrabold text-emerald-700">
          ĐÃ ĐẶT LỊCH
        </span>
      </button>
    );
  }

  if (state.kind === "dayOff") {
    return (
      <button
        disabled
        className="flex h-14 w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-100 px-1 text-[11px] font-semibold text-slate-500 cursor-not-allowed"
        title={`${dateLabel} · Nghỉ phép — ${state.dayOff.reason}`}
      >
        <Lock className="h-3.5 w-3.5 text-slate-400" />
        <span className="mt-0.5 max-w-full truncate px-1 text-[8px] font-bold uppercase tracking-wide">
          NGHỈ PHÉP
        </span>
      </button>
    );
  }

  if (state.kind === "closed") {
    return (
      <motion.div
        layout
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="relative h-14 w-full"
      >
        <button
          onClick={onClick}
          className="group relative flex h-full w-full flex-col items-center justify-center rounded-lg border border-dashed border-red-300 bg-red-50 px-1 text-[11px] font-semibold text-red-700 transition hover:bg-red-100"
          title={`${dateLabel} · Tạm đóng — ${state.closure.reason} (Click để mở lại)`}
        >
          <Ban className="h-3.5 w-3.5 text-red-500" />
          <span className="mt-0.5 max-w-full truncate px-1 text-[8px] font-bold uppercase tracking-wide opacity-80">
            TẠM ĐÓNG
          </span>
        </button>
        {onEditReason && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditReason();
            }}
            className="absolute right-1 top-1 hidden rounded bg-white p-0.5 text-slate-500 shadow-sm border transition group-hover:block hover:bg-slate-50"
            aria-label="Sửa lý do"
            title="Sửa lý do"
          >
            <X className="h-2.5 w-2.5 rotate-45" />
          </button>
        )}
      </motion.div>
    );
  }

  // open → default state, click to close
  return (
    <button
      onClick={onClick}
      className="flex h-14 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-emerald-500/30 bg-transparent px-1 text-[11px] font-bold text-[#4F8A74] hover:bg-emerald-50/30 transition shadow-sm"
      title={`${dateLabel} · Giờ rảnh`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F8A74] text-white shadow-sm">
        <CheckCircle2 className="h-3 w-3" />
      </span>
      <span className="text-[8px] uppercase tracking-wide font-extrabold text-[#4F8A74]/90">Giờ rảnh</span>
    </button>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card className="shadow-sm border-slate-100 hover:border-primary/20 transition-all bg-white/70 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
          {label}
        </div>
        <div className="mt-1 text-2xl font-black text-slate-800">{value}</div>
        {hint && (
          <div className="mt-0.5 text-[10px] text-slate-500 italic">{hint}</div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Client bookings — list, mark complete, cancel, note
// ---------------------------------------------------------------------------

function useBookingsTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    window.addEventListener(BOOKINGS_EVT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(BOOKINGS_EVT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);
  return tick;
}

function bookingDateTime(b: PTBooking) {
  return new Date(`${b.date}T${b.time}:00`);
}

function ClientBookings({ trainerId }: { trainerId: string }) {
  const tick = useBookingsTick();
  const bookings = useMemo(() => getBookings(trainerId), [trainerId, tick]);

  const [filter, setFilter] = useState<"upcoming" | "past" | "all">("upcoming");
  const [query, setQuery] = useState("");
  const [editingNote, setEditingNote] = useState<PTBooking | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const now = Date.now();

  const enriched = bookings.map((b) => ({
    ...b,
    when: bookingDateTime(b),
    isPast: bookingDateTime(b).getTime() < now,
  }));

  const filtered = enriched
    .filter((b) => {
      if (filter === "upcoming") return !b.isPast && b.status !== "cancelled";
      if (filter === "past") return b.isPast || b.status === "cancelled" || b.status === "completed";
      return true;
    })
    .filter((b) => {
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        (b.customerName ?? "").toLowerCase().includes(q) ||
        (b.customerEmail ?? "").toLowerCase().includes(q) ||
        (b.customerPhone ?? "").toLowerCase().includes(q)
      );
    })
    .sort((a, b) => a.when.getTime() - b.when.getTime());

  const upcomingCount = enriched.filter((b) => !b.isPast && b.status !== "cancelled").length;
  const completedCount = enriched.filter((b) => b.status === "completed").length;
  const cancelledCount = enriched.filter((b) => b.status === "cancelled").length;

  const markComplete = (b: PTBooking) => {
    updateBooking(b.id, { status: "completed" });
    toast.success("Đã ghi nhận buổi tập hoàn thành.");
  };

  const saveNote = () => {
    if (!editingNote) return;
    updateBooking(editingNote.id, { note: noteDraft.trim() });
    setEditingNote(null);
    setNoteDraft("");
    toast.success("Đã lưu nhận xét buổi tập.");
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Sắp diễn ra" value={String(upcomingCount)} hint="Buổi tập đã đặt trước" />
        <StatCard label="Đã hoàn thành" value={String(completedCount)} hint="Được đánh dấu hoàn tất" />
        <StatCard label="Đã hủy" value={String(cancelledCount)} hint="Học viên hoặc hệ thống hủy" />
      </div>

      <Card className="border-primary/10 shadow-card bg-white/70 backdrop-blur-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-1 rounded-lg border bg-slate-100/50 p-1">
              {(["upcoming", "past", "all"] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`rounded-md px-3 py-1 text-xs font-bold capitalize transition-colors ${
                    filter === f
                      ? "bg-white text-slate-800 shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {f === "upcoming" ? "Sắp tới" : f === "past" ? "Đã qua" : "Tất cả"}
                </button>
              ))}
            </div>
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Tìm theo tên học viên, email, SĐT..."
              className="w-full sm:max-w-xs"
            />
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-8 text-center text-sm text-slate-400">
              Không tìm thấy lịch hẹn tập nào.
            </div>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-100 bg-white">
              {filtered.map((b) => (
                <li key={b.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    {b.customerAvatar ? (
                      <img
                        src={b.customerAvatar}
                        alt={b.customerName ?? "Học viên"}
                        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-slate-100 shadow-sm"
                      />
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold shadow-inner">
                        {(b.customerName ?? "G").slice(0, 1).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="truncate text-sm font-bold text-slate-800">
                          {b.customerName ?? "Khách vãng lai"}
                        </span>
                        <BookingStatusBadge status={b.status ?? "confirmed"} isPast={b.isPast} />
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-medium text-slate-400">
                        {b.customerEmail && (
                          <span className="inline-flex items-center gap-1">
                            <Mail className="h-3 w-3" /> {b.customerEmail}
                          </span>
                        )}
                        {b.customerPhone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3 w-3" /> {b.customerPhone}
                          </span>
                        )}
                      </div>
                      {b.note && (
                        <div className="mt-1.5 inline-flex items-start gap-1 rounded-md bg-slate-50 border border-slate-100 px-2 py-1 text-[11px] text-slate-500">
                          <StickyNote className="mt-0.5 h-3 w-3 shrink-0 text-slate-400" />
                          <span className="whitespace-pre-wrap">{b.note}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="shrink-0 text-right min-w-[100px]">
                    <div className="text-sm font-bold text-slate-800">
                      {b.when.toLocaleDateString("vi-VN", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                      })}
                    </div>
                    <div className="text-xs font-mono font-bold text-emerald-600 mt-0.5 bg-emerald-50 px-2 py-0.5 rounded inline-block">
                      {b.time}
                    </div>
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        onClick={() => {
                          setEditingNote(b);
                          setNoteDraft(b.note ?? "");
                        }}
                      >
                        <StickyNote className="mr-2 h-4 w-4" /> Ghi chú buổi học
                      </DropdownMenuItem>
                      {b.status !== "completed" && b.status !== "cancelled" && (
                        <DropdownMenuItem onClick={() => markComplete(b)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                          <CheckCircle2 className="mr-2 h-4 w-4" /> Hoàn thành buổi học
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={!!editingNote}
        onOpenChange={(o) => {
          if (!o) {
            setEditingNote(null);
            setNoteDraft("");
          }
        }}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nhận xét / Ghi chú buổi học</DialogTitle>
          </DialogHeader>
          {editingNote && (
            <div className="grid gap-3">
              <div className="rounded-lg border bg-slate-50 p-3 text-sm">
                <div className="font-bold text-slate-800">{editingNote.customerName ?? "Khách vãng lai"}</div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {new Date(editingNote.date).toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}{" "}
                  · {editingNote.time}
                </div>
              </div>
              <Textarea
                rows={5}
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Điền các mục tiêu ca tập, chấn thương nếu có, bài tập trọng tâm, mức tạ, đánh giá của bạn..."
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingNote(null)}>
              Hủy
            </Button>
            <Button onClick={saveNote} className="bg-[#4F8A74] hover:bg-[#3f6e5d] text-white">Lưu ghi chú</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingStatusBadge({
  status,
  isPast,
}: {
  status: "confirmed" | "completed" | "cancelled";
  isPast: boolean;
}) {
  if (status === "completed") {
    return (
      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        Hoàn thành
      </Badge>
    );
  }
  if (status === "cancelled") {
    return (
      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 border border-red-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        Đã hủy
      </Badge>
    );
  }
  if (isPast) {
    return (
      <Badge variant="outline" className="text-slate-400 border-slate-200 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
        Đã qua
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-50 text-[#4F8A74] hover:bg-emerald-50 border border-emerald-500/10 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
      Chờ tập
    </Badge>
  );
}

// ---------------------------------------------------------------------------
// Clients — aggregated per-customer view derived from bookings
// ---------------------------------------------------------------------------

type ClientRow = {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  total: number;
  completed: number;
  upcoming: number;
  lastSession?: Date;
  nextSession?: Date;
};

function ClientsList({ trainerId }: { trainerId: string }) {
  const tick = useBookingsTick();
  const bookings = useMemo(() => getBookings(trainerId), [trainerId, tick]);
  const now = Date.now();

  const clients = useMemo<ClientRow[]>(() => {
    const map = new Map<string, ClientRow>();
    for (const b of bookings) {
      const id = b.customerId ?? b.customerEmail ?? b.customerName ?? "guest";
      const when = bookingDateTime(b);
      const existing = map.get(id) ?? {
        id,
        name: b.customerName ?? "Khách vãng lai",
        email: b.customerEmail,
        phone: b.customerPhone,
        avatar: b.customerAvatar,
        total: 0,
        completed: 0,
        upcoming: 0,
      };
      existing.total += 1;
      if (b.status === "completed") existing.completed += 1;
      if (when.getTime() >= now && b.status !== "cancelled") {
        existing.upcoming += 1;
        if (!existing.nextSession || when < existing.nextSession) {
          existing.nextSession = when;
        }
      } else {
        if (!existing.lastSession || when > existing.lastSession) {
          existing.lastSession = when;
        }
      }
      map.set(id, existing);
    }
    return [...map.values()].sort((a, b) => b.total - a.total);
  }, [bookings, now]);

  if (clients.length === 0) {
    return (
      <Card className="border-slate-100 shadow-card bg-white/70 backdrop-blur-sm">
        <CardContent className="p-8 text-center text-sm text-slate-400">
          Chưa có học viên nào đặt lịch tập với bạn.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/10 shadow-card bg-white/70 backdrop-blur-sm overflow-hidden">
      <CardContent className="p-0">
        <ul className="divide-y divide-slate-100 bg-white">
          {clients.map((c) => (
            <li key={c.id} className="flex flex-wrap items-center gap-3 p-4 sm:flex-nowrap">
              {c.avatar ? (
                <img
                  src={c.avatar}
                  alt={c.name}
                  className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-slate-100 shadow-sm"
                />
              ) : (
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 text-sm font-bold shadow-inner">
                  {c.name.slice(0, 1).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold text-slate-800">{c.name}</div>
                <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[10px] font-medium text-slate-400">
                  {c.email && (
                    <span className="inline-flex items-center gap-1">
                      <Mail className="h-3 w-3" /> {c.email}
                    </span>
                  )}
                  {c.phone && (
                    <span className="inline-flex items-center gap-1">
                      <Phone className="h-3 w-3" /> {c.phone}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <div className="text-center min-w-[40px]">
                  <div className="text-base font-bold text-slate-800">{c.total}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    Tổng buổi
                  </div>
                </div>
                <div className="text-center min-w-[40px]">
                  <div className="text-base font-bold text-emerald-600">
                    {c.completed}
                  </div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    Đã tập
                  </div>
                </div>
                <div className="text-center min-w-[40px]">
                  <div className="text-base font-bold text-emerald-500">{c.upcoming}</div>
                  <div className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    Chờ tập
                  </div>
                </div>
              </div>
              <div className="hidden text-right text-[10px] text-slate-400 font-medium sm:block min-w-[120px]">
                {c.nextSession && (
                  <div>
                    Sắp tới:{" "}
                    <span className="font-bold text-slate-700">
                      {c.nextSession.toLocaleDateString("vi-VN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                )}
                {c.lastSession && (
                  <div className="mt-0.5">
                    Buổi trước:{" "}
                    <span className="text-slate-600">
                      {c.lastSession.toLocaleDateString("vi-VN", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                  </div>
                )}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
