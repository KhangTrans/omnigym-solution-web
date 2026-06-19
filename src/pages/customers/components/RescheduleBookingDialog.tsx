import { useEffect, useState } from "react";
import { Loader2, CalendarDays, Info } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { TrainerSchedule } from "../../pubblic/trainers/components/TrainerSchedule";
import { trainersApi } from "@/api/trainers";
import { notify } from "@/utils/notify";

interface BookingItem {
  id: number;
  user_id: number;
  trainer_id: number;
  date: string;
  time: string;
  status: "confirmed" | "cancelled" | "pending_payment";
  created_at: string;
  updated_at: string;
  trainer?: {
    id: number;
    user_id: number;
    specialization?: string;
    avatar_url?: string;
    user?: {
      id: number;
      full_name: string;
      email: string;
    };
  };
}

interface RescheduleBookingDialogProps {
  isOpen: boolean;
  onClose: () => void;
  booking: BookingItem | null;
  onSuccess: () => void;
  formatDateDisplay: (dateStr: string) => string;
  calculateEndTime: (startTime: string) => string;
}

export function RescheduleBookingDialog({
  isOpen,
  onClose,
  booking,
  onSuccess,
  formatDateDisplay,
  calculateEndTime,
}: RescheduleBookingDialogProps) {
  const [rescheduleSchedule, setRescheduleSchedule] = useState<any[]>([]);
  const [rescheduleScheduleLoading, setRescheduleScheduleLoading] = useState(false);
  const [rescheduleWeekStart, setRescheduleWeekStart] = useState<Date>(() => {
    const x = new Date();
    const diff = (x.getDay() + 6) % 7; // Monday = 0
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  });
  const [rescheduleSelectedDay, setRescheduleSelectedDay] = useState<string>("");
  const [proposedNewSlot, setProposedNewSlot] = useState<{ date: string; time: string } | null>(null);
  const [rescheduleError, setRescheduleError] = useState<string | null>(null);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Reset states when dialog opens with a new booking
  useEffect(() => {
    if (booking) {
      setRescheduleSelectedDay(booking.date);
      setProposedNewSlot(null);
      setRescheduleError(null);
      const x = new Date();
      const diff = (x.getDay() + 6) % 7;
      x.setDate(x.getDate() - diff);
      x.setHours(0, 0, 0, 0);
      setRescheduleWeekStart(x);
    }
  }, [booking, isOpen]);

  // Load HLV schedule
  useEffect(() => {
    if (!booking || !isOpen) return;
    let cancelled = false;
    async function loadSchedule() {
      try {
        setRescheduleScheduleLoading(true);
        setRescheduleError(null);

        const formatLocalDate = (d: Date): string => {
          const year = d.getFullYear();
          const month = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${year}-${month}-${day}`;
        };

        const start_date = formatLocalDate(rescheduleWeekStart);
        const future = new Date(rescheduleWeekStart);
        future.setDate(rescheduleWeekStart.getDate() + 6);
        const end_date = formatLocalDate(future);

        const res = await trainersApi.getSchedule(
          booking.trainer_id,
          start_date,
          end_date
        );

        if (cancelled) return;
        setRescheduleSchedule(res.data.data || []);
      } catch (error) {
        console.error("Failed to load trainer schedule for reschedule", error);
      } finally {
        if (!cancelled) setRescheduleScheduleLoading(false);
      }
    }
    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [booking, rescheduleWeekStart, isOpen]);

  const handleSelectNewSlot = (date: string, slot: string) => {
    setProposedNewSlot({ date, time: slot });
  };

  const handleExecuteReschedule = async () => {
    if (!booking || !proposedNewSlot) return;
    try {
      setRescheduleLoading(true);
      setRescheduleError(null);
      await trainersApi.rescheduleBooking(booking.id, {
        new_date: proposedNewSlot.date,
        new_time: proposedNewSlot.time,
      });
      notify.success("Đổi lịch tập thành công!");
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Reschedule error:", error);
      setRescheduleError(error.response?.data?.message || "Không thể đổi lịch tập. Vui lòng thử lại.");
    } finally {
      setRescheduleLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl rounded-2xl border-0 p-6 shadow-lg bg-white max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
            <CalendarDays className="h-5.5 w-5.5 text-emerald-600 shrink-0" />
            Đổi lịch tập với HLV {booking?.trainer?.user?.full_name}
          </DialogTitle>
          <div className="text-slate-500 text-sm mt-1">
            Chọn một ngày và khung giờ trực trống mới của Huấn luyện viên dưới đây để đổi lịch.
          </div>
        </DialogHeader>

        {/* Current schedule info comparison */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-xs text-slate-600 flex flex-col sm:flex-row justify-between gap-4 mt-4">
          <div>
            <span className="font-semibold text-slate-400 block uppercase tracking-wider text-[10px]">Lịch hẹn cũ:</span>
            <strong className="text-slate-800 text-sm mt-0.5 block">
              {booking ? formatDateDisplay(booking.date) : ""} lúc {booking?.time} - {booking ? calculateEndTime(booking.time) : ""}
            </strong>
          </div>
          {proposedNewSlot && (
            <div className="border-t sm:border-t-0 sm:border-l border-slate-200 pt-3 sm:pt-0 sm:pl-4">
              <span className="font-semibold text-emerald-600 block uppercase tracking-wider text-[10px]">Lịch hẹn mới đề xuất:</span>
              <strong className="text-emerald-700 text-sm mt-0.5 block">
                {formatDateDisplay(proposedNewSlot.date)} lúc {proposedNewSlot.time} - {calculateEndTime(proposedNewSlot.time)}
              </strong>
            </div>
          )}
        </div>

        {rescheduleError && (
          <div className="p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium leading-relaxed flex gap-2 items-start mt-2">
            <Info className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
            <span>{rescheduleError}</span>
          </div>
        )}

        {/* Schedule picker component */}
        {booking && isOpen && (
          <div className="mt-4 border border-slate-100 p-4 rounded-2xl bg-white">
            <TrainerSchedule
              trainerId={String(booking.trainer_id)}
              schedule={rescheduleSchedule}
              scheduleLoading={rescheduleScheduleLoading}
              weekStart={rescheduleWeekStart}
              setWeekStart={setRescheduleWeekStart}
              selectedDay={rescheduleSelectedDay}
              setSelectedDay={setRescheduleSelectedDay}
              daysOff={[]}
              closures={[]}
              handleBookSlot={handleSelectNewSlot}
              selectedSlots={proposedNewSlot ? [proposedNewSlot] : []}
              onToggleSlot={handleSelectNewSlot}
              bookedTimes={rescheduleSchedule.reduce<Record<string, string[]>>((acc, entry) => {
                const dateKey = entry.date.split("T")[0];
                if (!acc[dateKey]) acc[dateKey] = [];
                entry.slots.filter((s: any) => s.status === "booked").forEach((s: any) => acc[dateKey].push(s.start_time));
                return acc;
              }, {})}
            />
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-100 mt-6">
          <Button
            variant="ghost"
            onClick={onClose}
            className="h-10 rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={handleExecuteReschedule}
            disabled={!proposedNewSlot || rescheduleLoading}
            className="h-10 rounded-xl bg-primary hover:bg-primary/95 text-white font-semibold flex items-center justify-center gap-1.5 shadow-md px-6"
          >
            {rescheduleLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Đang đổi lịch...
              </>
            ) : (
              "Xác nhận đổi lịch"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
