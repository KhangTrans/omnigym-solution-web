import React from "react";
import { Clock, Loader2, MapPin, CheckCircle, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/utils/cn";
import type { WorkShift } from "@/api/workShifts";
import type { AttendanceRecord } from "@/api/attendance";
import { formatTime, getAttendanceStatusBadge } from "./AttendanceLogs";

interface TodayShiftsProps {
  shifts: WorkShift[];
  logs: AttendanceRecord[];
  loading: boolean;
  onCheckIn: (shift: WorkShift) => void;
  onCheckOut: (shift: WorkShift) => void;
}

const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const isShiftActive = (shift: WorkShift) => {
  if (shift.status === 'completed' || shift.status === 'cancelled') return false;
  
  // Check if shift is today and current time is suitable
  const today = getTodayDateString();
  if (shift.date !== today) return false;

  return true;
};

export function TodayShifts({ shifts, logs, loading, onCheckIn, onCheckOut }: TodayShiftsProps) {
  // Find if there is an existing attendance check-in for a shift id
  const getShiftAttendance = (shiftId: number) => {
    return logs.find(log => log.shift_id === shiftId);
  };

  return (
    <Card className="border-border/60 shadow-lg rounded-[20px] overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="border-b bg-muted/30 py-5">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-emerald-600 animate-pulse" />
          Ca làm việc hôm nay
        </CardTitle>
        <CardDescription>Danh sách lịch trực và trạng thái điểm danh trong ngày</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
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
                        onClick={() => onCheckIn(shift)}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-5 h-10 rounded-xl transition-all active:scale-95 shadow-sm"
                      >
                        Check-in ca trực
                      </Button>
                    )}
                    {canCheckOut && (
                      <Button 
                        onClick={() => onCheckOut(shift)}
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
  );
}
