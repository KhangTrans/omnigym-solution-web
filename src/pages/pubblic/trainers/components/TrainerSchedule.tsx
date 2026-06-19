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
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/cn";
import { type TrainerScheduleShift, type TrainerScheduleSlot } from "@/api/trainers";

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const isSlotPast = (dateStr: string, slotTime: string): boolean => {
  try {
    const now = new Date();
    const [year, month, day] = dateStr.split("-").map(Number);
    const d = new Date(year, month - 1, day);
    const [h, m] = slotTime.split(":").map(Number);
    d.setHours(h, m, 0, 0);
    return d < now;
  } catch {
    return false;
  }
};

/** Generate default slots (05:00–21:00, each 90 min) */
const generateDefaultSlots = (): { start_time: string; end_time: string }[] => {
  const slots: { start_time: string; end_time: string }[] = [];
  let minutes = 5 * 60; // 05:00
  const endLimit = 21 * 60; // 21:00
  while (minutes + 90 <= endLimit) {
    const sh = Math.floor(minutes / 60);
    const sm = minutes % 60;
    const eh = Math.floor((minutes + 90) / 60);
    const em = (minutes + 90) % 60;
    slots.push({
      start_time: `${String(sh).padStart(2, "0")}:${String(sm).padStart(2, "0")}`,
      end_time: `${String(eh).padStart(2, "0")}:${String(em).padStart(2, "0")}`,
    });
    minutes += 90;
  }
  return slots;
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
  closures: any[];
  handleBookSlot: (date: string, slot: string) => void;
  /** Already-booked start_times keyed by date string, used to mark slots in the default grid */
  bookedTimes?: Record<string, string[]>;
  selectedSlots?: Array<{ date: string; time: string }>;
  onToggleSlot?: (date: string, time: string) => void;
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
  closures,
  handleBookSlot,
  bookedTimes = {},
  selectedSlots = [],
  onToggleSlot,
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

  // Group schedule entries by date
  const groupedSchedule = schedule.reduce(
    (acc: Record<string, TrainerScheduleShift[]>, item) => {
      const dateKey = item.date.split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(item);
      return acc;
    },
    {},
  );

  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    const key = formatLocalDate(d);
    const entries = groupedSchedule[key] || [];
    const bookedCount = entries.reduce(
      (sum, entry) => sum + entry.slots.filter((s) => s.status === "booked").length,
      0,
    );
    return {
      key,
      date: d,
      weekday: d.toLocaleDateString("vi-VN", { weekday: "long" }),
      day: d.getDate(),
      month: d.toLocaleDateString("vi-VN", { month: "short" }),
      isPast: d < new Date(new Date().setHours(0, 0, 0, 0)),
      isToday: key === formatLocalDate(new Date()),
      entries,
      bookedCount,
    };
  });

  const day = days.find((d) => d.key === selectedDay) ?? days[0];
  const isDayOff = daysOff.some((d) => d.trainerId === trainerId && d.date === selectedDay);
  const dayOffReason =
    daysOff.find((d) => d.trainerId === trainerId && d.date === selectedDay)?.reason || "Nghỉ phép";

  type SlotWithMeta = TrainerScheduleSlot & { dateStr: string };
  const daySlots: SlotWithMeta[] = isDayOff
    ? []
    : day.entries.flatMap((entry) =>
        entry.slots.map((s) => ({ ...s, dateStr: entry.date.split("T")[0] })),
      );

  // When trainer has no schedule for the selected day → show default slot grid
  const hasNoSchedule = !isDayOff && !day.isPast && day.entries.length === 0;
  const defaultSlots = hasNoSchedule ? generateDefaultSlots() : [];
  const alreadyBookedForDay = bookedTimes[selectedDay] ?? [];

  const availableCount = hasNoSchedule
    ? defaultSlots.filter(
        (s) =>
          !isSlotPast(selectedDay, s.start_time) &&
          !alreadyBookedForDay.includes(s.start_time),
      ).length
    : daySlots.filter((s) => {
        const isClosed = closures.some(
          (c) => c.trainerId === trainerId && c.date === selectedDay && c.time === s.start_time,
        );
        return s.status === "available" && !isClosed && !isSlotPast(selectedDay, s.start_time);
      }).length;

  const weekLabel = `${days[0].day} ${days[0].month} – ${days[6].day} ${days[6].month}`;

  // Group slots by time-of-day (for the normal schedule path)
  const groups = [
    {
      key: "morning",
      icon: Sun,
      label: "Sáng",
      slots: daySlots.filter((s) => parseInt(s.start_time.split(":")[0], 10) < 12),
    },
    {
      key: "afternoon",
      icon: Sunset,
      label: "Chiều",
      slots: daySlots.filter((s) => {
        const h = parseInt(s.start_time.split(":")[0], 10);
        return h >= 12 && h < 17;
      }),
    },
    {
      key: "evening",
      icon: Moon,
      label: "Tối",
      slots: daySlots.filter((s) => parseInt(s.start_time.split(":")[0], 10) >= 17),
    },
  ];

  // Group default slots by time-of-day
  const defaultGroups = [
    {
      key: "morning",
      icon: Sun,
      label: "Sáng",
      slots: defaultSlots.filter((s) => parseInt(s.start_time.split(":")[0], 10) < 12),
    },
    {
      key: "afternoon",
      icon: Sunset,
      label: "Chiều",
      slots: defaultSlots.filter((s) => {
        const h = parseInt(s.start_time.split(":")[0], 10);
        return h >= 12 && h < 17;
      }),
    },
    {
      key: "evening",
      icon: Moon,
      label: "Tối",
      slots: defaultSlots.filter((s) => parseInt(s.start_time.split(":")[0], 10) >= 17),
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
                    : "border-slate-200 bg-white hover:border-emerald-500 hover:bg-slate-50 text-slate-700",
              )}
            >
              <span className="text-[10px] uppercase tracking-wider font-bold opacity-80">{d.weekday}</span>
              <span className="text-xl font-extrabold leading-none">{d.day}</span>
              <span className={cn("text-[10px] font-semibold", isSelected ? "opacity-90" : "text-slate-400")}>
                {d.month}
              </span>
              {d.bookedCount > 0 && (
                <span
                  className={cn(
                    "mt-1 px-1.5 py-0.5 rounded-full text-[9px] font-extrabold leading-none border shadow-sm",
                    isSelected
                      ? "bg-white text-emerald-700 border-white"
                      : "bg-emerald-50 text-emerald-700 border-emerald-100",
                  )}
                >
                  {d.bookedCount}
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
                  : hasNoSchedule
                    ? `${availableCount} khung giờ có thể đặt (lịch linh hoạt)`
                    : `Có ${availableCount} khung giờ trống`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {hasNoSchedule && (
              <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 border border-violet-200 px-2.5 py-1 text-[10px] font-bold text-violet-600">
                <Sparkles className="h-3 w-3" />
                Lịch linh hoạt
              </span>
            )}
            <span className="text-xs text-slate-400 font-semibold italic">
              {!day.isPast && !isDayOff && (day.entries.length > 0 || hasNoSchedule)
                ? "Chọn khung giờ trống để đặt lịch"
                : null}
            </span>
          </div>
        </div>

        {isDayOff ? (
          <div className="py-12 text-center text-slate-500">
            <Ban className="h-10 w-10 text-rose-400 mx-auto mb-3" />
            <p className="font-bold text-slate-700">Huấn luyện viên nghỉ phép</p>
            <p className="text-sm text-slate-400 mt-1 italic">Lý do: {dayOffReason}</p>
          </div>
        ) : day.isPast ? (
          <div className="py-12 text-center text-slate-500">
            <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <p className="font-bold text-slate-600">Ngày đã qua</p>
          </div>
        ) : hasNoSchedule ? (
          /* ── Default slot grid when trainer has no work shifts ── */
          <div className="mt-3 space-y-1">
            <p className="text-xs text-violet-600 bg-violet-50 border border-violet-100 rounded-lg px-3 py-2 flex items-start gap-2">
              <Sparkles className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              Huấn luyện viên chưa cài đặt lịch làm việc cho ngày này. Bạn vẫn có thể chọn khung giờ — hệ thống sẽ tự động tạo ca làm việc khi đặt lịch.
            </p>
            <div className="mt-4 space-y-6">
              {defaultGroups.map(({ key, icon: Icon, label, slots: groupSlots }) => {
                if (groupSlots.length === 0) return null;
                return (
                  <section key={key}>
                    <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                      <Icon className="h-4 w-4 text-emerald-600" />
                      {label}
                    </div>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                      {groupSlots.map((slot) => {
                        const isPast = isSlotPast(selectedDay, slot.start_time);
                        const isBooked = alreadyBookedForDay.includes(slot.start_time);
                        const displayStatus: "open" | "booked" | "past" = isPast
                          ? "past"
                          : isBooked
                            ? "booked"
                            : "open";

                        const isSelected = selectedSlots.some(
                          (s) => s.date === selectedDay && s.time === slot.start_time
                        );

                        const styles = {
                          open: isSelected
                            ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-500/20"
                            : "border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer shadow-sm hover:shadow-md",
                          booked: "border-emerald-100 bg-emerald-50/30 text-emerald-800 cursor-not-allowed opacity-80",
                          past: "border-dashed border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed opacity-60",
                        };

                        return (
                          <button
                            key={slot.start_time}
                            onClick={() => {
                              if (displayStatus !== "open") return;
                              if (onToggleSlot) {
                                onToggleSlot(selectedDay, slot.start_time);
                              } else {
                                handleBookSlot(selectedDay, slot.start_time);
                              }
                            }}
                            disabled={displayStatus !== "open"}
                            className={cn(
                              "flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all duration-200 w-full",
                              styles[displayStatus],
                            )}
                          >
                            <div className="flex items-center gap-3">
                              <Clock
                                className={cn(
                                  "h-4 w-4 shrink-0",
                                  displayStatus === "open" ? "text-emerald-600" : "opacity-60",
                                )}
                              />
                              <div className="leading-tight">
                                <div className="font-mono text-sm font-bold text-slate-800">
                                  {slot.start_time} – {slot.end_time}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Khung giờ 1 tiếng 30 phút
                                </div>
                              </div>
                            </div>

                            <span
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                                displayStatus === "open"
                                  ? isSelected
                                    ? "bg-emerald-600 text-white border border-emerald-600"
                                    : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                  : displayStatus === "booked"
                                    ? "bg-emerald-600 text-white"
                                    : "bg-slate-100 text-slate-400",
                              )}
                            >
                              {displayStatus === "open" ? (
                                isSelected ? (
                                  <CheckCircle2 className="h-4 w-4" />
                                ) : (
                                  "+"
                                )
                              ) : displayStatus === "booked" ? (
                                <CheckCircle2 className="h-4 w-4" />
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
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {groups.map(({ key, icon: Icon, label, slots: groupSlots }) => {
              if (groupSlots.length === 0) return null;
              return (
                <section key={key}>
                  <div className="mb-3 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                    <Icon className="h-4 w-4 text-emerald-600" />
                    {label}
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {groupSlots.map((slot) => {
                      const isClosed = closures.some(
                        (c) =>
                          c.trainerId === trainerId &&
                          c.date === selectedDay &&
                          c.time === slot.start_time,
                      );
                      const isPast = isSlotPast(selectedDay, slot.start_time);

                      const displayStatus: "open" | "booked" | "closed" | "past" = isPast
                        ? "past"
                        : slot.status === "booked"
                          ? "booked"
                          : isClosed
                            ? "closed"
                            : "open";

                      const isSelected = selectedSlots.some(
                        (s) => s.date === selectedDay && s.time === slot.start_time
                      );

                      const styles = {
                        open: isSelected
                          ? "border-emerald-500 bg-emerald-50 text-emerald-900 shadow-md ring-2 ring-emerald-500/20"
                          : "border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50/20 cursor-pointer shadow-sm hover:shadow-md",
                        booked: "border-emerald-100 bg-emerald-50/30 text-emerald-800 cursor-not-allowed opacity-80",
                        closed: "border-dashed border-rose-200 bg-rose-50/20 text-rose-700 cursor-not-allowed opacity-80",
                        past: "border-dashed border-slate-100 bg-slate-50/50 text-slate-400 cursor-not-allowed opacity-60",
                      };

                      const closedReason =
                        closures.find(
                          (c) =>
                            c.trainerId === trainerId &&
                            c.date === selectedDay &&
                            c.time === slot.start_time,
                        )?.reason || "Bận việc riêng";

                      return (
                        <button
                          key={slot.start_time}
                          onClick={() => {
                            if (displayStatus !== "open") return;
                            if (onToggleSlot) {
                              onToggleSlot(selectedDay, slot.start_time);
                            } else {
                              handleBookSlot(selectedDay, slot.start_time);
                            }
                          }}
                          disabled={displayStatus !== "open"}
                          title={displayStatus === "closed" ? `Lý do: ${closedReason}` : undefined}
                          className={cn(
                            "flex items-center justify-between rounded-xl border px-4 py-3.5 text-left transition-all duration-200 w-full",
                            styles[displayStatus],
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <Clock
                              className={cn(
                                "h-4 w-4 shrink-0",
                                displayStatus === "open" ? "text-emerald-600" : "opacity-60",
                              )}
                            />
                            <div className="leading-tight">
                              <div className="font-mono text-sm font-bold text-slate-800">
                                {slot.start_time} – {slot.end_time}
                              </div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                {displayStatus === "closed"
                                  ? `Bận: ${closedReason}`
                                  : "Khung giờ 1 tiếng 30 phút"}
                              </div>
                            </div>
                          </div>

                          <span
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                              displayStatus === "open"
                                ? isSelected
                                  ? "bg-emerald-600 text-white border border-emerald-600"
                                  : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : displayStatus === "booked"
                                  ? "bg-emerald-600 text-white"
                                  : displayStatus === "closed"
                                    ? "bg-rose-100 text-rose-700"
                                    : "bg-slate-100 text-slate-400",
                            )}
                          >
                            {displayStatus === "open" ? (
                              isSelected ? (
                                <CheckCircle2 className="h-4 w-4" />
                              ) : (
                                "+"
                              )
                            ) : displayStatus === "booked" ? (
                              <CheckCircle2 className="h-4 w-4" />
                            ) : displayStatus === "closed" ? (
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
