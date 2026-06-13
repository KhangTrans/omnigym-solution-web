import { Link, Outlet, useLocation } from "react-router-dom";
import {
  ArrowLeft,
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
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import logoOmnigym from "@/assets/logo-omnigym.png";

type WorkspaceRole = "branchmanager" | "staff";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
  roles?: WorkspaceRole[];
};

const NAV: NavItem[] = [
  { to: "/branchmanager", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/branchmanager/trainer-applications", label: "Trainer Application", icon: ClipboardList, roles: ["branchmanager"] },
  { to: "/branchmanager/posts", label: "Posts", icon: FileText },
  { to: "/branchmanager/attendance", label: "Attendance", icon: ScanFace },
  { to: "/branchmanager/customer-checkin", label: "Customer Check-in", icon: CalendarCheck2 },
  { to: "/branchmanager/users", label: "Users", icon: Users, roles: ["branchmanager"] },
  { to: "/branchmanager/staff-attendance", label: "Staff Attendance", icon: ScanFace, roles: ["staff"] },
  { to: "/branchmanager/revenue", label: "Revenue", icon: DollarSign },
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
  const role = getWorkspaceRole();
  const visibleNav = NAV.filter((item) => !item.roles || item.roles.includes(role));

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden bg-muted/40 backdrop-blur lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 px-6">
            <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl bg-white shadow-sm">
              <img src={logoOmnigym} alt="OmniGym logo" className="h-full w-full object-cover" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Branch Console</div>
              <div className="text-[11px] text-muted-foreground">Branch Manager / Staff</div>
            </div>
          </div>

          <div className="px-4 py-4 space-y-3">
            <div>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
                Branch
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

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </div>
            {visibleNav.map((item) => {
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
                      ? "bg-muted text-foreground shadow-inner"
                      : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="p-3">
            <Link
              to="/"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </Link>
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
              <span>{role === "staff" ? "Staff view" : "Manager view"}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="secondary" className="gap-1 bg-primary/15 text-primary">
                <ShieldCheck className="h-3 w-3" />
                Workspace
              </Badge>
              <div className="flex items-center gap-2 rounded-full bg-muted pl-3 pr-1 py-1">
                <div className="text-right leading-tight">
                  <div className="text-xs font-semibold">Alex Park</div>
                  <div className="text-[10px] text-muted-foreground">{role === "staff" ? "Staff" : "Branch Manager"}</div>
                </div>
                <div
                  className="grid h-8 w-8 place-items-center rounded-full"
                  style={{
                    backgroundImage:
                      "linear-gradient(to bottom right, hsl(var(--primary)), color-mix(in srgb, hsl(var(--primary)) 40%, transparent))",
                  }}
                >
                  <UserCog className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
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
