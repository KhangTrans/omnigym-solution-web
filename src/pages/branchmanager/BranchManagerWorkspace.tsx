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
  UserSquare2,
  Users,
  ClipboardList,
  ScanFace,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type NavItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
};

const NAV: NavItem[] = [
  { to: "/branchmanager", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/branchmanager/trainer-applications", label: "Trainer Apps", icon: ClipboardList },
  { to: "/branchmanager/posts", label: "Posts", icon: FileText },
  { to: "/branchmanager/attendance", label: "Attendance", icon: ScanFace },
  { to: "/branchmanager/customer-checkin", label: "Customer Check-in", icon: CalendarCheck2 },
  { to: "/branchmanager/users", label: "Users", icon: Users },
  { to: "/branchmanager/shifts", label: "Shifts", icon: UserSquare2 },
  { to: "/branchmanager/revenue", label: "Revenue", icon: DollarSign },
];

export default function BranchManagerWorkspace() {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="grid min-h-screen w-full grid-cols-1 lg:grid-cols-[260px_1fr]">
        <aside className="hidden border-r bg-muted/40 backdrop-blur lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b px-6">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-primary to-primary/60 font-bold text-primary-foreground shadow-lg shadow-primary/30">
              B
            </div>
            <div className="leading-tight">
              <div className="text-sm font-semibold">Branch Console</div>
              <div className="text-[11px] text-muted-foreground">Branch Manager / Staff</div>
            </div>
          </div>

          <div className="border-b px-4 py-4 space-y-3">
            <Card className="border bg-background/70">
              <CardHeader className="space-y-1 pb-3">
                <CardTitle className="text-sm">Current workspace</CardTitle>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Building2 className="h-4 w-4" />
                  OmniGym Branch Ops
                </div>
              </CardHeader>
              <CardContent className="pt-0 text-xs text-muted-foreground">
                Các chức năng branch/staff được tách khỏi admin khi admin không cần can thiệp.
              </CardContent>
            </Card>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-3">
            <div className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Workspace
            </div>
            {NAV.map((item) => {
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

          <div className="border-t p-3">
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
          <header className="flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur lg:px-8">
            <div className="hidden items-center gap-2 text-sm text-muted-foreground lg:flex">
              <Building2 className="h-4 w-4" />
              <span>OmniGym Branch Ops</span>
              <span className="text-muted-foreground/60">/</span>
              <span>BranchManager & Staff</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="gap-1 bg-primary/15 text-primary">
                <ShieldCheck className="h-3 w-3" />
                Workspace
              </Badge>
              <div className="flex items-center gap-2 rounded-full bg-muted pl-3 pr-1 py-1">
                <div className="text-right leading-tight">
                  <div className="text-xs font-semibold">Branch Manager</div>
                  <div className="text-[10px] text-muted-foreground">Staff portal</div>
                </div>
                <div className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-primary to-primary/40">
                  <UserCog className="h-4 w-4 text-primary-foreground" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 p-4 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
