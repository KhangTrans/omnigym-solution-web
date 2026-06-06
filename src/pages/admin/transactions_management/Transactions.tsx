
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Download, Receipt } from "lucide-react";
import { useAdminRevenue, type RevenueEntry } from "@/lib/admin-store";



const SOURCES: RevenueEntry["source"][] = ["Membership", "Shop", "Class", "PT Session"];

function fmt(n: number) {
  return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);
}

function TransactionsPage() {
  const { revenue } = useAdminRevenue();
  const [query, setQuery] = useState("");
  const [source, setSource] = useState<"all" | RevenueEntry["source"]>("all");
  const [range, setRange] = useState<"7" | "30" | "90" | "all">("30");

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    const cutoff =
      range === "all" ? 0 : Date.now() - parseInt(range, 10) * 86400000;
    return revenue
      .filter((r) => (source === "all" ? true : r.source === source))
      .filter((r) => (range === "all" ? true : new Date(r.date).getTime() >= cutoff))
      .filter((r) =>
        !q ? true : r.customer.toLowerCase().includes(q) || r.source.toLowerCase().includes(q),
      )
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [revenue, query, source, range]);

  const total = filtered.reduce((s, r) => s + r.amount, 0);
  const avg = filtered.length ? total / filtered.length : 0;

  function exportCSV() {
    const rows = [
      ["id", "date", "customer", "source", "amount"],
      ...filtered.map((r) => [r.id, r.date, r.customer, r.source, r.amount.toString()]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transaction reports</h1>
          <p className="text-sm text-muted-foreground">
            {filtered.length} transactions · total {fmt(total)} · avg {fmt(avg)}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={exportCSV}>
          <Download className="mr-2 h-3 w-3" />Export CSV
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            <Receipt className="h-4 w-4" /> Ledger
          </CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            <Input placeholder="Search customer…" className="w-48" value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={source} onValueChange={(v) => setSource(v as typeof source)}>
              <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All sources</SelectItem>
                {SOURCES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={range} onValueChange={(v) => setRange(v as typeof range)}>
              <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Last 7d</SelectItem>
                <SelectItem value="30">Last 30d</SelectItem>
                <SelectItem value="90">Last 90d</SelectItem>
                <SelectItem value="all">All time</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md bg-card shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tx ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.slice(0, 80).map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-mono text-xs">{r.id}</TableCell>
                    <TableCell className="tabular-nums">{new Date(r.date).toLocaleDateString()}</TableCell>
                    <TableCell>{r.customer}</TableCell>
                    <TableCell><Badge variant="secondary">{r.source}</Badge></TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmt(r.amount)}</TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">No transactions match these filters.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {filtered.length > 80 && (
            <p className="mt-2 text-xs text-muted-foreground">Showing first 80 of {filtered.length} matches. Export CSV to see all.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TransactionsPage;
