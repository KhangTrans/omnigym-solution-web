import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  RefreshCw,
  Clock
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
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in-0 duration-500">
      {/* Header section with gradient glow */}
      <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-r from-emerald-800 to-teal-900 p-8 text-white shadow-2xl">
        <div className="absolute right-0 top-0 -mr-20 -mt-20 h-80 w-80 rounded-full bg-emerald-700/20 blur-3xl" />
        <div className="absolute left-1/3 bottom-0 -mb-20 h-60 w-60 rounded-full bg-teal-500/15 blur-3xl" />
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300 ring-1 ring-emerald-400/20">
              <Calendar className="h-3.5 w-3.5" />
              Hôm nay: {new Date().toLocaleDateString("vi-VN", { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Khu vực Điểm danh Nhân viên</h1>
            <p className="text-emerald-100 max-w-xl text-sm leading-relaxed">
              Vui lòng kiểm tra và xác nhận điểm danh đúng giờ cho ca trực của bạn bằng cách nhập mã PIN xác nhận của quản lý hoặc nhận diện khuôn mặt.
            </p>
          </div>
          
          <Button 
            variant="outline" 
            onClick={() => { fetchTodayData(); fetchLogsData(); }}
            className="self-start md:self-auto bg-white/10 text-white border-white/20 hover:bg-white/20 hover:text-white h-11 px-5 rounded-xl transition-all active:scale-95"
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Làm mới dữ liệu
          </Button>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Today's Shifts - Left/Main Column */}
        <div className="lg:col-span-2 space-y-6">
          <TodayShifts
            shifts={shifts}
            logs={logs}
            loading={loadingShifts}
            onCheckIn={openCheckIn}
            onCheckOut={requestCheckOut}
          />
        </div>

        {/* Info panel / quick tip - Right Column */}
        <div className="space-y-6">
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
        <AlertDialogContent className="max-w-md rounded-[20px] p-6">
          <AlertDialogHeader className="space-y-1.5">
            <AlertDialogTitle className="text-xl font-bold flex items-center gap-2">
              <Clock className="h-5 w-5 text-amber-600" />
              Xác nhận Check-out
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500">
              {shiftToCheckOut && (
                <span>Bạn có chắc chắn muốn kết thúc ca làm việc từ {formatTime(shiftToCheckOut.start_time)} đến {formatTime(shiftToCheckOut.end_time)}?</span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex gap-2 pt-3">
            <AlertDialogCancel className="flex-1 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 border-none text-slate-800">
              Hủy
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={confirmCheckOut}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-10 rounded-xl font-bold border-none"
            >
              Xác nhận ra ca
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
