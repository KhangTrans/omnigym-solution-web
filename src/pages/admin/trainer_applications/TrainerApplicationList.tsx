import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  Search,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { trainerApplicationAPI } from "@/api/trainerApplications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ApplicationDetailDialog } from "./components/ApplicationDetailDialog";
import { ApplicationRejectDialog } from "./components/ApplicationRejectDialog";

const STATUSES = ["draft", "pending", "approved", "rejected", "all"] as const;
type StatusFilter = (typeof STATUSES)[number];
export type ApplicationStatus = "draft" | "pending" | "approved" | "rejected";

export type ApplicationCertificate = {
  id?: number;
  cert_name?: string | null;
  issued_by?: string | null;
  certificate_number?: string | null;
  image_url?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  status?: string | null;
};
export type ApplicationBranch = {
  id?: number;
  branch_name?: string | null;
  address?: string | null;
  province?: string | null;
  district?: string | null;
};
export type TrainerLevel = "junior" | "senior" | "master";

export const trainerLevelLabel: Record<TrainerLevel, string> = {
  junior: "Junior",
  senior: "Senior",
  master: "Master",
};

export type ApplicationUser = {
  id?: number;
  full_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
};
export type TrainerApplication = {
  id: number;
  user_id: number;
  status: ApplicationStatus;
  submitted_at?: string | null;
  reviewed_at?: string | null;
  rejection_reason?: string | null;
  bio?: string | null;
  specialization?: string | null;
  avatar_url?: string | null;
  phone_number?: string | null;
  address?: string | null;
  branch_id?: number | null;
  branch?: ApplicationBranch | null;
  desired_level?: TrainerLevel | null;
  approved_level?: TrainerLevel | null;
  years_experience?: number | string | null;
  hourly_rate?: number | string | null;
  identity_number?: string | null;
  identity_image_url?: string | null;
  user?: ApplicationUser | null;
  certificates?: ApplicationCertificate[];
};

export const statusLabel: Record<ApplicationStatus | "all", string> = {
  all: "Tất cả",
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};
export const statusClass: Record<ApplicationStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

export function applicantName(app: TrainerApplication) {
  const user = app.user;
  return (
    user?.full_name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    `User #${app.user_id}`
  );
}
export function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "-";
}
export function formatMoney(value?: number | string | null) {
  const amount = Number(value) || 0;
  return amount ? amount.toLocaleString("vi-VN") + "đ" : "-";
}

