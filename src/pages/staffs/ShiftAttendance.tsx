import React, { useState, useEffect, useRef } from "react";
import { 
  Clock, 
  MapPin, 
  CheckCircle, 
  Key, 
  Calendar, 
  ArrowRightLeft, 
  AlertCircle,
  Loader2,
  RefreshCw,
  QrCode
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
import { cn } from "@/utils/cn";

export default function ShiftAttendance() {
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [logs, setLogs] = useState<AttendanceRecord[]>([]);
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingLogs, setLoadingLogs] = useState(false);
  
  // Dialog state
  const [checkInModalOpen, setCheckInModalOpen] = useState(false);
  const [activeShift, setActiveShift] = useState<WorkShift | null>(null);
  
  // PIN state
  const [pinCode, setPinCode] = useState("");
  const [submittingCheckIn, setSubmittingCheckIn] = useState(false);

  // Checkout confirmation state
  const [checkOutConfirmOpen, setCheckOutConfirmOpen] = useState(false);
  const [shiftToCheckOut, setShiftToCheckOut] = useState<WorkShift | null>(null);

  const formatTime = (timeStr: string) => {
    try {
      return timeStr.slice(0, 5);
    } catch {
      return timeStr;
    }
  };

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
    setPinCode("");
  };

  const handlePinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeShift) return;
    if (pinCode.length !== 6) {
      toast.error("Mã PIN phải bao gồm 6 ký tự");
      return;
    }

    try {
      setSubmittingCheckIn(true);
      await attendanceApi.checkIn({
        shift_id: activeShift.id,
        check_in_code: pinCode.toUpperCase().trim()
      });
      toast.success("Check-in bằng mã PIN thành công!");
      setCheckInModalOpen(false);
      fetchTodayData();
      fetchLogsData();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Mã PIN không chính xác hoặc ca làm việc đã được check-in");
    } finally {
      setSubmittingCheckIn(false);
    }
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

  const getAttendanceStatusBadge = (status: string) => {
    switch (status) {
      case "present":
        return <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white font-medium">Đúng giờ</Badge>;
      case "late":
        return <Badge className="bg-amber-500 hover:bg-amber-600 text-white font-medium">Đi muộn</Badge>;
      case "absent":
        return <Badge className="bg-rose-500 hover:bg-rose-600 text-white font-medium">Vắng mặt</Badge>;
      case "excused":
        return <Badge className="bg-blue-500 hover:bg-blue-600 text-white font-medium">Có phép</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const isShiftActive = (shift: WorkShift) => {
    if (shift.status === 'completed' || shift.status === 'cancelled') return false;
    
    // Check if shift is today and current time is suitable
    const today = getTodayDateString();
    if (shift.date !== today) return false;

    // Simple time check if needed, but we can allow check-in anytime on the shift day
    return true;
  };

  // Find if there is an existing attendance check-in for a shift id
  const getShiftAttendance = (shiftId: number) => {
    return logs.find(log => log.shift_id === shiftId);
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
              Vui lòng kiểm tra và xác nhận điểm danh đúng giờ cho ca trực của bạn. Bạn có thể chọn nhập mã PIN của quản lý hoặc quét QR động tại quầy lễ tân.
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
          <Card className="border-border/60 shadow-lg rounded-[20px] overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="border-b bg-muted/30 py-5">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <Clock className="h-5 w-5 text-emerald-600 animate-pulse" />
                Ca làm việc hôm nay
              </CardTitle>
              <CardDescription>Danh sách lịch trực và trạng thái điểm danh trong ngày</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              {loadingShifts ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
                  <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
                  <span className="text-sm">Đang tải lịch làm việc...</span>
                </div>
              ) : shifts.length > 0 ? (
                <div className="space-y-4">
                  {shifts.map((shift) => {
                    const attendance = getShiftAttendance(shift.id);
                    const canCheckIn = isShiftActive(shift) && !attendance;
                    const canCheckOut = attendance && !attendance.check_out_time;
                    
                    return (
                      <div 
                        key={shift.id} 
                        className={cn(
                          "flex flex-col sm:flex-row sm:items-center justify-between p-5 rounded-2xl border transition-all duration-300 gap-4",
                          attendance?.check_out_time 
                            ? "bg-emerald-500/5 border-emerald-500/20" 
                            : attendance 
                            ? "bg-amber-500/5 border-amber-500/20"
                            : "bg-background border-border/80 hover:shadow-md hover:border-emerald-600/30"
                        )}
                      >
                        <div className="flex items-start gap-4">
                          <div className={cn(
                            "p-3 rounded-xl",
                            attendance?.check_out_time 
                              ? "bg-emerald-500/10 text-emerald-600" 
                              : attendance 
                              ? "bg-amber-500/10 text-amber-600" 
                              : "bg-slate-100 text-slate-500"
                          )}>
                            <Clock className="h-6 w-6" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-semibold text-slate-800 text-base">
                                {formatTime(shift.start_time)} - {formatTime(shift.end_time)}
                              </span>
                              {attendance && getAttendanceStatusBadge(attendance.status)}
                              {attendance?.check_out_time && (
                                <Badge className="bg-slate-500 text-white font-medium">Hoàn thành ca</Badge>
                              )}
                              {!attendance && (
                                <Badge variant="outline" className="border-slate-300 text-slate-600">Chưa điểm danh</Badge>
                              )}
                            </div>
                            <div className="flex items-center text-xs text-muted-foreground gap-1">
                              <MapPin className="h-3 w-3 shrink-0" />
                              <span>{shift.branch?.branch_name || "Chi nhánh chưa xác định"}</span>
                            </div>
                            
                            {/* Time logs */}
                            {attendance && (
                              <div className="text-xs text-slate-500 mt-1 space-y-0.5">
                                {attendance.check_in_time && (
                                  <div>Check-in: <strong className="text-slate-700">{new Date(attendance.check_in_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</strong></div>
                                )}
                                {attendance.check_out_time && (
                                  <div>Check-out: <strong className="text-slate-700">{new Date(attendance.check_out_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })}</strong></div>
                                )}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 sm:self-center self-end">
                          {canCheckIn && (
                            <Button 
                              onClick={() => openCheckIn(shift)}
                              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 h-10 rounded-xl transition-all active:scale-95 shadow-sm"
                            >
                              Check-in ca trực
                            </Button>
                          )}
                          {canCheckOut && (
                            <Button 
                              onClick={() => requestCheckOut(shift)}
                              variant="outline"
                              className="border-primary text-primary hover:bg-primary/5 font-semibold px-5 h-10 rounded-xl transition-all active:scale-95"
                            >
                              Check-out ca trực
                            </Button>
                          )}
                          {!canCheckIn && !canCheckOut && attendance?.check_out_time && (
                            <div className="flex items-center gap-1 text-emerald-600 font-semibold text-sm">
                              <CheckCircle className="h-5 w-5" /> Đã xong
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12 text-slate-500 bg-slate-50/50 rounded-2xl border border-dashed">
                  <AlertCircle className="mx-auto h-8 w-8 text-slate-400 mb-3" />
                  <p className="font-medium">Không có ca làm việc nào được xếp cho bạn ngày hôm nay</p>
                  <p className="text-xs text-muted-foreground mt-1">Liên hệ với Quản lý nếu bạn cho rằng đây là sai sót.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info panel / quick tip - Right Column */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-lg rounded-[20px] overflow-hidden bg-card/50 backdrop-blur-sm">
            <CardHeader className="bg-emerald-500/5 py-5 border-b border-emerald-500/10">
              <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
                <Key className="h-4.5 w-4.5 text-emerald-600" />
                Hướng dẫn Điểm danh
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 space-y-4 text-sm leading-relaxed text-slate-600">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">1</div>
                  <p>Bấm nút <strong>"Check-in ca trực"</strong> tại ca đang hiển thị để mở bảng nhập mã PIN.</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">2</div>
                  <p>Nhập mã PIN 6 chữ cái in hoa do quản lý chi nhánh cấp trực tiếp tại quầy.</p>
                </div>
                <div className="flex gap-3">
                  <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">3</div>
                  <p>Vào cuối ca, nhớ bấm <strong>"Check-out ca trực"</strong> để kết thúc và ghi nhận giờ ra.</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border text-xs text-muted-foreground flex items-start gap-2 mt-2">
                  <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  <span><strong>Lưu ý:</strong> Chức năng quét mã QR điểm danh được dành riêng cho ứng dụng di động (Mobile App). Trên giao diện web, vui lòng chỉ sử dụng mã PIN.</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Attendance History - Full width */}
      <Card className="border-border/60 shadow-lg rounded-[20px] overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardHeader className="border-b bg-muted/30 py-5">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5 text-slate-700" />
            Nhật ký điểm danh cá nhân (my-logs)
          </CardTitle>
          <CardDescription>Xem toàn bộ lịch sử điểm danh của bản thân trước đây</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          {loadingLogs ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
              <span className="text-sm">Đang tải lịch sử điểm danh...</span>
            </div>
          ) : logs.length > 0 ? (
            <div className="rounded-xl border overflow-hidden">
              <Table>
                <TableHeader className="bg-muted/40">
                  <TableRow>
                    <TableHead>Ngày trực</TableHead>
                    <TableHead>Khung giờ ca</TableHead>
                    <TableHead>Chi nhánh</TableHead>
                    <TableHead>Giờ vào (In)</TableHead>
                    <TableHead>Giờ ra (Out)</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="max-w-[150px]">Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => {
                    const shiftDate = log.shift?.date 
                      ? new Date(log.shift.date).toLocaleDateString("vi-VN", { day: '2-digit', month: '2-digit', year: 'numeric' })
                      : "-";
                    const shiftTime = log.shift 
                      ? `${formatTime(log.shift.start_time)} - ${formatTime(log.shift.end_time)}`
                      : "-";
                    const checkInTime = log.check_in_time 
                      ? new Date(log.check_in_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
                      : "-";
                    const checkOutTime = log.check_out_time 
                      ? new Date(log.check_out_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
                      : "-";
                    
                    return (
                      <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                        <TableCell className="font-semibold text-slate-800 tabular-nums">{shiftDate}</TableCell>
                        <TableCell className="tabular-nums">{shiftTime}</TableCell>
                        <TableCell className="text-muted-foreground">{log.shift?.branch?.branch_name || (log.shift?.branch_id ? `CN: ${log.shift.branch_id}` : "OmniGym branch")}</TableCell>
                        <TableCell className="font-medium text-emerald-600 tabular-nums">{checkInTime}</TableCell>
                        <TableCell className="font-medium text-amber-600 tabular-nums">{checkOutTime}</TableCell>
                        <TableCell>{getAttendanceStatusBadge(log.status)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={log.notes || undefined}>
                          {log.notes || "-"}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground bg-slate-50/50 rounded-2xl border border-dashed">
              Chưa có bản ghi điểm danh nào trước đây.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Check-in Authentication Modal */}
      <Dialog open={checkInModalOpen} onOpenChange={setCheckInModalOpen}>
        <DialogContent className="max-w-md rounded-[20px] p-6 overflow-hidden">
          <DialogHeader className="space-y-1.5">
            <DialogTitle className="text-xl font-bold">Xác thực điểm danh</DialogTitle>
            <DialogDescription>
              {activeShift && (
                <span>Ca trực: {formatTime(activeShift.start_time)} - {formatTime(activeShift.end_time)} hôm nay</span>
              )}
            </DialogDescription>
          </DialogHeader>

          {/* PIN Input Form State */}
          <form onSubmit={handlePinSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-700 ml-0.5">Nhập mã PIN xác nhận (6 chữ cái)</label>
              <Input
                maxLength={6}
                placeholder="MÃ PIN"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value.toUpperCase())}
                className="h-12 text-center text-lg font-bold tracking-widest uppercase focus-visible:ring-emerald-500 focus-visible:border-emerald-500"
                autoFocus
                required
              />
              <p className="text-xs text-muted-foreground">Mã PIN này được cấp bởi Quản lý phòng tập tại quầy trực tiếp.</p>
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCheckInModalOpen(false)}
                className="flex-1 h-11 rounded-xl"
                disabled={submittingCheckIn}
              >
                Hủy
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground h-11 rounded-xl font-bold"
                disabled={submittingCheckIn || pinCode.length !== 6}
              >
                {submittingCheckIn ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Xác nhận
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

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
