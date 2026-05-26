import { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Save, 
  LogOut,
  User,
  Mail,
  Phone,
  Camera
} from 'lucide-react';
import { cn } from '../../utils/cn';

// Simple reusable components
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden", className)}>
    {children}
  </div>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
);

const CardHeader = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("px-6 py-4 border-b border-slate-100", className)}>
    {children}
  </div>
);

const AdminProfile = () => {
  const [profile, setProfile] = useState({
    name: 'Quản trị viên',
    email: 'admin@omnigym.vn',
    role: 'Quản trị hệ thống',
    phone: '0987 654 321',
    avatar: 'https://github.com/shadcn.png',
    bio: 'Quản lý vận hành hệ thống giải pháp OmniGym.',
    twoFactor: true
  });

  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setProfile(prev => ({
          ...prev,
          name: user.full_name || prev.name,
          email: user.email || prev.email,
          role: user.role || prev.role,
          avatar: user.avatar_url || prev.avatar,
        }));
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  }, []);

  const handleSave = () => {
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      alert("Đã lưu thay đổi hồ sơ!");
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Hồ sơ Quản trị</h1>
          <p className="text-sm text-slate-500">
            Cập nhật thông tin tài khoản và cấu hình bảo mật của bạn.
          </p>
        </div>
        <div className="flex items-center gap-1 bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-100">
          <ShieldCheck className="h-3 w-3" /> {profile.role}
        </div>
      </div>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">Thông tin cá nhân</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center sm:flex-row sm:items-start gap-6">
            <div className="relative group">
              <img 
                src={profile.avatar} 
                alt={profile.name} 
                className="h-24 w-24 rounded-full object-cover ring-4 ring-slate-50 border border-slate-200"
              />
              <button className="absolute bottom-0 right-0 p-1.5 bg-white rounded-full border border-slate-200 shadow-sm text-slate-500 hover:text-emerald-600 transition-colors">
                <Camera className="h-4 w-4" />
              </button>
            </div>
            
            <div className="flex-1 space-y-4 w-full">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 ml-0.5">Họ và tên</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={profile.name} 
                      onChange={(e) => setProfile({...profile, name: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 ml-0.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      value={profile.email} 
                      onChange={(e) => setProfile({...profile, email: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 ml-0.5">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="text" 
                      value={profile.phone} 
                      onChange={(e) => setProfile({...profile, phone: e.target.value})}
                      className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-700 ml-0.5">Vai trò</label>
                  <input 
                    type="text" 
                    value={profile.role} 
                    disabled
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>
              
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 ml-0.5">Giới thiệu</label>
                <textarea 
                  rows={3} 
                  value={profile.bio} 
                  onChange={(e) => setProfile({...profile, bio: e.target.value})}
                  className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-base font-semibold text-slate-900">Bảo mật</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-slate-200 p-4 bg-slate-50/50">
            <div>
              <div className="text-sm font-semibold text-slate-900">Xác thực 2 yếu tố (2FA)</div>
              <div className="text-xs text-slate-500">
                Yêu cầu mã xác thực một lần khi đăng nhập vào bảng quản trị.
              </div>
            </div>
            <button 
              onClick={() => setProfile({...profile, twoFactor: !profile.twoFactor})}
              className={cn(
                "w-10 h-5 rounded-full relative transition-colors duration-200 ease-in-out outline-none",
                profile.twoFactor ? "bg-emerald-600" : "bg-slate-300"
              )}
            >
              <div className={cn(
                "absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-200 ease-in-out",
                profile.twoFactor ? "left-6" : "left-1"
              )} />
            </button>
          </div>
          
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-0.5">Mật khẩu mới</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-0.5">Xác nhận mật khẩu</label>
              <input 
                type="password" 
                placeholder="••••••••" 
                className="w-full rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between pt-4">
        <button 
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
        >
          <LogOut className="h-4 w-4" /> Đăng xuất khỏi quản trị
        </button>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-lg transition-all shadow-md active:scale-95 disabled:opacity-50"
        >
          {isSaving ? "Đang lưu..." : (
            <>
              <Save className="h-4 w-4" /> Lưu thay đổi
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default AdminProfile;