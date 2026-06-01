import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Dumbbell,
  Library,
  Building2,
  RefreshCcw,
  ShieldAlert,
  Receipt,
  Banknote,
  UserCog,
  LogOut,
  CircleHelp,
} from "lucide-react";
import { cn } from "../utils/cn";
import { toast } from "sonner";

type NavItem = {
  to: string;
  label: string;
  icon: any;
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
    to: "/admin/payouts",
    label: "Thanh toán đối tác",
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

  const userData = localStorage.getItem('user');
  let user = null;
  try {
    user = userData && userData !== "undefined" ? JSON.parse(userData) : null;
  } catch (e) {
    console.error("Failed to parse user data from localStorage", e);
  }
  
  const isPartner = user?.role === 'Partner' || user?.role === 'Gym' || user?.role_id === 3;

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    toast.success("Đã đăng xuất thành công");
    navigate('/login');
  };

  const filteredNav = NAV; // Partner now sees everything like logic requested

  const profile = {
    name: user?.full_name || "Quản trị viên",
    role: isPartner ? "Đối tác" : (user?.role === "Admin" ? "Quản trị hệ thống" : "Nhân viên"),
    avatar: user?.avatar_url || "https://github.com/shadcn.png",
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen w-full lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-card shadow-[2px_0_14px_rgba(15,23,42,0.08)] lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-2 px-6 shadow-[0_1px_8px_rgba(15,23,42,0.08)]">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold shadow-lg shadow-primary/20">
              O
            </div>
            <div className="leading-tight">
              <div className="text-sm font-bold text-foreground uppercase tracking-tight">
                {isPartner ? "OmniGym Partner" : "OmniGym Admin"}
              </div>
              <div className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                Platform
              </div>
            </div>
          </div>
          <nav className="flex-1 space-y-6 overflow-y-auto p-4 custom-scrollbar">
            {GROUPS.map((group) => {
              const groupItems = filteredNav.filter((n) => n.group === group);
              if (groupItems.length === 0) return null;
              
              return (
                <div key={group} className="space-y-1.5">
                  <div className="px-3 pb-1 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground/70">
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
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-all duration-200",
                          active
                            ? "bg-primary text-primary-foreground shadow-md shadow-primary/20"
                            : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-4 w-4",
                            active
                              ? "text-primary-foreground"
                              : "text-muted-foreground"
                          )}
                        />
                        {item.label}
                      </Link>
                    )
                  })}
                </div>
              )
            })}
          </nav>

          <div className="border-t p-4">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold text-red-500 transition-all duration-200 hover:bg-red-50"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
      </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between bg-card/60 shadow-[0_1px_8px_rgba(15,23,42,0.08)] px-4 backdrop-blur lg:px-8">
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
            <div className="hidden text-sm text-muted-foreground lg:block">
              OmniGym Solution Platform · Quản trị viên
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

          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
