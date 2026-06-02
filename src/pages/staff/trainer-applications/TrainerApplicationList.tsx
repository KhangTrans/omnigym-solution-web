import { useEffect, useMemo, useState } from "react";
import {
  BadgeCheck,
  CalendarDays,
  CheckCircle2,
  Clock,
  Eye,
  FileBadge,
  Loader2,
  Mail,
  Phone,
  RefreshCw,
  Search,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { trainerApplicationAPI } from "@/api/trainerApplications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const STATUSES = ["pending", "approved", "rejected", "all"] as const;
type StatusFilter = (typeof STATUSES)[number];
type ApplicationStatus = "draft" | "pending" | "approved" | "rejected";

type ApplicationCertificate = {
  id?: number;
  cert_name?: string | null;
  issued_by?: string | null;
  certificate_number?: string | null;
  image_url?: string | null;
  issued_at?: string | null;
  expires_at?: string | null;
  status?: string | null;
};
type ApplicationUser = {
  id?: number;
  full_name?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone_number?: string | null;
  avatar_url?: string | null;
};
type TrainerApplication = {
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
  years_experience?: number | string | null;
  hourly_rate?: number | string | null;
  identity_number?: string | null;
  identity_image_url?: string | null;
  user?: ApplicationUser | null;
  certificates?: ApplicationCertificate[];
};

const statusLabel: Record<ApplicationStatus | "all", string> = {
  all: "Tất cả",
  draft: "Nháp",
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  rejected: "Từ chối",
};
const statusClass: Record<ApplicationStatus, string> = {
  draft: "bg-slate-100 text-slate-700 border-slate-200",
  pending: "bg-amber-50 text-amber-700 border-amber-200",
  approved: "bg-emerald-50 text-emerald-700 border-emerald-200",
  rejected: "bg-red-50 text-red-700 border-red-200",
};

function applicantName(app: TrainerApplication) {
  const user = app.user;
  return (
    user?.full_name ||
    `${user?.firstName || ""} ${user?.lastName || ""}`.trim() ||
    user?.email ||
    `User #${app.user_id}`
  );
}
function formatDate(value?: string | null) {
  return value ? new Date(value).toLocaleString("vi-VN") : "-";
}
function formatMoney(value?: number | string | null) {
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
          if (app.status !== "draft") {
            acc.all += 1;
            if (app.status in acc) acc[app.status as keyof typeof acc] += 1;
          }
          return acc;
        },
        { all: 0, pending: 0, approved: 0, rejected: 0 },
      ),
    [applications],
  );

  const filteredApplications = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return applications
      .filter((app) => app.status !== "draft")
      .filter((app) => statusFilter === "all" || app.status === statusFilter)
      .filter((app) => {
        if (!keyword) return true;
        return [
          String(app.id),
          applicantName(app),
          app.user?.email,
          app.phone_number,
          app.specialization,
        ]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(keyword));
      });
  }, [applications, search, statusFilter]);

  async function openDetail(id: number) {
    try {
      const res = await trainerApplicationAPI.getOne(id);
      setSelectedApplication(res.data.data);
      setDetailOpen(true);
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Không thể tải chi tiết hồ sơ",
      );
    }
  }
  async function refreshSelected(id: number) {
    const res = await trainerApplicationAPI.getOne(id);
    setSelectedApplication(res.data.data);
  }

  async function handleApprove(id: number) {
    if (!confirm("Bạn chắc chắn muốn duyệt hồ sơ Trainer này?")) return;
    setProcessing(true);
    try {
      await trainerApplicationAPI.approve(id);
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
          <div className="overflow-hidden rounded-xl border border-border">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/60 text-left text-xs uppercase tracking-wider text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3">Hồ sơ</th>
                    <th className="px-4 py-3">Người gửi</th>
                    <th className="px-4 py-3">Chuyên môn</th>
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
                          {app.specialization || "-"}
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
        onApprove={handleApprove}
        onRejectClick={() => setRejectOpen(true)}
      />
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối hồ sơ Trainer</DialogTitle>
            <DialogDescription>
              Nhập lý do để người dùng biết cần bổ sung hoặc chỉnh sửa thông tin
              nào.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Ví dụ: Chứng chỉ chưa rõ ảnh, thiếu thông tin định danh..."
            rows={5}
          />
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRejectOpen(false)}
              disabled={processing}
            >
              Hủy
            </Button>
            <Button
              variant="destructive"
              onClick={handleReject}
              disabled={processing}
            >
              {processing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <XCircle className="h-4 w-4" />
              )}
              Từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
