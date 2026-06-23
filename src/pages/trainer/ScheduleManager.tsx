import { useEffect, useMemo, useState } from "react";
import {
  Ban,
  Calendar as CalIcon,
  ChevronLeft,
  ChevronRight,
  Lock,
  RotateCcw,
  Users,
  CheckCircle2,
  X,
  Mail,
  Phone,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  SESSION_LEN_MIN,
  useTrainerClosures,
  useTrainerDaysOff,
  type TrainerClosure,
  type TrainerDayOff,
} from "@/lib/trainer-schedule-store";
import { type PTBooking } from "@/lib/pt-membership";
import { trainersApi } from "@/api/trainers";
import { Badge } from "@/components/ui/badge";

const SCHEDULE_SLOTS = [
  "05:00",
  "06:30",
  "08:00",
  "09:30",
  "11:00",
  "12:30",
  "13:00",
  "14:30",
  "16:00",
  "17:30",
  "19:00",
  "20:30",
];

type SlotState =
  | { kind: "past" }
  | { kind: "booked"; booking: PTBooking }
  | { kind: "dayOff"; dayOff: TrainerDayOff }
  | { kind: "closed"; closure: TrainerClosure }
  | { kind: "locked" }
  | { kind: "open" };

type DayCell = {
  iso: string;
  weekday: string;
  day: number;
  month: string;
  isPast: boolean;
  isToday: boolean;
};

const QUICK_REASONS = [
  "Phòng tập đóng cửa",
  "Nghỉ phép cá nhân",
  "Nghỉ ốm",
  "Đào tạo bên ngoài",
  "Ngày nghỉ lễ",
] as const;

