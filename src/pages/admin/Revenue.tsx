
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Badge } from "../../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Plus, Trash2, RotateCcw, TrendingUp } from "lucide-react";
import { useAdminRevenue, type RevenueEntry } from "../../lib/admin-store";
import { toast } from "sonner";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const SOURCES: RevenueEntry["source"][] = ["Membership", "Shop", "Class", "PT Session"];

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function RevenuePage() {
  const { revenue, create, remove, reset } = useAdminRevenue();
  const [filter, setFilter] = useState<"all" | RevenueEntry["source"]>("all");
  const [open, setMở] = useState(false);
  const [draft, setDraft] = useState<Omit<RevenueEntry, "id">>({
    date: new Date().toISOString().slice(0, 10),
    source: "Membership",
    amount: 49,
    customer: "",
  });

  const filtered = useMemo(
    () => revenue.filter((r) => filter === "all" || r.source === filter),
    [revenue, filter],
  );

  const totals = useMemo(() => {
    const total = filtered.reduce((s, r) => s + r.amount, 0);
    const bySource = SOURCES.map((s) => ({
      source: s,
      total: revenue.filter((r) => r.source === s).reduce((sum, r) => sum + r.amount, 0),
    }));
    return { total, bySource };
  }, [filtered, revenue]);

  const daily = useMemo(() => {
    const days = 30;
    const buckets = Array.from({ length: days }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (days - 1 - i));
      return { label: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }), key: d.toISOString().slice(0, 10), amount: 0 };
    });
    revenue.forEach((r) => {
      const k = new Date(r.date).toISOString().slice(0, 10);
      const b = buckets.find((x) => x.key === k);
      if (b) b.amount += r.amount;
    });
    return buckets;
  }, [revenue]);

  const monthly = useMemo(() => {
    const months: Record<string, number> = {};
    revenue.forEach((r) => {
      const d = new Date(r.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      months[key] = (months[key] || 0) + r.amount;
    });
    return Object.entries(months)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6)
      .map(([k, v]) => ({
        label: new Date(`${k}-01`).toLocaleDateString(undefined, { month: "short" }),
        amount: Math.round(v),
      }));
  }, [revenue]);

  const PIE_COLORS = [
    "hsl(var(--primary))",
    "hsl(var(--chart-2, 200 70% 50%))",
    "hsl(var(--chart-3, 30 80% 55%))",
    "hsl(var(--chart-4, 280 60% 55%))",
  ];

  function submit() {
    if (!draft.customer.trim()) {
      toast.error("Vui lòng nhập tên khách hàng");
      return;
    }
    create({
      ...draft,
      date: new Date(draft.date).toISOString(),
      amount: Number(draft.amount) || 0,
    });
    toast.success("Đã thêm doanh thu");
    setMở(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Doanh thu</h1>
          <p className="text-sm text-muted-foreground">Total: {fmt(totals.total)} ({filtered.length} entries)</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { reset(); toast("Đã tạo lại doanh thu"); }}>
            <RotateCcw className="mr-2 h-3 w-3" /> Tạo lại
          </Button>
          <Dialog open={open} onOpenChange={setMở}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="mr-2 h-3 w-3" />New entry</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>New revenue entry</DialogTitle></DialogHeader>
              <div className="space-y-3 py-2">
                <div>
                  <Label>Khách hàng</Label>
                  <Input value={draft.customer} onChange={(e) => setDraft({ ...draft, customer: e.target.value })} />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Ngày</Label>
                    <Input type="date" value={draft.date.slice(0, 10)} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                  </div>
                  <div>
                    <Label>Số tiền (USD)</Label>
                    <Input type="number" value={draft.amount} onChange={(e) => setDraft({ ...draft, amount: +e.target.value })} />
                  </div>
                </div>
                <div>
                  <Label>Nguồn</Label>
                  <Select value={draft.source} onValueChange={(v) => setDraft({ ...draft, source: v as RevenueEntry["source"] })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="ghost" onClick={() => setMở(false)}>Hủy</Button>
                <Button onClick={submit}>Thêm</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {totals.bySource.map((b) => (
          <Card key={b.source}>
            <CardContent className="p-4">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">{b.source}</div>
              <div className="mt-1 text-xl font-bold tabular-nums">{fmt(b.total)}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4" /> Doanh thu · 30 ngày qua
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }}
                    formatter={(v: number) => fmt(v)}
                  />
                  <Area type="monotone" dataKey="amount" stroke="hsl(var(--primary))" fill="url(#rev)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Phân bổ nguồn</CardTitle></CardHeader>
          <CardContent>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={totals.bySource}
                    dataKey="total"
                    nameKey="source"
                    innerRadius={50}
                    outerRadius={90}
                    paddingAngle={2}
                  >
                    {totals.bySource.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Monthly revenue · last 6 months</CardTitle></CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthly} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip formatter={(v: number) => fmt(v)} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Giao dịch</CardTitle>
          <Select value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả sources</SelectItem>
              {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ngày</TableHead>
                  <TableHead>Khách hàng</TableHead>
                  <TableHead>Nguồn</TableHead>
                  <TableHead className="text-right">Số tiền</TableHead>
                  <TableHead className="w-12" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 50).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="tabular-nums">{new Date(r.date).toLocaleDateString("vi-VN")}</TableCell>
                    <TableCell>{r.customer}</TableCell>
                    <TableCell><Badge variant="secondary">{r.source}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(r.amount)}</TableCell>
                    <TableCell>
                      <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 50 && (
            <p className="mt-2 text-xs text-muted-foreground">Showing first 50 of {filtered.length} entries.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default RevenuePage;
