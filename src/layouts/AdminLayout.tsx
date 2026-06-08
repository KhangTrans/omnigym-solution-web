import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Dumbbell,
  Library,
  FileText,
  Building2,
  RefreshCcw,
  ShieldAlert,
  Receipt,
  Banknote,
  UserCog,
  LogOut,
  Loader2,
  CircleHelp,
  ClipboardCheck,
  PanelLeft,
  ChevronDown,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "../utils/cn";
import { toast } from "sonner";
import { authApi } from "../api/auth";
import logoOmnigym from "@/assets/logo-omnigym.png";

type NavItem = {
  to: string;
  label: string;
  icon: LucideIcon;
  exact?: boolean;
  group: "Insights" | "Operations" | "Content" | "Account";
};

const NAV: NavItem[] = [
  {
    to: "/admin",
    label: "Tổng quan",
    icon: LayoutDashboard,
    exact: true,
    group: "Insights",
  },
  {
    to: "/admin/revenue",
    label: "Doanh thu",
    icon: DollarSign,
    group: "Insights",
  },
  {
    to: "/admin/transactions",
    label: "Giao dịch",
    icon: Receipt,
    group: "Insights",
  },
  { to: "/admin/users", label: "Người dùng", icon: Users, group: "Operations" },
  {
    to: "/admin/gyms",
    label: "Phòng tập",
    icon: Building2,
    group: "Operations",
  },
  {
    to: "/admin/membership-packages",
    label: "Gói thành viên",
    icon: Dumbbell,
    group: "Operations",
  },
  {
    to: "/admin/branch-management",
    label: "Chi nhánh",
    icon: Building2,
    group: "Operations",
  },
  {
    to: "/admin/trainer-applications",
    label: "Duyệt Trainer",
    icon: ClipboardCheck,
    group: "Operations",
  },
  {
    to: "/admin/payouts",
    label: "Thanh toán chi nhánh",
    icon: Banknote,
    group: "Operations",
  },
  {
    to: "/admin/refunds",
    label: "Hoàn tiền",
    icon: RefreshCcw,
    group: "Operations",
  },
  {
    to: "/admin/moderation",
    label: "Kiểm duyệt",
    icon: ShieldAlert,
    group: "Content",
  },
  {
    to: "/admin/exercises",
    label: "Gói bài tập",
    icon: Dumbbell,
    group: "Content",
  },
  {
    to: "/admin/library",
    label: "Thư viện bài tập",
    icon: Library,
    group: "Content",
  },
  {
    to: "/admin/blogs",
    label: "Bài viết",
    icon: FileText,
    group: "Content",
  },
  {
    to: "/admin/faq",
    label: "FAQ",
    icon: CircleHelp,
    group: "Content",
  },
  {
    to: "/admin/profile",
    label: "Hồ sơ của tôi",
    icon: UserCog,
    group: "Account",
  },
];

const GROUPS_LABELS: Record<string, string> = {
  Insights: "Số liệu & Báo cáo",
  Operations: "Quản lý vận hành",
  Content: "Quản lý nội dung",
  Account: "Tài khoản",
};

