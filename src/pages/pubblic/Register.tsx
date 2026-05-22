import React, { useState, useEffect, useRef, type FormEvent } from 'react';
import axios from 'axios';
import { 
  Mail, 
  Lock, 
  User, 
  Calendar, 
  Target, 
  ChevronRight, 
  ChevronLeft,
  ChevronDown,
  ShieldCheck, 
  Loader2,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthShell } from '../../components/AuthShell';

// --- Helper Components ---

function Field({
  id,
  label,
  type,
  placeholder,
  icon,
  value,
  onChange,
  required = false
}: {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value?: string;
  onChange?: (v: string) => void;
  required?: boolean;
}) {
  return (
    <div className="space-y-1.5 text-left">
      <label htmlFor={id} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="relative group">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground group-focus-within:text-primary transition-colors">
          {icon}
        </span>
        <input
          id={id}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          required={required}
          className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm shadow-sm transition outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
        />
      </div>
    </div>
  );
}

function StrengthBar({ score }: { score: number }) {
  const labels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Tuyệt vời"];
  const colors = ["bg-red-500", "bg-red-500", "bg-yellow-500", "bg-primary", "bg-primary"];
  return (
    <div className="mt-2 w-full text-left">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < score ? colors[score] : "bg-muted"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{labels[score]}</p>
    </div>
  );
}

function scorePassword(p: string) {
  let s = 0;
  if (p.length >= 8) s++;
  if (/[A-Z]/.test(p)) s++;
  if (/[0-9]/.test(p)) s++;
  if (/[^A-Za-z0-9]/.test(p)) s++;
  return s;
}

