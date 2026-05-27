import { Link, Outlet, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  DollarSign,
  Dumbbell,
  ArrowLeft,
  Library,
  Building2,
  RefreshCcw,
  ShieldAlert,
  Receipt,
  Banknote,
  UserCog,
} from "lucide-react";
import { cn } from "../utils/cn";
import { useAdminProfile } from "../lib/admin-ops-store";

type NavItem = {
  to:
    | "/admin"
    | "/admin/revenue"
    | "/admin/transactions"
    | "/admin/users"
    | "/admin/gyms"
    | "/admin/payouts"
    | "/admin/refunds"
    | "/admin/moderation"
    | "/admin/exercises"
    | "/admin/library"
    | "/admin/profile";
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  group: "Insights" | "Operations" | "Content" | "Account";
};

const NAV: NavItem[] = [
  { to: "/admin", label: "Tổng quan", icon: LayoutDashboard, exact: true, group: "Insights" },
  { to: "/admin/revenue", label: "Doanh thu", icon: DollarSign, group: "Insights" },
  { to: "/admin/transactions", label: "Giao dịch", icon: Receipt, group: "Insights" },
  { to: "/admin/users", label: "Người dùng", icon: Users, group: "Operations" },
  { to: "/admin/gyms", label: "Phòng tập", icon: Building2, group: "Operations" },
  { to: "/admin/payouts", label: "Thanh toán đối tác", icon: Banknote, group: "Operations" },
  { to: "/admin/refunds", label: "Hoàn tiền", icon: RefreshCcw, group: "Operations" },
  { to: "/admin/moderation", label: "Kiểm duyệt", icon: ShieldAlert, group: "Content" },
  { to: "/admin/exercises", label: "Gói bài tập", icon: Dumbbell, group: "Content" },
  { to: "/admin/library", label: "Thư viện bài tập", icon: Library, group: "Content" },
  { to: "/admin/profile", label: "Hồ sơ của tôi", icon: UserCog, group: "Account" },
];

const GROUPS: NavItem["group"][] = ["Insights", "Operations", "Content", "Account"];

function AdminLayout() {
  const { pathname } = useLocation();
  const { profile } = useAdminProfile();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r bg-card lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-2 border-b px-6">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground font-bold">
              P
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">OmniGym Admin</div>
              <div className="text-[11px] text-muted-foreground">Trung tâm điều khiển</div>
            </div>
          </div>
          <nav className="flex-1 space-y-4 overflow-y-auto p-3">
            {GROUPS.map((group) => (
              <div key={group} className="space-y-1">
                <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                  {group}
                </div>
                {NAV.filter((n) => n.group === group).map((item) => {
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
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
          <div className="border-t p-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Về trang chủ
            </Link>
          </div>
        </aside>

        <div className="flex min-w-0 flex-col">
          <header className="flex h-16 items-center justify-between border-b bg-card/60 px-4 backdrop-blur lg:px-8">
            <div className="flex items-center gap-3 overflow-x-auto lg:hidden">
              {NAV.map((item) => {
                const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={cn(
                      "rounded-full px-3 py-1.5 text-xs font-medium",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
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
                <div className="text-[11px] text-muted-foreground">{profile.role}</div>
              </div>
              <img
                src={profile.avatar}
                alt={profile.name}
                className="h-9 w-9 rounded-full object-cover ring-2 ring-primary/40"
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
}
export default AdminLayout;
