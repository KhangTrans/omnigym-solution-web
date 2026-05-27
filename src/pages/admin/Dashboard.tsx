import { Link } from "react-router-dom";
import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, TrendingUp, ArrowRight, Dumbbell, Library } from "lucide-react";
import {
  useAdminRevenue,
  useAdminUsers,
  useAdminPacks,
  useExerciseLibrary,
} from "@/lib/admin-store";



function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

function AdminOverview() {
  const { revenue } = useAdminRevenue();
  const { users } = useAdminUsers();
  const { packs } = useAdminPacks();
  const { exercises: library } = useExerciseLibrary();

  const stats = useMemo(() => {
    const total = revenue.reduce((s, r) => s + r.amount, 0);
    const last30 = revenue
      .filter((r) => Date.now() - new Date(r.date).getTime() < 30 * 86400000)
      .reduce((s, r) => s + r.amount, 0);
    const prev30 = revenue
      .filter((r) => {
        const d = Date.now() - new Date(r.date).getTime();
        return d >= 30 * 86400000 && d < 60 * 86400000;
      })
      .reduce((s, r) => s + r.amount, 0);
    const delta = prev30 ? ((last30 - prev30) / prev30) * 100 : 0;
    const activeMembers = users.filter((u) => u.status === "active" && u.role === "member").length;
    return { total, last30, delta, activeMembers };
  }, [revenue, users]);

  const sparkline = useMemo(() => {
    const days = 30;
    const buckets: number[] = Array(days).fill(0);
    const now = new Date();
    revenue.forEach((r) => {
      const diff = Math.floor((now.getTime() - new Date(r.date).getTime()) / 86400000);
      if (diff >= 0 && diff < days) buckets[days - 1 - diff] += r.amount;
    });
    return buckets;
  }, [revenue]);

  const max = Math.max(1, ...sparkline);
  const points = sparkline
    .map((v, i) => `${(i / (sparkline.length - 1)) * 100},${100 - (v / max) * 100}`)
    .join(" ");

  const cards = [
    { label: "Tổng doanh thu", value: fmt(stats.total), icon: DollarSign, hint: `${fmt(stats.last30)} last 30d` },
    { label: "Thành viên đang hoạt động", value: String(stats.activeMembers), icon: Users, hint: `${users.length} total accounts` },
    { label: "Gói bài tập", value: String(packs.filter((p) => p.publishedToDashboard).length), icon: Dumbbell, hint: `${packs.length} total · live on dashboard` },
    { label: "Bài tập thư viện", value: String(library.length), icon: Library, hint: "Có thể thêm vào gói tập" },
  ];

  const recent = [...revenue].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Overview</h1>
          <p className="text-sm text-muted-foreground">Snapshot of revenue, members and exercise packs.</p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          {stats.delta >= 0 ? "+" : ""}
          {stats.delta.toFixed(1)}% vs prior 30d
        </Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{c.label}</span>
                  <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
                <div className="mt-2 text-2xl font-bold tabular-nums">{c.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Revenue · last 30 days</CardTitle>
            <Button asChild size="sm" variant="ghost">
              <Link to="/admin/revenue">
                Open <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-40 w-full">
              <defs>
                <linearGradient id="grad" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="oklch(var(--primary) / 0.4)" />
                  <stop offset="100%" stopColor="oklch(var(--primary) / 0)" />
                </linearGradient>
              </defs>
              <polyline
                fill="none"
                stroke="hsl(var(--primary, 158 50% 35%))"
                strokeWidth="1.2"
                points={points}
                vectorEffect="non-scaling-stroke"
                style={{ stroke: "var(--primary)" }}
              />
              <polygon
                points={`0,100 ${points} 100,100`}
                fill="url(#grad)"
                style={{ fill: "color-mix(in oklab, var(--primary) 18%, transparent)" }}
              />
            </svg>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent transactions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between text-sm">
                <div>
                  <div className="font-medium">{r.customer}</div>
                  <div className="text-xs text-muted-foreground">
                    {r.source} · {new Date(r.date).toLocaleDateString()}
                  </div>
                </div>
                <div className="tabular-nums font-semibold">{fmt(r.amount)}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default AdminOverview;
