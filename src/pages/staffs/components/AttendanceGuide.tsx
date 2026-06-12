import React from "react";
import { Key, AlertCircle, Wifi, ShieldAlert } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function AttendanceGuide() {
  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-card">
        <CardHeader className="bg-muted/40 py-5">
          <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
            <Key className="h-4 w-4 text-emerald-600" />
            Hướng dẫn Điểm danh
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-4 text-sm leading-relaxed text-muted-foreground">
          <div className="space-y-3">
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">1</div>
              <p>Bấm nút <strong>"Check-in ca trực"</strong> tại ca đang hiển thị để bắt đầu.</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">2</div>
              <p>Chọn phương thức điểm danh: Nhập mã PIN 6 chữ cái do Quản lý cấp hoặc dùng <strong>Nhận diện khuôn mặt</strong>.</p>
            </div>
            <div className="flex gap-3">
              <div className="h-6 w-6 rounded-full bg-emerald-100 text-emerald-700 font-bold grid place-items-center text-xs shrink-0 mt-0.5">3</div>
              <p>Vào cuối ca, nhớ bấm <strong>"Check-out ca trực"</strong> để kết thúc và ghi nhận giờ ra.</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm rounded-xl overflow-hidden bg-card">
        <CardHeader className="bg-muted/40 py-4">
          <CardTitle className="text-sm font-bold text-amber-800 flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-amber-600" />
            Quy định Điểm danh
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5 space-y-3 text-xs leading-relaxed text-muted-foreground">
          <div className="flex gap-2">
            <Wifi className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Yêu cầu mạng WiFi chi nhánh (IP Binding):</strong> Thiết bị của bạn bắt buộc phải kết nối với đường truyền mạng WiFi tại chi nhánh đó (sử dụng Static Public IP). Hệ thống sẽ tự động chặn các yêu cầu check-in từ mạng ngoài.
            </p>
          </div>
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Giới hạn thời gian ca trực:</strong> 
              <br />
              • Check-in sớm tối đa: <strong>30 phút</strong> trước khi ca bắt đầu.
              <br />
              • Check-in muộn tối đa: <strong>15 phút</strong> sau khi ca bắt đầu. Trễ hơn thời gian này, bạn không thể tự điểm danh.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

