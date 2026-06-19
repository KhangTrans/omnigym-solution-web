import React, { useEffect, useState } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  User,
  Lock,
  LogOut,
  ChevronLeft,
  Settings,
  Dumbbell,
  Loader2,
  UserCheck,
  Heart,
  Calendar,
} from "lucide-react";
import { cn } from "../utils/cn";
import { Navbar } from "../components/site/Navbar";
import { authApi } from "../api/auth";

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
        const savedUser = localStorage.getItem("user");
        if (!savedUser) {
          sessionStorage.setItem("postLoginRedirect", location.pathname);
          navigate("/login");
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
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
    }
  };

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm font-medium text-slate-500">
            Đang xác thực phiên đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    {
      label: "Hồ sơ cá nhân",
      path: "/profile",
      icon: User,
    },
    {
      label: "Điểm danh (Check-in)",
      path: "/check-in",
      icon: UserCheck,
    },
    {
      label: "Trainer yêu thích",
      path: "/favorites/trainers",
      icon: Heart,
    },
    {
      label: "Lịch tập của tôi",
      path: "/my-bookings",
      icon: Calendar,
    },
    {
      label: "Đổi mật khẩu",
      path: "/change-password",
      icon: Lock,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <div
        className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35"
        aria-hidden
      />
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,138,116,0.10),transparent_55%)]"
        aria-hidden
      />
      <Navbar />

      <div className="relative flex flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 gap-8">
        {/* Sidebar */}
        <aside className="hidden md:block w-64 flex-shrink-0">
          <nav className="sticky top-24 space-y-2 rounded-[1.75rem] border border-primary/10 bg-white/70 p-3 shadow-card backdrop-blur-xl">
            <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Cài đặt tài khoản
            </div>
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all",
                  location.pathname === item.path
                    ? "bg-primary text-primary-foreground shadow-glow"
                    : "text-muted-foreground hover:bg-primary/5 hover:text-primary",
                )}
              >
                <item.icon
                  size={18}
                  className={cn(
                    location.pathname === item.path
                      ? "text-primary-foreground"
                      : "text-muted-foreground",
                  )}
                />
                {item.label}
              </Link>
            ))}

            <hr className="my-3 border-border/70" />

            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-red-500 transition-all hover:bg-red-50 hover:text-red-600"
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
                    : "bg-white text-slate-600 border-slate-200",
                )}
              >
                <item.icon size={16} />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="overflow-hidden rounded-[2rem] border border-primary/10 bg-white/75 shadow-card backdrop-blur-xl min-h-[600px]">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
