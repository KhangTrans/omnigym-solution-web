import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Phone, 
  Calendar, 
  Ruler, 
  Weight, 
  Camera,
  Save,
  CheckCircle2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../utils/cn';
import { authApi } from '../../api/auth';
import { notify } from '../../utils/notify';
import { uploadImageToCloudinary } from '../../utils/cloudinary';

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
    id: 0,
    full_name: '',
    email: '',
    phone_number: '',
    avatar_url: '',
    dob: '',
    height: '' as string | number,
    weight: '' as string | number,
    gender: 'Other',
    workout_goal: '',
    medical_history: '',
    role: 'Customer'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await authApi.getMe();
        const user = response.data;
        
        // Flatten nested customer data if it exists
        const customerData = user.customer || {};
        
        setProfile(prev => ({
          ...prev,
          ...user,
          ...customerData,
          full_name: user.full_name || 'Hội viên',
          gender: customerData.gender || 'Other',
          dob: customerData.dob ? new Date(customerData.dob).toISOString().split('T')[0] : '',
          height: customerData.height || '',
          weight: customerData.weight || '',
          workout_goal: customerData.workout_goal || '',
          medical_history: customerData.medical_history || ''
        }));
      } catch {
        // Fallback to local storage if API fails
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const user = JSON.parse(savedUser);
            setProfile(prev => ({ ...prev, ...user }));
          } catch {
            // Ignore parse error
          }
        }
      }
    };
    fetchProfile();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const response = await authApi.updateProfile(profile);
      const updatedUser = response.data.user;
      const customerData = updatedUser.customer || {};
      
      // Update local storage with full structured user object
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      // Flatten for the local profile state
      setProfile(prev => ({ 
        ...prev, 
        ...updatedUser,
        ...customerData,
        gender: customerData.gender || 'Other',
        dob: customerData.dob ? new Date(customerData.dob).toISOString().split('T')[0] : '',
        height: customerData.height || '',
        weight: customerData.weight || '',
        workout_goal: customerData.workout_goal || '',
        medical_history: customerData.medical_history || ''
      }));
      
      setSuccess(true);
      notify.success("Cập nhật hồ sơ thành công");
      setTimeout(() => setSuccess(false), 3000);
    } catch (error: any) {
      notify.error(error.response?.data?.message || "Không thể cập nhật hồ sơ");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 4 * 1024 * 1024) {
      notify.error("Kích thước ảnh không được vượt quá 4MB");
      return;
    }

    setIsSaving(true);
    try {
      // Gọi utility upload lên Cloudinary đã tạo
      const imageUrl = await uploadImageToCloudinary(file);
      
      const response = await authApi.updateProfile({ avatar_url: imageUrl });
      const updatedUser = response.data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setProfile(prev => ({ 
        ...prev, 
        avatar_url: updatedUser.avatar_url,
        full_name: updatedUser.full_name,
        phone_number: updatedUser.phone_number
      }));
      
      window.dispatchEvent(new Event('user-login'));
      notify.success("Cập nhật ảnh đại diện thành công");
    } catch (error: any) {
      console.error("Upload error:", error);
      notify.error(error.message || "Không thể tải ảnh lên. Vui lòng thử lại.");
    } finally {
      setIsSaving(false);
    }
  };

  const initials = profile.full_name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .substring(0, 2) || 'U';

  return (
    <div>
      <main className="mx-auto max-w-4xl px-4 py-8 sm:px-8 lg:px-10">
        <div className="space-y-8">
          {/* Profile Hero Card */}
          <div className="relative overflow-hidden rounded-[1.75rem] border border-primary/10 bg-primary/5 p-6 text-center sm:flex sm:items-center sm:gap-6 sm:text-left">
            <div className="relative group">
              {profile.avatar_url ? (
                <img 
                  src={profile.avatar_url} 
                  alt={profile.full_name} 
                  referrerPolicy="no-referrer"
                  className="h-24 w-24 rounded-full border-4 border-background object-cover ring-2 ring-primary/15 shadow-card"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'User')}&background=4F8A74&color=fff`;
                  }}
                />
              ) : (
                <div className="grid h-24 w-24 place-items-center rounded-full bg-white text-2xl font-bold text-primary ring-2 ring-primary/15 ring-offset-4 ring-offset-background shadow-card transition-all group-hover:bg-primary/5">
                  {initials}
                </div>
              )}
              <button 
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="absolute bottom-0 right-0 rounded-full border border-primary/15 bg-white p-1.5 text-foreground shadow-sm transition-all hover:scale-110 hover:text-primary"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input 
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>

            <div className="flex-1">
              <Badge variant="secondary" className="mb-2">Hội viên</Badge>
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{profile.full_name}</h1>
              <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" /> {profile.email || 'Không có email'}
              </p>
            </div>
          </div>

          <div className="grid gap-8">
            <section className="space-y-6">
              <h2 className="flex items-center gap-2 border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">
                Thông tin cá nhân
              </h2>
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Họ và tên</label>
                  <input 
                    type="text" 
                    value={profile.full_name} 
                    onChange={e => setProfile({...profile, full_name: e.target.value})}
                    className="w-full rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Số điện thoại</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="tel" 
                      value={profile.phone_number} 
                      onChange={e => setProfile({...profile, phone_number: e.target.value})}
                      className="w-full rounded-xl border border-border bg-background/70 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Giới tính</label>
                  <select 
                    value={profile.gender}
                    onChange={e => setProfile({...profile, gender: e.target.value})}
                    className="w-full rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                  >
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ngày sinh</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input 
                      type="date" 
                      value={profile.dob} 
                      onChange={e => setProfile({...profile, dob: e.target.value})}
                      className="w-full rounded-xl border border-border bg-background/70 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                    />
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="flex items-center gap-2 border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">
                Chỉ số hình thể
              </h2>
              <div className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Chiều cao (cm)</label>
                    <div className="relative">
                      <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="number" 
                        value={profile.height} 
                        onChange={e => setProfile({...profile, height: e.target.value})}
                        className="w-full rounded-xl border border-border bg-background/70 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Cân nặng (kg)</label>
                    <div className="relative">
                      <Weight className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input 
                        type="number" 
                        value={profile.weight} 
                        onChange={e => setProfile({...profile, weight: e.target.value})}
                        className="w-full rounded-xl border border-border bg-background/70 pl-10 pr-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all"
                        placeholder="0"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Mục tiêu tập luyện</label>
                  <textarea 
                    rows={2}
                    value={profile.workout_goal}
                    onChange={e => setProfile({...profile, workout_goal: e.target.value})}
                    placeholder="Bạn đang hướng tới mục tiêu gì?"
                    className="w-full rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all resize-none"
                  />
                </div>
              </div>
            </section>

            <section className="space-y-6">
              <h2 className="flex items-center gap-2 border-l-4 border-primary pl-3 text-lg font-semibold text-foreground">
                Thông tin sức khỏe
              </h2>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tiền sử bệnh lý</label>
                <textarea 
                  rows={3}
                  value={profile.medical_history}
                  onChange={e => setProfile({...profile, medical_history: e.target.value})}
                  placeholder="Bất kỳ tình trạng hoặc chấn thương nào chúng tôi cần biết?"
                  className="w-full rounded-xl border border-border bg-background/70 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:border-primary focus:ring-primary/20 transition-all resize-none"
                />
              </div>
            </section>
          </div>

          <div className="flex items-center justify-end gap-3 pt-8 pb-10">
            <button 
              onClick={() => navigate(-1)}
              className="rounded-2xl px-6 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary"
            >
              Hủy
            </button>
            <button 
              onClick={handleSave}
              disabled={isSaving}
              className={cn(
                "group relative flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5 active:scale-95 disabled:opacity-70",
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
                  <Save className="h-5 w-5" /> Cập nhật hồ sơ
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
