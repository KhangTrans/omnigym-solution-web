
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ShieldCheck, Save, LogOut } from "lucide-react";
import { useAdminProfile, type AdminProfile } from "@/lib/admin-ops-store";
import { toast } from "sonner";
import { ImageUpload } from "@/components/site/ImageUpload";



const ROLES: AdminProfile["role"][] = ["Owner", "Operations", "Support"];

function AdminProfilePage() {
  const { profile, update } = useAdminProfile();
  const [draft, setDraft] = useState<AdminProfile>(profile);

  useEffect(() => { setDraft(profile); }, [profile]);

  function set<K extends keyof AdminProfile>(key: K, value: AdminProfile[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function save() {
    if (!draft.name.trim() || !draft.email.trim()) {
      toast.error("Name and email are required");
      return;
    }
    update(draft);
    toast.success("Profile saved");
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">My admin profile</h1>
          <p className="text-sm text-muted-foreground">
            Update your account details and security preferences.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <ShieldCheck className="h-3 w-3" /> {draft.role}
        </Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Identity</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <ImageUpload
            label="Avatar"
            value={draft.avatar}
            onChange={(v) => set("avatar", v)}
            previewClassName="h-20 w-20 rounded-full"
            hint="Square photo recommended · max 4MB"
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>Full name</Label>
              <Input value={draft.name} onChange={(e) => set("name", e.target.value)} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={draft.email} onChange={(e) => set("email", e.target.value)} />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={draft.role} onValueChange={(v) => set("role", v as AdminProfile["role"])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{ROLES.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={draft.phone} onChange={(e) => set("phone", e.target.value)} />
            </div>
          </div>

          <div>
            <Label>Bio</Label>
            <Textarea rows={3} value={draft.bio} onChange={(e) => set("bio", e.target.value)} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <div className="text-sm font-medium">Two-factor authentication</div>
              <div className="text-xs text-muted-foreground">
                Require a one-time code when signing in to the admin console.
              </div>
            </div>
            <Switch checked={draft.twoFactor} onCheckedChange={(v) => set("twoFactor", v)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label>New password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
            <div>
              <Label>Confirm new password</Label>
              <Input type="password" placeholder="••••••••" />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button variant="outline" className="gap-2">
          <LogOut className="h-4 w-4" /> Sign out of admin
        </Button>
        <Button onClick={save} className="gap-2">
          <Save className="h-4 w-4" /> Save changes
        </Button>
      </div>
    </div>
  );
}

export default AdminProfilePage;
