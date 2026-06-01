
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Lock, Unlock } from "lucide-react";
import { usersApi, type ApiUser, type UserStatus } from "@/api/users";
import { toast } from "sonner";

const normalizeStatus = (status?: string): UserStatus =>
  String(status || "").toLowerCase() === "active" ? "active" : "locked";

function UsersPage() {
  const navigate = useNavigate();
  const [users, setUsers] = useState<ApiUser[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingIds, setPendingIds] = useState<Set<number>>(new Set());
  const [confirmUser, setConfirmUser] = useState<ApiUser | null>(null);

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

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await usersApi.list();
      setUsers(response.data || []);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }, [handleApiError]);

  useEffect(() => {
    void fetchUsers();
  }, [fetchUsers]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) => {
      const name = u.full_name || u.email || u.phone_number || "";
      const role = u.role?.role_name || "";
      const status = normalizeStatus(u.status);
      return [name, u.email || "", role, status].some((v) => v.toLowerCase().includes(q));
    });
  }, [users, query]);

  const activeCount = useMemo(
    () => users.filter((u) => normalizeStatus(u.status) === "active").length,
    [users],
  );

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
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, status: nextStatus } : u)),
      );
      toast.success(
        nextStatus === "locked" ? "Đã khóa tài khoản" : "Đã mở khóa tài khoản",
      );
    } catch (error) {
      handleApiError(error, { onNotFound: () => void fetchUsers() });
    } finally {
      setPending(user.id, false);
    }
  };

  const confirmMessage = confirmUser
    ? normalizeStatus(confirmUser.status) === "active"
      ? "Bạn có chắc muốn khóa tài khoản này không?"
      : "Bạn có chắc muốn mở khóa tài khoản này không?"
    : "";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">
            {users.length} accounts · {activeCount} active
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Members & staff</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name, email, role…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="rounded-md bg-card shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
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
                ) : (
                  filtered.map((u) => {
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
                )}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-sm text-muted-foreground py-8">
                      No users found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

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
