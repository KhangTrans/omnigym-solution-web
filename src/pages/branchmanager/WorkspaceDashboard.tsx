import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building2,
  DollarSign,
  Users,
  UserSquare2,
  TrendingUp,
  ArrowUpRight,
  FileText,
  MapPin,
  Phone,
  Clock,
  Calendar,
} from "lucide-react";
import { useAdminRevenue } from "@/lib/admin-store";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(n);
}

type WorkspaceRole = "branchmanager" | "staff";

function getWorkspaceRole(): WorkspaceRole {
  try {
    const user = JSON.parse(localStorage.getItem("user") || "null");
    const roleValue =
      typeof user?.role === "object"
        ? user?.role?.role_name || user?.role?.name
        : user?.role;
    const role = String(roleValue || "").toLowerCase();
    if (role === "staff" || Number(user?.role_id) === 4) {
      return "staff";
    }
    return "branchmanager";
  } catch {
    return "branchmanager";
  }
}

export default function WorkspaceDashboard() {
  const { revenue } = useAdminRevenue();
  const role = getWorkspaceRole();
  const canManageStaff = role === "branchmanager";

  const branchRevenue = useMemo(() => {
    const factor = 0.28;
    const total = revenue.reduce((s, r) => s + r.amount, 0) * factor;
    const last30 =
      revenue
        .filter((r) => Date.now() - new Date(r.date).getTime() < 30 * 86400000)
        .reduce((s, r) => s + r.amount, 0) * factor;
    const prev30 =
      revenue
        .filter((r) => {
          const d = Date.now() - new Date(r.date).getTime();
          return d >= 30 * 86400000 && d < 60 * 86400000;
        })
        .reduce((s, r) => s + r.amount, 0) * factor;
    const delta = prev30 ? ((last30 - prev30) / prev30) * 100 : 0;
    return { total, last30, delta, factor };
  }, [revenue]);

  const sparkline = useMemo(() => {
    const days = 30;
    const buckets: number[] = Array(days).fill(0);
    const now = new Date();
    revenue.forEach((r) => {
      const diff = Math.floor((now.getTime() - new Date(r.date).getTime()) / 86400000);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff] += r.amount * branchRevenue.factor;
    });
    return buckets;
  }, [revenue, branchRevenue.factor]);

  const max = Math.max(1, ...sparkline);
  const points = sparkline
    .map((v, i) => `${(i / (sparkline.length - 1)) * 100},${100 - (v / max) * 95}`)
    .join(" ");
  const area = `0,100 ${points} 100,100`;

  const cards = [
    {
      label: "Branch revenue",
      value: fmt(branchRevenue.total),
      icon: DollarSign,
      accent: "from-emerald-500/30 to-emerald-500/0 text-emerald-600",
      hint: `${fmt(branchRevenue.last30)} last 30d`,
    },
    {
      label: "Active trainers",
      value: "0",
      icon: UserSquare2,
      accent: "from-sky-500/30 to-sky-500/0 text-sky-600",
      hint: "0 total on roster",
    },
    {
      label: "Active staff",
      value: "0",
      icon: Users,
      accent: "from-violet-500/30 to-violet-500/0 text-violet-600",
      hint: "0 employees",
    },
    {
      label: "Facilities",
      value: "4",
      icon: Building2,
      accent: "from-amber-500/30 to-amber-500/0 text-amber-600",
      hint: "★ 4.8",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Manager dashboard</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">OmniGym Downtown</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Snapshot of trainers, staff, and revenue at this branch.
          </p>
        </div>
        <Badge
          variant="secondary"
          className="gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
        >
          <TrendingUp className="h-3 w-3" />
          {branchRevenue.delta >= 0 ? "+" : ""}
          {branchRevenue.delta.toFixed(1)}% vs prior 30d
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="relative min-h-34 overflow-hidden border-0 bg-card text-card-foreground shadow-sm">
              <div className={`pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-linear-to-br ${c.accent} blur-2xl`} />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{c.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-h-80 border-0 bg-card text-card-foreground shadow-sm lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Revenue trend</CardTitle>
              <p className="text-xs text-muted-foreground">Last 30 days, daily totals</p>
            </div>
            <Button asChild size="sm" variant="ghost" className="text-muted-foreground hover:bg-muted">
              <Link to="/branchmanager/revenue">
                Details <ArrowUpRight className="ml-1 h-3.5 w-3.5" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                <defs>
                  <linearGradient id="ws-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <polyline points={area} fill="url(#ws-grad)" stroke="none" />
              </svg>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-80 border-0 bg-card text-card-foreground shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base">Posts queue</CardTitle>
              <p className="text-xs text-muted-foreground">Staff publishing pipeline</p>
            </div>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Row label="Pending review" value={0} dot="bg-amber-500" />
            <Row label="Approved" value={0} dot="bg-emerald-500" />
            <Row label="Drafts" value={0} dot="bg-slate-400" />
            <Row label="Rejected" value={0} dot="bg-rose-500" />
            <Button asChild variant="secondary" size="sm" className="w-full border-0 bg-muted text-foreground shadow-sm hover:bg-muted/80">
              <Link to="/branchmanager/posts">Open post moderation</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="min-h-65 overflow-hidden border-0 bg-card text-card-foreground shadow-sm lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Branch details</CardTitle>
            <p className="text-xs text-muted-foreground">Your active location</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 sm:flex-row">
              <img
                src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1200&q=80"
                alt="OmniGym Downtown"
                className="h-32 w-full rounded-md object-cover sm:w-56"
              />
              <div className="space-y-2">
                <div className="text-xl font-semibold text-foreground">OmniGym Downtown</div>
                <Info icon={MapPin} text="120 Broadway, Manhattan" />
                <Info icon={Clock} text="Mon–Sun · 5:00 – 23:00" />
                <Info icon={Phone} text="+1 (212) 555-0142" />
                <Info icon={Building2} text="4 facilities · ★ 4.8" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="min-h-80 border-0 bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ActionLink to="/branchmanager/trainer-applications" label="Manage trainers" />
            {canManageStaff && <ActionLink to="/branchmanager/users" label="Manage staff" />}
            <ActionLink to="/branchmanager/revenue" label="View revenue" />
          </CardContent>
        </Card>
      </div>

      {canManageStaff && (
        <Card className="min-h-80 border-0 bg-card text-card-foreground shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Branch/staff scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <Row icon={Users} text="User list for branch operations" />
            <Row icon={UserSquare2} text="Work shifts management" />
            <Row icon={Calendar} text="Customer check-in monitoring" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Row({ label, value, dot }: { label: string; value: number; dot: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2 text-muted-foreground">
        <span className={`h-2.5 w-2.5 rounded-full ${dot}`} />
        {label}
      </div>
      <span className="font-semibold text-foreground">{value}</span>
    </div>
  );
}

function Info({ icon: Icon, text }: { icon: typeof MapPin; text: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <Icon className="h-4 w-4" />
      {text}
    </div>
  );
}

function ActionLink({ to, label }: { to: string; label: string }) {
  return (
    <Button asChild variant="secondary" size="sm" className="w-full justify-between border-0 bg-muted text-foreground shadow-sm hover:bg-muted/80">
      <Link to={to}>
        {label} <ArrowUpRight className="h-3.5 w-3.5" />
      </Link>
    </Button>
  );
}
