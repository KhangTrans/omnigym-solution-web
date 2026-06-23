import { useEffect, useState, useMemo } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  Building2,
  CalendarCheck2,
  DollarSign,
  FileText,
  LayoutDashboard,
  ShieldCheck,
  UserCog,
  Users,
  ClipboardList,
  ScanFace,
  LogOut,
  MessageSquareQuote,
  KeyRound,
  Camera,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logoOmnigym from "@/assets/logo-omnigym.png";
import { authApi } from "@/api/auth";
import { toast } from "sonner";
import { WorkspaceNotificationsBell } from "@/components/site/WorkspaceNotificationsBell";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type WorkspaceRole = "branchmanager" | "staff";

type NavGroup = "Insights" | "HrOps" | "TrainerOps" | "MemberOps" | "Content" | "Account";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  roles?: WorkspaceRole[];
  group: NavGroup;
};

const NAV: NavItem[] = [
  { to: "/branchmanager", label: "Tổng quan", icon: LayoutDashboard, exact: true, group: "Insights" },
  { to: "/branchmanager/revenue", label: "Doanh thu", icon: DollarSign, group: "Insights" },
  
  { to: "/branchmanager/users", label: "Tài khoản Nhân viên", icon: Users, roles: ["branchmanager"], group: "HrOps" },
  { to: "/branchmanager/staff-schedule", label: "Lịch làm việc", icon: CalendarCheck2, roles: ["staff"], group: "HrOps" },
  { to: "/branchmanager/staff-attendance", label: "Điểm danh nhân viên", icon: ScanFace, roles: ["staff"], group: "HrOps" },
  { to: "/branchmanager/attendance", label: "Điểm danh ca trực", icon: ScanFace, group: "HrOps" },
  
  { to: "/branchmanager/trainer-applications", label: "Duyệt Trainer", icon: ClipboardList, roles: ["branchmanager"], group: "TrainerOps" },
  { to: "/branchmanager/trainers", label: "Danh sách Trainer", icon: Users, group: "TrainerOps" },
  
  { to: "/branchmanager/customer-checkin", label: "Check-in Hội viên", icon: CalendarCheck2, group: "MemberOps" },
  { to: "/branchmanager/reviews", label: "Đánh giá khách hàng", icon: MessageSquareQuote, group: "MemberOps" },
  
  { to: "/branchmanager/posts", label: "Bài viết", icon: FileText, group: "Content" },
  
  { to: "/branchmanager/profile", label: "Hồ sơ cá nhân", icon: UserCog, group: "Account" },
  { to: "/branchmanager/face-registration", label: "Đăng ký gương mặt", icon: Camera, roles: ["staff"], group: "Account" },
  { to: "/branchmanager/change-password", label: "Đổi mật khẩu", icon: KeyRound, group: "Account" },
];

const GROUPS_LABELS: Record<NavGroup, string> = {
  Insights: "Số liệu & Báo cáo",
  HrOps: "Quản lý Nhân sự & Lịch trực",
  TrainerOps: "Quản lý Huấn luyện viên",
  MemberOps: "Vận hành & Hội viên",
  Content: "Quản lý Nội dung",
  Account: "Cá nhân",
};

const GROUPS: NavGroup[] = [
  "Insights",
  "HrOps",
  "TrainerOps",
  "MemberOps",
  "Content",
  "Account",
];

function getWorkspaceRole(): WorkspaceRole {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const roleValue = typeof user?.role === "object"
      ? user?.role?.role_name || user?.role?.name
      : user?.role;
    const role = String(roleValue || "").toLowerCase();
    if (role === "staff") return "staff";
    if (Number(user?.role_id) === 4) return "staff";
    return "branchmanager";
  } catch {
    return "branchmanager";
  }
}

