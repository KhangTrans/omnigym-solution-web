import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Clock, Eye, Loader2, RefreshCw, Search, XCircle } from "lucide-react";
import { toast } from "sonner";
import { trainerApplicationAPI } from "@/api/trainerApplications";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  applicantName,
  formatDate,
  StatusBadge,
  statusLabel,
  type ApplicationStatus,
  type TrainerApplication,
  type TrainerLevel,
  trainerLevelLabel,
} from "@/pages/admin/trainer_applications/TrainerApplicationList";
import { BranchApplicationDetailDialog } from "./BranchApplicationDetailDialog";
import { ApplicationRejectDialog } from "@/pages/admin/trainer_applications/components/ApplicationRejectDialog";

const STATUSES = ["draft", "pending", "approved", "rejected", "all"] as const;
type StatusFilter = (typeof STATUSES)[number];

export default function BranchManagerTrainerApplications() {
  const [applications, setApplications] = useState<TrainerApplication[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState<TrainerApplication | null>(null);
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
      toast.error(error.response?.data?.message || "Không thể tải danh sách hồ sơ");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void fetchApplications(); }, []);

  const counts = useMemo(
    () => applications.reduce(
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
        return [String(app.id), applicantName(app), app.user?.email, app.phone_number, app.specialization]
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
      toast.error(error.response?.data?.message || "Không thể tải chi tiết hồ sơ");
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
    if (!rejectionReason.trim()) return toast.error("Vui lòng nhập lý do từ chối");
    setProcessing(true);
    try {
      await trainerApplicationAPI.reject(selectedApplication.id, rejectionReason.trim());
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
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Branch workspace</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Trainer Application</h1>
          <p className="mt-1 text-sm text-muted-foreground">Xem hồ sơ đăng ký Trainer, kiểm tra chứng chỉ và duyệt hoặc từ chối đơn.</p>
        </div>
        <Button variant="secondary" onClick={() => void fetchApplications()} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard icon={<Clock />} label="Chờ duyệt" value={counts.pending} tone="amber" />
        <SummaryCard icon={<BadgeCheck />} label="Đã duyệt" value={counts.approved} tone="emerald" />
        <SummaryCard icon={<XCircle />} label="Từ chối" value={counts.rejected} tone="red" />
      </div>

      <Card className="min-h-[420px] border-0 bg-card shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap gap-2">
              {STATUSES.map((status) => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status
                    ? "rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-sm"
                    : "rounded-full bg-muted px-4 py-2 text-sm font-semibold text-muted-foreground shadow-sm hover:text-foreground"}
                >
                  {statusLabel[status]} ({counts[status] ?? 0})
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm theo tên, email, chuyên môn..." className="border-0 bg-muted pl-9 shadow-sm" />
            </div>
          </div>

          <div className="overflow-hidden rounded-xl bg-card shadow-sm">
            <div className="overflow-x-auto admin-scrollbar">
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
                <tbody className="bg-card">
                  {loading ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground"><Loader2 className="mx-auto mb-2 h-6 w-6 animate-spin" />Đang tải danh sách hồ sơ...</td></tr>
                  ) : filteredApplications.length === 0 ? (
                    <tr><td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">Không có hồ sơ phù hợp.</td></tr>
                  ) : filteredApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-muted/30">
                      <td className="px-4 py-4 font-semibold">#{app.id}</td>
                      <td className="px-4 py-4"><div className="font-semibold text-foreground">{applicantName(app)}</div><div className="text-xs text-muted-foreground">{app.user?.email || "-"}</div></td>
                      <td className="max-w-[220px] truncate px-4 py-4">{app.specialization || "-"}</td>
                      <td className="px-4 py-4">{app.phone_number || app.user?.phone_number || "-"}</td>
                      <td className="px-4 py-4"><StatusBadge status={app.status as ApplicationStatus} /></td>
                      <td className="px-4 py-4">{formatDate(app.submitted_at)}</td>
                      <td className="px-4 py-4 text-right"><Button variant="secondary" size="sm" onClick={() => void openDetail(app.id)}><Eye className="h-4 w-4" />Chi tiết</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <BranchApplicationDetailDialog application={selectedApplication} open={detailOpen} onOpenChange={setDetailOpen} processing={processing} approvedLevel={approvedLevel} setApprovedLevel={setApprovedLevel} onApprove={handleApprove} onRejectClick={() => setRejectOpen(true)} />
      <ApplicationRejectDialog open={rejectOpen} onOpenChange={setRejectOpen} rejectionReason={rejectionReason} setRejectionReason={setRejectionReason} onSubmit={handleReject} processing={processing} />
    </div>
  );
}

function SummaryCard({ icon, label, value, tone }: { icon: React.ReactNode; label: string; value: number; tone: "amber" | "emerald" | "red" }) {
  const toneClass = { amber: "bg-amber-50 text-amber-700", emerald: "bg-emerald-50 text-emerald-700", red: "bg-red-50 text-red-700" }[tone];
  return <Card className="border-0 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className={`grid h-11 w-11 place-items-center rounded-xl ${toneClass}`}><span className="[&_svg]:h-5 [&_svg]:w-5">{icon}</span></div><div><div className="text-2xl font-bold">{value}</div><div className="text-sm text-muted-foreground">{label}</div></div></CardContent></Card>;
}
