
import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AxiosError } from "axios";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Lock, Unlock } from "lucide-react";
import {
  usersApi,
  type ApiUser,
  type UserStatus,
  type PaginationMeta,
} from "@/api/users";
import { toast } from "sonner";

// ─── Constants ────────────────────────────────────────────────────────────────
const PAGE_LIMIT = 15;

type RoleFilter = "all" | "Customer" | "Trainer" | "Staff";
type StatusFilter = "all" | "active" | "locked";

const normalizeStatus = (status?: string): UserStatus =>
  String(status || "").toLowerCase() === "active" ? "active" : "locked";

// ─── Component ────────────────────────────────────────────────────────────────
function UsersPage() {
  const navigate = useNavigate();

  // ── Data state ──
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta>({
    total: 0,
    page: 1,
    limit: PAGE_LIMIT,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(false);

  // ── Filter + search state ──
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // ── Lock/Unlock state ──
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [confirmUser, setConfirmUser] = useState<ApiUser | null>(null);

  // Ref to the card top — used for scroll-to-top on page change
  const tableTopRef = useRef<HTMLDivElement>(null);

  // ─── Error handler ────────────────────────────────────────────────────────
  const handleApiError = useCallback(
    (error: unknown, options?: { onNotFound?: () => void }) => {
      const axiosError = error as AxiosError<{ message?: string }>;
      if (!axiosError.response) {
        toast.error("Mất kết nối mạng. Vui lòng thử lại.");
        return;
      }

      const status = axiosError.response.status;
      if (status === 401) {
        toast.error("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        navigate("/login");
        return;
      }
      if (status === 403) {
        toast.error("Bạn không có quyền thực hiện thao tác này");
        return;
      }
      if (status === 404) {
        toast.error(axiosError.response.data?.message || "Không tìm thấy người dùng");
        options?.onNotFound?.();
        return;
      }
      if (status >= 500) {
        toast.error("Lỗi máy chủ. Vui lòng thử lại sau.");
        return;
      }

      toast.error(axiosError.response.data?.message || "Đã có lỗi xảy ra");
    },
    [navigate],
  );

  // ─── Fetch (gọi BE với đầy đủ params) ─────────────────────────────────────
  const fetchUsers = useCallback(
    async (page: number, role: RoleFilter, status: StatusFilter, search: string) => {
      try {
        setLoading(true);

        const params: Record<string, string | number> = {
          page,
          limit: PAGE_LIMIT,
        };

        // Truyền role filter lên BE (nếu "all" thì không truyền → BE tự exclude Admin/Partner)
        if (role !== "all") params.role = role;

        // Truyền status filter lên BE
        if (status !== "all") params.status = status;

        // Search query truyền lên BE (nếu API hỗ trợ) — hiện tại lọc thêm ở FE
        if (search.trim()) params.search = search.trim();

        const response = await usersApi.list(params);
        const { data, pagination: meta } = response.data;

        setUsers(data);
        setPagination(meta);
      } catch (error) {
        handleApiError(error);
      } finally {
        setLoading(false);
      }
    },
    [handleApiError],
  );

  // ─── Fetch khi bất kỳ filter / trang thay đổi ─────────────────────────────
  useEffect(() => {
    void fetchUsers(currentPage, roleFilter, statusFilter, query);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, roleFilter, statusFilter]);

  // Khi search/filter thay đổi → reset về trang 1 rồi fetch
  // Dùng timeout nhỏ để debounce ô search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      void fetchUsers(1, roleFilter, statusFilter, query);
    }, 300);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  // ─── Lock / Unlock ─────────────────────────────────────────────────────────
  const setPending = (userId: number, pending: boolean) => {
    setPendingIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(userId);
      else next.delete(userId);
      return next;
    });
  };

  const handleToggleStatus = async (user: ApiUser) => {
    const currentStatus = normalizeStatus(user.status);
    const nextStatus: UserStatus = currentStatus === "active" ? "locked" : "active";

    try {
      setPending(user.id, true);
      await usersApi.updateStatus(user.id, nextStatus);

      // Cập nhật local state, không refetch toàn bộ trang
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)),
      );

      toast.success(nextStatus === "locked" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản");
    } catch (error) {
      handleApiError(error, {
        onNotFound: () => void fetchUsers(currentPage, roleFilter, statusFilter, query),
      });
    } finally {
      setPending(user.id, false);
    }
  };

  const confirmMessage = confirmUser
    ? normalizeStatus(confirmUser.status) === "active"
      ? "Bạn có chắc muốn khóa tài khoản này không?"
      : "Bạn có chắc muốn mở khóa tài khoản này không?"
    : "";

  // ─── Pagination helpers ────────────────────────────────────────────────────
  const goToPage = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;
    setCurrentPage(page);
    // Scroll về đầu bảng — chỉ khi user bấm chuyển trang
    tableTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const startItem = (pagination.page - 1) * pagination.limit + 1;
  const endItem = Math.min(pagination.page * pagination.limit, pagination.total);

  // ─── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            {pagination.total} accounts
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members &amp; staff</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">

          {/* ── Toolbar: Search + Role filter + Status filter ── */}
          <div className="flex flex-wrap items-center gap-2">
            <Input
              id="users-search"
              placeholder="Search by name, email…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-[180px] flex-1"
            />

            {/* Filter theo Role */}
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v as RoleFilter);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger id="users-role-filter" className="w-[140px]">
                <SelectValue placeholder="Role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All roles</SelectItem>
                <SelectItem value="Customer">Customer</SelectItem>
                <SelectItem value="Trainer">Trainer</SelectItem>
                <SelectItem value="Staff">Staff</SelectItem>
              </SelectContent>
            </Select>

            {/* Filter theo Status */}
            <Select
              value={statusFilter}
              onValueChange={(v) => {
                setStatusFilter(v as StatusFilter);
                setCurrentPage(1);
              }}
            >
              <SelectTrigger id="users-status-filter" className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ── Table ── */}
          <div ref={tableTopRef} className="rounded-md bg-card shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Created</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                      Đang tải...
                    </TableCell>
                  </TableRow>
                ) : users.length > 0 ? (
                  users.map((u) => {
                    const name = u.full_name || u.email || u.phone_number || "Unknown";
                    const roleName = u.role?.role_name || "Unknown";
                    const status = normalizeStatus(u.status);
                    const isPending = pendingIds.has(u.id);
                    const createdAt = u.created_at ? u.created_at.slice(0, 10) : "-";

                    return (
                      <TableRow key={u.id}>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell className="hidden md:table-cell text-muted-foreground">
                          {u.email || "-"}
                        </TableCell>
                        <TableCell className="capitalize">{roleName}</TableCell>
                        <TableCell>
                          <Badge variant={status === "active" ? "default" : "destructive"}>
                            {status === "active" ? "Active" : "Locked"}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden lg:table-cell tabular-nums">
                          {createdAt}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant={status === "active" ? "destructive" : "secondary"}
                            onClick={() => setConfirmUser(u)}
                            disabled={isPending}
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
                      colSpan={6}
                      className="text-center text-sm text-muted-foreground py-10"
                    >
                      {roleFilter !== "all" || statusFilter !== "all" || query
                        ? "Không tìm thấy người dùng phù hợp với bộ lọc hiện tại."
                        : "Chưa có người dùng nào."}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* ── Pagination — chỉ hiển thị khi có hơn 1 trang ── */}
          {!loading && pagination.total > PAGE_LIMIT && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <p className="text-sm text-muted-foreground">
                Hiển thị{" "}
                <span className="font-medium">
                  {pagination.total === 0 ? 0 : startItem}–{endItem}
                </span>{" "}
                trong tổng số{" "}
                <span className="font-medium">{pagination.total}</span> tài khoản
              </p>
              <div className="flex items-center gap-1">
                <Button
                  id="users-page-prev"
                  size="sm"
                  variant="outline"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1 || loading}
                >
                  Trước
                </Button>
                <span className="min-w-[90px] text-center text-sm tabular-nums">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  id="users-page-next"
                  size="sm"
                  variant="outline"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === pagination.totalPages || loading}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>

      {/* ── Confirm Lock/Unlock dialog ── */}
      <AlertDialog
        open={Boolean(confirmUser)}
        onOpenChange={(open) => {
          if (!open) setConfirmUser(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận thao tác</AlertDialogTitle>
            <AlertDialogDescription>{confirmMessage}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (confirmUser) {
                  const target = confirmUser;
                  setConfirmUser(null);
                  void handleToggleStatus(target);
                }
              }}
              disabled={confirmUser ? pendingIds.has(confirmUser.id) : false}
            >
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default UsersPage;
