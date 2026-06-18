import React from "react";
import {
  Sun,
  Sunset,
  Moon,
  Ban,
  Lock,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { type TrainerScheduleShift } from "@/api/trainers";

const SCHEDULE_SLOTS = [
  "06:00",
  "07:30",
  "09:00",
  "10:30",
  "12:00",
  "13:30",
  "15:00",
  "16:30",
  "18:00",
  "19:30",
] as const;

const SESSION_LEN_MIN = 90;

const getLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
};

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseTimeToMinutes = (timeStr: string | null | undefined): number => {
  if (!timeStr) return 0;
  const parts = timeStr.split(":");
  const h = Number(parts[0] || 0);
  const m = Number(parts[1] || 0);
  return h * 60 + m;
};

const addMinutes = (hhmm: string, mins: number): string => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = h * 60 + m + mins;
  const nh = Math.floor(total / 60).toString().padStart(2, "0");
  const nm = (total % 60).toString().padStart(2, "0");
  return `${nh}:${nm}`;
};

const isSlotInShift = (slotTime: string, shiftStartStr: string | null | undefined, shiftEndStr: string | null | undefined): boolean => {
  if (!shiftStartStr || !shiftEndStr) return false;
  const slotStart = parseTimeToMinutes(slotTime);
  const slotEnd = slotStart + 90; // 1 hour 30 mins = 90 mins
  const shiftStart = parseTimeToMinutes(shiftStartStr);
  const shiftEnd = parseTimeToMinutes(shiftEndStr);
  return slotStart >= shiftStart && slotEnd <= shiftEnd;
};

const isSlotPast = (dateStr: string, slotTime: string): boolean => {
  try {
    const now = new Date();
    const d = getLocalDate(dateStr);
    const [h, m] = slotTime.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d < now;
  } catch {
    return false;
  }
};

export interface TrainerScheduleProps {
  trainerId: string;
  schedule: TrainerScheduleShift[];
  scheduleLoading: boolean;
  weekStart: Date;
  setWeekStart: React.Dispatch<React.SetStateAction<Date>>;
  selectedDay: string;
  setSelectedDay: React.Dispatch<React.SetStateAction<string>>;
  daysOff: any[];
  bookings: any[];
  closures: any[];
  handleBookSlot: (date: string, slot: string) => void;
}

