import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Camera } from "lucide-react";

interface FaceRegistrationCardProps {
  isFaceRegistered: boolean;
  onOpenModal: () => void;
}

export function FaceRegistrationCard({ isFaceRegistered, onOpenModal }: FaceRegistrationCardProps) {
  return (
    <Card className="border-none shadow-sm overflow-hidden">
      <CardHeader className="border-b bg-slate-50/50 pb-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
            <Camera className="h-4 w-4" />
          </div>
          <div>
            <CardTitle className="text-lg font-bold">Xác thực bằng khuôn mặt</CardTitle>
            <p className="text-xs text-muted-foreground">Đăng ký khuôn mặt mẫu để điểm danh ra vào ca nhanh chóng</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border border-dashed border-slate-200 bg-slate-50/30 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">Trạng thái đăng ký:</span>
              {isFaceRegistered ? (
                <Badge className="bg-emerald-100 text-emerald-800 border-none font-bold normal-case">
                  Đã đăng ký khuôn mặt
                </Badge>
              ) : (
                <Badge variant="outline" className="border-slate-300 text-slate-600 normal-case">
                  Chưa đăng ký
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Khuôn mặt mẫu sẽ được mã hóa dưới dạng vector đặc trưng và so khớp tự động khi điểm danh.
            </p>
          </div>
          <Button
            onClick={onOpenModal}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl"
          >
            <Camera className="mr-2 h-4 w-4" />
            {isFaceRegistered ? "Đăng ký lại khuôn mặt" : "Bắt đầu đăng ký"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