export default function TrainerApplicationList() {
  const [applications, setApplications] = useState<TrainerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] =
    useState<TrainerApplication | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [processing, setProcessing] = useState(false);
  const [approvedLevel, setApprovedLevel] = useState<TrainerLevel>("junior");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("pending");
  const [search, setSearch] = useState("");

  async function fetchApplications() {
    setLoading(true);
    try {
      const res = await trainerApplicationAPI.getAll();
      setApplications(res.data.data || []);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể tải danh sách hồ sơ",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchApplications();
  }, []);

  const counts = useMemo(
    () =>
      applications.reduce(
        (acc, app) => {
          acc.all += 1;
          if (app.status in acc) acc[app.status as keyof typeof acc] += 1;
          return acc;
        },
        { all: 0, draft: 0, pending: 0, approved: 0, rejected: 0 },
      ),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return applications
      .filter((app) => statusFilter === "all" || app.status === statusFilter)
      .filter((app) => {
        if (!keyword) return true;
        return [
          String(app.id),
          applicantName(app),
          app.user?.email,
          app.phone_number,
          app.specialization,
          app.branch?.branch_name,
          app.desired_level ? trainerLevelLabel[app.desired_level] : undefined,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [applications, search, statusFilter]);

  async function openDetail(id: number) {
    try {
      const res = await trainerApplicationAPI.getOne(id);
      const app = res.data.data as TrainerApplication;
      setSelectedApplication(app);
      setApprovedLevel(app.desired_level || "junior");
      setDetailOpen(true);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể tải chi tiết hồ sơ",
      );
    }
  }
  async function refreshSelected(id: number) {
    const res = await trainerApplicationAPI.getOne(id);
    const app = res.data.data as TrainerApplication;
    setSelectedApplication(app);
    if (app.status === "pending") setApprovedLevel(app.desired_level || "junior");
  }

  async function handleApprove(id: number) {
    if (!approvedLevel) return toast.error("Vui lòng chọn level duyệt cho Trainer.");
    if (!confirm(`Bạn chắc chắn muốn duyệt hồ sơ Trainer với level ${trainerLevelLabel[approvedLevel]}?`)) return;
    setProcessing(true);
    try {
      await trainerApplicationAPI.approve(id, approvedLevel);
      toast.success("Đã duyệt hồ sơ Trainer");
      await fetchApplications();
      await refreshSelected(id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể duyệt hồ sơ");
    } finally {
      setProcessing(false);
    }
  }

  async function handleReject() {
    if (!selectedApplication) return;
    if (!rejectionReason.trim())
      return toast.error("Vui lòng nhập lý do từ chối");
    setProcessing(true);
    try {
      await trainerApplicationAPI.reject(
        selectedApplication.id,
        rejectionReason.trim(),
      );
      toast.success("Đã từ chối hồ sơ Trainer");
      setRejectOpen(false);
      setRejectionReason("");
      await fetchApplications();
      await refreshSelected(selectedApplication.id);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể từ chối hồ sơ");
    } finally {
      setProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Staff review
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Trainer Applications
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Xem hồ sơ đăng ký Trainer, kiểm tra chứng chỉ và duyệt hoặc từ chối
            đơn.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={fetchApplications}
          disabled={loading}
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Làm mới
        </Button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={<Clock />}
          label="Chờ duyệt"
          value={counts.pending}
          tone="amber"
        />
        <SummaryCard
          icon={<BadgeCheck />}
          label="Đã duyệt"
          value={counts.approved}
          tone="emerald"
        />
        <SummaryCard
          icon={<XCircle />}
          label="Từ chối"
          value={counts.rejected}
          tone="red"
        />
      </div>
      <Card>
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
                      : "rounded-full border border-input bg-background px-4 py-2 text-sm font-semibold text-muted-foreground hover:bg-background hover:text-foreground"
                  }
                >
                  {statusLabel[status]} ({counts[status] ?? 0})
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, email, chuyên môn..."
                className="pl-9"
              />
            </div>
          </div>
          <div className="overflow-hidden rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)]">
            <div className="overflow-x-auto admin-scrollbar">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Hồ sơ</th>
                    <th className="px-4 py-3">Người gửi</th>
                    <th className="px-4 py-3">Chi nhánh</th>
                    <th className="px-4 py-3">Chuyên môn</th>
                    <th className="px-4 py-3">Level mong muốn</th>
                    <th className="px-4 py-3">Liên hệ</th>
                    <th className="px-4 py-3">Trạng thái</th>
                    <th className="px-4 py-3">Ngày gửi</th>
                    <th className="px-4 py-3 text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                        Đang tải danh sách hồ sơ...
                      </td>
                    </tr>
                  ) : filteredApplications.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-12 text-center text-muted-foreground"
                      >
                        Không có hồ sơ phù hợp.
                      </td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.id} className="hover:bg-muted/30">
                        <td className="px-4 py-4 font-semibold">#{app.id}</td>
                        <td className="px-4 py-4">
                          <div className="font-semibold text-foreground">
                            {applicantName(app)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {app.user?.email || "-"}
                          </div>
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-4">
                          {app.branch?.branch_name || (app.branch_id ? `#${app.branch_id}` : "-")}
                        </td>
                        <td className="max-w-[220px] truncate px-4 py-4">
                          {app.specialization || "-"}
                        </td>
                        <td className="px-4 py-4">
                          {app.desired_level ? trainerLevelLabel[app.desired_level] : "-"}
                        </td>
                        <td className="px-4 py-4">
                          {app.phone_number || app.user?.phone_number || "-"}
                        </td>
                        <td className="px-4 py-4">
                          <StatusBadge status={app.status} />
                        </td>
                        <td className="px-4 py-4">
                          {formatDate(app.submitted_at)}
                        </td>
                        <td className="px-4 py-4 text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openDetail(app.id)}
                          >
                            <Eye className="h-4 w-4" />
                            Chi tiết
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
      <ApplicationDetailDialog
        application={selectedApplication}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        processing={processing}
        approvedLevel={approvedLevel}
        setApprovedLevel={setApprovedLevel}
        onApprove={handleApprove}
        onRejectClick={() => setRejectOpen(true)}
      />
      <ApplicationRejectDialog
        open={rejectOpen}
        onOpenChange={setRejectOpen}
        rejectionReason={rejectionReason}
        setRejectionReason={setRejectionReason}
        onSubmit={handleReject}
        processing={processing}
      />
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  tone: "amber" | "emerald" | "red";
}) {
  const toneClass = {
    amber: "bg-amber-50 text-amber-700",
    emerald: "bg-emerald-50 text-emerald-700",
    red: "bg-red-50 text-red-700",
  }[tone];
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div
          className={`grid h-11 w-11 place-items-center rounded-xl ${toneClass}`}
        >
          <span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span>
        </div>
        <div>
          <div className="text-2xl font-bold">{value}</div>
          <div className="text-sm text-muted-foreground">{label}</div>
        </div>
      </CardContent>
    </Card>
  );
}

export function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
