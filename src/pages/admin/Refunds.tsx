
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Button } from "../../components/ui/button";
import { Badge } from "../../components/ui/badge";
import { Textarea } from "../../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "../../components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Check, X, RefreshCcw } from "lucide-react";
import { useRefunds, type RefundRequest } from "../../lib/admin-ops-store";
import { toast } from "sonner";

function fmt(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function RefundsPage() {
  const { refunds, approve, deny } = useRefunds();
  const [tab, setTab] = useState<RefundRequest["status"] | "all">("pending");
  const [active, setActive] = useState<RefundRequest | null>(null);
  const [decision, setDecision] = useState<"approve" | "deny" | null>(null);
  const [note, setNote] = useState("");

  const counts = useMemo(
    () => ({
      pending: refunds.filter((r) => r.status === "pending").length,
      approved: refunds.filter((r) => r.status === "approved").length,
      denied: refunds.filter((r) => r.status === "denied").length,
    }),
    [refunds],
  );

  const filtered = tab === "all" ? refunds : refunds.filter((r) => r.status === tab);

  const pendingTotal = refunds
    .filter((r) => r.status === "pending")
    .reduce((s, r) => s + r.amount, 0);

  function open(r: RefundRequest, d: "approve" | "deny") {
    setActive(r);
    setDecision(d);
    setNote("");
  }

  function confirm() {
    if (!active || !decision) return;
    if (decision === "approve") {
      approve(active.id, note);
      toast.success(`Refund of ${fmt(active.amount)} approved`);
    } else {
      deny(active.id, note);
      toast(`Refund denied`);
    }
    setActive(null);
    setDecision(null);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Refund requests</h1>
          <p className="text-sm text-muted-foreground">
            {counts.pending} pending · {fmt(pendingTotal)} at risk
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <RefreshCcw className="h-3 w-3" />
          {refunds.length} total this period
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Đang chờ</div>
          <div className="mt-1 text-2xl font-bold">{counts.pending}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Đã duyệt</div>
          <div className="mt-1 text-2xl font-bold">{counts.approved}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Đã từ chối</div>
          <div className="mt-1 text-2xl font-bold">{counts.denied}</div>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Queue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList>
              <TabsTrigger value="pending">Đang chờ ({counts.pending})</TabsTrigger>
              <TabsTrigger value="approved">Đã duyệt ({counts.approved})</TabsTrigger>
              <TabsTrigger value="denied">Đã từ chối ({counts.denied})</TabsTrigger>
              <TabsTrigger value="all">Tất cả ({refunds.length})</TabsTrigger>
            </TabsList>
            <TabsContent value={tab} className="mt-4">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Khách hàng</TableHead>
                      <TableHead>Reason</TableHead>
                      <TableHead>Nguồn</TableHead>
                      <TableHead className="text-right">Số tiền</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="w-44 text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>
                          <div className="font-medium">{r.customer}</div>
                          <div className="text-xs text-muted-foreground">{r.email}</div>
                        </TableCell>
                        <TableCell className="max-w-xs text-sm text-muted-foreground line-clamp-2">{r.reason}</TableCell>
                        <TableCell><Badge variant="outline">{r.source}</Badge></TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{fmt(r.amount)}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              r.status === "pending" ? "secondary" :
                              r.status === "approved" ? "default" : "destructive"
                            }
                          >
                            {r.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          {r.status === "pending" ? (
                            <div className="flex justify-end gap-1">
                              <Button size="sm" variant="ghost" onClick={() => open(r, "deny")}>
                                <X className="mr-1 h-3 w-3" />Deny
                              </Button>
                              <Button size="sm" onClick={() => open(r, "approve")}>
                                <Check className="mr-1 h-3 w-3" />Approve
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString("vi-VN") : "—"}
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="py-8 text-center text-sm text-muted-foreground">No requests in this view.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setDecision(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {decision === "approve" ? "Approve refund" : "Deny refund"}
            </DialogTitle>
          </DialogHeader>
          {active && (
            <div className="space-y-3 py-2 text-sm">
              <div>
                <span className="text-muted-foreground">Khách hàng: </span>
                <span className="font-medium">{active.customer}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Số tiền: </span>
                <span className="font-medium tabular-nums">{fmt(active.amount)}</span>
              </div>
              <div className="rounded border bg-muted/30 p-3 text-sm">{active.reason}</div>
              <Textarea
                placeholder="Note (optional, visible internally)"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
            </div>
          )}
          <DialogFooter>
            <Button variant="ghost" onClick={() => { setActive(null); setDecision(null); }}>Hủy</Button>
            <Button
              onClick={confirm}
              variant={decision === "deny" ? "destructive" : "default"}
            >
              {decision === "approve" ? "Approve refund" : "Confirm denial"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default RefundsPage;
