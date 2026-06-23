import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  Clock,
  Loader2,
  Trash2,
  Info,
  CalendarDays
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trainersApi } from "@/api/trainers";
import { notify } from "@/utils/notify";
import { CancelBookingDialog } from "./components/CancelBookingDialog";
import { RescheduleBookingDialog } from "./components/RescheduleBookingDialog";

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

export default function MyBookings() {
  const [bookings, setBookings] = useState<BookingItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  
  // Hủy lịch state
  const [cancellingBooking, setCancellingBooking] = useState<BookingItem | null>(null);
  const [cancelLoading, setCancelLoading] = useState(false);

  // Đổi lịch state
  const [reschedulingBooking, setReschedulingBooking] = useState<BookingItem | null>(null);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const res = await trainersApi.getMyBookings();
      setBookings(res.data.data || []);
    } catch (error: any) {
      console.error("Failed to fetch bookings:", error);
      notify.error(error.response?.data?.message || "Không thể tải danh sách lịch tập.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    try {
      setCancelLoading(true);
      await trainersApi.cancelBooking(cancellingBooking.id);
      notify.success("Đã hủy lịch tập thành công và hoàn lại buổi tập vào gói!");
      setCancellingBooking(null);
      fetchBookings();
    } catch (error: any) {
      console.error("Failed to cancel booking:", error);
      notify.error(error.response?.data?.message || "Không thể hủy lịch tập. Vui lòng thử lại.");
    } finally {
      setCancelLoading(false);
    }
  };

  const formatDateDisplay = (dateStr: string): string => {
    try {
      return new Date(dateStr).toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const calculateEndTime = (startTime: string): string => {
    try {
      const [h, m] = startTime.split(":").map(Number);
      let totalMin = h * 60 + m + 90;
      let newH = Math.floor(totalMin / 60) % 24;
      let newM = totalMin % 60;
      return `${String(newH).padStart(2, "0")}:${String(newM).padStart(2, "0")}`;
    } catch {
      return "";
    }
  };

  // Ca tập cách hiện tại trên 2 tiếng thì được hủy hoặc đổi lịch
  const isCancellable = (booking: BookingItem): boolean => {
    if (booking.status !== "confirmed") return false;
    try {
      const now = new Date();
      const scheduledDateTime = new Date(booking.date);
      const [hours, minutes] = booking.time.split(":");
      scheduledDateTime.setHours(Number(hours), Number(minutes), 0, 0);

      const diffMs = scheduledDateTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      return diffHours >= 2;
    } catch {
      return false;
    }
  };

  const now = new Date();
  
  // Phân loại bookings
  const categorized = bookings.reduce(
    (acc: { upcoming: BookingItem[]; past: BookingItem[] }, b) => {
      const scheduledDateTime = new Date(b.date);
      const [hours, minutes] = b.time.split(":");
      scheduledDateTime.setHours(Number(hours), Number(minutes), 0, 0);

      const isPast = scheduledDateTime < now || b.status === "cancelled";
      if (isPast) {
        acc.past.push(b);
      } else {
        acc.upcoming.push(b);
      }
      return acc;
    },
    { upcoming: [], past: [] }
  );

  categorized.upcoming.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  categorized.past.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const displayedBookings = activeTab === "upcoming" ? categorized.upcoming : categorized.past;

  const renderStatus = (b: BookingItem) => {
    if (b.status === "cancelled") {
      return (
        <Badge variant="destructive" className="bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 rounded-full px-3 font-semibold text-xs">
          Đã hủy
        </Badge>
      );
    }
    const scheduledDateTime = new Date(b.date);
    const [hours, minutes] = b.time.split(":");
    scheduledDateTime.setHours(Number(hours), Number(minutes), 0, 0);

    if (scheduledDateTime < now) {
      return (
        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50 rounded-full px-3 font-semibold text-xs">
          Hoàn thành
        </Badge>
      );
    }
    return (
      <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-50 rounded-full px-3 font-semibold text-xs">
        Chờ tập
      </Badge>
    );
  };

  return (
    <div className="p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Lịch tập của tôi</h2>
          <p className="text-xs text-slate-500 mt-1">Quản lý các ca tập luyện đã đăng ký với Huấn luyện viên cá nhân.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 rounded-lg border bg-slate-100/50 p-1">
          <button
            onClick={() => setActiveTab("upcoming")}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "upcoming"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Sắp diễn ra ({categorized.upcoming.length})
          </button>
          <button
            onClick={() => setActiveTab("past")}
            className={`rounded-md px-4 py-1.5 text-xs font-bold transition-all ${
              activeTab === "past"
                ? "bg-white text-slate-800 shadow-sm"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            Đã tập & Đã hủy ({categorized.past.length})
          </button>
        </div>
      </div>

      {/* Rules Banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs text-amber-800 leading-relaxed flex gap-2.5 items-start">
        <Info className="h-4.5 w-4.5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <strong className="font-bold">Quy định đổi/hủy lịch tập PT:</strong>
          <ul className="list-disc pl-4 mt-1 space-y-1">
            <li>Bạn chỉ được phép đổi hoặc hủy ca tập trước giờ tập bắt đầu ít nhất 2 tiếng.</li>
            <li>Khi bạn hủy lịch tập đúng hạn, số buổi tập trong gói PT tương ứng sẽ được cộng trả lại cho bạn.</li>
          </ul>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
          <p className="text-sm text-slate-500">Đang tải lịch tập của bạn...</p>
        </div>
      ) : displayedBookings.length === 0 ? (
        <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl">
          <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <p className="font-bold text-slate-600">Không có lịch tập nào</p>
          <p className="text-xs text-slate-400 mt-1">
            {activeTab === "upcoming"
              ? "Bạn chưa có ca tập nào sắp tới. Hãy tìm PT và đặt lịch nhé!"
              : "Lịch sử tập luyện của bạn trống."}
          </p>
          {activeTab === "upcoming" && (
            <Button asChild className="mt-4 bg-primary hover:bg-primary/95 text-white rounded-xl">
              <Link to="/gyms">Tìm huấn luyện viên</Link>
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {displayedBookings.map((booking) => {
            const trainerUser = booking.trainer?.user;
            const trainerName = trainerUser?.full_name || "Huấn luyện viên";
            const avatar = booking.trainer?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(trainerName)}&background=4F8A74&color=fff`;
            const cancellable = isCancellable(booking);

            return (
              <Card key={booking.id} className="border border-slate-100 hover:border-slate-200 shadow-sm transition-all overflow-hidden bg-white/70 backdrop-blur-xl">
                <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-start gap-4 min-w-0">
                    <img
                      src={avatar}
                      alt={trainerName}
                      className="h-12 w-12 rounded-full object-cover border border-slate-100 shadow-sm"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(trainerName)}&background=4F8A74&color=fff`;
                      }}
                    />
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2.5 flex-wrap">
                        <h4 className="font-bold text-slate-800 text-sm truncate">{trainerName}</h4>
                        {renderStatus(booking)}
                      </div>
                      <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wide">
                        PT Chuyên môn: {booking.trainer?.specialization || "Tổng hợp"}
                      </p>
                      
                      <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1 pt-1">
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Calendar className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span>{formatDateDisplay(booking.date)}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
                          <Clock className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-mono">{booking.time} - {calculateEndTime(booking.time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 self-end md:self-center shrink-0">
                    {cancellable && (
                      <>
                        <Button
                          onClick={() => setReschedulingBooking(booking)}
                          variant="outline"
                          className="h-9 rounded-xl border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 font-bold text-xs flex items-center gap-1.5"
                        >
                          <CalendarDays className="h-3.5 w-3.5" />
                          Đổi lịch
                        </Button>
                        <Button
                          onClick={() => setCancellingBooking(booking)}
                          variant="outline"
                          className="h-9 rounded-xl border-rose-200 bg-rose-50/30 hover:bg-rose-50 text-rose-600 hover:text-rose-700 font-bold text-xs flex items-center gap-1.5"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Hủy lịch
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Confirmation Cancel Dialog */}
      <CancelBookingDialog
        isOpen={!!cancellingBooking}
        onClose={() => setCancellingBooking(null)}
        booking={cancellingBooking}
        onConfirm={handleCancelBooking}
        loading={cancelLoading}
        formatDateDisplay={formatDateDisplay}
      />

      {/* Reschedule Dialog */}
      <RescheduleBookingDialog
        isOpen={!!reschedulingBooking}
        onClose={() => setReschedulingBooking(null)}
        booking={reschedulingBooking}
        onSuccess={fetchBookings}
        formatDateDisplay={formatDateDisplay}
        calculateEndTime={calculateEndTime}
      />
    </div>
  );
}
