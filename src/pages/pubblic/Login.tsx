import React, { useState, useEffect } from 'react';
import { Mail, Lock, Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import { authApi } from '../../api/auth';
import { notify } from '../../utils/notify';
import { rsaService } from '../../utils/rsa';

const Login = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPwd, setShowPwd] = useState(false);
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const navigate = useNavigate();

  // Kiểm tra nếu đã đăng nhập rồi thì chuyển hướng
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser);
        if (user?.role === 'Admin' || user?.role === 'Staff' || user?.role_id === 1 || user?.role_id === 2) {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } catch {
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      // Mã hóa mật khẩu bằng RSA trước khi gửi
      const encryptedPassword = await rsaService.encrypt(formData.password);

      const response = await authApi.login({
        ...formData,
        password: encryptedPassword
      });
      const { user } = response.data;
      
      // Lưu thông tin user vào localStorage
      localStorage.setItem('user', JSON.stringify(user));

      // Phát sự kiện để Navbar cập nhật ngay lập tức
      window.dispatchEvent(new Event('user-login'));

      notify.success(`Chào mừng ${user.full_name || 'bạn'} quay trở lại!`);

      // Kiểm tra vai trò từ backend để chuyển hướng
      // Giả định role_id: 1 là Admin, 2 là Staff (hoặc dùng chuỗi 'Admin', 'Staff')
      if (user?.role === 'Admin' || user?.role === 'Staff' || user?.role_id === 1 || user?.role_id === 2) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Email hoặc mật khẩu không đúng';
      setError(msg);
      notify.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authApi.googleLogin(credentialResponse.credential);
      const { user } = response.data;
      
      localStorage.setItem('user', JSON.stringify(user));
      window.dispatchEvent(new Event('user-login'));

      notify.success("Đăng nhập Google thành công!");

      if (user?.role === 'Admin' || user?.role === 'Staff' || user?.role_id === 1 || user?.role_id === 2) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Đăng nhập Google thất bại. Vui lòng thử lại.';
      setError(msg);
      notify.error(msg);
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

      <div className="relative my-8">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-slate-100"></div>
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-4 text-slate-400 font-medium">Hoặc đăng nhập với</span>
        </div>
      </div>

      <div className="flex justify-center">
        <GoogleLogin
          onSuccess={handleGoogleSuccess}
          onError={() => setError('Đăng nhập Google thất bại')}
          useOneTap
          theme="outline"
          shape="rectangular"
          width="100%"
        />
      </div>

      <div className="mt-10 text-center text-sm text-slate-500 pt-6 border-t border-slate-100">
        Bạn chưa có tài khoản? <Link to="/register" className="text-slate-900 font-bold hover:underline">Đăng ký ngay</Link>
      </div>
    </div>
  );
};

export default Login;
