import React from "react";
import { Loader2, ArrowRightLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AttendanceRecord } from "@/api/attendance";

interface AttendanceLogsProps {
  logs: AttendanceRecord[];
  loading: boolean;
}

export const formatTime = (timeStr?: string | null) => {
  if (!timeStr) return "-";
  try {
    return timeStr.slice(0, 5);
  } catch {
    return timeStr;
  }
};

export const getAttendanceStatusBadge = (status: string) => {
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

export function AttendanceLogs({ logs, loading }: AttendanceLogsProps) {
  return (
    <Card className="min-h-[280px] border-0 shadow-sm rounded-xl overflow-hidden bg-card">
      <CardHeader className="bg-muted/40 py-5">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-slate-700" />
          Nhật ký điểm danh cá nhân (my-logs)
        </CardTitle>
        <CardDescription>Xem toàn bộ lịch sử điểm danh của bản thân trước đây</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
            <span className="text-sm">Đang tải lịch sử điểm danh...</span>
          </div>
        ) : logs.length > 0 ? (
          <div className="rounded-xl overflow-hidden shadow-sm">
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
                  const start = log.shift?.shift?.start_time || log.shift?.start_time;
                  const end = log.shift?.shift?.end_time || log.shift?.end_time;
                  const shiftTime = start && end ? `${formatTime(start)} - ${formatTime(end)}` : "-";
                  const checkInTime = log.check_in_time 
                    ? new Date(log.check_in_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
                    : "-";
                  const checkOutTime = log.check_out_time 
                    ? new Date(log.check_out_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
                    : "-";
                  
                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/50 transition-colors">
                      <TableCell className="font-semibold text-foreground tabular-nums">{shiftDate}</TableCell>
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
          <div className="text-center py-10 text-muted-foreground bg-muted/30 rounded-xl shadow-sm">
            Chưa có bản ghi điểm danh nào trước đây.
          </div>
        )}
      </CardContent>
    </Card>
  );
}
