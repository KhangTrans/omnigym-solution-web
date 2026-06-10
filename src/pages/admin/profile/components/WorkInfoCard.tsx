import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Briefcase, Building2, MapPin, Clock } from "lucide-react";

interface WorkInfoCardProps {
  profile: any;
}

export function WorkInfoCard({ profile }: WorkInfoCardProps) {
  return (
    <Card className="border-none shadow-sm overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 border border-slate-100">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <Briefcase className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Thông tin công việc &amp; Chi nhánh</CardTitle>
            <p className="text-xs text-muted-foreground">Chi tiết vị trí công tác và chi nhánh trực thuộc của bạn</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* Thông tin công việc */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Thông tin công việc</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium text-slate-500">Phòng ban</span>
                <span className="text-sm font-semibold text-slate-900">{profile?.staff?.department || "Chưa cập nhật"}</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-lg bg-slate-50 border border-slate-100">
                <span className="text-sm font-medium text-slate-500">Nhiệm vụ được giao</span>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-800 border-none font-bold">
                  {profile?.staff?.assigned_tasks_count ?? 0} nhiệm vụ
                </Badge>
              </div>
            </div>
          </div>

          {/* Thông tin chi nhánh */}
          <div className="space-y-4">
            <h4 className="text-sm font-bold uppercase tracking-wider text-slate-500">Chi nhánh làm việc</h4>
            {profile?.staff?.branch ? (
              <div className="p-4 rounded-xl border border-emerald-100 bg-emerald-50/30 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Building2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">{profile.staff.branch.branch_name}</div>
                    <div className="text-xs text-emerald-700/80 font-medium">Chi nhánh đang hoạt động</div>
                  </div>
                </div>
                
                <div className="space-y-2 pt-2 border-t border-emerald-100/50">
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span className="truncate" title={profile.staff.branch.address}>{profile.staff.branch.address}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Giờ mở cửa: {profile.staff.branch.opening_house || "06:00 - 22:00"}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center">
                <Building2 className="h-8 w-8 text-slate-300 mb-2" />
                <span className="text-sm font-bold text-slate-500">Chưa gán chi nhánh</span>
                <p className="text-xs text-slate-400 mt-1">Vui lòng liên hệ Quản trị viên để được phân bổ chi nhánh làm việc</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
