import React, { useEffect, useState } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Activity,
  Filter,
  Key
} from "lucide-react";
import { workShiftsApi, type WorkShift } from "@/api/workShifts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// Trạng thái ca làm việc bằng Tiếng Việt
const STATUS_LABELS = {
  scheduled: { label: "Đã xếp lịch", variant: "secondary", color: "bg-sky-50 text-sky-700 border-sky-200" },
  completed: { label: "Đã hoàn thành", variant: "default", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  cancelled: { label: "Đã hủy", variant: "destructive", color: "bg-rose-50 text-rose-700 border-rose-200" },
};

export default function StaffSchedule() {
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  
  // Thống kê ca
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    cancelled: 0,
  });

  const fetchSchedule = async () => {
    try {
      setLoading(true);
      const res = await workShiftsApi.getMyShifts();
      
      // Res có cấu trúc { message, data } hoặc là mảng trực tiếp
      const data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      setShifts(data);
      
      // Tính toán thống kê
      const newStats = {
        total: data.length,
        scheduled: data.filter(s => s.status === 'scheduled').length,
        completed: data.filter(s => s.status === 'completed').length,
        cancelled: data.filter(s => s.status === 'cancelled').length,
      };
      setStats(newStats);
    } catch (err: any) {
      console.error("Lỗi khi tải lịch làm việc:", err);
      toast.error(err.response?.data?.message || "Không thể tải lịch làm việc cá nhân.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSchedule();
  }, []);

  // Hàm định dạng ngày: "Thứ Hai, 15/06/2026"
  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("vi-VN", {
        weekday: "long",
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
      });
    } catch {
      return dateString;
    }
  };

  // Lọc danh sách ca làm việc theo trạng thái được chọn
  const filteredShifts = shifts.filter(shift => {
    if (statusFilter === "all") return true;
    return shift.status === statusFilter;
  });

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* ── Header ── */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Staff Workspace</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">Lịch làm việc cá nhân</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Theo dõi danh sách ca trực được phân công, trạng thái hoàn thành và mã check-in tương ứng.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => void fetchSchedule()}
          disabled={loading}
          className="self-start shadow-sm border border-slate-200"
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} /> 
          Làm mới dữ liệu
        </Button>
      </div>

      {/* ── Grid Thống kê ── */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Tổng ca trực */}
        <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-indigo-50 text-indigo-700">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tổng số ca</div>
                <div className="text-2xl font-bold text-slate-800">{stats.total}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ca sắp tới */}
        <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-sky-50 text-sky-700">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lịch sắp tới</div>
                <div className="text-2xl font-bold text-slate-800">{stats.scheduled}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ca đã hoàn thành */}
        <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hoàn thành</div>
                <div className="text-2xl font-bold text-slate-800">{stats.completed}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ca đã hủy */}
        <Card className="border-0 shadow-sm bg-card hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-rose-50 text-rose-700">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Đã bị hủy</div>
                <div className="text-2xl font-bold text-slate-800">{stats.cancelled}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Bộ lọc ── */}
      <div className="flex flex-wrap items-center gap-3 bg-muted/30 p-4 rounded-xl border border-slate-100">
        <div className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <Filter className="h-4 w-4 text-slate-500" />
          <span>Bộ lọc trạng thái:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px] bg-white border-slate-200">
            <SelectValue placeholder="Chọn trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả trạng thái</SelectItem>
            <SelectItem value="scheduled">Đã xếp lịch</SelectItem>
            <SelectItem value="completed">Đã hoàn thành</SelectItem>
            <SelectItem value="cancelled">Đã hủy</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Danh sách ca làm việc ── */}
      <div className="space-y-4">
        {loading ? (
          <div className="py-20 text-center text-muted-foreground flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm">Đang tải lịch làm việc của bạn...</p>
          </div>
        ) : filteredShifts.length > 0 ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredShifts.map((shift) => {
              const statusInfo = STATUS_LABELS[shift.status] || { 
                label: shift.status, 
                color: "bg-slate-50 text-slate-700 border-slate-200" 
              };
              
              return (
                <Card 
                  key={shift.id} 
                  className="overflow-hidden border border-slate-100 shadow-sm hover:shadow-md hover:border-slate-200 transition-all duration-300 flex flex-col justify-between group"
                >
                  {/* Top Bar với Trạng thái */}
                  <div className="p-5 pb-0 flex items-start justify-between">
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    {shift.status === 'scheduled' && (
                      <Badge variant="outline" className="text-slate-500 font-mono text-xs flex items-center gap-1 bg-slate-50 border-slate-200">
                        <Key className="h-3 w-3 text-slate-400" />
                        PIN: {shift.check_in_code}
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-5 space-y-4 flex-1">
                    {/* Ngày */}
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Ngày trực</div>
                      <div className="font-semibold text-slate-800 flex items-center gap-2 group-hover:text-primary transition-colors">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        {formatDate(shift.date)}
                      </div>
                    </div>

                    {/* Giờ giấc */}
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Giờ làm việc</div>
                      <div className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Clock className="h-4 w-4 text-slate-400" />
                        {shift.start_time} - {shift.end_time}
                      </div>
                    </div>

                    {/* Chi nhánh */}
                    {shift.branch && (
                      <div>
                        <div className="text-xs text-muted-foreground uppercase tracking-wider mb-1 font-medium">Địa điểm</div>
                        <div className="text-sm font-semibold text-slate-700 flex items-start gap-2">
                          <MapPin className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
                          <div>
                            <div>{shift.branch.branch_name}</div>
                            <div className="text-xs text-muted-foreground font-normal mt-0.5">{shift.branch.address}</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>

                  {/* Bottom Border Accent */}
                  <div className={`h-1 w-full ${
                    shift.status === 'completed' ? 'bg-emerald-500' :
                    shift.status === 'cancelled' ? 'bg-rose-500' : 'bg-sky-500'
                  }`} />
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center p-6 bg-slate-50/50">
            <Activity className="h-10 w-10 text-slate-400 mb-3" />
            <h3 className="text-base font-bold text-slate-700">Không tìm thấy ca làm việc</h3>
            <p className="text-sm text-slate-500 mt-1 max-w-xs mx-auto">
              {statusFilter !== "all" 
                ? "Không có ca làm việc nào khớp với trạng thái lọc hiện tại."
                : "Bạn chưa được sắp ca trực nào trong hệ thống."}
            </p>
            {statusFilter !== "all" && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setStatusFilter("all")} 
                className="mt-4 border-slate-200"
              >
                Đặt lại bộ lọc
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
