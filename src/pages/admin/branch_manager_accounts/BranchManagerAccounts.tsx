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
import { UserPlus, Users, Eye, EyeOff, RefreshCw, Lock, Unlock } from "lucide-react";
import { branchManagerAPI, type BranchManagerUser } from "@/api/branchManagers";
import { branchesApi } from "@/api/branches";
import { rsaService } from "@/utils/rsa";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

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
  branch_id: string;
  avatar_url: string;
};

const emptyForm: FormState = {
  full_name: "",
  email: "",
  password: "",
  confirm_password: "",
  phone_number: "",
  branch_id: "",
  avatar_url: "",
};

function BranchManagerAccountsPage() {
  // ── Data state ──
  const [managerList, setManagerList] = useState<BranchManagerUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);

  // ── Form state ──
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // ── Lock/Unlock state ──
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [confirmManager, setConfirmManager] = useState<BranchManagerUser | null>(null);

  // ── Load data ──
  const fetchManagerList = async () => {
    try {
      setLoading(true);
      const response = await branchManagerAPI.getAll();
      setManagerList(response.data.data);
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Không thể tải danh sách quản lý.";
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
    void fetchManagerList();
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
      return toast.error("Vui lòng nhập họ tên quản lý.");
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
    if (!form.branch_id || form.branch_id === "none") {
      return toast.error("Vui lòng chọn chi nhánh quản lý.");
    }

    try {
      setSubmitting(true);

      const branchIdNum = Number(form.branch_id);

      // Mã hóa mật khẩu bằng RSA trước khi gửi lên backend
      const encryptedPassword = await rsaService.encrypt(form.password);

      const payload = {
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        password: encryptedPassword,
        phone_number: form.phone_number.trim() || undefined,
        branch_id: branchIdNum,
        avatar_url: form.avatar_url.trim() || undefined,
      };

      await branchManagerAPI.create(payload);
      toast.success("Tạo tài khoản Quản lý thành công.");
      setShowModal(false);
      void fetchManagerList();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Tạo tài khoản thất bại.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const setPending = (mgrId: number, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(mgrId);
      else next.delete(mgrId);
      return next;
    });
  };

  const handleToggleStatus = async (mgr: BranchManagerUser) => {
    const currentStatus = String(mgr.status || "").toLowerCase();
    const nextStatus = currentStatus === "active" ? "locked" : "active";

    try {
      setPending(mgr.id, true);
      await branchManagerAPI.updateStatus(mgr.id, nextStatus as any);

      setManagerList((prev) =>
        prev.map((m) => (m.id === mgr.id ? { ...m, status: nextStatus } : m))
      );

      toast.success(nextStatus === "locked" ? "Đã khóa tài khoản Quản lý" : "Đã mở khóa tài khoản Quản lý");
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      const message = err.response?.data?.message || "Thao tác thất bại.";
      toast.error(message);
    } finally {
      setPending(mgr.id, false);
    }
  };

  // ── Render ──
  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tài khoản Quản lý chi nhánh</h1>
          <p className="text-sm text-muted-foreground">
            {managerList.length} quản lý đang hoạt động trong hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void fetchManagerList()}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Làm mới
          </Button>
          <Button
            onClick={handleOpenModal}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Tạo tài khoản Quản lý
          </Button>
        </div>
      </div>

      {/* ── Table ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" />
            Danh sách quản lý
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
                  <TableHead className="hidden lg:table-cell">Chi nhánh quản lý</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="hidden xl:table-cell">Ngày tạo</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      Đang tải danh sách quản lý...
                    </TableCell>
                  </TableRow>
                ) : managerList.length > 0 ? (
                  managerList.map((m) => {
                    const name = m.full_name || m.email || "Chưa có tên";
                    const status = String(m.status || "").toLowerCase();
                    const branchName = m.manager?.branch?.branch_name || "—";
                    const createdAt = m.created_at ? m.created_at.slice(0, 10) : "—";

                    return (
                      <TableRow key={m.id}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {m.email || "—"}
                        </TableCell>
                        <TableCell className="hidden sm:table-cell text-muted-foreground">
                          {m.phone_number || "—"}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell text-primary font-medium">{branchName}</TableCell>
                        <TableCell>
                          <Badge variant={status === "active" ? "default" : "destructive"}>
                            {status === "active" ? "Hoạt động" : "Khóa"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden xl:table-cell tabular-nums text-muted-foreground">
                          {createdAt}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={status === "active" ? "danger-glass" : "success-glass"}
                            onClick={() => setConfirmManager(m)}
                            disabled={pendingIds.has(m.id)}
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
                      colSpan={7}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      Chưa có quản lý nào. Hãy tạo tài khoản Quản lý đầu tiên.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* ── Create Manager Modal ── */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-130">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Tạo tài khoản Quản lý mới
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Họ tên */}
            <div className="grid gap-1.5">
              <Label htmlFor="mgr-full-name">
                Họ tên <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mgr-full-name"
                placeholder="Nhập họ tên quản lý"
                value={form.full_name}
                onChange={(e) => setField("full_name", e.target.value)}
              />
            </div>

            {/* Email */}
            <div className="grid gap-1.5">
              <Label htmlFor="mgr-email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="mgr-email"
                type="email"
                placeholder="manager@omnigym.vn"
                value={form.email}
                onChange={(e) => setField("email", e.target.value)}
              />
            </div>

            {/* Password */}
            <div className="grid gap-1.5">
              <Label htmlFor="mgr-password">
                Mật khẩu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="mgr-password"
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
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div className="grid gap-1.5">
              <Label htmlFor="mgr-confirm-password">
                Xác nhận mật khẩu <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="mgr-confirm-password"
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
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Phone + Branch — 2 cột */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-1.5">
                <Label htmlFor="mgr-phone">Số điện thoại</Label>
                <Input
                  id="mgr-phone"
                  type="tel"
                  placeholder="0xxx xxxxxx"
                  value={form.phone_number}
                  onChange={(e) => setField("phone_number", e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="mgr-branch">Chi nhánh quản lý <span className="text-destructive">*</span></Label>
                <Select
                  value={form.branch_id}
                  onValueChange={(v) => setField("branch_id", v)}
                >
                  <SelectTrigger id="mgr-branch">
                    <SelectValue placeholder="Chọn chi nhánh" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Chọn chi nhánh —</SelectItem>
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
              variant="outline"
              onClick={handleCloseModal}
              disabled={submitting}
            >
              Hủy
            </Button>
            <Button
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
        open={Boolean(confirmManager)}
        onOpenChange={(open) => {
          if (!open) setConfirmManager(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thao tác</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmManager?.status === "active"
                ? `Bạn có chắc muốn khóa tài khoản của quản lý "${confirmManager?.full_name || confirmManager?.email}" không?`
                : `Bạn có chắc muốn mở khóa tài khoản của quản lý "${confirmManager?.full_name || confirmManager?.email}" không?`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmManager) {
                  const target = confirmManager;
                  setConfirmManager(null);
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

export default BranchManagerAccountsPage;
