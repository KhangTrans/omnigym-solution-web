import { useEffect, useState, useMemo } from "react";
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
  Calendar,
  UserPlus,
  MessageSquareQuote,
  KeyRound,
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
  group: "Insights" | "GymOps" | "HrOps" | "MemberOps" | "Content" | "Account";
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
  {
    to: "/admin/refunds",
    label: "Hoàn tiền",
    icon: RefreshCcw,
    group: "Insights",
  },
  {
    to: "/admin/gyms",
    label: "Phòng tập",
    icon: Building2,
    group: "GymOps",
  },
  {
    to: "/admin/branch-management",
    label: "Chi nhánh",
    icon: Building2,
    group: "GymOps",
  },
  {
    to: "/admin/membership-packages",
    label: "Gói thành viên",
    icon: Dumbbell,
    group: "GymOps",
  },
  {
    to: "/admin/trainer-packages",
    label: "Gói PT",
    icon: Dumbbell,
    group: "GymOps",
  },
  {
    to: "/admin/payouts",
    label: "Thanh toán chi nhánh",
    icon: Banknote,
    group: "GymOps",
  },
  {
    to: "/admin/staff-accounts",
    label: "Tài khoản Staff",
    icon: UserPlus,
    group: "HrOps",
  },
  {
    to: "/admin/trainers",
    label: "Danh sách Trainer",
    icon: Users,
    group: "HrOps",
  },
  {
    to: "/admin/trainer-applications",
    label: "Duyệt Trainer",
    icon: ClipboardCheck,
    group: "HrOps",
  },
  {
    to: "/admin/shift-attendance",
    label: "Điểm danh ca trực",
    icon: ClipboardCheck,
    group: "HrOps",
  },
  {
    to: "/admin/attendance-management",
    label: "Quản lý điểm danh",
    icon: Calendar,
    group: "HrOps",
  },
  {
    to: "/admin/users",
    label: "Người dùng",
    icon: Users,
    group: "MemberOps",
  },
  {
    to: "/admin/customer-attendance",
    label: "Check-in Hội viên",
    icon: Users,
    group: "MemberOps",
  },
  {
    to: "/admin/reviews",
    label: "Đánh giá hội viên",
    icon: MessageSquareQuote,
    group: "MemberOps",
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
  {
    to: "/admin/change-password",
    label: "Đổi mật khẩu",
    icon: KeyRound,
    group: "Account",
  },
];

const GROUPS_LABELS: Record<string, string> = {
  Insights: "Số liệu & Báo cáo",
  GymOps: "Quản lý Chi nhánh",
  HrOps: "Quản lý Nhân sự",
  MemberOps: "Quản lý Hội viên",
  Content: "Quản lý nội dung",
  Account: "Tài khoản",
};

