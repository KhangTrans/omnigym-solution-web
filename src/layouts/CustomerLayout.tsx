import React, { useEffect, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  LogOut, 
  ChevronLeft,
  Settings,
  Dumbbell,
  Loader2
} from 'lucide-react';
import { cn } from '../utils/cn';
import { Navbar } from '../components/site/Navbar';
import { authApi } from '../api/auth';

export default function CustomerLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    const verifySession = async () => {
      try {
        await authApi.getMe();
        setVerifying(false);
      } catch (error) {
        console.error("Session verification failed", error);
        const savedUser = localStorage.getItem('user');
        if (!savedUser) {
          navigate('/login');
        } else {
          setVerifying(false); // Cho phép xem trang bằng data cũ nếu đã từng login
        }
      }
    };

    verifySession();
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem('user');
      navigate('/login');
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500">Đang xác thực phiên đăng nhập...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: 'Hồ sơ cá nhân',
      path: '/profile',
      icon: User
    },
    {
      label: 'Đổi mật khẩu',
      path: '/change-password',
      icon: Lock
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <Navbar />

      <div className="flex flex-1 max-w-7xl w-full mx-auto sm:px-6 lg:px-8 py-8 gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <nav className="space-y-1 sticky top-24">
            <div className="px-3 mb-4 text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Cài đặt tài khoản
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition-all",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20"
                    : "text-slate-600 hover:bg-white hover:text-primary hover:shadow-sm"
                )}
              >
                <item.icon size={18} className={cn(location.pathname === item.path ? "text-primary-foreground" : "text-slate-400")} />
                {item.label}
              </Link>
            ))}
            
            <hr className="my-4 border-slate-200" />
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 rounded-xl transition-all"
            >
              <LogOut size={18} />
              Đăng xuất
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 w-full max-w-4xl mx-auto">
          {/* Mobile Nav */}
          <div className="md:hidden flex overflow-x-auto no-scrollbar gap-2 mb-6 px-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex-shrink-0 flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-full transition-all border",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-white text-slate-600 border-slate-200"
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden min-h-[600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

