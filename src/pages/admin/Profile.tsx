
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, Save, LogOut, KeyRound, Lock, UserCog } from "lucide-react";
import { authApi } from "@/api/auth";
import { toast } from "sonner";
import { ImageUpload } from "@/components/site/ImageUpload";

function AdminProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialProfile, setInitialProfile] = useState<any>(null);
  const [changingPass, setChangingPass] = useState(false);
  const [passwords, setPasswords] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [profile, setProfile] = useState<any>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await authApi.getMe();
      const user = response.data.user;
      if (user) {
        setProfile(user);
        setInitialProfile(user);
        // Cập nhật lại localStorage để đồng bộ với server
        localStorage.setItem('user', JSON.stringify(user));
        window.dispatchEvent(new Event('user-login'));
      }
    } catch (error: any) {
      console.error("Fetch profile error:", error);
      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn");
        localStorage.removeItem('user');
        window.location.href = '/login';
      } else {
        // Nếu lỗi mạng, vẫn giữ data cũ từ localStorage (đã set ở initState)
        toast.error("Không thể kết nối máy chủ để cập nhật dữ liệu mới nhất");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = (field: string, value: any) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
  };

  const save = async () => {
    setSaving(true);
    try {
      // Gọi API thực tế để cập nhật hồ sơ
      const response = await authApi.updateProfile({
        full_name: profile.full_name,
        phone_number: profile.phone_number,
        avatar_url: profile.avatar_url,
        bio: profile.bio
      });
      
      const updatedUser = response.data.user || profile;
      
      // Cập nhật lại localStorage để các thành phần khác (Navbar) đồng bộ
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfile(updatedUser);
      setInitialProfile(updatedUser);
      window.dispatchEvent(new Event('user-login'));
      
      toast.success("Đã cập nhật hồ sơ thành công");
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || "Cập nhật hồ sơ thất bại";
      toast.error(errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const isDirty = 
    profile?.full_name !== initialProfile?.full_name ||
    profile?.phone_number !== (initialProfile?.phone_number || "") ||
    profile?.avatar_url !== initialProfile?.avatar_url ||
    profile?.bio !== (initialProfile?.bio || "");

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.newPassword !== passwords.confirmPassword) {
      return toast.error("Mật khẩu mới không khớp");
    }
    if (passwords.newPassword.length < 6) {
      return toast.error("Mật khẩu mới phải có ít nhất 6 ký tự");
    }

    setChangingPass(true);
    try {
      await authApi.changePassword({
        oldPassword: passwords.oldPassword,
        newPassword: passwords.newPassword
      });
      toast.success("Đổi mật khẩu thành công");
      setPasswords({ oldPassword: "", newPassword: "", confirmPassword: "" });
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Đổi mật khẩu thất bại");
    } finally {
      setChangingPass(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Hồ sơ cá nhân</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý thông tin cá nhân và thiết lập tài khoản của bạn.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 px-3 py-1 text-xs">
          <ShieldCheck className="h-3.5 w-3.5" /> 
          {profile?.role === 'Admin' ? 'Quản trị viên' : (profile?.role === 'Partner' ? 'Đối tác' : 'Nhân viên')}
        </Badge>
      </div>

      <Card className="border-none shadow-sm capitalize">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Thông tin định danh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <ImageUpload
            label="Ảnh đại diện"
            value={profile?.avatar_url}
            onChange={(v) => handleUpdate("avatar_url", v)}
            previewClassName="h-24 w-24 rounded-full border-2 border-slate-100 shadow-sm"
            hint="Khuyên dùng ảnh vuông · tối đa 4MB"
          />

          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-semibold text-slate-700">Họ và tên</Label>
              <Input 
                value={profile?.full_name || ""} 
                onChange={(e) => handleUpdate("full_name", e.target.value)}
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
                onChange={(e) => handleUpdate("phone_number", e.target.value)}
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
              onChange={(e) => handleUpdate("bio", e.target.value)}
              className="bg-slate-50 border-slate-200 focus:bg-white transition-colors"
              placeholder="Chia sẻ một chút về vai trò hoặc kinh nghiệm của bạn..."
            />
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t">
            <Button 
              variant="outline" 
              onClick={fetchProfile}
              disabled={saving || !isDirty}
            >
              Hủy thay đổi
            </Button>
            <Button 
              onClick={save} 
              className="bg-emerald-600 hover:bg-emerald-700 min-w-[120px]"
              disabled={saving || !isDirty}
            >
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Lưu thay đổi
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-slate-50/50 pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <KeyRound className="h-4 w-4" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Bảo mật tài khoản</CardTitle>
              <p className="text-xs text-muted-foreground">Thay đổi mật khẩu định kỳ để bảo vệ tài khoản của bạn</p>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <form onSubmit={handleChangePassword} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Lock className="h-3.5 w-3.5 text-slate-400" />
                    Mật khẩu hiện tại
                  </Label>
                  <Input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwords.oldPassword}
                    onChange={(e) => setPasswords(p => ({ ...p, oldPassword: e.target.value }))}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>
                
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2">Quy tắc mật khẩu</h4>
                  <ul className="space-y-1.5">
                    <li className="text-xs text-blue-600 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-blue-400" />
                      Tối thiểu 6 ký tự
                    </li>
                    <li className="text-xs text-blue-600 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-blue-400" />
                      Nên bao gồm cả chữ và số
                    </li>
                    <li className="text-xs text-blue-600 flex items-center gap-2">
                      <div className="h-1 w-1 rounded-full bg-blue-400" />
                      Không nên trùng với mật khẩu cũ
                    </li>
                  </ul>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <KeyRound className="h-3.5 w-3.5 text-slate-400" />
                    Mật khẩu mới
                  </Label>
                  <Input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords(p => ({ ...p, newPassword: e.target.value }))}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                    Xác nhận mật khẩu mới
                  </Label>
                  <Input 
                    type="password"
                    required
                    placeholder="••••••••"
                    value={passwords.confirmPassword}
                    onChange={(e) => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))}
                    className="bg-slate-50 border-slate-200 focus:bg-white transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t">
              <Button 
                type="submit" 
                className="bg-slate-900 hover:bg-slate-800 text-white min-w-[160px] shadow-lg shadow-slate-200"
                disabled={changingPass || !passwords.oldPassword || !passwords.newPassword}
              >
                {changingPass ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Lock className="mr-2 h-4 w-4" />}
                Cập nhật bảo mật
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminProfilePage;
