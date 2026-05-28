import React, { useState } from 'react';
import { 
  Lock, 
  ShieldCheck, 
  ArrowLeft, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

const ChangePassword = () => {
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!currentPassword) return setError("Vui lòng nhập mật khẩu hiện tại");
    if (newPassword.length < 6) return setError("Mật khẩu mới phải từ 6 ký tự");
    if (newPassword !== confirmPassword) return setError("Mật khẩu xác nhận không khớp");
    if (currentPassword === newPassword) return setError("Mật khẩu mới không được trùng với mật khẩu cũ");

    setLoading(true);
    setError(null);
    try {
      await authApi.changePassword({
        oldPassword: currentPassword,
        newPassword
      });
      setSuccess("Đổi mật khẩu thành công!");
      
      // Clear fields
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      // Optional: redirect or logout
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError("Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.");
        setTimeout(() => {
          localStorage.removeItem('user');
          navigate('/login');
        }, 2000);
      } else {
        setError(err.response?.data?.message || "Mật khẩu hiện tại không chính xác.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-8 sm:p-12">
      <div className="mb-10 border-b pb-6">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Đổi mật khẩu</h1>
        <p className="text-slate-500 text-sm">
          Đảm bảo mật khẩu của bạn có ít nhất 6 ký tự để bảo mật tài khoản.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-md">
        {/* Mật khẩu hiện tại */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
            <Lock className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            Mật khẩu hiện tại
          </label>
          <div className="relative group">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowCurrentPassword(!showCurrentPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Mật khẩu mới */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            Mật khẩu mới
          </label>
          <div className="relative group">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Xác nhận mật khẩu mới */}
        <div className="space-y-1.5">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center">
            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-slate-400" />
            Xác nhận mật khẩu mới
          </label>
          <div className="relative group">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full h-11 bg-slate-50 border border-slate-200 rounded-xl px-4 text-sm transition-all focus:bg-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
              placeholder="••••••••"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Thông báo Lỗi/Thành công */}
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-red-50 border border-red-100 flex items-start gap-3"
          >
            <AlertCircle className="h-4 w-4 text-red-500 mt-0.5" />
            <p className="text-sm text-red-600 font-medium">{error}</p>
          </motion.div>
        )}

        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100 flex items-start gap-3"
          >
            <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5" />
            <p className="text-sm text-emerald-600 font-medium">{success}</p>
          </motion.div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            "CẬP NHẬT MẬT KHẨU"
          )}
        </button>
      </form>
    </div>
  );
};

export default ChangePassword;