function StatusBadge({ status }: { status: ApplicationStatus }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass[status]}`}
    >
      {statusLabel[status]}
    </span>
  );
}
function InfoItem({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-border bg-muted/20 p-3">
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="break-words text-sm font-medium text-foreground">
        {value || "-"}
      </div>
    </div>
  );
}

function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
  processing,
  onApprove,
  onRejectClick,
}: {
  application: TrainerApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processing: boolean;
  onApprove: (id: number) => void;
  onRejectClick: () => void;
}) {
  if (!application) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Hồ sơ Trainer #{application.id}
            <StatusBadge status={application.status} />
          </DialogTitle>
          <DialogDescription>
            Kiểm tra hồ sơ, giấy tờ định danh và chứng chỉ trước khi duyệt.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-[160px_1fr]">
            <div className="overflow-hidden rounded-xl border border-border bg-muted">
              {application.avatar_url ? (
                <img
                  src={application.avatar_url}
                  alt="Avatar"
                  className="h-40 w-full object-cover"
                />
              ) : (
                <div className="grid h-40 place-items-center text-muted-foreground">
                  <User className="h-8 w-8" />
                </div>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem
                icon={<User className="h-3.5 w-3.5" />}
                label="Người gửi"
                value={applicantName(application)}
              />
              <InfoItem
                icon={<Mail className="h-3.5 w-3.5" />}
                label="Email"
                value={application.user?.email}
              />
              <InfoItem
                icon={<Phone className="h-3.5 w-3.5" />}
                label="Số điện thoại"
                value={
                  application.phone_number || application.user?.phone_number
                }
              />
              <InfoItem
                icon={<CalendarDays className="h-3.5 w-3.5" />}
                label="Ngày gửi"
                value={formatDate(application.submitted_at)}
              />
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-base font-semibold">
              Thông tin chuyên môn
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <InfoItem label="Chuyên môn" value={application.specialization} />
              <InfoItem
                label="Số năm kinh nghiệm"
                value={application.years_experience ?? "-"}
              />
              <InfoItem
                label="Giá theo giờ"
                value={formatMoney(application.hourly_rate)}
              />
              <InfoItem label="Địa chỉ" value={application.address} />
              <InfoItem label="Bio" value={application.bio} />
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-base font-semibold">Định danh</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <InfoItem
                icon={<ShieldCheck className="h-3.5 w-3.5" />}
                label="Số định danh"
                value={application.identity_number}
              />
              <div className="rounded-lg border border-border bg-muted/20 p-3">
                <div className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Ảnh định danh
                </div>
                {application.identity_image_url ? (
                  <a
                    href={application.identity_image_url}
                    target="_blank"
                    rel="noreferrer"
                    className="block overflow-hidden rounded-lg border border-border"
                  >
                    <img
                      src={application.identity_image_url}
                      alt="Identity"
                      className="max-h-56 w-full object-contain bg-background"
                    />
                  </a>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Không có ảnh
                  </div>
                )}
              </div>
            </div>
          </section>
          <section>
            <h3 className="mb-3 text-base font-semibold">Chứng chỉ</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {application.certificates?.length ? (
                application.certificates.map((cert, index) => (
                  <div
                    key={cert.id || index}
                    className="rounded-xl border border-border bg-card p-4"
                  >
                    <div className="mb-3 flex items-center gap-2 font-semibold">
                      <FileBadge className="h-4 w-4" />
                      {cert.cert_name || `Certificate #${index + 1}`}
                    </div>
                    <div className="grid gap-2 text-sm">
                      <InfoItem label="Đơn vị cấp" value={cert.issued_by} />
                      <InfoItem
                        label="Mã chứng chỉ"
                        value={cert.certificate_number}
                      />
                      <InfoItem
                        label="Ngày cấp"
                        value={
                          cert.issued_at
                            ? String(cert.issued_at).slice(0, 10)
                            : "-"
                        }
                      />
                      <InfoItem
                        label="Ngày hết hạn"
                        value={
                          cert.expires_at
                            ? String(cert.expires_at).slice(0, 10)
                            : "-"
                        }
                      />
                    </div>
                    {cert.image_url && (
                      <a
                        href={cert.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-3 block overflow-hidden rounded-lg border border-border"
                      >
                        <img
                          src={cert.image_url}
                          alt={cert.cert_name || "Certificate"}
                          className="max-h-52 w-full object-contain bg-background"
                        />
                      </a>
                    )}
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-border p-4 text-sm text-muted-foreground">
                  Không có chứng chỉ.
                </div>
              )}
            </div>
          </section>
          {application.rejection_reason && (
            <section className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              <div className="font-semibold">Lý do từ chối</div>
              <p className="mt-1">{application.rejection_reason}</p>
            </section>
          )}
        </div>
        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Đóng
          </Button>
          {application.status === "pending" && (
            <>
              <Button
                variant="destructive"
                onClick={onRejectClick}
                disabled={processing}
              >
                <XCircle className="h-4 w-4" />
                Từ chối
              </Button>
              <Button
                onClick={() => onApprove(application.id)}
                disabled={processing}
                className="bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground"
              >
                {processing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-4 w-4" />
                )}
                Duyệt hồ sơ
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
