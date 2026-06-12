import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAdminRevenue } from "@/lib/admin-store";
import { DollarSign, TrendingUp } from "lucide-react";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

export default function BranchManagerRevenue() {
  const { revenue } = useAdminRevenue();
  const total = useMemo(() => revenue.reduce((s, r) => s + r.amount, 0), [revenue]);
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Branch workspace</div>
          <h1 className="text-2xl font-bold tracking-tight">Revenue</h1>
          <p className="text-sm text-muted-foreground">Tổng quan doanh thu khu vực branch.</p>
        </div>
        <Badge variant="secondary" className="gap-1"><TrendingUp className="h-3 w-3" /> Overview</Badge>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card><CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Total</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{fmt(total)}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Transactions</CardTitle></CardHeader><CardContent className="text-3xl font-bold">{revenue.length}</CardContent></Card>
        <Card><CardHeader><CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Branch scope</CardTitle></CardHeader><CardContent className="text-3xl font-bold"><DollarSign className="h-6 w-6" /></CardContent></Card>
      </div>
    </div>
  );
}
