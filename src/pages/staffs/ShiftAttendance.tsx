import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  RefreshCw,
  Clock,
  UserCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { attendanceApi, type AttendanceRecord } from "@/api/attendance";
import { workShiftsApi, type WorkShift } from "@/api/workShifts";
import { toast } from "sonner";

// Import subcomponents
import { AttendanceGuide } from "./components/AttendanceGuide";
import { AttendanceLogs, formatTime } from "./components/AttendanceLogs";
import { TodayShifts } from "./components/TodayShifts";
import { CheckInModal } from "./components/CheckInModal";

const getWorkShiftTime = (shift: WorkShift) => {
  const start = shift.shift?.start_time || shift.start_time;
  const end = shift.shift?.end_time || shift.end_time;
  return `${formatTime(start)} đến ${formatTime(end)}`;
};

export default function ShiftAttendance() {
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Dialog state
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<WorkShift | null>(null);
  
  // Checkout confirmation state
  const [checkOutConfirmOpen, setCheckOutConfirmOpen] = useState(false);
  const [shiftToCheckOut, setShiftToCheckOut] = useState<WorkShift | null>(null);

  const getTodayDateString = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const fetchTodayData = async () => {
    try {
      setLoadingShifts(true);
      const dateStr = getTodayDateString();
      const shiftsRes = await workShiftsApi.list({ date: dateStr });
      const data = shiftsRes.data?.data || (Array.isArray(shiftsRes.data) ? shiftsRes.data : []);
      setShifts(data);
    } catch (err: any) {
      console.error("Fetch shifts error:", err);
      toast.error(err.response?.data?.message || "Không thể tải danh sách ca làm việc");
      setShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  };

  const fetchLogsData = async () => {
    try {
      setLoadingLogs(true);
      const logsRes = await attendanceApi.getMyLogs();
      const data = logsRes.data?.data || (Array.isArray(logsRes.data) ? logsRes.data : []);
      setLogs(data);
    } catch (err: any) {
      console.error("Fetch logs error:", err);
      toast.error(err.response?.data?.message || "Không thể tải lịch sử điểm danh");
      setLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchTodayData();
    fetchLogsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openCheckIn = (shift: WorkShift) => {
    setActiveShift(shift);
    setCheckInModalOpen(true);
  };

  const requestCheckOut = (shift: WorkShift) => {
    setShiftToCheckOut(shift);
    setCheckOutConfirmOpen(true);
  };

  const confirmCheckOut = async () => {
    if (!shiftToCheckOut) return;
    try {
      setCheckOutConfirmOpen(false);
      setLoadingShifts(true);
      await attendanceApi.checkOut({ shift_id: shiftToCheckOut.id });
      toast.success("Check-out thành công!");
      fetchTodayData();
      fetchLogsData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Check-out thất bại.");
    } finally {
      setLoadingShifts(false);
      setShiftToCheckOut(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Staff workspace</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Điểm danh nhân viên</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Kiểm tra ca trực hôm nay, check-in/check-out bằng mã PIN quản lý hoặc nhận diện khuôn mặt.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => { fetchTodayData(); fetchLogsData(); }}
          className="self-start shadow-sm"
        >
          <RefreshCw className="mr-2 h-4 w-4" /> Làm mới dữ liệu
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Calendar className="h-5 w-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Hôm nay</div>
              <div className="font-semibold">{new Date().toLocaleDateString("vi-VN", { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700"><Clock className="h-5 w-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Ca hôm nay</div>
              <div className="text-2xl font-bold">{shifts.length}</div>
            </div>
          </div>
        </div>
        <div className="rounded-xl bg-card p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-violet-50 text-violet-700"><UserCheck className="h-5 w-5" /></div>
            <div>
              <div className="text-xs uppercase tracking-wider text-muted-foreground">Nhật ký</div>
              <div className="text-2xl font-bold">{logs.length}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {/* Today's Shifts - Left/Main Column */}
        <div className="lg:col-span-2 space-y-4">
          <TodayShifts
            shifts={shifts}
            logs={logs}
            loading={loadingShifts}
            onCheckIn={openCheckIn}
            onCheckOut={requestCheckOut}
          />
        </div>

        {/* Info panel / quick tip - Right Column */}
        <div className="space-y-4">
          <AttendanceGuide />
        </div>
      </div>

      {/* Attendance History - Full width */}
      <AttendanceLogs
        logs={logs}
        loading={loadingLogs}
      />

      {/* Check-in Authentication Modal */}
      <CheckInModal
        open={checkInModalOpen}
        onOpenChange={setCheckInModalOpen}
        activeShift={activeShift}
        onSuccess={() => {
          fetchTodayData();
          fetchLogsData();
        }}
      />

      {/* Check-out Confirmation Dialog */}
      <AlertDialog open={checkOutConfirmOpen} onOpenChange={setCheckOutConfirmOpen}>
        <AlertDialogContent className="max-w-md rounded-xl border-0 p-6 shadow-lg">
          <AlertDialogHeader className="space-y-1.5">
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Xác nhận Check-out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              {shiftToCheckOut && (
                <span>Bạn có chắc chắn muốn kết thúc ca làm việc từ {getWorkShiftTime(shiftToCheckOut)}?</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 pt-3">
            <AlertDialogCancel className="h-10 flex-1 rounded-md border-0 bg-muted text-foreground shadow-sm hover:bg-muted/80">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCheckOut}
              className="h-10 flex-1 rounded-md border-0 bg-primary font-semibold text-primary-foreground shadow-sm hover:bg-primary/90"
            >
              Xác nhận ra ca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
