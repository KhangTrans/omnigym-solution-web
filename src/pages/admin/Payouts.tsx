
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Banknote, Check, X, CreditCard } from "lucide-react";
import { useGymPayouts, type GymPayout } from "../../lib/admin-ops-store";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function PayoutsPage() {
  const { payouts, setStatus } = useGymPayouts();
  const [tab, setTab] = useState<GymPayout["status"] | "all">("pending");

  const counts = useMemo(
    () => ({
      pending: payouts.filter((p) => p.status === "pending").length,
      approved: payouts.filter((p) => p.status === "approved").length,
      paid: payouts.filter((p) => p.status === "paid").length,
      rejected: payouts.filter((p) => p.status === "rejected").length,
    }),
    [payouts],
  );

  const pendingValue = payouts
    .filter((p) => p.status === "pending")
    .reduce((s, p) => s + p.net, 0);

  const filtered = tab === "all" ? payouts : payouts.filter((p) => p.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gym payout approvals</h1>
          <p className="text-sm text-muted-foreground">
            Review and release payouts to gym partners.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <Banknote className="h-3 w-3" />
          {fmt(pendingValue)} awaiting approval
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-4">
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Đang chờ</div>
          <div className="mt-1 text-2xl font-bold">{counts.pending}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Đã duyệt</div>
          <div className="mt-1 text-2xl font-bold">{counts.approved}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Đã trả</div>
          <div className="mt-1 text-2xl font-bold">{counts.paid}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Đã từ chối</div>
          <div className="mt-1 text-2xl font-bold">{counts.rejected}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Payout queue</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="pending">Đang chờ ({counts.pending})</TabsTrigger>
              <TabsTrigger value="approved">Đã duyệt ({counts.approved})</TabsTrigger>
              <TabsTrigger value="paid">Đã trả ({counts.paid})</TabsTrigger>
              <TabsTrigger value="rejected">Đã từ chối ({counts.rejected})</TabsTrigger>
              <TabsTrigger value="all">Tất cả ({payouts.length})</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Brand</TableHead>
                      <TableHead>Period</TableHead>
                      <TableHead className="text-right">Gross</TableHead>
                      <TableHead className="text-right">Fees</TableHead>
                      <TableHead className="text-right">Net payout</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="w-56 text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((p) => (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.brandName}</TableCell>
                        <TableCell className="tabular-nums">{p.period}</TableCell>
                        <TableCell className="text-right tabular-nums">{fmt(p.gross)}</TableCell>
                        <TableCell className="text-right tabular-nums text-muted-foreground">−{fmt(p.fees)}</TableCell>
                        <TableCell className="text-right tabular-nums font-semibold">{fmt(p.net)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              p.status === "pending" ? "secondary" :
                              p.status === "approved" ? "outline" :
                              p.status === "paid" ? "default" :
                              "destructive"
                            }
                          >
                            {p.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {p.status === "pending" && (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => { setStatus(p.id, "rejected"); toast("Payout rejected"); }}>
                                <X className="mr-1 h-3 w-3" />Reject
                              </Button>
                              <Button size="sm" onClick={() => { setStatus(p.id, "approved"); toast.success("Payout approved"); }}>
                                <Check className="mr-1 h-3 w-3" />Approve
                              </Button>
                            </div>
                          )}
                          {p.status === "approved" && (
                            <Button size="sm" onClick={() => { setStatus(p.id, "paid"); toast.success("Marked as paid"); }}>
                              <CreditCard className="mr-1 h-3 w-3" />Mark paid
                            </Button>
                          )}
                          {(p.status === "paid" || p.status === "rejected") && (
                            <span className="text-xs text-muted-foreground">
                              {p.decidedAt ? new Date(p.decidedAt).toLocaleDateString("vi-VN") : "—"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={7} className="py-8 text-center text-sm text-muted-foreground">No payouts here.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

export default PayoutsPage;
