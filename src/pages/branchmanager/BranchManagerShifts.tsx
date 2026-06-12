import { useEffect, useState } from "react";
import { workShiftsApi, type WorkShift } from "@/api/workShifts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarCheck2 } from "lucide-react";
import { toast } from "sonner";

export default function BranchManagerShifts() {
  const [items, setItems] = useState<WorkShift[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await workShiftsApi.list();
        setItems(res.data.data ?? []);
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Không tải được ca làm việc.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Branch workspace</div>
          <h1 className="text-2xl font-bold tracking-tight">Shifts</h1>
          <p className="text-sm text-muted-foreground">Ca làm việc của chi nhánh.</p>
        </div>
        <Badge variant="secondary" className="gap-1"><CalendarCheck2 className="h-3 w-3" /> {items.length} ca</Badge>
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Danh sách ca</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-hidden rounded-md border">
            <Table>
              <TableHeader><TableRow><TableHead>Ngày</TableHead><TableHead>Giờ</TableHead><TableHead>Trạng thái</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? <TableRow><TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">Đang tải...</TableCell></TableRow> : items.length === 0 ? <TableRow><TableCell colSpan={3} className="py-10 text-center text-sm text-muted-foreground">Chưa có ca làm việc.</TableCell></TableRow> : items.map((s) => <TableRow key={s.id}><TableCell>{s.date}</TableCell><TableCell>{s.start_time} - {s.end_time}</TableCell><TableCell><Badge variant="outline">{s.status}</Badge></TableCell></TableRow>)}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
