import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  Mail, 
  Phone, 
  Calendar, 
  Ruler, 
  Weight, 
  Target, 
  Activity,
  LogOut,
  ChevronLeft,
  Camera,
  Save,
  CheckCircle2
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';

// Reuse basic UI components (simulating the Shadcn ones used in the reference)
const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("bg-card text-card-foreground rounded-2xl border border-border shadow-card overflow-hidden", className)}>
    {children}
  </div>
);

const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn("p-6", className)}>
    {children}
  </div>
);

const Badge = ({ children, className, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'secondary' }) => {
  const variants = {
    default: "bg-primary text-primary-foreground",
    secondary: "bg-secondary text-secondary-foreground"
  };
  return (
    <span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
};

const CustomerProfile = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    phone_number: '',
    avatar_url: '',
    dob: '',
    height: '',
    weight: '',
    gender: 'Other',
    workout_goal: '',
    medical_history: '',
    role: 'Customer'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        setProfile(prev => ({
          ...prev,
          ...user,
          // Handle cases where fields might be missing
          full_name: user.full_name || 'Hội viên',
          gender: user.gender || 'Khác'
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
      setSuccess(true);
      localStorage.setItem('user', JSON.stringify(profile));
      setTimeout(() => setSuccess(false), 3000);
    }, 1000);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'U';

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-white/80 backdrop-blur-md sticky top-0 z-10">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
          <Link to="/" className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground hover:text-primary transition-colors">
            <ChevronLeft className="h-4 w-4" /> Quay lại trang chủ
          </Link>
          <button 
            onClick={handleLogout}
            className="text-sm font-medium text-destructive hover:text-destructive/80 transition-colors"
          >
            Đăng xuất
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="space-y-8">
          {/* Profile Hero Card */}
          <Card>
            <CardContent className="flex flex-col items-center gap-6 p-8 text-center sm:flex-row sm:text-left">
              <div className="relative group">
                {profile.avatar_url ? (
                  <img 
                    src={profile.avatar_url} 
                    alt={profile.full_name} 
                    className="h-28 w-28 rounded-full border-4 border-background object-cover ring-2 ring-border shadow-md"
                  />
                ) : (
                  <div className="grid h-28 w-28 place-items-center rounded-full bg-muted text-2xl font-bold text-foreground ring-2 ring-border ring-offset-4 ring-offset-background group-hover:bg-muted/80 transition-all">
                    {initials}
                  </div>
                )}
                <button className="absolute bottom-0 right-0 p-2 bg-white rounded-full border border-border shadow-sm text-foreground hover:text-primary transition-all hover:scale-110">
                  <Camera className="h-4 w-4" />
                </button>
              </div>

              <div className="flex-1">
                <Badge variant="secondary" className="mb-2">Hội viên</Badge>
                <h1 className="text-3xl font-bold tracking-tight">{profile.full_name}</h1>
                <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                  <Mail className="h-4 w-4" /> {profile.email || 'Không có email'}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 justify-center sm:justify-start">
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/50 rounded-lg text-xs font-medium border border-border">
                    <Activity className="h-3 w-3" /> Trạng thái hoạt động
                  </div>
                  {profile.workout_goal && (
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-lg text-xs font-medium border border-primary/20">
                      <Target className="h-3 w-3" /> {profile.workout_goal}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Details Sections */}
          <div className="grid gap-6">
            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <UserIcon className="h-5 w-5 text-primary" /> Thông tin cá nhân
              </h2>
              <Card>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Họ và tên</label>
                    <input 
                      type="text" 
                      value={profile.full_name} 
                      onChange={e => setProfile({...profile, full_name: e.target.value})}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Số điện thoại</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="tel" 
                        value={profile.phone_number} 
                        onChange={e => setProfile({...profile, phone_number: e.target.value})}
                        className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Giới tính</label>
                    <select 
                      value={profile.gender}
                      onChange={e => setProfile({...profile, gender: e.target.value})}
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="Male">Nam</option>
                      <option value="Female">Nữ</option>
                      <option value="Other">Khác</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Ngày sinh</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="date" 
                        value={profile.dob} 
                        onChange={e => setProfile({...profile, dob: e.target.value})}
                        className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" /> Chỉ số hình thể
              </h2>
              <Card>
                <CardContent className="space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-muted-foreground">Chiều cao (cm)</label>
                      <div className="relative">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input 
                          type="number" 
                          value={profile.height} 
                          onChange={e => setProfile({...profile, height: e.target.value})}
                          className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-muted-foreground">Cân nặng (kg)</label>
                      <div className="relative">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <input 
                          type="number" 
                          value={profile.weight} 
                          onChange={e => setProfile({...profile, weight: e.target.value})}
                          className="w-full rounded-xl border border-border bg-background pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                          placeholder="0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Mục tiêu tập luyện</label>
                    <textarea 
                      rows={2}
                      value={profile.workout_goal}
                      onChange={e => setProfile({...profile, workout_goal: e.target.value})}
                      placeholder="Bạn đang hướng tới mục tiêu gì?"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>

            <section className="space-y-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" /> Thông tin sức khỏe
              </h2>
              <Card>
                <CardContent>
                  <div className="space-y-1.5">
                    <label className="text-sm font-semibold text-muted-foreground">Tiền sử bệnh lý</label>
                    <textarea 
                      rows={3}
                      value={profile.medical_history}
                      onChange={e => setProfile({...profile, medical_history: e.target.value})}
                      placeholder="Bất kỳ tình trạng hoặc chấn thương nào chúng tôi cần biết?"
                      className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all resize-none"
                    />
                  </div>
                </CardContent>
              </Card>
            </section>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 pb-20">
            <button 
              onClick={() => navigate(-1)}
              className="px-6 py-2.5 text-sm font-semibold text-muted-foreground hover:bg-secondary rounded-xl transition-colors"
            >
              Hủy
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "group relative flex items-center gap-2 px-8 py-2.5 bg-primary text-primary-foreground text-sm font-bold rounded-xl transition-all shadow-lg active:scale-95 disabled:opacity-70",
                success && "bg-emerald-600 hover:bg-emerald-600 shadow-emerald-200"
              )}
            >
              {isSaving ? (
                <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 animate-in zoom-in" />
                  Đã lưu!
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" /> Lưu hồ sơ
                </>
              )}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerProfile;