export function TrainerSchedule({
  trainerId,
  schedule,
  scheduleLoading,
  weekStart,
  setWeekStart,
  selectedDay,
  setSelectedDay,
  daysOff,
  bookings,
  closures,
  handleBookSlot,
}: TrainerScheduleProps) {
  if (scheduleLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-10 bg-slate-100 rounded-xl w-1/3" />
        <div className="grid grid-cols-7 gap-2">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 bg-slate-100 rounded-2xl" />
          ))}
        </div>
        <div className="h-40 bg-slate-100 rounded-2xl" />
      </div>
    );
  }

  // Group by date
  const groupedSchedule = schedule.reduce((acc: Record<string, TrainerScheduleShift[]>, item) => {
    const dateKey = item.date.split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(item);
    return acc;
  }, {});

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = formatLocalDate(d);
    return {
      key,
      date: d,
      weekday: d.toLocaleDateString("vi-VN", { weekday: "long" }),
      day: d.getDate(),
      month: d.toLocaleDateString("vi-VN", { month: "short" }),
      isPast: d < new Date(new Date().setHours(0, 0, 0, 0)),
      isToday: key === formatLocalDate(new Date()),
      shifts: groupedSchedule[key] || [],
    };
  });

  const day = days.find((d) => d.key === selectedDay) ?? days[0];
  const isDayOff = daysOff.some((d) => d.trainerId === trainerId && d.date === selectedDay);
  const dayOffReason = daysOff.find((d) => d.trainerId === trainerId && d.date === selectedDay)?.reason || "Nghỉ phép";

  const daySlots = isDayOff ? [] : SCHEDULE_SLOTS.filter((slotTime) => {
    return day.shifts.some((ws) => isSlotInShift(slotTime, ws.shift?.start_time, ws.shift?.end_time));
  });

  const availableCount = daySlots.filter((s) => {
    const isBooked = bookings.some((b) => {
      const bDate = typeof b.date === "string" ? b.date.split("T")[0] : formatLocalDate(new Date(b.date));
      return bDate === selectedDay && b.time === s && b.status !== "cancelled";
    });
    const isClosed = closures.some((c) => c.trainerId === trainerId && c.date === selectedDay && c.time === s);
    const isPast = isSlotPast(selectedDay, s);
    return !isBooked && !isClosed && !isPast;
  }).length;

  const weekLabel = `${days[0].day} ${days[0].month} – ${days[6].day} ${days[6].month}`;

  const groups = [
    {
      key: "morning",
      icon: Sun,
      label: "Sáng",
      times: daySlots.filter((s) => parseInt(s.split(":")[0], 10) < 12),
    },
    {
      key: "afternoon",
      icon: Sunset,
      label: "Chiều",
      times: daySlots.filter((s) => {
        const h = parseInt(s.split(":")[0], 10);
        return h >= 12 && h < 17;
      }),
    },
    {
      key: "evening",
      icon: Moon,
      label: "Tối",
      times: daySlots.filter((s) => parseInt(s.split(":")[0], 10) >= 17),
    },
  ];

  const shiftWeek = (delta: number) => {
    const x = new Date(weekStart);
    x.setDate(x.getDate() + delta * 7);
    setWeekStart(x);
  };

  return (
    <div className="space-y-6">
      {/* Navigator and Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="text-sm font-bold text-slate-700">Tuần: {weekLabel}</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftWeek(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-semibold"
              onClick={() => {
                const x = new Date();
                const diff = (x.getDay() + 6) % 7;
                x.setDate(x.getDate() - diff);
                x.setHours(0, 0, 0, 0);
                setWeekStart(x);
              }}
            >
              Hôm nay
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => shiftWeek(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-500 font-medium">
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded border border-slate-200 bg-white" />
            Trống (Open)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-emerald-600" />
            Đã đặt (Booked)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Ban className="h-3.5 w-3.5 text-rose-500" />
            Đóng (Closed)
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Lock className="h-3.5 w-3.5 text-slate-400" />
            Đã qua (Past)
          </span>
        </div>
      </div>

      {/* Day Strip */}
      <div className="grid grid-cols-7 gap-2">
        {days.map((d) => {
          const isSelected = d.key === selectedDay;
          const dayBooked = bookings.filter((b) => {
            const bDate = typeof b.date === "string" ? b.date.split("T")[0] : formatLocalDate(new Date(b.date));
            return bDate === d.key && b.status !== "cancelled";
          }).length;
          return (
            <button
              key={d.key}
              onClick={() => !d.isPast && setSelectedDay(d.key)}
              disabled={d.isPast}
              className={cn(
                "flex flex-col items-center gap-1 rounded-2xl border px-2 py-3.5 transition-all duration-200",
                d.isPast
                  ? "cursor-not-allowed border-dashed border-slate-100 bg-slate-50/50 text-slate-400 opacity-60"
                  : isSelected
                    ? "border-emerald-600 bg-emerald-600 text-white shadow-md ring-2 ring-emerald-600/20 scale-102"
                    : "border-slate-200 bg-white hover:border-emerald-500 hover:bg-slate-50 text-slate-700"
              )}
            >
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{d.weekday}</span>
              <span className="text-xl font-extrabold leading-none">{d.day}</span>
              <span className={cn("text-[10px] font-semibold", isSelected ? "opacity-90" : "text-slate-400")}>
                {d.month}
              </span>
              {dayBooked > 0 && (
                <span
                  className={cn(
                    "mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold leading-none border shadow-sm",
                    isSelected
                      ? "bg-white text-emerald-700 border-white"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100"
                  )}
                >
                  {dayBooked}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Slot List */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-800">
              {new Date(selectedDay).toLocaleDateString("vi-VN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {day.isPast
                ? "Ngày đã qua"
                : isDayOff
                  ? "Huấn luyện viên nghỉ phép"
                  : day.shifts.length === 0
                    ? "Không có lịch làm việc"
                    : `Có ${availableCount} khung giờ trống`}
            </p>
          </div>
          <span className="text-xs text-slate-400 font-semibold italic">
            {!day.isPast && !isDayOff && day.shifts.length > 0 && "Chọn khung giờ trống để đặt lịch"}
          </span>
        </div>

        {isDayOff ? (
          <div className="py-12 text-center text-slate-500">
            <Ban className="h-10 w-10 text-rose-400 mx-auto mb-3" />
            <p className="font-bold text-slate-700">Huấn luyện viên nghỉ phép</p>
            <p className="text-sm text-slate-400 mt-1 italic">Lý do: {dayOffReason}</p>
          </div>
        ) : day.shifts.length === 0 ? (
          <div className="py-12 text-center text-slate-500">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-600">Huấn luyện viên không có ca trực vào ngày này</p>
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map(({ key, icon: Icon, label, times }) => {
              if (times.length === 0) return null;
              return (
                <section key={key}>
                  <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Icon className="h-4 w-4 text-emerald-600" />
                    {label}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {times.map((slot) => {
                      const isBooked = bookings.some(
                        (b) => {
                          const bDate = typeof b.date === "string" ? b.date.split("T")[0] : formatLocalDate(new Date(b.date));
                          return b.trainerId === trainerId && bDate === selectedDay && b.time === slot && b.status !== "cancelled";
                        }
                      );
                      const isClosed = closures.some(
                        (c) => c.trainerId === trainerId && c.date === selectedDay && c.time === slot
                      );
                      const isPast = isSlotPast(selectedDay, slot);
                      const end = addMinutes(slot, SESSION_LEN_MIN);

                      const status: "open" | "booked" | "closed" | "past" = isPast
                        ? "past"
                        : isBooked
                          ? "booked"
                          : isClosed
                            ? "closed"
                            : "open";

                      const styles = {
                        open: "border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer shadow-sm hover:shadow-md",
                        booked: "border-emerald-100 bg-emerald-50/30 text-emerald-800 cursor-not-allowed opacity-80",
                        closed: "border-dashed border-rose-200 bg-rose-50/20 text-rose-700 cursor-not-allowed opacity-80",
                        past: "border-dashed border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed opacity-60",
                      };

                      const closedReason = closures.find(
                        (c) => c.trainerId === trainerId && c.date === selectedDay && c.time === slot
                      )?.reason || "Bận việc riêng";

                      return (
                        <button
                          key={slot}
                          onClick={() => status === "open" && handleBookSlot(selectedDay, slot)}
                          disabled={status !== "open"}
                          title={status === "closed" ? `Lý do: ${closedReason}` : undefined}
                          className={cn(
                            "flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all duration-200 w-full",
                            styles[status]
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Clock
                              className={cn(
                                "h-4 w-4 shrink-0",
                                status === "open" ? "text-emerald-600" : "opacity-60"
                              )}
                            />
                            <div className="leading-tight">
                              <div className="font-mono text-sm font-bold text-slate-800">
                                {slot} – {end}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {status === "closed" ? `Bận: ${closedReason}` : "Khung giờ 1 tiếng 30 phút"}
                              </div>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                              status === "open"
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : status === "booked"
                                  ? "bg-emerald-600 text-white"
                                  : status === "closed"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-400"
                            )}
                          >
                            {status === "open" ? (
                              "+"
                            ) : status === "booked" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : status === "closed" ? (
                              <Ban className="h-4 w-4" />
                            ) : (
                              <Lock className="h-3.5 w-3.5" />
                            )}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
