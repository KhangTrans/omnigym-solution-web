import React from "react";
import {
  CalendarDays,
  CheckCircle2,
  FileBadge,
  Loader2,
  Mail,
  Phone,
  ShieldCheck,
  User,
  XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { TrainerApplication } from "../TrainerApplicationList";
import {
  applicantName,
  formatDate,
  formatMoney,
  StatusBadge,
} from "../TrainerApplicationList";

interface ApplicationDetailDialogProps {
  application: TrainerApplication | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  processing: boolean;
  onApprove: (id: number) => void;
  onRejectClick: () => void;
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

export function ApplicationDetailDialog({
  application,
  open,
  onOpenChange,
  processing,
  onApprove,
  onRejectClick,
}: ApplicationDetailDialogProps) {
  if (!application) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto admin-scrollbar">
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
            <div className="overflow-hidden rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)] bg-muted">
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
