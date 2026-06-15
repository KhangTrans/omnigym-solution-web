import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Loader2, Save } from "lucide-react";
import { ImageUpload } from "@/components/site/ImageUpload";

interface ProfileInfoCardProps {
  profile: any;
  onUpdate: (field: string, value: any) => void;
  saving: boolean;
  isDirty: boolean;
  onCancel: () => void;
  onSave: () => void;
}

export function ProfileInfoCard({
  profile,
  onUpdate,
  saving,
  isDirty,
  onCancel,
  onSave
}: ProfileInfoCardProps) {
  return (
    <Card className="border-none shadow-sm capitalize">
      <CardHeader>
        <CardTitle className="text-lg font-bold">Thông tin định danh</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Cột trái: Ảnh đại diện */}
          <div className="w-full lg:w-[400px] shrink-0">
            <ImageUpload
              label="Ảnh đại diện"
              value={profile?.avatar_url}
              onChange={(v) => onUpdate("avatar_url", v)}
              previewClassName="w-full aspect-[4/3] max-w-[400px] rounded-xl border-2 border-slate-100 shadow-sm"
              variant="avatar"
            />
          </div>

          {/* Cột phải: Form thông tin */}
          <div className="flex-1 w-full space-y-6">
            <div className="grid gap-6 sm:grid-cols-2">
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Họ và tên</Label>
                <Input 
                  value={profile?.full_name || ""} 
                  onChange={(e) => onUpdate("full_name", e.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Email</Label>
                <Input 
                  type="email" 
                  value={profile?.email || ""} 
                  disabled
                  className="bg-slate-100 border-slate-200 cursor-not-allowed opacity-70"
                />
              </div>
              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Số điện thoại</Label>
                <Input 
                  value={profile?.phone_number || ""} 
                  onChange={(e) => onUpdate("phone_number", e.target.value)}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  placeholder="Chưa cập nhật"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Giới thiệu bản thân</Label>
              <Textarea 
                rows={4} 
                value={profile?.bio || ""} 
                onChange={(e) => onUpdate("bio", e.target.value)}
                className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                placeholder="Chia sẻ một chút về vai trò hoặc kinh nghiệm của bạn..."
              />
            </div>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t">
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={saving || !isDirty}
          >
            Hủy thay đổi
          </Button>
          <Button 
            onClick={onSave} 
            className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
            disabled={saving || !isDirty}
          >
            {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Lưu thay đổi
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
