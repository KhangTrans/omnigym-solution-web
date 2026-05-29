import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Lock, 
  KeyRound, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  EyeOff,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';
import { rsaService } from '../../utils/rsa';

const ForgotPassword = () => {
  const navigate = useNavigate();
  
  // States cho luồng xử lý
  const [step, setStep] = useState<1 | 2>(1); // Bước 1: Nhập email, Bước 2: Nhập OTP & Pass mới
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(0);

  // States cho dữ liệu form
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Xử lý đếm ngược cho nút gửi lại mã
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // BƯỚC 1: Gửi yêu cầu khôi phục mật khẩu
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError("Vui lòng nhập địa chỉ email");
    
    setLoading(true);
    setError(null);
    try {
      await authApi.forgotPassword(email);
      setSuccess("Mã xác thực đã được gửi đến Email của bạn.");
      setStep(2); // Chuyển sang bước 2
      setCountdown(60); // Đếm ngược 60 giây
    } catch (err: any) {
      setError(err.response?.data?.message || "Email không tồn tại trong hệ thống.");
    } finally {
      setLoading(false);
    }
  };

  // BƯỚC 2: Xác nhận OTP và đặt lại mật khẩu
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation phía Client
    if (otp.length < 6) return setError("Mã OTP phải có 6 chữ số.");
    if (newPassword.length < 6) return setError("Mật khẩu mới phải từ 6 ký tự.");
    if (newPassword !== confirmPassword) return setError("Mật khẩu xác nhận không khớp.");

    setLoading(true);
    setError(null);
    try {
      // Mã hóa RSA cho mật khẩu mới
      const encryptedNewPassword = await rsaService.encrypt(newPassword);

      await authApi.resetPassword({
        email,
        otp,
        newPassword: encryptedNewPassword
      });
      setSuccess("Đổi mật khẩu thành công! Đang chuyển hướng về trang đăng nhập...");
      
      // Chuyển hướng về trang login sau 3 giây thành công
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || "Mã OTP không chính xác hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Nút quay lại */}
      <Link 
        to="/login" 
        className="inline-flex items-center text-xs font-bold text-slate-400 hover:text-emerald-600 transition-colors mb-6 group"
      >
        <ArrowLeft className="h-3.5 w-3.5 mr-1.5 transition-transform group-hover:-translate-x-1" />
        QUAY LẠI ĐĂNG NHẬP
      </Link>

      <div className="text-left mb-8">
        <div className="inline-block px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#4F8A74] text-[11px] font-bold mb-4 uppercase tracking-wider">
          {step === 1 ? "Khôi phục quyền truy cập" : "Thiết lập mật khẩu mới"}
        </div>
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
          {step === 1 ? "Quên mật khẩu?" : "Đặt lại mật khẩu"}
        </h3>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          {step === 1 
            ? "Đừng lo lắng, hãy nhập email của bạn và chúng tôi sẽ gửi mã khôi phục." 
            : `Mã OTP đã được gửi đến ${email}. Vui lòng kiểm tra hộp thư.`}
        </p>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.form
            key="step1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            onSubmit={handleRequestReset}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-0.5">Địa chỉ Email</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
                  <Mail className="h-4 w-4" />
                </span>
                <input
                  type="email"
                  placeholder="nhap_email@example.com"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F8A74] text-white h-11 rounded-lg font-bold shadow-sm hover:bg-[#3f6e5d] transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2 uppercase tracking-widest mt-2"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (
                <>
                  Gửi mã khôi phục <ChevronRight className="h-4 w-4" />
                </>
              )}
            </button>
          </motion.form>
        ) : (
          <motion.form
            key="step2"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            onSubmit={handleResetPassword}
            className="space-y-4"
          >
            {/* Trường nhập mã OTP */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-0.5">
                <label className="text-xs font-semibold text-slate-700">Mã xác thực (OTP)</label>
                <button 
                  type="button"
                  disabled={countdown > 0 || loading}
                  onClick={handleRequestReset}
                  className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 disabled:text-slate-400"
                >
                  {countdown > 0 ? `Gửi lại sau ${countdown}s` : "Gửi lại mã"}
                </button>
              </div>
              <div className="relative group">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  type="text"
                  placeholder="Nhập 6 chữ số"
                  maxLength={6}
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400 tracking-[0.5em] font-mono"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                />
              </div>
            </div>

            {/* Trường nhập mật khẩu mới */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-0.5">Mật khẩu mới</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2.5 text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Trường xác nhận mật khẩu */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 ml-0.5">Xác nhận mật khẩu</label>
              <div className="relative group">
                <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
                  <Lock className="h-4 w-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  required
                  className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2.5 text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#4F8A74] text-white h-11 rounded-lg font-bold shadow-sm hover:bg-[#3f6e5d] transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2 uppercase tracking-widest mt-4"
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Xác nhận đổi mật khẩu"}
            </button>
          </motion.form>
        )}
      </AnimatePresence>

      {/* Thông báo lỗi & thành công */}
      <div className="mt-6 space-y-3">
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-rose-600 text-[11px] font-medium flex items-center gap-2 bg-rose-50 p-3 rounded-lg border border-rose-100"
          >
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </motion.div>
        )}
        
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-700 text-[11px] font-medium flex items-center gap-2 bg-emerald-50 p-3 rounded-lg border border-emerald-100"
          >
            <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{success}</span>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