const GROUPS: NavItem["group"][] = [
  "Insights",
  "GymOps",
  "HrOps",
  "MemberOps",
  "Content",
  "Account",
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;
  const [verifying, setVerifying] = useState(true);

  const userData = localStorage.getItem("user");
  let user = null;
  try {
    user = userData && userData !== "undefined" ? JSON.parse(userData) : null;
  } catch (e) {
    console.error("Failed to parse user data from localStorage", e);
  }

  const isPartner =
    user?.role === "BranchManager" ||
    user?.role === "Gym" ||
    user?.role_id === 3;

  const getRoleName = (u: any) => {
    if (!u) return "";
    if (typeof u.role === "object" && u.role?.role_name) {
      return String(u.role.role_name).toLowerCase();
    }
    return String(u.role || "").toLowerCase();
  };
  const userRole = getRoleName(user);
  const isStaff = userRole === "staff";

  useEffect(() => {
    const verifySession = async () => {
      try {
        await authApi.getMe();
        
        // Kiểm tra quyền Admin
        const userDataStr = localStorage.getItem("user");
        const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
        const role = String(currentUser?.role || "").toLowerCase();
        const isUserAdmin = role === "admin" || [1, 2].includes(Number(currentUser?.role_id));
        
        if (!isUserAdmin) {
          toast.error("Bạn không có quyền truy cập trang quản trị");
          navigate("/dashboard");
          return;
        }

        setVerifying(false);
      } catch (error) {
        console.error("Session verification failed", error);
        localStorage.removeItem("user");
        localStorage.removeItem("token");
        navigate("/login");
      }
    };

    verifySession();
  }, [navigate]);

  useEffect(() => {
    const blockedForPartner = [
      "/admin/attendance-management",
      "/admin/branch-management",
      "/admin/trainer-applications",
      "/admin/users",
      "/admin/staff-accounts",
    ];
    const isRestricted = blockedForPartner.some(
      (path) => pathname === path || pathname.startsWith(path + "/"),
    );

    if (!verifying && isStaff && isRestricted) {
      toast.error("Bạn không có quyền truy cập trang này");
      navigate("/admin/shift-attendance");
    }
  }, [verifying, isStaff, pathname, navigate]);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error("Logout failed", error);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      toast.success("Đã đăng xuất thành công");
      navigate("/login");
    }
  };

  const filteredNav = useMemo(() => {
    return NAV.filter((item) => {
      if (item.to === "/admin/shift-attendance") {
        return isStaff;
      }
      if (
        item.to === "/admin/attendance-management" ||
        item.to === "/admin/branch-management" ||
        item.to === "/admin/trainer-applications" ||
        item.to === "/admin/users" ||
        item.to === "/admin/staff-accounts"
      ) {
        return !isStaff;
      }
      return true;
    });
  }, [isStaff]);

  const profile = {
    name: user?.full_name || "Quản trị viên",
    role: isPartner
      ? "Quản lý chi nhánh"
      : user?.role === "Admin"
        ? "Quản trị hệ thống"
        : "Nhân viên",
    avatar: user?.avatar_url || "https://github.com/shadcn.png",
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

  return (
    <div className="h-screen overflow-hidden bg-background text-foreground">
      <div className="grid h-full w-full grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden h-full border-r border-slate-100 bg-card lg:flex lg:flex-col overflow-hidden">
          <div className="flex h-16 items-center gap-2 border-b border-slate-100 px-6">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-[#2f6b50] text-white font-bold">
              O
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">OmniGym Admin</div>
              <div className="text-[11px] text-muted-foreground">Bảng điều khiển hệ thống</div>
            </div>
          </div>
          <nav className="flex-1 space-y-3 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
            {GROUPS.map((group) => {
              const groupItems = filteredNav.filter((n) => n.group === group);
              if (groupItems.length === 0) return null;

              return (
                <div key={group} className="space-y-1">
                  <div className="px-3 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                    {GROUPS_LABELS[group]}
                  </div>
                  <div className="space-y-1">
                    {groupItems.map((item) => {
                      const active = item.exact
                        ? pathname === item.to
                        : pathname === item.to || pathname.startsWith(item.to + "/");
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.to}
                          to={item.to}
                          className={cn(
                            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium",
                            active
                              ? "bg-[#2f6b50] text-white shadow-sm"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <Icon className="h-4 w-4" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </nav>
          <div className="border-t border-slate-100 p-3">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </aside>

        <div className="flex h-full min-w-0 flex-col overflow-hidden">
          <header className="flex h-16 items-center justify-between border-b border-slate-100 bg-card/60 px-4 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3 overflow-x-auto admin-scrollbar lg:hidden">
              {filteredNav.map((item) => {
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
                        ? "bg-[#2f6b50] text-white"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
              <button
                onClick={handleLogout}
                className="rounded-full bg-red-50 px-3 py-1.5 text-xs font-semibold text-red-500 whitespace-nowrap"
              >
                Đăng xuất
              </button>
            </div>
            
            <div className="hidden items-center gap-4 lg:flex">
              <div className="grid h-8 w-8 shrink-0 place-items-center overflow-hidden rounded-lg bg-white shadow-sm border border-slate-100">
                <img
                  src={logoOmnigym}
                  alt="OmniGym logo"
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="leading-tight">
                <div className="text-base font-semibold tracking-tight text-foreground">
                  OmniGym Admin Console
                </div>
                <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Bảng quản trị hệ thống
                </div>
              </div>
            </div>

            <Link
              to="/admin/profile"
              className="flex items-center gap-3 rounded-full pl-3 pr-1 py-1 hover:bg-muted"
            >
              <div className="text-right leading-tight">
                <div className="text-sm font-semibold">{profile.name}</div>
                <div className="text-[11px] text-muted-foreground font-medium uppercase">
                  {profile.role}
                </div>
              </div>
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-9 w-9 rounded-full object-cover shadow-sm ring-2 ring-[#2f6b50]/20"
              />
            </Link>
          </header>

          <main className="flex-1 overflow-y-auto p-4 lg:p-8 [&::-webkit-scrollbar]:hidden [scrollbar-width:none] [-ms-overflow-style:none]">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
