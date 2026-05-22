import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  User, 
  ChevronRight, 
  ShieldCheck, 
  Loader2,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { authApi } from '../../api/auth';

// --- Helper Components ---

interface FieldProps {
  id: string;
  label: string;
  type: string;
  placeholder: string;
  icon: React.ReactNode;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
}

const MotionField = ({
  id,
  label,
  type,
  placeholder,
  icon,
  value,
  onChange,
  required = false
}: FieldProps) => (
  <div className="space-y-1.5 text-left">
    <label htmlFor={id} className="block text-xs font-semibold text-slate-700">
      {label}
    </label>
    <div className="relative group">
      <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
        {icon}
      </span>
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        required={required}
        className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 py-2 text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400"
      />
    </div>
  </div>
);

const StrengthBar = ({ score }: { score: number }) => {
  const labels = ["Quá yếu", "Yếu", "Trung bình", "Mạnh", "Tuyệt vời"];
  const colors = ["bg-rose-500", "bg-rose-500", "bg-amber-400", "bg-emerald-500", "bg-emerald-500"];
  return (
    <div className="mt-2 w-full">
        <div className="flex gap-1 h-1">
            {[0, 1, 2, 3].map((i) => (
                <div key={i} className={`flex-1 rounded-full ${i < score ? colors[score] : 'bg-slate-100'}`} />
            ))}
        </div>
        <p className="text-[10px] text-slate-400 mt-1">{labels[score]}</p>
    </div>
  );
};

const Register = () => {
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    identifier: '',
    otp: '',
    password: '',
  });

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleRequestOTP = async () => {
    if (!formData.identifier) {
      setError("Vui lòng nhập Email trước");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await authApi.requestOTP(formData.identifier);
      setSuccess("Mã OTP đã được gửi đến email!");
      setOtpSent(true);
      setCountdown(120);
    } catch (err: any) {
      console.error("OTP Error:", err);
      if (err.message === "Network Error") {
        setError("Lỗi kết nối (CORS). Vui lòng kiểm tra cấu hình Backend.");
      } else {
        setError(err.response?.data?.message || "Không thể gửi OTP. Vui lòng thử lại.");
      }
    } finally {
      setLoading(false);
    }
  };

  const pwdStrength = (p: string) => {
    let s = 0;
    if (p.length >= 8) s++;
    if (/[A-Z]/.test(p)) s++;
    if (/[0-9]/.test(p)) s++;
    if (/[^A-Za-z0-9]/.test(p)) s++;
    return s;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAgreed) return setError("Bạn cần đồng ý với các Điều khoản");
    if (!otpSent) return setError("Vui lòng xác thực email trước");

    setLoading(true);
    setError(null);
    try {
      await authApi.register({
        identifier: formData.identifier,
        otp: formData.otp,
        password: formData.password,
        personalInfo: {
          full_name: `${formData.firstName} ${formData.lastName}`.trim(),
        }
      });
      setSuccess("Tạo tài khoản thành công!");
    } catch (err: any) {
      setError(err.response?.data?.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <div className="inline-block px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#4F8A74] text-[11px] font-bold mb-4 uppercase tracking-wider">
          Bắt đầu hành trình của bạn
        </div>
        <h3 className="text-[32px] font-bold tracking-tight text-slate-900 leading-tight">
          Tạo tài khoản mới
        </h3>
        <p className="text-sm text-slate-500 mt-2">
            Thử nghiệm 7 ngày miễn phí. Hủy bất cứ lúc nào.
        </p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <MotionField 
            id="firstName" label="Họ" type="text" placeholder="Nguyễn"
            icon={<User className="h-4 w-4" />} value={formData.firstName}
            onChange={(v) => setFormData({...formData, firstName: v})} required
          />
          <MotionField 
            id="lastName" label="Tên" type="text" placeholder="Văn A"
            icon={<User className="h-4 w-4" />} value={formData.lastName}
            onChange={(v) => setFormData({...formData, lastName: v})} required
          />
        </div>

        <div className="flex gap-2 items-end">
            <div className="flex-1">
                <MotionField 
                    id="identifier" label="Địa chỉ Email" type="email" placeholder="vi_du@abc.com"
                    icon={<Mail className="h-4 w-4" />} value={formData.identifier}
                    onChange={(v) => setFormData({...formData, identifier: v})} required
                />
            </div>
            <button
                type="button" 
                disabled={loading || countdown > 0} 
                onClick={handleRequestOTP}
                className="h-[38px] px-4 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100 hover:bg-emerald-100 transition-all text-xs font-bold disabled:opacity-50"
            >
                {countdown > 0 ? `${Math.floor(countdown / 60)}:${(countdown % 60).toString().padStart(2, '0')}` : 'Xác thực'}
            </button>
        </div>

        <AnimatePresence>
            {otpSent && (
                <motion.div 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    exit={{ opacity: 0, height: 0 }} 
                    className="overflow-hidden"
                >
                    <MotionField 
                        id="otp" label="Mã xác thực OTP" type="text" placeholder="Nhập 6 chữ số"
                        icon={<ShieldCheck className="h-4 w-4" />} value={formData.otp}
                        onChange={(v) => setFormData({...formData, otp: v})} required
                    />
                </motion.div>
            )}
        </AnimatePresence>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
              <Lock className="h-4 w-4" />
            </span>
            <input 
              type={showPwd ? "text" : "password"} placeholder="Ít nhất 8 ký tự"
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400"
              value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} required
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {formData.password && <StrengthBar score={pwdStrength(formData.password)} />}
        </div>

        <label className="flex items-start gap-2 text-xs text-slate-500 cursor-pointer pt-1">
            <input type="checkbox" className="mt-0.5 h-4 w-4 rounded border-slate-300 accent-emerald-600 cursor-pointer" checked={isAgreed} onChange={(e) => setIsAgreed(e.target.checked)} />
            <span className="leading-tight">Tôi đồng ý với các <Link to="/terms" className="text-slate-900 font-bold hover:underline">Điều khoản</Link> và <Link to="/privacy" className="text-slate-900 font-bold hover:underline">Chính sách bảo mật</Link></span>
        </label>

        {error && <div className="text-rose-600 text-xs font-medium flex items-center gap-2 bg-rose-50 p-3 rounded-lg border border-rose-100"><AlertCircle className="h-4 w-4" /> {error}</div>}
        {success && <div className="text-emerald-600 text-xs font-medium flex items-center gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100"><ShieldCheck className="h-4 w-4" /> {success}</div>}
        
        <button
          type="submit" disabled={loading || !isAgreed}
          className="w-full bg-[#4F8A74] text-white h-11 rounded-lg font-bold shadow-sm hover:bg-[#3f6e5d] transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2 uppercase tracking-widest"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo tài khoản ngay"}
        </button>
      </form>

      <div className="mt-8 text-center text-sm text-slate-500">
        Bạn đã có tài khoản? <Link to="/login" className="text-slate-900 font-bold hover:underline">Đăng nhập</Link>
      </div>
    </div>
  );
};

export default Register;
