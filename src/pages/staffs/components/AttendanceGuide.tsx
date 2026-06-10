import React from "react";
import { Key, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceGuide() {
  return (
    <Card className="border-border/60 shadow-lg rounded-[20px] overflow-hidden bg-card/50 backdrop-blur-sm">
      <CardHeader className="bg-emerald-500/5 py-5 border-b border-emerald-500/10">
        <CardTitle className="text-base font-bold text-slate-800 flex items-center gap-2">
          <Key className="h-4 w-4 text-emerald-600" />
          Hướng dẫn Điểm danh
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 space-y-4 text-sm leading-relaxed text-slate-600">
        <div className="space-y-3">
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">1</div>
            <p>Bấm nút <strong>"Check-in ca trực"</strong> tại ca đang hiển thị để mở bảng nhập mã PIN.</p>
          </div>
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">2</div>
            <p>Nhập mã PIN 6 chữ cái in hoa do quản lý chi nhánh cấp trực tiếp tại quầy.</p>
          </div>
          <div className="flex gap-3">
            <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">3</div>
            <p>Vào cuối ca, nhớ bấm <strong>"Check-out ca trực"</strong> để kết thúc và ghi nhận giờ ra.</p>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border text-xs text-muted-foreground flex items-start gap-2 mt-2">
            <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
            <span><strong>Lưu ý:</strong> Chức năng quét mã QR điểm danh được dành riêng cho ứng dụng di động (Mobile App). Trên giao diện web, vui lòng chỉ sử dụng mã PIN.</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
