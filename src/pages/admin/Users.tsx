
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Plus, Pencil, Trash2 } from "lucide-react";
import { useAdminUsers, type AdminUser } from "@/lib/admin-store";
import { toast } from "sonner";



const PLANS: AdminUser["plan"][] = ["Free", "Basic", "Pro", "Elite"];
const ROLES: AdminUser["role"][] = ["member", "trainer", "admin"];
const STATUSES: AdminUser["status"][] = ["active", "paused", "banned"];

const empty: Omit<AdminUser, "id"> = {
  name: "",
  email: "",
  plan: "Basic",
  role: "member",
  status: "active",
  joined: new Date().toISOString().slice(0, 10),
  spend: 0,
};

function UsersPage() {
  const { users, create, update, remove } = useAdminUsers();
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<AdminUser | null>(null);
  const [draft, setDraft] = useState<Omit<AdminUser, "id">>(empty);

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return users;
    return users.filter((u) =>
      [u.name, u.email, u.plan, u.role, u.status].some((v) => v.toLowerCase().includes(q)),
    );
  }, [users, query]);

  function startCreate() {
    setEditing(null);
    setDraft(empty);
    setOpen(true);
  }
  function startEdit(u: AdminUser) {
    setEditing(u);
    const { id: _id, ...rest } = u;
    void _id;
    setDraft(rest);
    setOpen(true);
  }
  function submit() {
    if (!draft.name.trim() || !draft.email.trim()) {
      toast.error("Name and email required");
      return;
    }
    if (editing) {
      update(editing.id, draft);
      toast.success("User updated");
    } else {
      create(draft);
      toast.success("User created");
    }
    setOpen(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Users</h1>
          <p className="text-sm text-muted-foreground">{users.length} accounts · {users.filter(u => u.status === "active").length} active</p>
        </div>
        <Button size="sm" onClick={startCreate}><Plus className="mr-2 h-3 w-3" />New user</Button>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Members & staff</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <Input placeholder="Search by name, email, plan…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <div className="rounded-md bg-card shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead className="hidden md:table-cell">Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden lg:table-cell">Joined</TableHead>
                  <TableHead className="text-right">Spend</TableHead>
                  <TableHead className="w-20" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="hidden md:table-cell text-muted-foreground">{u.email}</TableCell>
                    <TableCell><Badge variant="outline">{u.plan}</Badge></TableCell>
                    <TableCell className="capitalize">{u.role}</TableCell>
                    <TableCell>
                      <Badge
                        variant={u.status === "active" ? "default" : u.status === "paused" ? "secondary" : "destructive"}
                      >
                        {u.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell tabular-nums">{u.joined.slice(0, 10)}</TableCell>
                    <TableCell className="text-right tabular-nums">${u.spend.toFixed(0)}</TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => startEdit(u)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => { remove(u.id); toast("User removed"); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">No users found.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editing ? "Edit user" : "New user"}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Name</Label>
                <Input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label>Plan</Label>
                <Select value={draft.plan} onValueChange={(v) => setDraft({ ...draft, plan: v as AdminUser["plan"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{PLANS.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Role</Label>
                <Select value={draft.role} onValueChange={(v) => setDraft({ ...draft, role: v as AdminUser["role"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r} className="capitalize">{r}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={draft.status} onValueChange={(v) => setDraft({ ...draft, status: v as AdminUser["status"] })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{STATUSES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Joined</Label>
                <Input type="date" value={draft.joined.slice(0, 10)} onChange={(e) => setDraft({ ...draft, joined: e.target.value })} />
              </div>
              <div>
                <Label>Lifetime spend</Label>
                <Input type="number" value={draft.spend} onChange={(e) => setDraft({ ...draft, spend: +e.target.value })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Lưu" : "Tạo mới"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default UsersPage;
