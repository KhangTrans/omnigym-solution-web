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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ApplicationDetailDialog } from "./components/ApplicationDetailDialog";
import { ApplicationRejectDialog } from "./components/ApplicationRejectDialog";

const STATUSES = ["pending", "approved", "rejected", "all"] as const;
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
    if (app.status === "pending")
      setApprovedLevel(app.desired_level || "junior");
  }

  async function handleApprove(id: number) {
    if (!approvedLevel)
      return toast.error("Vui lòng chọn level duyệt cho Trainer.");
    if (
      !confirm(
        `Bạn chắc chắn muốn duyệt hồ sơ Trainer với level ${trainerLevelLabel[approvedLevel]}?`,
      )
    )
      return;
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
        <CardHeader className="space-y-3">
          <CardTitle className="text-base">Danh sách hồ sơ ứng tuyển</CardTitle>
          <div className="flex flex-wrap items-center gap-3">
            <Tabs
              value={statusFilter}
              onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            >
              <TabsList>
                <TabsTrigger value="all">Tất cả ({counts.all})</TabsTrigger>
                <TabsTrigger value="pending">
                  Chờ duyệt ({counts.pending})
                </TabsTrigger>
                <TabsTrigger value="approved">
                  Đã duyệt ({counts.approved})
                </TabsTrigger>
                <TabsTrigger value="rejected">
                  Từ chối ({counts.rejected})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative w-full md:w-72">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm kiếm hồ sơ ứng tuyển..."
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)] overflow-x-auto border-0">
            <Table className="min-w-[900px]">
              <TableHeader className="bg-muted/60">
                <TableRow>
                  <TableHead className="px-4 py-3">Hồ sơ</TableHead>
                  <TableHead className="px-4 py-3">Người gửi</TableHead>
                  <TableHead className="px-4 py-3">Chi nhánh</TableHead>
                  <TableHead className="px-4 py-3">Chuyên môn</TableHead>
                  <TableHead className="px-4 py-3">Level mong muốn</TableHead>
                  <TableHead className="px-4 py-3">Liên hệ</TableHead>
                  <TableHead className="px-4 py-3">Trạng thái</TableHead>
                  <TableHead className="px-4 py-3">Ngày gửi</TableHead>
                  <TableHead className="px-4 py-3 text-right">
                    Thao tác
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="bg-card">
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      <Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />
                      Đang tải danh sách hồ sơ...
                    </TableCell>
                  </TableRow>
                ) : filteredApplications.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={7}
                      className="px-4 py-12 text-center text-muted-foreground"
                    >
                      Không có hồ sơ phù hợp.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredApplications.map((app) => (
                    <TableRow key={app.id} className="hover:bg-muted/50">
                      <TableCell className="px-4 py-4 font-semibold">
                        #{app.id}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <div className="font-semibold text-foreground">
                          {applicantName(app)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {app.user?.email || "-"}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate px-4 py-4">
                        {app.branch?.branch_name ||
                          (app.branch_id ? `#${app.branch_id}` : "-")}
                      </TableCell>
                      <TableCell className="max-w-[220px] truncate px-4 py-4">
                        {app.specialization || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {app.desired_level
                          ? trainerLevelLabel[app.desired_level]
                          : "-"}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {app.phone_number || app.user?.phone_number || "-"}
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        <StatusBadge status={app.status} />
                      </TableCell>
                      <TableCell className="px-4 py-4">
                        {formatDate(app.submitted_at)}
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openDetail(app.id)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4 text-slate-700" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
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
