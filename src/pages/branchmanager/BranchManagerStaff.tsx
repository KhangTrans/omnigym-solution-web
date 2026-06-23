import { useEffect, useState } from "react";
import { usersApi, type ApiUser } from "@/api/users";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Users } from "lucide-react";
import { toast } from "sonner";

export default function BranchManagerStaff() {
  const [items, setItems] = useState<ApiUser[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const userData = localStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;
        const branch_id = user?.branch_id;
        
        const res = await usersApi.list({ role: "Staff", branch_id });
        setItems(res.data.data ?? []);
      } catch (e: any) {
        toast.error(e.response?.data?.message || "Không tải được danh sách nhân sự.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = items.filter((u) => !q || `${u.full_name || ""} ${u.email || ""}`.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Branch workspace</div>
          <h1 className="text-2xl font-bold tracking-tight">Users / Staff</h1>
          <p className="text-sm text-muted-foreground">Danh sách nhân sự trong workspace branch.</p>
        </div>
        <Badge variant="secondary" className="gap-1"><Users className="h-3 w-3" /> {items.length} người</Badge>
      </div>
      <Card className="min-h-[420px] border-0 bg-card text-card-foreground shadow-sm">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="text-base">Staff users</CardTitle>
          <div className="relative w-72 max-w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Tìm kiếm..." className="pl-8" />
          </div>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="overflow-hidden rounded-xl bg-card shadow-sm">
            <Table>
              <TableHeader><TableRow className="hover:bg-transparent"><TableHead className="text-muted-foreground">Họ tên</TableHead><TableHead className="text-muted-foreground">Email</TableHead><TableHead className="text-muted-foreground">Trạng thái</TableHead></TableRow></TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">Đang tải...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={3} className="h-32 text-center text-sm text-muted-foreground">Không có dữ liệu.</TableCell></TableRow>
                ) : filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.full_name || "—"}</TableCell>
                    <TableCell>{u.email}</TableCell>
                    <TableCell><Badge variant="secondary">{u.status || "—"}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