const GROUPS: NavItem["group"][] = [
  "Insights",
  "Operations",
  "Content",
  "Account",
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [verifying, setVerifying] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const userData = localStorage.getItem('user');
  let user = null;
  try {
    user = userData && userData !== "undefined" ? JSON.parse(userData) : null;
  } catch (e) {
    console.error("Failed to parse user data from localStorage", e);
  }
  
  const isPartner = user?.role === 'BranchManager' || user?.role === 'Gym' || user?.role_id === 3;

  useEffect(() => {
    const verifySession = async () => {
      try {
        await authApi.getMe();
        setVerifying(false);
      } catch (error) {
        console.error("Session verification failed", error);
        localStorage.removeItem('user');
        navigate('/login');
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
      localStorage.removeItem('token');
      toast.success("Đã đăng xuất thành công");
      navigate('/login');
    }
  };

  const filteredNav = NAV; // Partner now sees everything like logic requested

  const profile = {
    name: user?.full_name || "Quản trị viên",
    role: isPartner ? "Quản lý chi nhánh" : (user?.role === "Admin" ? "Quản trị hệ thống" : "Nhân viên"),
    avatar: user?.avatar_url || "https://github.com/shadcn.png",
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

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className="grid min-h-screen w-full transition-[grid-template-columns] duration-300 ease-out lg:grid-cols-[96px_1fr]"
        style={{ gridTemplateColumns: sidebarOpen ? "300px minmax(0,1fr)" : "96px minmax(0,1fr)" }}
      >
        <aside
          className={cn(
            "group/sidebar sticky top-24 mx-3 mb-6 mt-24 hidden h-[calc(100vh-120px)] overflow-hidden bg-card shadow-[0_18px_50px_rgba(15,23,42,0.12)] transition-[border-radius] duration-200 lg:flex lg:flex-col",
            sidebarOpen ? "rounded-[30px]" : "rounded-[24px]"
          )}
        >
          <nav className={cn("flex-1 overflow-y-auto overflow-x-hidden py-8 transition-[padding] duration-300 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden", sidebarOpen ? "space-y-7 px-4" : "space-y-8 px-3")}>
            {GROUPS.map((group) => {
              const groupItems = filteredNav.filter((n) => n.group === group);
              if (groupItems.length === 0) return null;
              
              return (
                <div key={group} className={cn("space-y-2", !sidebarOpen && "pt-0")}>
                  <div
                    className={cn(
                      "mx-auto my-4 flex h-4 w-full shrink-0 flex-col items-center justify-center gap-1 transition-all duration-200",
                      sidebarOpen ? "h-0 overflow-hidden opacity-0" : "opacity-100"
                    )}
                    aria-hidden="true"
                  >
                    <span className="block h-px w-9 rounded-full bg-slate-300/80" />
                    <span className="block h-px w-6 rounded-full bg-slate-300/50" />
                  </div>
                  <div className={cn(
                    "overflow-hidden px-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/80 transition-all duration-200",
                    sidebarOpen ? "h-7 opacity-100" : "h-0 opacity-0"
                  )}>
                    {GROUPS_LABELS[group]}
                  </div>
                  {groupItems.map((item) => {
                    const active = item.exact
                      ? pathname === item.to
                      : pathname === item.to ||
                        pathname.startsWith(item.to + "/");
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.to}
                        to={item.to}
                        title={item.label}
                        className={cn(
                          "flex h-12 w-full items-center overflow-hidden rounded-lg text-base font-semibold transition-all duration-200",
                          sidebarOpen ? "justify-start gap-4 px-3" : "justify-center px-0",
                          sidebarOpen
                            ? active
                              ? "bg-[#2f6b50] text-white"
                              : "text-foreground hover:bg-muted hover:text-foreground"
                            : active
                              ? "text-primary"
                              : "text-foreground hover:text-primary"
                        )}
                      >
                        <span className="grid h-7 w-7 shrink-0 place-items-center">
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              active
                                ? sidebarOpen ? "text-white" : "text-[#2f6b50]"
                                : "text-foreground"
                            )}
                          />
                        </span>
                        <span className={cn(
                          "overflow-hidden whitespace-nowrap transition-all duration-200",
                          sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
                        )}>
                          {item.label}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          <div className={cn("border-t transition-[padding] duration-300", sidebarOpen ? "p-4" : "p-3")}>
            <button
              onClick={handleLogout}
              title="Đăng xuất"
              className={cn(
                "flex h-12 w-full items-center overflow-hidden rounded-xl text-base font-semibold text-red-500 transition-all duration-200 hover:bg-red-50",
                sidebarOpen ? "justify-start gap-4 px-3" : "justify-center px-0"
              )}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center">
                <LogOut className="h-5 w-5 shrink-0" />
              </span>
              <span className={cn(
                "overflow-hidden whitespace-nowrap transition-all duration-200",
                sidebarOpen ? "w-auto opacity-100" : "w-0 opacity-0"
              )}>
                Đăng xuất
              </span>
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="fixed left-0 right-0 top-0 z-30 flex h-20 items-center justify-between bg-card/80 shadow-[0_1px_8px_rgba(15,23,42,0.08)] px-4 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3 overflow-x-auto lg:hidden">
              {NAV.map((item) => {
                const active = item.exact
                  ? pathname === item.to
                  : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                )
              })}
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 whitespace-nowrap"
              >
                Đăng xuất
              </button>
            </div>
            <div className="hidden items-center gap-4 lg:flex">
              <button
                type="button"
                onClick={() => setSidebarOpen((open) => !open)}
                className="flex h-11 items-center gap-2 rounded-xl border border-slate-200 bg-slate-100/80 px-3 text-slate-700 transition-colors hover:bg-slate-200"
                aria-label={sidebarOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
                title={sidebarOpen ? "Thu gọn sidebar" : "Mở rộng sidebar"}
              >
                <PanelLeft className="h-5 w-5" />
                <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", sidebarOpen ? "rotate-180" : "rotate-0")} />
              </button>
              <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-2xl bg-white shadow-lg">
                <img src={logoOmnigym} alt="OmniGym logo" className="h-full w-full object-cover" />
              </div>
              <div className="leading-tight">
                <div className="text-xl font-semibold tracking-tight text-foreground">
                  {isPartner ? "OmniGym Branch Manager" : "OmniGym Admin"}
                </div>
                <div className="text-[11px] font-medium uppercase tracking-[0.28em] text-foreground">
                  Platform
                </div>
              </div>
              <div className="ml-4 text-sm text-muted-foreground">
                OmniGym Solution Platform · Quản trị viên
              </div>
            </div>
            <Link
              to="/admin/profile"
              className="flex items-center gap-3 rounded-full pl-3 pr-1 py-1 hover:bg-muted"
            >
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold">{profile.name}</div>
                <div className="text-[11px] text-muted-foreground">
                  {profile.role}
                </div>
              </div>
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-9 w-9 rounded-full object-cover shadow-[0_2px_10px_rgba(15,23,42,0.16)]"
              />
            </Link>
          </header>

          <main className="flex-1 p-4 pt-24 lg:p-8 lg:pt-28">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
