import React, { useState } from "react";
import { ImageUpload } from "@/components/site/ImageUpload";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { authApi } from "@/api/auth";
import { useOutletContext } from "react-router-dom";

export default function TrainerProfileEditor() {
  const { trainerProfile, setProfileTick } = useOutletContext<any>();

  const [formData, setFormData] = useState({
    full_name: trainerProfile.user?.full_name || "",
    phone_number: trainerProfile.phone_number || "",
    avatar_url: trainerProfile.avatar_url || trainerProfile.user?.avatar_url || "",
    specialization: trainerProfile.specialization || "",
    experience_years: String(trainerProfile.years_experience || 0),
    bio: trainerProfile.bio || "",
  });

  const [saving, setSaving] = useState(false);

  const isDirty =
    formData.full_name !== (trainerProfile.user?.full_name || "") ||
    formData.phone_number !== (trainerProfile.phone_number || "") ||
    formData.avatar_url !== (trainerProfile.avatar_url || trainerProfile.user?.avatar_url || "") ||
    formData.specialization !== (trainerProfile.specialization || "") ||
    formData.experience_years !== String(trainerProfile.years_experience || 0) ||
    formData.bio !== (trainerProfile.bio || "");

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await authApi.updateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        avatar_url: formData.avatar_url,
        specialization: formData.specialization,
        experience_years: Number(formData.experience_years) || 0,
        bio: formData.bio,
      });
      toast.success("Cập nhật hồ sơ Trainer thành công!");
      setProfileTick((t: any) => t + 1);
    } catch (error: any) {
      console.error(error);
      toast.error(error.response?.data?.message || "Cập nhật hồ sơ thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-primary/10 shadow-card">
      <CardContent className="p-6">
        <form onSubmit={handleSave} className="space-y-6">
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Cột trái: Ảnh đại diện */}
            <div className="w-full lg:w-[320px] shrink-0">
              <ImageUpload
                label="Ảnh đại diện Trainer"
                value={formData.avatar_url}
                onChange={(url) => setFormData((prev) => ({ ...prev, avatar_url: url }))}
                previewClassName="w-full aspect-[4/3] max-w-[320px] rounded-xl border-2 border-slate-100 shadow-sm"
                variant="avatar"
              />
              <p className="text-xs text-muted-foreground mt-2 text-center">
                Ảnh đại diện hiển thị trên trang danh sách PT.
              </p>
            </div>

            {/* Cột phải: Form thông tin */}
            <div className="flex-1 w-full space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Họ và tên</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, full_name: e.target.value }))}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Số điện thoại</Label>
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => setFormData((prev) => ({ ...prev, phone_number: e.target.value }))}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Chuyên môn (ngăn cách bởi dấu phẩy)</Label>
                  <Input
                    value={formData.specialization}
                    onChange={(e) => setFormData((prev) => ({ ...prev, specialization: e.target.value }))}
                    placeholder="Strength, HIIT, Yoga, Boxing"
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-semibold text-slate-700">Số năm kinh nghiệm</Label>
                  <Input
                    type="number"
                    min={0}
                    value={formData.experience_years}
                    onChange={(e) => setFormData((prev) => ({ ...prev, experience_years: e.target.value }))}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="font-semibold text-slate-700">Giới thiệu bản thân (Bio)</Label>
                <Textarea
                  rows={4}
                  value={formData.bio}
                  onChange={(e) => setFormData((prev) => ({ ...prev, bio: e.target.value }))}
                  className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
                  placeholder="Chia sẻ kinh nghiệm, phong cách huấn luyện của bạn..."
                />
              </div>

              <div className="space-y-3 pt-4 border-t border-slate-100">
                <Label className="font-bold text-slate-700 text-sm flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Chứng chỉ của tôi
                </Label>
                
                {(!trainerProfile.certificates || trainerProfile.certificates.length === 0) ? (
                  <p className="text-xs text-muted-foreground italic bg-slate-50 p-3 rounded-lg border border-dashed">
                    Chưa có thông tin chứng chỉ được cập nhật hoặc phê duyệt.
                  </p>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {trainerProfile.certificates.map((cert: any) => (
                      <div key={cert.id} className="flex gap-3 p-3 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors">
                        {cert.image_url && (
                          <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-white">
                            <img src={cert.image_url} alt={cert.cert_name} className="w-full h-full object-cover" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1 space-y-0.5">
                          <h4 className="text-xs font-bold text-slate-800 truncate" title={cert.cert_name}>
                            {cert.cert_name}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            <span className="font-semibold">Nơi cấp:</span> {cert.issued_by}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            <span className="font-semibold">Số:</span> {cert.certificate_number || "N/A"}
                          </p>
                          {(cert.issued_at || cert.expires_at) && (
                            <p className="text-[10px] text-slate-400">
                              {cert.issued_at ? new Date(cert.issued_at).toLocaleDateString("vi-VN") : ""}
                              {cert.expires_at ? ` - ${new Date(cert.expires_at).toLocaleDateString("vi-VN")}` : ""}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() =>
                setFormData({
                  full_name: trainerProfile.user?.full_name || "",
                  phone_number: trainerProfile.phone_number || "",
                  avatar_url: trainerProfile.avatar_url || trainerProfile.user?.avatar_url || "",
                  specialization: trainerProfile.specialization || "",
                  experience_years: String(trainerProfile.years_experience || 0),
                  bio: trainerProfile.bio || "",
                })
              }
              disabled={saving || !isDirty}
            >
              Hủy thay đổi
            </Button>
            <Button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px] text-white"
              disabled={saving || !isDirty}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Lưu thay đổi
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