export default function WorkspaceShell() {
  const pathname = useLocation().pathname;
  const navigate = useNavigate();
  const [verifying, setVerifying] = useState(true);
  const [expandedGroups, setExpandedGroups] = useState<Record<NavGroup, boolean>>({} as Record<NavGroup, boolean>);

  const toggleGroup = (group: NavGroup) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [group]: !prev[group],
    }));
  };
  const [user, setUser] = useState<any>(() => {
    try {
      const data = localStorage.getItem("user");
      return data && data !== "undefined" ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  });

  const role = getWorkspaceRole();
  const visibleNav = useMemo(() => {
    return NAV.filter((item) => !item.roles || item.roles.includes(role));
  }, [role]);

  useEffect(() => {
    const verifySession = async () => {
      try {
        await authApi.getMe();
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
    const handleUserChange = () => {
      try {
        const data = localStorage.getItem("user");
        setUser(data && data !== "undefined" ? JSON.parse(data) : null);
      } catch (e) {
        console.error("Failed to parse user data from localStorage", e);
      }
    };
    window.addEventListener("user-login", handleUserChange);
    return () => window.removeEventListener("user-login", handleUserChange);
  }, []);

  // Automatically expand the group containing the active route
  useEffect(() => {
    const activeGroup = GROUPS.find((group) =>
      visibleNav.some(
        (item) =>
          item.group === group &&
          (item.exact
            ? pathname === item.to
            : pathname === item.to || pathname.startsWith(item.to + "/"))
      )
    );
    if (activeGroup) {
      setExpandedGroups((prev) => {
        if (prev[activeGroup]) return prev;
        return {
          ...prev,
          [activeGroup]: true,
        };
      });
    }
  }, [pathname, visibleNav]);

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

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm font-medium text-slate-500">
            Đang xác thực phiên đăng nhập...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-muted/40 backdrop-blur lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 px-6">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm">
              <img src={logoOmnigym} alt="OmniGym logo" className="h-full w-full object-cover" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Bảng điều khiển chi nhánh</div>
              <div className="text-[11px] text-muted-foreground">Quản lý / Nhân viên</div>
            </div>
          </div>

          <div className="px-4 py-4 space-y-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Chi nhánh
              </div>
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-2">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div className="min-w-0 leading-tight">
                  <div className="truncate text-sm font-medium text-foreground">OmniGym Downtown</div>
                  <div className="truncate text-[10px] text-muted-foreground">New York, NY</div>
                </div>
              </div>
            </div>
          </div>

          <nav className="flex-1 space-y-2 overflow-y-auto p-3">
            {GROUPS.map((group) => {
              const groupItems = visibleNav.filter((item) => item.group === group);
              if (groupItems.length === 0) return null;

              const isExpanded = !!expandedGroups[group];

              return (
                <div key={group} className="space-y-1">
                  <button
                    onClick={() => toggleGroup(group)}
                    className="flex w-full items-center justify-between px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/75 hover:text-foreground transition-colors cursor-pointer"
                  >
                    <span>{GROUPS_LABELS[group]}</span>
                    {isExpanded ? (
                      <ChevronDown className="h-3.5 w-3.5" />
                    ) : (
                      <ChevronRight className="h-3.5 w-3.5" />
                    )}
                  </button>
                  {isExpanded && (
                    <div className="space-y-1 pl-1 transition-all">
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
                              "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                              active
                                ? "bg-muted text-foreground shadow-inner font-semibold"
                                : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                            )}
                          >
                            <Icon className="h-4 w-4" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>

          <div className="p-3 border-t border-muted-foreground/10">
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-red-500 hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
            >
              <LogOut className="h-4 w-4" />
              Đăng xuất
            </button>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between bg-background/80 px-4 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3 overflow-x-auto lg:hidden">
              {visibleNav.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium",
                      active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </div>
            <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
              <Building2 className="h-4 w-4" />
              <span>OmniGym Downtown</span>
              <span className="text-muted-foreground/60">/</span>
              <span>{role === "staff" ? "Chế độ Nhân viên" : "Chế độ Quản lý"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1 bg-primary/15 text-primary">
                <ShieldCheck className="h-3 w-3" />
                Khu vực làm việc
              </Badge>
              <WorkspaceNotificationsBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full bg-muted pl-3 pr-1 py-1 hover:bg-muted/80 transition-colors cursor-pointer focus:outline-none">
                    <div className="text-right leading-tight hidden sm:block">
                      <div className="text-xs font-semibold">
                        {user?.full_name || (role === "staff" ? "Nhân viên" : "Quản lý chi nhánh")}
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {role === "staff" ? "Nhân viên" : "Quản lý chi nhánh"}
                      </div>
                    </div>
                    {user?.avatar_url ? (
                      <img
                        src={user.avatar_url}
                        alt={user.full_name || "Avatar"}
                        className="h-8 w-8 rounded-full object-cover shadow-sm border border-border"
                      />
                    ) : (
                      <div
                        className="grid h-8 w-8 place-items-center rounded-full"
                        style={{
                          backgroundImage:
                            "linear-gradient(to bottom right, hsl(var(--primary)), color-mix(in srgb, hsl(var(--primary)) 40%, transparent))",
                        }}
                      >
                        <UserCog className="h-4 w-4 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Tài khoản của tôi</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/branchmanager/profile" className="flex w-full items-center gap-2 cursor-pointer">
                      <UserCog className="h-4 w-4" />
                      <span>Hồ sơ cá nhân</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50 cursor-pointer">
                    <LogOut className="h-4 w-4" />
                    <span>Đăng xuất</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            <div className="mx-auto w-full" style={{ maxWidth: 1440 }}>
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
