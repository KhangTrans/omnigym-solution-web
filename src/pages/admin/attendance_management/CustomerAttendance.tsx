import React, { useState, useEffect, useMemo } from "react";
import { 
  Calendar, 
  Building, 
  Search, 
  Loader2, 
  RefreshCw, 
  Users, 
  MapPin, 
  Clock 
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { branchesApi } from "@/api/branches";
import { customerCheckInApi, CustomerCheckInRecord } from "@/api/customerCheckIn";
import { toast } from "sonner";

export default function CustomerAttendance() {
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
  const staffBranchId = currentUser?.staff?.branch_id || currentUser?.branch_id;

  const [branches, setBranches] = useState<any[]>([]);
  const [checkIns, setCheckIns] = useState<CustomerCheckInRecord[]>([]);
  
  // Filter states
  const [filterDate, setFilterDate] = useState(getTodayDateString());
  const [filterBranchId, setFilterBranchId] = useState(isStaff && staffBranchId ? String(staffBranchId) : "all");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [loadingCheckIns, setLoadingCheckIns] = useState(false);

  function getTodayDateString() {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Fetch branches metadata
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const res = await branchesApi.getAll();
        setBranches(Array.isArray(res.data) ? res.data : (res.data?.data ?? []));
      } catch (err) {
        console.error("Error fetching branches:", err);
        toast.error("Không thể tải danh sách chi nhánh");
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  // Fetch check-in logs
  const fetchCheckIns = async () => {
    try {
      setLoadingCheckIns(true);
      
      // Request filters to backend
      const params: any = {};
      if (filterBranchId !== "all") {
        params.branch_id = filterBranchId;
      }
      if (filterDate) {
        params.date = filterDate;
      }

      const res = userRole === "admin"
        ? await customerCheckInApi.getAllForAdmin(params)
        : await customerCheckInApi.getAllForBranch(params);

      setCheckIns(Array.isArray(res.data) ? res.data : res.data ?? []);
    } catch (err: any) {
      console.error(err);
      toast.error("Không thể tải lịch sử check-in của hội viên");
      setCheckIns([]);
    } finally {
      setLoadingCheckIns(false);
    }
  };

  useEffect(() => {
    fetchCheckIns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterDate, filterBranchId]);

  // Frontend filter for search term (filtering by name, email, phone)
  const filteredCheckIns = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return checkIns;

    return checkIns.filter((log) => {
      const user = log.customer?.user;
      if (!user) return false;
      return (
        (user.full_name || "").toLowerCase().includes(term) ||
        (user.email || "").toLowerCase().includes(term) ||
        (user.phone_number || "").includes(term)
      );
    });
  }, [checkIns, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in-0 duration-500">
      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
          <Users className="h-6 w-6 text-emerald-600" />
          Nhật ký Check-in của Hội viên
        </h1>
        <p className="text-sm text-slate-500 mt-1">
          Theo dõi và quản lý việc check-in phòng tập hàng ngày của các khách hàng (hội viên) mua gói tập.
        </p>
      </div>

      {/* Toolbar Filter */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-card rounded-2xl border shadow-sm">
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
          <Select value={filterBranchId} onValueChange={setFilterBranchId} disabled={loadingBranches || isStaff}>
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

        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            type="text"
            placeholder="Tìm theo tên, email, sđt hội viên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9 h-9 border-border bg-background"
          />
        </div>
        
        <Button 
          variant="outline" 
          size="sm"
          onClick={fetchCheckIns} 
          className="h-9 gap-1.5 ml-auto text-slate-700 border-border"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Làm mới
        </Button>
      </div>

      {/* Logs Table */}
      <Card className="border-border/60 shadow-lg rounded-[20px]">
        <CardHeader className="py-5 border-b">
          <CardTitle className="text-base font-bold">Danh sách hội viên đi tập</CardTitle>
          <CardDescription>
            {filterDate ? `Ngày ghi nhận: ${new Date(filterDate).toLocaleDateString("vi-VN")}` : 'Toàn bộ thời gian'}
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow>
                <TableHead className="pl-6">Hội viên (Customer)</TableHead>
                <TableHead>Chi nhánh</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Thời gian check-in</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingCheckIns ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                      <span>Đang tải nhật ký check-in...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCheckIns.length > 0 ? (
                filteredCheckIns.map((log) => {
                  const user = log.customer?.user;
                  const name = user?.full_name || "Khách hàng ẩn danh";
                  const email = user?.email || "Chưa cập nhật email";
                  const phone = user?.phone_number || "Chưa cập nhật SĐT";
                  
                  const branchName = log.branch?.branch_name || `Chi nhánh ID: ${log.branch_id}`;
                  const address = log.branch?.address || "-";
                  
                  const time = new Date(log.check_in_time).toLocaleTimeString("vi-VN", { 
                    hour: '2-digit', 
                    minute: '2-digit', 
                    second: '2-digit' 
                  });

                  return (
                    <TableRow key={log.id} className="hover:bg-slate-50/50">
                      <TableCell className="pl-6 font-semibold text-slate-800 py-3.5">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 rounded-full bg-emerald-100 text-emerald-700 font-bold flex items-center justify-center text-xs">
                            {name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div>{name}</div>
                            <div className="text-[11px] text-muted-foreground font-normal flex flex-wrap gap-x-2">
                              <span>Email: {email}</span>
                              <span>·</span>
                              <span>SĐT: {phone}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{branchName}</TableCell>
                      <TableCell className="text-slate-500 text-xs flex items-center gap-1.5 py-4">
                        <MapPin className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span>{address}</span>
                      </TableCell>
                      <TableCell className="font-semibold text-emerald-600 tabular-nums">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-emerald-500" />
                          {time}
                        </span>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-10 text-muted-foreground italic">
                    Chưa có lượt check-in nào được ghi nhận cho bộ lọc đã chọn.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