function addMinutes(hhmm: string, mins: number) {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60)
    .toString()
    .padStart(2, "0");
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

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: any;
  color?: string;
}) {
  return (
    <Card className="relative overflow-hidden shadow-sm border border-slate-100 hover:border-[#4F8A74]/30 hover:shadow-md transition-all duration-300 bg-white/80 backdrop-blur-md rounded-2xl group">
      <div className={`absolute top-0 left-0 w-1.5 h-full ${color || "bg-[#4F8A74]"}`} />
      <CardContent className="p-5 flex items-center justify-between">
        <div className="space-y-1">
          <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            {label}
          </div>
          <div className="text-3xl font-black text-slate-800 tracking-tight">{value}</div>
          {hint && (
            <div className="text-[10px] text-slate-500 italic mt-0.5 group-hover:text-[#4F8A74] transition-colors">{hint}</div>
          )}
        </div>
        {Icon && (
          <div className={`p-3 rounded-2xl ${color === "bg-rose-500" ? "bg-rose-50 text-rose-600" : color === "bg-emerald-500" ? "bg-emerald-50 text-emerald-600" : "bg-teal-50 text-[#4F8A74]"} group-hover:scale-110 transition-transform duration-300`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

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

  if (state.kind === "locked") {
    return (
      <button
        disabled
        className="flex h-14 w-full items-center justify-center rounded-lg border border-dashed border-slate-100 bg-slate-50/20 text-slate-400 cursor-not-allowed"
        title={`${dateLabel} · Ngoài ca trực`}
      >
        <Lock className="h-3.5 w-3.5 opacity-30" />
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

  return (
    <button
      onClick={onClick}
      className="flex h-14 w-full flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-emerald-500/30 bg-transparent px-1 text-[11px] font-bold text-[#4F8A74] hover:bg-emerald-50/30 transition shadow-sm"
      title={`${dateLabel} · Giờ rảnh`}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#4F8A74] text-white shadow-sm">
        <CheckCircle2 className="h-3 w-3" />
      </span>
      <span className="text-[8px] uppercase tracking-wide font-extrabold text-[#4F8A74]/90">
        Giờ rảnh
      </span>
    </button>
  );
}

import { useOutletContext } from "react-router-dom";

export default function ScheduleManager() {
  const { trainer } = useOutletContext<any>();
  const trainerId = trainer.id;
  const { closures, close, reopen, reopenMany } = useTrainerClosures(trainerId);
  const { daysOff, setDayOff, removeDayOff } = useTrainerDaysOff(trainerId);
  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date()),
  );
  
  // Real DB state
  const [bookings, setBookings] = useState<PTBooking[]>([]);
  const [dbShifts, setDbShifts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForModal, setSelectedBookingForModal] = useState<PTBooking | null>(null);

  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(() => {
    const today = new Date().toISOString().slice(0, 10);
    const start = startOfWeek(new Date());
    const tempDays = Array.from({ length: 7 }).map((_, i) => {
      const x = new Date(start);
      x.setDate(start.getDate() + i);
      return x.toISOString().slice(0, 10);
    });
    const todayIdx = tempDays.indexOf(today);
    return todayIdx !== -1 ? todayIdx : 0;
  });

  const [closing, setClosing] = useState<{ date: string; time: string } | null>(
    null,
  );
  const [editing, setEditing] = useState<TrainerClosure | null>(null);
  const [reasonDraft, setReasonDraft] = useState("");

  const [daysOffOpen, setDaysOffOpen] = useState(false);
  const [daysOffSelected, setDaysOffSelected] = useState<Set<string>>(
    new Set(),
  );
  const [daysOffReason, setDaysOffReason] = useState("");

  const fetchData = async () => {
    try {
      setLoading(true);
      const startStr = weekStart.toISOString().slice(0, 10);
      const endStr = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
      
      const [scheduleRes, bookingsRes] = await Promise.all([
        trainersApi.getSchedule(trainerId, startStr, endStr),
        trainersApi.getTrainerBookings(),
      ]);
      
      setDbShifts(scheduleRes.data.data);
      
      const mappedBookings = bookingsRes.data.data.map((b: any) => ({
        id: String(b.id),
        trainerId: String(b.trainer_id),
        date: typeof b.date === 'string' ? b.date.slice(0, 10) : new Date(b.date).toISOString().slice(0, 10),
        time: b.time.slice(0, 5),
        status: b.status,
        customerName: b.user?.full_name || "Khách vãng lai",
        customerEmail: b.user?.email || "",
        customerPhone: b.user?.phone_number || "",
        customerAvatar: b.user?.avatar_url || "",
        note: b.note || "",
      }));
      setBookings(mappedBookings);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải lịch làm việc hoặc thông tin đặt hẹn.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [trainerId, weekStart]);

  const days = useMemo(() => weekDays(weekStart), [weekStart]);

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
    
    // Check if booked first
    const k = `${date}_${time}`;
    const b = bookingMap.get(k);
    if (b) return { kind: "booked", booking: b };
    
    // Check if this date has a shift in dbShifts
    const dayShift = dbShifts.find((s) => s.date === date);
    if (!dayShift) return { kind: "locked" };
    
    // Check if this slot is covered by the shift
    const matchedSlot = dayShift.slots.find((sl: any) => sl.start_time.slice(0, 5) === time);
    if (!matchedSlot) return { kind: "locked" };
    
    const off = dayOffMap.get(date);
    if (off) return { kind: "dayOff", dayOff: off };
    const c = closureMap.get(k);
    if (c) return { kind: "closed", closure: c };
    
    return { kind: "open" };
  }

  const weekKeys = new Set(
    days.flatMap((d) => SCHEDULE_SLOTS.map((t) => `${d.iso}_${t}`)),
  );
  
  // Tổng số slot của ca trực trong tương lai
  const totalFutureShiftSlots = dbShifts.reduce((acc, currentShift) => {
    const day = days.find(d => d.iso === currentShift.date);
    if (!day || day.isPast) return acc;
    return acc + currentShift.slots.length;
  }, 0);
  
  const weekClosed = closures.filter((c) =>
    weekKeys.has(`${c.date}_${c.time}`),
  ).length;
  
  const weekBooked = bookings.filter((b) =>
    weekKeys.has(`${b.date}_${b.time}`) && b.status === "confirmed",
  ).length;
  
  // A day off locks all slots on that day
  const weekDaysOff = daysOff.filter((d) =>
    days.some((day) => day.iso === d.date && !day.isPast),
  );
  
  const weekDaysOffSlots = weekDaysOff.reduce((n, d) => {
    const day = days.find((x) => x.iso === d.date);
    if (!day || day.isPast) return n;
    
    const dayShift = dbShifts.find((s) => s.date === d.date);
    if (!dayShift) return n;
    
    const bookedOnDay = bookings.filter((b) => b.date === d.date && b.status === "confirmed").length;
    return n + dayShift.slots.length - bookedOnDay;
  }, 0);

  const weekOpen = Math.max(
    0,
    totalFutureShiftSlots - weekClosed - weekBooked - weekDaysOffSlots,
  );

  const perDay = days.map((d, i) => {
    const dayShift = dbShifts.find((s) => s.date === d.iso);
    const daySlotsCount = dayShift ? dayShift.slots.length : 0;
    return {
      closed: closures.filter((c) => c.date === d.iso).length,
      booked: bookings.filter((b) => b.date === d.iso && b.status === "confirmed").length,
      dayOff: !!dayOffMap.get(d.iso),
    };
  });

  const shiftWeek = (delta: number) => {
    const x = new Date(weekStart);
    x.setDate(x.getDate() + delta * 7);
    setWeekStart(x);
  };

  const weekLabel = `${days[0].day} Thg ${days[0].iso.slice(5, 7)} – ${days[6].day} Thg ${days[6].iso.slice(5, 7)}`;

  const handleCellClick = (date: string, time: string, state: SlotState) => {
    if (state.kind === "past") return;
    if (state.kind === "booked") {
      setSelectedBookingForModal(state.booking);
      return;
    }
    if (state.kind === "dayOff") {
      toast.info(
        `Ngày nghỉ · ${new Date(date).toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "short" })}`,
        {
          description: `${state.dayOff.reason} — vui lòng xóa ngày nghỉ để cập nhật từng khung giờ.`,
        },
      );
      return;
    }
    if (state.kind === "closed") {
      reopen(state.closure.id);
      toast.success(
        `Đã mở lại khung giờ ${time}–${addMinutes(time, SESSION_LEN_MIN)}`,
      );
      return;
    }
    setClosing({ date, time });
    setReasonDraft("");
  };

  const reopenAllWeek = () => {
    const targets = closures.filter((c) => weekKeys.has(`${c.date}_${c.time}`));
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
    toast.success(
      `Đã đóng khung giờ ${closing.time}–${addMinutes(closing.time, SESSION_LEN_MIN)}`,
    );
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
      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard
          label="Giờ rảnh trong tuần"
          value={String(weekOpen)}
          hint="Học viên có thể đăng ký"
          icon={CheckCircle2}
          color="bg-[#4F8A74]"
        />
        <StatCard
          label="Giờ đã được đặt"
          value={String(weekBooked)}
          hint="Học viên đã xác nhận lịch"
          icon={Users}
          color="bg-emerald-500"
        />
        <StatCard
          label="Giờ tạm đóng"
          value={String(weekClosed)}
          hint="Trainer bận hoặc tạm đóng"
          icon={Ban}
          color="bg-rose-500"
        />
      </div>

      <Card className="border border-slate-100 shadow-md rounded-2xl bg-white/80 backdrop-blur-md">
        <CardContent className="space-y-5 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="inline-flex items-center gap-2 text-lg font-bold text-[#4F8A74]">
                <CalIcon className="h-4 w-4" /> Tuần · {weekLabel}
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Tất cả khung giờ mặc định mở · Click vào khung giờ để tạm đóng ·{" "}
                <span className="font-semibold text-slate-800">1h30 phút</span>{" "}
                mỗi ca tập.
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

          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto rounded-2xl border border-border bg-card">
            <div className="min-w-[760px]">
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
                          d.isToday
                            ? "bg-[#4F8A74] text-white"
                            : "text-slate-800"
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

          {/* Mobile view */}
          <div className="block md:hidden space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none snap-x border-b border-slate-100">
              {days.map((d, idx) => {
                const counts = perDay[idx];
                const isSelected = selectedDayIndex === idx;
                return (
                  <button
                    key={d.iso}
                    type="button"
                    onClick={() => setSelectedDayIndex(idx)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border min-w-[76px] snap-center transition-all ${
                      isSelected
                        ? "border-[#4F8A74] bg-[#4F8A74]/10 text-[#4F8A74] font-bold ring-2 ring-[#4F8A74]/20"
                        : d.isToday
                        ? "border-[#4F8A74]/50 bg-[#4F8A74]/5 text-slate-800"
                        : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                    } ${d.isPast ? "opacity-60" : ""}`}
                  >
                    <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                      {d.weekday}
                    </span>
                    <span className="text-sm font-extrabold mt-0.5">
                      {d.day}
                    </span>
                    <div className="mt-1 flex gap-1 justify-center">
                      {counts.booked > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" title="Đã đặt" />
                      )}
                      {counts.closed > 0 && (
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" title="Tạm đóng" />
                      )}
                      {counts.dayOff && (
                        <span className="h-1.5 w-1.5 rounded-full bg-slate-400" title="Nghỉ phép" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Mobile Slots list for active day */}
            <div className="space-y-3">
              {(() => {
                const activeDay = days[selectedDayIndex];
                return SCHEDULE_SLOTS.map((slot) => {
                  const state = cellState(activeDay.iso, slot, activeDay.isPast);
                  return (
                    <div
                      key={slot}
                      className={`flex items-center justify-between p-3 rounded-xl border bg-white shadow-sm gap-4 transition-all duration-200 ${
                        activeDay.isToday ? "border-[#4F8A74]/20 bg-[#4F8A74]/[0.01]" : "border-slate-100"
                      }`}
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-extrabold text-slate-700">{slot}</span>
                        <span className="text-[10px] text-muted-foreground font-semibold mt-0.5">
                          – {addMinutes(slot, SESSION_LEN_MIN)}
                        </span>
                      </div>
                      <div className="w-[130px] shrink-0">
                        <SlotCell
                          state={state}
                          onClick={() => handleCellClick(activeDay.iso, slot, state)}
                          onEditReason={
                            state.kind === "closed"
                              ? () => {
                                  setEditing(state.closure);
                                  setReasonDraft(state.closure.reason);
                                }
                              : undefined
                          }
                          dateLabel={`${activeDay.weekday} ${activeDay.day} · ${slot}`}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>
          </div>

          {weekClosed > 0 && (
            <div className="pt-2">
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
                              {d.weekday} {d.day} Thg {d.iso.slice(5, 7)} ·{" "}
                              {c.time}–{addMinutes(c.time, SESSION_LEN_MIN)}
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
            </div>
          )}
        </CardContent>
      </Card>

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
                  {closing.time} – {addMinutes(closing.time, SESSION_LEN_MIN)} ·
                  1h30 phút
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
                  {editing.time} – {addMinutes(editing.time, SESSION_LEN_MIN)} ·
                  1h30 phút
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
              <Button
                onClick={commitEditReason}
                className="bg-[#4F8A74] hover:bg-[#3f6e5d] text-white"
              >
                Lưu thay đổi
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
                Tất cả các khung giờ tự do trong ngày được chọn sẽ tự động
                chuyển sang tạm đóng. Lịch đã có học viên đặt trước sẽ không bị
                ảnh hưởng.
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

      {selectedBookingForModal && (
        <Dialog
          open={!!selectedBookingForModal}
          onOpenChange={(o) => {
            if (!o) setSelectedBookingForModal(null);
          }}
        >
          <DialogContent className="max-w-md bg-white">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-slate-800">Chi tiết lịch đặt hẹn</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 mt-2">
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/20 p-3 text-sm flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-800">
                    {new Date(selectedBookingForModal.date).toLocaleDateString("vi-VN", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                    })}
                  </div>
                  <div className="text-xs text-[#4F8A74] mt-0.5 font-semibold">
                    {selectedBookingForModal.time} – {addMinutes(selectedBookingForModal.time, SESSION_LEN_MIN)} · 1h30 phút
                  </div>
                </div>
                <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-emerald-200">
                  Đã xác nhận
                </Badge>
              </div>
              
              <div className="space-y-2">
                <Label className="text-xs font-semibold text-slate-600">Thông tin học viên</Label>
                <div className="flex items-center gap-3 rounded-lg border p-3 bg-white">
                  {selectedBookingForModal.customerAvatar ? (
                    <img
                      src={selectedBookingForModal.customerAvatar}
                      alt={selectedBookingForModal.customerName}
                      className="h-10 w-10 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 font-bold">
                      {selectedBookingForModal.customerName?.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="font-bold text-slate-800 truncate">{selectedBookingForModal.customerName}</div>
                    <div className="flex flex-col gap-0.5 mt-0.5 text-xs text-slate-500">
                      <div className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" /> {selectedBookingForModal.customerEmail}</div>
                      <div className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" /> {selectedBookingForModal.customerPhone}</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedBookingForModal.note && (
                <div className="space-y-1">
                  <Label className="text-xs font-semibold text-slate-600">Ghi chú buổi học</Label>
                  <div className="rounded-lg border p-3 bg-slate-50 text-xs text-slate-600 italic whitespace-pre-wrap">
                    {selectedBookingForModal.note}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setSelectedBookingForModal(null)} className="bg-[#4F8A74] hover:bg-[#3f6e5d] text-white">
                Đóng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
