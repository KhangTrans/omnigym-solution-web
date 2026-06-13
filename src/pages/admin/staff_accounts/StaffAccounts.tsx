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
import { UserPlus, Users, Eye, EyeOff, RefreshCw } from "lucide-react";
import { staffAPI, type StaffUser, type CreateStaffPayload } from "@/api/staffs";
import { branchesApi } from "@/api/branches";
import { rsaService } from "@/utils/rsa";

type Branch = {
  id: number;
  branch_name?: string;
};

type FormState = {
  full_name: string;
  email: string;
  password: string;
  confirm_password: string;
  phone_number: string;
  department: string;
  branch_id: string;
  avatar_url: string;
};

const emptyForm: FormState = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone_number: "",
  department: "",
  branch_id: "",
  avatar_url: "",
};

function StaffAccountsPage() {
  // ── Data state ──
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form state ──
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

  const fetchBranches = async () => {
    try {
      const response = await branchesApi.getAll({ limit: 100 });
      const resData = response.data;
      let list: any[] = [];
      if (resData) {
        if (Array.isArray(resData)) {
          list = resData;
        } else if (Array.isArray(resData.branches)) {
          list = resData.branches;
        } else if (Array.isArray(resData.data)) {
          list = resData.data;
        }
      }
      setBranches(list);
    } catch (err) {
      console.error("Failed to load branches:", err);
    }
  };

  useEffect(() => {
    void fetchStaffList();
    void fetchBranches();
  }, []);

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

    // Validate
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

      const branchIdNum = form.branch_id && form.branch_id !== "none" ? Number(form.branch_id) : undefined;

      // Mã hóa mật khẩu bằng RSA trước khi gửi lên backend
      const encryptedPassword = await rsaService.encrypt(form.password);

      const payload: CreateStaffPayload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: encryptedPassword,
        phone_number: form.phone_number.trim() || undefined,
        department: form.department.trim() || undefined,
        branch_id: branchIdNum && !isNaN(branchIdNum) ? branchIdNum : undefined,
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

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tài khoản Staff</h1>
          <p className="text-sm text-muted-foreground">
            {staffList.length} nhân viên đang hoạt động trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            id="staff-refresh-btn"
            variant="outline"
            size="sm"
            onClick={() => void fetchStaffList()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button
            id="staff-create-btn"
            onClick={handleOpenModal}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Tạo tài khoản Staff
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Danh sách nhân viên
          </CardTitle>
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
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Đang tải danh sách nhân viên...
                    </TableCell>
                  </TableRow>
                ) : staffList.length > 0 ? (
                  staffList.map((s) => {
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
                        <TableCell className="hidden lg:table-cell">{department}</TableCell>
                        <TableCell className="hidden lg:table-cell">{branchName}</TableCell>
                        <TableCell>
                          <Badge variant={status === "active" ? "default" : "destructive"}>
                            {status === "active" ? "Hoạt động" : "Khóa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell tabular-nums text-muted-foreground">
                          {createdAt}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      Chưa có nhân viên nào. Hãy tạo tài khoản Staff đầu tiên.
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
              <Label htmlFor="staff-full-name">
                Họ tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff-full-name"
                placeholder="Nhập họ tên nhân viên"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="grid gap-1.5">
              <Label htmlFor="staff-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="staff-email"
                type="email"
                placeholder="example@omnigym.vn"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="grid gap-1.5">
              <Label htmlFor="staff-password">
                Mật khẩu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="staff-password"
                  name="create-staff-password"
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
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="grid gap-1.5">
              <Label htmlFor="staff-confirm-password">
                Xác nhận mật khẩu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="staff-confirm-password"
                  name="create-staff-confirm-password"
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
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Phone */}
            <div className="grid gap-1.5">
              <Label htmlFor="staff-phone">Số điện thoại</Label>
              <Input
                id="staff-phone"
                type="tel"
                placeholder="0xxx xxxxxx"
                value={form.phone_number}
                onChange={(e) => setField("phone_number", e.target.value)}
              />
            </div>

            {/* Department + Branch — 2 cột */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="staff-department">Phòng ban</Label>
                <Input
                  id="staff-department"
                  placeholder="Vd: Lễ tân, Kỹ thuật..."
                  value={form.department}
                  onChange={(e) => setField("department", e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="staff-branch">Chi nhánh</Label>
                <Select
                  value={form.branch_id}
                  onValueChange={(v) => setField("branch_id", v)}
                >
                  <SelectTrigger id="staff-branch">
                    <SelectValue placeholder="Chọn chi nhánh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Chưa phân công —</SelectItem>
                    {branches.map((b) => (
                      <SelectItem key={b.id} value={String(b.id)}>
                        {b.branch_name || `Chi nhánh #${b.id}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              id="staff-cancel-btn"
              variant="outline"
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
              id="staff-submit-btn"
              onClick={handleSubmit}
              disabled={submitting}
            >
              {submitting ? "Đang tạo..." : "Tạo tài khoản"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StaffAccountsPage;
