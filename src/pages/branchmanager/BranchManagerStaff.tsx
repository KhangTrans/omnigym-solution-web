import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import {
  UserPlus,
  Users,
  Eye,
  EyeOff,
  RefreshCw,
  Lock,
  Unlock,
  Search,
} from "lucide-react";
import { staffAPI, type StaffUser, type CreateStaffPayload } from "@/api/staffs";
import { rsaService } from "@/utils/rsa";

type FormState = {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone_number: string;
  department: string;
  avatar_url: string;
};

const emptyForm: FormState = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone_number: "",
  department: "",
  avatar_url: "",
};

export default function BranchManagerStaff() {
  // ── Data state ──
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // ── Form state ──
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Lock/Unlock state ──
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [confirmStaff, setConfirmStaff] = useState<StaffUser | null>(null);

  // ── Load data ──
  const fetchStaffList = async () => {
    try {
      setLoading(true);
      const response = await staffAPI.list();
      setStaffList(response.data.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Không thể tải danh sách nhân viên.";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchStaffList();
  }, []);

  // ── Filter ──
  const filtered = staffList.filter((s) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (s.full_name || "").toLowerCase().includes(q) ||
      (s.email || "").toLowerCase().includes(q)
    );
  });

  // ── Helper ──
  const setField = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleOpenModal = () => {
    setForm(emptyForm);
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (submitting) return;

    if (!form.full_name.trim()) {
      return toast.error("Vui lòng nhập họ tên nhân viên.");
    }
    if (!form.email.trim()) {
      return toast.error("Vui lòng nhập email.");
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email.trim())) {
      return toast.error("Định dạng email không hợp lệ.");
    }
    if (!form.password || form.password.length < 6) {
      return toast.error("Mật khẩu phải có ít nhất 6 ký tự.");
    }
    if (form.password !== form.confirm_password) {
      return toast.error("Xác nhận mật khẩu không khớp.");
    }

    try {
      setSubmitting(true);

      const encryptedPassword = await rsaService.encrypt(form.password);

      const payload: CreateStaffPayload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: encryptedPassword,
        phone_number: form.phone_number.trim() || undefined,
        department: form.department.trim() || undefined,
        avatar_url: form.avatar_url.trim() || undefined,
      };

      await staffAPI.create(payload);
      toast.success("Tạo tài khoản Staff thành công.");
      setShowModal(false);
      void fetchStaffList();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Tạo tài khoản thất bại.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const setPending = (staffId: number, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(staffId);
      else next.delete(staffId);
      return next;
    });
  };

  const handleToggleStatus = async (staff: StaffUser) => {
    const currentStatus = String(staff.status || "").toLowerCase();
    const nextStatus = currentStatus === "active" ? "locked" : "active";

    try {
      setPending(staff.id, true);
      await staffAPI.updateStatus(staff.id, nextStatus as "active" | "locked");

      setStaffList((prev) =>
        prev.map((s) => (s.id === staff.id ? { ...s, status: nextStatus } : s))
      );

      toast.success(
        nextStatus === "locked"
          ? "Đã khóa tài khoản Staff"
          : "Đã mở khóa tài khoản Staff"
      );
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Thao tác thất bại.";
      toast.error(message);
    } finally {
      setPending(staff.id, false);
    }
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">
            Branch workspace
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Tài khoản Nhân viên</h1>
          <p className="text-sm text-muted-foreground">
            {staffList.length} nhân viên đang hoạt động trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="bm-staff-refresh-btn"
            variant="outline"
            size="sm"
            onClick={() => void fetchStaffList()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button id="bm-staff-create-btn" onClick={handleOpenModal}>
            <UserPlus className="h-4 w-4 mr-2" />
            Tạo tài khoản Staff
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Danh sách nhân viên
          </CardTitle>
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Tìm kiếm theo tên, email..."
              className="pl-8"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Họ tên</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead className="hidden sm:table-cell">Số điện thoại</TableHead>
                  <TableHead className="hidden lg:table-cell">Phòng ban</TableHead>
                  <TableHead className="hidden lg:table-cell">Chi nhánh</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden xl:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="h-24 text-center text-muted-foreground"
                    >
                      Đang tải danh sách nhân viên...
                    </TableCell>
                  </TableRow>
                ) : filtered.length > 0 ? (
                  filtered.map((s) => {
                    const name = s.full_name || s.email || "Chưa có tên";
                    const status = String(s.status || "").toLowerCase();
                    const department = s.staff?.department || "—";
                    const branchName = s.staff?.branch?.branch_name || "—";
                    const createdAt = s.created_at ? s.created_at.slice(0, 10) : "—";

                    return (
                      <TableRow key={s.id}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {s.email || "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {s.phone_number || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {department}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell">
                          {branchName}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              status === "active" ? "default" : "destructive"
                            }
                          >
                            {status === "active" ? "Hoạt động" : "Khóa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell tabular-nums text-muted-foreground">
                          {createdAt}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={
                              status === "active" ? "danger-glass" : "success-glass"
                            }
                            onClick={() => setConfirmStaff(s)}
                            disabled={pendingIds.has(s.id)}
                          >
                            {status === "active" ? (
                              <Lock className="mr-2 h-4 w-4" />
                            ) : (
                              <Unlock className="mr-2 h-4 w-4" />
                            )}
                            {status === "active" ? "Khóa" : "Mở khóa"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      {searchQuery
                        ? "Không tìm thấy nhân viên phù hợp."
                        : "Chưa có nhân viên nào. Hãy tạo tài khoản Staff đầu tiên."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create Staff Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Tạo tài khoản Staff mới
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Họ tên */}
            <div className="grid gap-1.5">
              <Label htmlFor="bm-staff-full-name">
                Họ tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bm-staff-full-name"
                placeholder="Nhập họ tên nhân viên"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="grid gap-1.5">
              <Label htmlFor="bm-staff-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bm-staff-email"
                type="email"
                placeholder="example@omnigym.vn"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="grid gap-1.5">
              <Label htmlFor="bm-staff-password">
                Mật khẩu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="bm-staff-password"
                  name="bm-create-staff-password"
                  autoComplete="new-password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Ít nhất 6 ký tự"
                  value={form.password}
                  onChange={(e) => setField("password", e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="grid gap-1.5">
              <Label htmlFor="bm-staff-confirm-password">
                Xác nhận mật khẩu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="bm-staff-confirm-password"
                  name="bm-create-staff-confirm-password"
                  autoComplete="new-password"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Nhập lại mật khẩu"
                  value={form.confirm_password}
                  onChange={(e) => setField("confirm_password", e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  onClick={() => setShowConfirmPassword((v) => !v)}
                  aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="grid gap-1.5">
              <Label htmlFor="bm-staff-phone">Số điện thoại</Label>
              <Input
                id="bm-staff-phone"
                type="tel"
                placeholder="0xxx xxxxxx"
                value={form.phone_number}
                onChange={(e) => setField("phone_number", e.target.value)}
              />
            </div>

            {/* Department */}
            <div className="grid gap-1.5">
              <Label htmlFor="bm-staff-department">Phòng ban</Label>
              <Input
                id="bm-staff-department"
                placeholder="Vd: Lễ tân, Kỹ thuật..."
                value={form.department}
                onChange={(e) => setField("department", e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              id="bm-staff-cancel-btn"
              variant="outline"
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              id="bm-staff-submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Confirm Lock/Unlock dialog ── */}
      <AlertDialog
        open={Boolean(confirmStaff)}
        onOpenChange={(open) => {
          if (!open) setConfirmStaff(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thao tác</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmStaff?.status === "active"
                ? `Bạn có chắc muốn khóa tài khoản của nhân viên "${confirmStaff?.full_name || confirmStaff?.email}" không?`
                : `Bạn có chắc muốn mở khóa tài khoản của nhân viên "${confirmStaff?.full_name || confirmStaff?.email}" không?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmStaff) {
                  const target = confirmStaff;
                  setConfirmStaff(null);
                  void handleToggleStatus(target);
                }
              }}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
