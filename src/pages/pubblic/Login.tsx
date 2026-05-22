import React, { useState } from 'react';
import { Mail, Lock, ChevronRight, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/auth';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.login(formData);
      localStorage.setItem('token', response.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Email hoặc mật khẩu không đúng');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full">
      <div className="text-left mb-8">
        <div className="inline-block px-3 py-1 rounded-full bg-slate-50 border border-slate-100 text-[#4F8A74] text-[11px] font-bold mb-4 uppercase tracking-wider">
          Mừng bạn quay trở lại
        </div>
        <h3 className="text-3xl font-bold tracking-tight text-slate-900">
          Đăng nhập hệ thống
        </h3>
        <p className="text-sm text-slate-500 mt-2">
          Hành trình rèn luyện chuyên nghiệp bắt đầu từ đây.
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-5">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 ml-0.5">Địa chỉ Email</label>
          <div className="relative group">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
              <Mail className="h-4 w-4" />
            </span>
            <input
              type="email"
              placeholder="ten_dang_nhap@abc.com"
              required
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-4 py-2 text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400"
              value={formData.identifier}
              onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between items-center ml-0.5">
            <label className="text-xs font-semibold text-slate-700">Mật khẩu</label>
            <Link to="/forgot-password" intrinsic-title="Quên mật khẩu?" className="text-xs font-bold text-emerald-600 hover:underline">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative group">
            <span className="absolute inset-y-0 left-3 flex items-center text-slate-400 group-focus-within:text-slate-600 transition-colors">
              <Lock className="h-4 w-4" />
            </span>
            <input
              type={showPwd ? "text" : "password"}
              placeholder="••••••••"
              required
              className="w-full rounded-lg border border-slate-200 bg-white pl-10 pr-10 py-2 text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500 placeholder:text-slate-400"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
            <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600">
              {showPwd ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <div className="text-rose-600 text-[11px] font-medium flex items-center gap-2 bg-rose-50 p-2.5 rounded-lg border border-rose-100">
            <AlertCircle className="h-3.5 w-3.5" /> {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#4F8A74] text-white h-11 rounded-lg font-bold shadow-sm hover:bg-[#3f6e5d] transition-colors disabled:opacity-50 text-sm flex items-center justify-center gap-2 mt-2 uppercase tracking-widest"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Đăng nhập ngay"}
        </button>
      </form>

      <div className="mt-10 text-center text-sm text-slate-500 pt-6 border-t border-slate-100">
        Bạn chưa có tài khoản? <Link to="/register" className="text-slate-900 font-bold hover:underline">Đăng ký ngay</Link>
      </div>
    </div>
  );
};

export default Login;