const CustomSelect = ({ 
  label, 
  value, 
  options, 
  onChange 
}: { 
  label: string, 
  value: string, 
  options: { value: string, label: string }[], 
  onChange: (val: string) => void 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div className="space-y-1.5" ref={containerRef}>
      <label className="text-sm font-medium">{label}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full flex items-center justify-between rounded-lg border border-input bg-background px-3 py-2.5 text-sm shadow-sm transition outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-[42px] ${isOpen ? 'ring-2 ring-primary/20 border-primary' : ''}`}
        >
          <span>{selectedLabel}</span>
          <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary' : ''}`} />
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 4, scale: 0.98 }}
              className="absolute z-50 mt-1.5 w-full bg-background border border-input rounded-xl shadow-xl overflow-hidden py-1"
            >
              {options.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 text-sm transition-colors hover:bg-primary/5 hover:text-primary ${value === opt.value ? 'bg-primary/10 text-primary font-medium' : 'text-foreground'}`}
                >
                  {opt.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

// --- Main Component ---

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identifier: '',
    otp: '',
    password: '',
    confirmPassword: '',
    personalInfo: {
      age: '',
      gender: 'male',
      workout_goal: ''
    }
  });

  const pwdStrength = scorePassword(formData.password);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Request OTP
  const handleRequestOTP = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.identifier) {
      setError("Please enter your email");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await axios.post('/api/auth/request-otp', { identifier: formData.identifier });
      setSuccess("OTP sent to your email!");
      setOtpSent(true);
      setCountdown(60);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to send OTP. Please try again.");
      // For demo purpose
      setOtpSent(true);
      setCountdown(60);
    } finally {
      setLoading(false);
    }
  };

  // Register
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) {
      setError("Please verify your email first");
      return;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const payload = {
        identifier: formData.identifier,
        otp: formData.otp,
        password: formData.password,
        personalInfo: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
          age: Number(formData.personalInfo.age),
          gender: formData.personalInfo.gender,
          workout_goal: formData.personalInfo.workout_goal
        }
      };
      await axios.post('/api/auth/register', payload);
      setSuccess("Account created successfully!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      badge="Bắt đầu hành trình"
      title="Tạo tài khoản của bạn"
      subtitle="Dùng thử miễn phí 7 ngày. Hủy bất cứ lúc nào."
      footer={
        <>
          Đã là thành viên?{" "}
          <a href="/login" className="font-semibold text-primary hover:underline">
            Đăng nhập
          </a>
        </>
      }
    >
      <form onSubmit={handleRegister} className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
        {/* Name Group */}
        <div className="grid grid-cols-2 gap-3">
          <Field 
            id="firstName"
            label="Họ"
            type="text"
            placeholder="Nguyễn"
            icon={<User className="h-4 w-4" />}
            value={formData.firstName}
            onChange={(v) => setFormData({...formData, firstName: v})}
            required
          />
          <Field 
            id="lastName"
            label="Tên"
            type="text"
            placeholder="Văn A"
            icon={<User className="h-4 w-4" />}
            value={formData.lastName}
            onChange={(v) => setFormData({...formData, lastName: v})}
            required
          />
        </div>

        {/* Email & Verify Group */}
        <div className="space-y-4">
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Field 
                id="identifier"
                label="Email"
                type="email"
                placeholder="van-a@example.com"
                icon={<Mail className="h-4 w-4" />}
                value={formData.identifier}
                onChange={(v) => setFormData({...formData, identifier: v})}
                required
              />
            </div>
            <button
              type="button"
              disabled={loading || countdown > 0}
              onClick={handleRequestOTP}
              className="h-[42px] px-4 rounded-lg bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition text-sm font-semibold whitespace-nowrap disabled:opacity-50"
            >
              {countdown > 0 ? `${countdown}s` : 'Xác thực'}
            </button>
          </div>

          {/* OTP Field */}
          <AnimatePresence>
            {otpSent && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5"
              >
                <label className="text-sm font-medium text-foreground">Mã xác nhận (OTP)</label>
                <div className="relative group">
                  <ShieldCheck className="absolute inset-y-0 left-3 h-10 flex items-center text-muted-foreground group-focus-within:text-primary pointer-events-none w-4" />
                  <input 
                    type="text"
                    maxLength={6}
                    placeholder="Nhập mã 6 chữ số"
                    className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm shadow-sm transition outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    value={formData.otp}
                    onChange={(e) => setFormData({...formData, otp: e.target.value})}
                    required
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Password */}
        <div className="space-y-1.5">
          <label className="text-sm font-medium">Mật khẩu</label>
          <div className="relative group">
            <Lock className="absolute inset-y-0 left-3 h-10 flex items-center text-muted-foreground group-focus-within:text-primary pointer-events-none w-4" />
            <input 
              type={showPwd ? "text" : "password"}
              placeholder="Ít nhất 8 ký tự"
              className="w-full rounded-lg border border-input bg-background pl-10 pr-10 py-2.5 text-sm shadow-sm transition outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              required
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute inset-y-0 right-3 flex items-center text-muted-foreground hover:text-foreground"
            >
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <StrengthBar score={pwdStrength} />
        </div>

        {/* Optional Personal Info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <label className="text-sm font-medium">Tuổi</label>
            <div className="relative group">
              <Calendar className="absolute inset-y-0 left-3 h-10 flex items-center text-muted-foreground group-focus-within:text-primary pointer-events-none w-4" />
              <input 
                type="number"
                min="1"
                max="120"
                placeholder="20"
                className="w-full rounded-lg border border-input bg-background pl-10 pr-3 py-2.5 text-sm shadow-sm transition outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
                value={formData.personalInfo.age}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || (Number(val) >= 0 && Number(val) <= 120)) {
                    setFormData({...formData, personalInfo: {...formData.personalInfo, age: val}});
                  }
                }}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <CustomSelect 
              label="Giới tính"
              value={formData.personalInfo.gender}
              options={[
                { value: 'male', label: 'Nam' },
                { value: 'female', label: 'Nữ' },
                { value: 'other', label: 'Khác' }
              ]}
              onChange={(v) => setFormData({...formData, personalInfo: {...formData.personalInfo, gender: v}})}
            />
          </div>
        </div>

        <label className="flex items-start gap-2 text-sm text-muted-foreground pt-2 cursor-pointer group">
          <input 
            type="checkbox" 
            className="mt-0.5 h-4 w-4 rounded border-input accent-primary cursor-pointer transition"
            checked={isAgreed}
            onChange={(e) => setIsAgreed(e.target.checked)}
          />
          <span className="group-hover:text-foreground transition-colors">
            Tôi đồng ý với{" "}
            <a href="#" className="font-medium text-primary hover:underline">Điều khoản</a> và{" "}
            <a href="#" className="font-medium text-primary hover:underline">Chính sách bảo mật</a>.
          </span>
        </label>

        {error && (
          <div className="flex items-center gap-2 text-destructive text-sm font-medium bg-destructive/5 p-3 rounded-lg border border-destructive/10 animate-shake">
            <AlertCircle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
        
        <button
          type="submit"
          disabled={loading || !isAgreed}
          className="w-full bg-primary text-white h-11 rounded-lg font-semibold shadow-lg shadow-primary/20 hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed disabled:grayscale disabled:shadow-none"
        >
          {loading ? (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Đang xử lý...</span>
            </div>
          ) : 'Tạo tài khoản'}
        </button>
      </form>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: oklch(0.929 0.013 255.508); border-radius: 10px; }
        @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-4px); } 75% { transform: translateX(4px); } }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </AuthShell>
  );
};

export default Register;
