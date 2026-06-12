import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  ClipboardCheck, 
  Building, 
  Search, 
  Key, 
  User, 
  FileText,
  AlertCircle,
  Loader2,
  RefreshCw,
  CheckCircle,
  XCircle,
  CalendarCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { workShiftsApi, type WorkShift } from "@/api/workShifts";
import { attendanceApi, type AttendanceRecord } from "@/api/attendance";
import { branchesApi } from "@/api/branches";
import { usersApi, type ApiUser } from "@/api/users";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

export default function AttendanceManagement() {
  const userData = localStorage.getItem("user");
  let currentUser: any = null;
  try {
    currentUser = userData && userData !== "undefined" ? JSON.parse(userData) : null;
  } catch (e) {
    console.error("Failed to parse user data from localStorage", e);
  }

  const getRoleName = (u: any) => {
    if (!u) return "";
    if (typeof u.role === "object" && u.role?.role_name) {
      return String(u.role.role_name).toLowerCase();
    }
    return String(u.role || "").toLowerCase();
  };
  const userRole = getRoleName(currentUser);
  const isStaff = userRole === "staff";

  const [activeTab, setActiveTab] = useState("shifts");
  const [branches, setBranches] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<ApiUser[]>([]);
  
  // Filtering & selection state
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [filterBranchId, setFilterBranchId] = useState("all");
  
  // Data lists
  const [shifts, setShifts] = useState<WorkShift[]>([]);
  const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
  
  // Loading states
  const [loadingShifts, setLoadingShifts] = useState(false);
  const [loadingAttendances, setLoadingAttendances] = useState(false);
  const [submittingShift, setSubmittingShift] = useState(false);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Dialog states for shifts
  const [shiftDialogOpen, setShiftDialogOpen] = useState(false);
  const [selectedShift, setSelectedShift] = useState<WorkShift | null>(null); // Null if creating
  const [shiftForm, setShiftForm] = useState({
    user_id: "",
    branch_id: "",
    date: getTodayDateString(),
    start_time: "08:00",
    end_time: "17:00",
    check_in_code: "",
    status: "scheduled" as 'scheduled' | 'completed' | 'cancelled'
  });

  // Dialog states for attendance edits
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<AttendanceRecord | null>(null);
  const [attendanceForm, setAttendanceForm] = useState({
    check_in_time: "",
    check_out_time: "",
    status: "present" as 'present' | 'absent' | 'late' | 'excused',
    notes: ""
  });

  function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Fetch branches and staff once
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [branchesRes, usersRes] = await Promise.all([
          branchesApi.getAll(),
          isStaff ? Promise.resolve({ data: { data: [] } }) : usersApi.list({ role: "Staff", limit: 100 })
        ]);
        setBranches(Array.isArray(branchesRes.data) ? branchesRes.data : (branchesRes.data?.data ?? []));
        setStaffList(usersRes?.data?.data || []);
      } catch (err) {
        console.error("Meta fetch error:", err);
      }
    };
    fetchMeta();
  }, [isStaff]);

  // Fetch data depending on active tab & filters
  const fetchShifts = async () => {
    try {
      setLoadingShifts(true);
      const res = await workShiftsApi.list({ date: filterDate });
      let data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      if (filterBranchId !== "all") {
        data = data.filter((s: WorkShift) => String(s.branch_id) === filterBranchId);
      }
      if (isStaff && currentUser) {
        data = data.filter((s: WorkShift) => s.user_id === currentUser.id);
      }
      setShifts(data);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải danh sách ca làm việc");
      setShifts([]);
    } finally {
      setLoadingShifts(false);
    }
  };

  const fetchAttendances = async () => {
    try {
      setLoadingAttendances(true);
      let data = [];
      if (isStaff) {
        // Staff can only read their own logs via my-logs endpoint
        const res = await attendanceApi.getMyLogs();
        data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
        // Filter by date on frontend
        if (filterDate) {
          data = data.filter((log: AttendanceRecord) => {
            if (!log.shift?.date) return false;
            const shiftDateStr = new Date(log.shift.date).toISOString().split('T')[0];
            return shiftDateStr === filterDate;
          });
        }
      } else {
        // Manager/Admin can query the entire branch/date
        const res = await attendanceApi.getAll({ 
          date: filterDate,
          branch_id: filterBranchId === "all" ? undefined : filterBranchId
        });
        data = res.data?.data || (Array.isArray(res.data) ? res.data : []);
      }
      setAttendances(data);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải nhật ký điểm danh");
      setAttendances([]);
    } finally {
      setLoadingAttendances(false);
    }
  };

  useEffect(() => {
    if (activeTab === "shifts") {
      fetchShifts();
    } else {
      fetchAttendances();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, filterDate, filterBranchId]);

  const generatePin = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let pin = "";
    for (let i = 0; i < 6; i++) {
      pin += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setShiftForm(prev => ({ ...prev, check_in_code: pin }));
  };

  const handleOpenCreateShift = () => {
    setSelectedShift(null);
    setShiftForm({
      user_id: staffList[0]?.id ? String(staffList[0].id) : "",
      branch_id: branches[0]?.id ? String(branches[0].id) : "",
      date: filterDate,
      start_time: "08:00",
      end_time: "17:00",
      check_in_code: "",
      status: "scheduled"
    });
    setShiftDialogOpen(true);
    // Auto generate pin
    setTimeout(() => {
      generatePin();
    }, 50);
  };

  const handleOpenEditShift = (shift: WorkShift) => {
    setSelectedShift(shift);
    setShiftForm({
      user_id: String(shift.user_id),
      branch_id: String(shift.branch_id),
      date: shift.date,
      start_time: shift.start_time.slice(0, 5),
      end_time: shift.end_time.slice(0, 5),
      check_in_code: shift.check_in_code,
      status: shift.status
    });
    setShiftDialogOpen(true);
  };

  const handleShiftSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shiftForm.user_id || !shiftForm.branch_id || !shiftForm.date || !shiftForm.start_time || !shiftForm.end_time || !shiftForm.check_in_code) {
      toast.error("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    try {
      setSubmittingShift(true);
      const payload = {
        user_id: Number(shiftForm.user_id),
        branch_id: Number(shiftForm.branch_id),
        date: shiftForm.date,
        start_time: shiftForm.start_time + ":00",
        end_time: shiftForm.end_time + ":00",
        check_in_code: shiftForm.check_in_code
      };

      if (selectedShift) {
        // Edit
        await workShiftsApi.update(selectedShift.id, {
          date: payload.date,
          start_time: payload.start_time,
          end_time: payload.end_time,
          check_in_code: payload.check_in_code,
          status: shiftForm.status
        });
        toast.success("Cập nhật ca làm việc thành công!");
      } else {
        // Create
        await workShiftsApi.create(payload);
        toast.success("Tạo ca làm việc thành công!");
      }

      setShiftDialogOpen(false);
      fetchShifts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Không thể lưu ca làm việc");
    } finally {
      setSubmittingShift(false);
    }
  };

  const handleDeleteShift = async (id: number) => {
    if (!window.confirm("Bạn có chắc chắn muốn xóa ca làm trực này không?")) return;
    try {
      setLoadingShifts(true);
      await workShiftsApi.delete(id);
      toast.success("Đã xóa ca trực thành công!");
      fetchShifts();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Xóa ca trực thất bại");
    } finally {
      setLoadingShifts(false);
    }
  };

  // Convert Date object to datetime-local string format YYYY-MM-DDThh:mm
  const formatDatetimeLocal = (dateString?: string) => {
    if (!dateString) return "";
    const d = new Date(dateString);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
  };

  const handleOpenEditAttendance = (att: AttendanceRecord) => {
    setSelectedAttendance(att);
    setAttendanceForm({
      check_in_time: formatDatetimeLocal(att.check_in_time),
      check_out_time: formatDatetimeLocal(att.check_out_time),
      status: att.status,
      notes: att.notes || ""
    });
    setAttendanceDialogOpen(true);
  };

  const handleAttendanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAttendance) return;

    try {
      setSubmittingAttendance(true);
      const payload = {
        check_in_time: attendanceForm.check_in_time ? new Date(attendanceForm.check_in_time).toISOString() : undefined,
        check_out_time: attendanceForm.check_out_time ? new Date(attendanceForm.check_out_time).toISOString() : undefined,
        status: attendanceForm.status,
        notes: attendanceForm.notes
      };

      await attendanceApi.update(selectedAttendance.id, payload);
      toast.success("Cập nhật nhật ký điểm danh thành công!");
      setAttendanceDialogOpen(false);
      fetchAttendances();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const getStatusBadge = (status: string) => {
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

  const getShiftStatusBadge = (status: string) => {
    switch (status) {
      case "scheduled":
        return <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50/30">Lên lịch</Badge>;
      case "completed":
        return <Badge variant="outline" className="border-slate-300 text-slate-700 bg-slate-50/50">Hoàn thành</Badge>;
      case "cancelled":
        return <Badge variant="outline" className="border-rose-300 text-rose-700 bg-rose-50/30">Hủy</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* Title block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <CalendarCheck className="h-6 w-6 text-emerald-600" />
            Quản lý Điểm danh & Xếp ca
          </h1>
          <p className="text-sm text-slate-500 mt-1">Lập kế hoạch làm việc cho Staff và quản lý nhật ký check-in/out chi nhánh.</p>
        </div>
      </div>

      {/* Toolbar filter */}
      <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-card p-4 shadow-[0_2px_12px_rgba(15,23,42,0.08)]">
        <div className="flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-muted-foreground" />
          <Input 
            type="date"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            className="w-[160px] h-9 border-border bg-background"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Building className="h-4.5 w-4.5 text-muted-foreground" />
          <Select value={filterBranchId} onValueChange={setFilterBranchId}>
            <SelectTrigger className="w-[180px] h-9 bg-background">
              <SelectValue placeholder="Tất cả chi nhánh" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              {branches.map((b) => (
                <SelectItem key={b.id} value={String(b.id)}>{b.branch_name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button 
          variant="outline" 
          size="sm"
          onClick={() => { activeTab === "shifts" ? fetchShifts() : fetchAttendances(); }} 
          className="h-9 gap-1.5 ml-auto text-slate-700 border-border"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </Button>
      </div>

      {/* Main tab panel */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full space-y-6">
        <TabsList className="grid grid-cols-2 max-w-[400px] bg-slate-100 p-1 rounded-xl">
          <TabsTrigger value="shifts" className="rounded-lg font-bold">Xếp ca làm việc</TabsTrigger>
          <TabsTrigger value="logs" className="rounded-lg font-bold">Nhật ký điểm danh</TabsTrigger>
        </TabsList>

        {/* Tab 1: Shift management */}
        <TabsContent value="shifts" className="space-y-4">
          <Card className="border-0 shadow-[0_2px_12px_rgba(15,23,42,0.08)] rounded-[20px]">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 py-5 border-b">
              <div>
                <CardTitle className="text-base font-bold">Danh sách ca làm việc</CardTitle>
                <CardDescription>Thời gian xếp ca: {new Date(filterDate).toLocaleDateString("vi-VN")}</CardDescription>
              </div>
              {!isStaff && (
                <Button 
                  onClick={handleOpenCreateShift}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs h-9 px-4 rounded-xl shadow-sm"
                >
                  <Plus className="mr-1 h-4 w-4" /> Thêm ca trực mới
                </Button>
              )}
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6">Nhân viên (Staff)</TableHead>
                    <TableHead>Chi nhánh</TableHead>
                    <TableHead>Thời gian ca</TableHead>
                    <TableHead>Mã PIN Check-in</TableHead>
                    <TableHead>Trạng thái ca</TableHead>
                    {!isStaff && <TableHead className="text-right pr-6">Thao tác</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingShifts ? (
                    <TableRow>
                      <TableCell colSpan={isStaff ? 5 : 6} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                          <span>Đang tải danh sách ca...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : shifts.length > 0 ? (
                    shifts.map((shift) => (
                      <TableRow key={shift.id} className="hover:bg-slate-50/50">
                        <TableCell className="pl-6 font-semibold text-slate-800 flex items-center gap-2 py-3.5">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                            {shift.user?.full_name?.charAt(0).toUpperCase() || <User className="h-4 w-4" />}
                          </div>
                          <div>
                            <div>{shift.user?.full_name || "Nhân viên chưa đặt tên"}</div>
                            <div className="text-xs text-muted-foreground font-normal">{shift.user?.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{shift.branch?.branch_name || `Mã CN: ${shift.branch_id}`}</TableCell>
                        <TableCell className="font-medium tabular-nums">
                          {shift.start_time.slice(0, 5)} - {shift.end_time.slice(0, 5)}
                        </TableCell>
                        <TableCell className="tabular-nums font-bold text-slate-700">
                          {isStaff ? (
                            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200 text-slate-400">******</span>
                          ) : (
                            <span className="bg-slate-100 px-2.5 py-1 rounded border border-slate-200">{shift.check_in_code}</span>
                          )}
                        </TableCell>
                        <TableCell>{getShiftStatusBadge(shift.status)}</TableCell>
                        {!isStaff && (
                          <TableCell className="text-right pr-6 space-x-1.5">
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleOpenEditShift(shift)}
                              className="h-8 w-8 text-blue-600 hover:bg-blue-50"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              onClick={() => handleDeleteShift(shift.id)}
                              className="h-8 w-8 text-rose-600 hover:bg-rose-50"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isStaff ? 5 : 6} className="text-center py-10 text-muted-foreground">
                        Không có ca làm việc nào được xếp trong ngày này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Attendance records */}
        <TabsContent value="logs" className="space-y-4">
          <Card className="border-0 shadow-[0_2px_12px_rgba(15,23,42,0.08)] rounded-[20px]">
            <CardHeader className="py-5 border-b">
              <CardTitle className="text-base font-bold">Nhật ký điểm danh chi nhánh</CardTitle>
              <CardDescription>Bảng ghi nhận giờ vào/ra thực tế của nhân viên</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="pl-6">Nhân viên</TableHead>
                    <TableHead>Chi nhánh</TableHead>
                    <TableHead>Ca trực (Lý thuyết)</TableHead>
                    <TableHead>Giờ vào thực tế</TableHead>
                    <TableHead>Giờ ra thực tế</TableHead>
                    <TableHead>Đánh giá</TableHead>
                    <TableHead className="max-w-[150px]">Ghi chú</TableHead>
                    {!isStaff && <TableHead className="text-right pr-6">Điều chỉnh</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingAttendances ? (
                    <TableRow>
                      <TableCell colSpan={isStaff ? 7 : 8} className="h-24 text-center">
                        <div className="flex items-center justify-center gap-2 text-muted-foreground">
                          <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                          <span>Đang tải nhật ký điểm danh...</span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : attendances.length > 0 ? (
                    attendances.map((log) => {
                      const name = log.user?.full_name || "Staff";
                      const branchName = log.shift?.branch?.branch_name || (log.shift?.branch_id 
                        ? (branches.find(b => b.id === log.shift?.branch_id)?.branch_name || `CN: ${log.shift.branch_id}`)
                        : "-");
                      const shiftTime = log.shift 
                        ? `${log.shift.start_time.slice(0, 5)} - ${log.shift.end_time.slice(0, 5)}`
                        : "-";
                      const checkIn = log.check_in_time 
                        ? new Date(log.check_in_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
                        : "-";
                      const checkOut = log.check_out_time 
                        ? new Date(log.check_out_time).toLocaleTimeString("vi-VN", { hour: '2-digit', minute: '2-digit' })
                        : "-";
                        
                      return (
                        <TableRow key={log.id} className="hover:bg-slate-50/50">
                          <TableCell className="pl-6 font-semibold text-slate-800 py-3.5">
                            <div>{name}</div>
                            <div className="text-xs text-muted-foreground font-normal">{log.user?.email}</div>
                          </TableCell>
                          <TableCell>{branchName}</TableCell>
                          <TableCell className="tabular-nums">{shiftTime}</TableCell>
                          <TableCell className="font-semibold text-emerald-600 tabular-nums">{checkIn}</TableCell>
                          <TableCell className="font-semibold text-amber-600 tabular-nums">{checkOut}</TableCell>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell className="text-xs text-muted-foreground max-w-[150px] truncate" title={log.notes || undefined}>
                            {log.notes || "-"}
                          </TableCell>
                          {!isStaff && (
                            <TableCell className="text-right pr-6">
                              <Button 
                                onClick={() => handleOpenEditAttendance(log)}
                                variant="outline"
                                size="sm"
                                className="text-primary border-primary hover:bg-primary/5 h-8 font-semibold rounded-lg text-xs"
                              >
                                <Edit className="mr-1 h-3.5 w-3.5" /> Chỉnh sửa
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={isStaff ? 7 : 8} className="text-center py-10 text-muted-foreground">
                        Chưa có bản ghi điểm danh nào ghi nhận trong ngày này.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal 1: Shift Dialog (Create / Edit) */}
      <Dialog open={shiftDialogOpen} onOpenChange={setShiftDialogOpen}>
        <DialogContent className="max-w-md rounded-[20px] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              {selectedShift ? "Chỉnh sửa ca làm việc" : "Tạo ca làm việc mới"}
            </DialogTitle>
            <DialogDescription>Nhập thông tin lịch làm việc để nhân viên điểm danh</DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleShiftSubmit} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="shift-user">Nhân viên trực *</Label>
              <Select 
                value={shiftForm.user_id} 
                onValueChange={(v) => setShiftForm(prev => ({ ...prev, user_id: v }))}
                disabled={!!selectedShift} // Do not change user on edit
              >
                <SelectTrigger id="shift-user" className="bg-background">
                  <SelectValue placeholder="Chọn nhân viên" />
                </SelectTrigger>
                <SelectContent>
                  {staffList.map((user) => (
                    <SelectItem key={user.id} value={String(user.id)}>
                      {user.full_name || user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shift-branch">Chi nhánh làm việc *</Label>
              <Select 
                value={shiftForm.branch_id} 
                onValueChange={(v) => setShiftForm(prev => ({ ...prev, branch_id: v }))}
                disabled={!!selectedShift}
              >
                <SelectTrigger id="shift-branch" className="bg-background">
                  <SelectValue placeholder="Chọn chi nhánh" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.branch_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="shift-date">Ngày trực *</Label>
                <Input 
                  type="date" 
                  id="shift-date" 
                  value={shiftForm.date}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, date: e.target.value }))}
                  required
                />
              </div>
              
              <div className="space-y-1.5">
                <Label htmlFor="shift-status">Trạng thái ca *</Label>
                <Select 
                  value={shiftForm.status} 
                  onValueChange={(v: any) => setShiftForm(prev => ({ ...prev, status: v }))}
                  disabled={!selectedShift} // Status only editable on edit
                >
                  <SelectTrigger id="shift-status" className="bg-background">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">Lên lịch</SelectItem>
                    <SelectItem value="completed">Hoàn thành</SelectItem>
                    <SelectItem value="cancelled">Hủy</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="shift-start">Giờ bắt đầu *</Label>
                <Input 
                  type="time" 
                  id="shift-start" 
                  value={shiftForm.start_time}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, start_time: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="shift-end">Giờ kết thúc *</Label>
                <Input 
                  type="time" 
                  id="shift-end" 
                  value={shiftForm.end_time}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, end_time: e.target.value }))}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="shift-pin">Mã PIN xác thực ca trực *</Label>
              <div className="flex gap-2">
                <Input 
                  type="text" 
                  id="shift-pin" 
                  maxLength={6}
                  value={shiftForm.check_in_code}
                  onChange={(e) => setShiftForm(prev => ({ ...prev, check_in_code: e.target.value.toUpperCase() }))}
                  className="font-mono tracking-widest text-center font-bold"
                  placeholder="6 CHỮ CÁI"
                  required
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={generatePin}
                  className="px-3 border-border hover:bg-slate-100"
                >
                  <Key className="h-4.5 w-4.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">Nhân viên có thể nhập mã này thay thế cho quét QR để Check-in.</p>
            </div>

            <DialogFooter className="pt-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShiftDialogOpen(false)}
                className="h-10 rounded-xl"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={submittingShift}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 rounded-xl"
              >
                {submittingShift ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Lưu ca làm
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal 2: Edit Attendance Record */}
      <Dialog open={attendanceDialogOpen} onOpenChange={setAttendanceDialogOpen}>
        <DialogContent className="max-w-md rounded-[20px] p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Điều chỉnh thông tin điểm danh</DialogTitle>
            <DialogDescription>
              {selectedAttendance && (
                <span>Điều chỉnh nhật ký cho {selectedAttendance.user?.full_name}</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAttendanceSubmit} className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="att-in">Giờ vào thực tế (Check-in time)</Label>
              <Input 
                type="datetime-local" 
                id="att-in" 
                value={attendanceForm.check_in_time}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, check_in_time: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="att-out">Giờ ra thực tế (Check-out time)</Label>
              <Input 
                type="datetime-local" 
                id="att-out" 
                value={attendanceForm.check_out_time}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, check_out_time: e.target.value }))}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="att-status">Đánh giá chuyên cần</Label>
              <Select 
                value={attendanceForm.status} 
                onValueChange={(v: any) => setAttendanceForm(prev => ({ ...prev, status: v }))}
              >
                <SelectTrigger id="att-status" className="bg-background">
                  <SelectValue placeholder="Chọn trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Đúng giờ (Present)</SelectItem>
                  <SelectItem value="late">Đi muộn (Late)</SelectItem>
                  <SelectItem value="absent">Vắng mặt (Absent)</SelectItem>
                  <SelectItem value="excused">Có phép (Excused)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="att-notes">Ghi chú điều chỉnh</Label>
              <Textarea 
                id="att-notes" 
                placeholder="Nhập lý do sửa đổi hoặc ghi chú về ca làm việc của nhân viên..."
                value={attendanceForm.notes}
                onChange={(e) => setAttendanceForm(prev => ({ ...prev, notes: e.target.value }))}
                rows={3}
              />
            </div>

            <DialogFooter className="pt-3">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setAttendanceDialogOpen(false)}
                className="h-10 rounded-xl"
              >
                Hủy
              </Button>
              <Button 
                type="submit" 
                disabled={submittingAttendance}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-10 rounded-xl"
              >
                {submittingAttendance ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                Cập nhật ghi nhận
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
