
import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Trash2, Check, ShieldAlert, MessageSquare } from "lucide-react";
import { useContentReports, type ContentReport } from "@/lib/admin-ops-store";
import { toast } from "sonner";



const REASON_LABEL: Record<ContentReport["reason"], string> = {
  spam: "Spam",
  harassment: "Harassment",
  misinformation: "Misinformation",
  inappropriate: "Inappropriate",
  other: "Other",
};

function ModerationPage() {
  const { reports, setStatus } = useContentReports();
  const [tab, setTab] = useState<ContentReport["status"] | "all">("open");

  const counts = useMemo(
    () => ({
      open: reports.filter((r) => r.status === "open").length,
      removed: reports.filter((r) => r.status === "removed").length,
      dismissed: reports.filter((r) => r.status === "dismissed").length,
    }),
    [reports],
  );

  const filtered = tab === "all" ? reports : reports.filter((r) => r.status === tab);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Content moderation</h1>
          <p className="text-sm text-muted-foreground">
            Review user-flagged reviews, profiles, gyms and trainers.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          <ShieldAlert className="h-3 w-3" />
          {counts.open} open
        </Badge>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Open</div>
          <div className="mt-1 text-2xl font-bold">{counts.open}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Removed</div>
          <div className="mt-1 text-2xl font-bold">{counts.removed}</div>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Dismissed</div>
          <div className="mt-1 text-2xl font-bold">{counts.dismissed}</div>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
        <TabsList>
          <TabsTrigger value="open">Open ({counts.open})</TabsTrigger>
          <TabsTrigger value="removed">Removed ({counts.removed})</TabsTrigger>
          <TabsTrigger value="dismissed">Dismissed ({counts.dismissed})</TabsTrigger>
          <TabsTrigger value="all">All ({reports.length})</TabsTrigger>
        </TabsList>
        <TabsContent value={tab} className="mt-4 space-y-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline" className="capitalize">{r.contentType}</Badge>
                    <Badge
                      variant={r.reason === "harassment" || r.reason === "inappropriate" ? "destructive" : "secondary"}
                    >
                      {REASON_LABEL[r.reason]}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(r.reportedAt).toLocaleString()}
                    </span>
                  </div>
                  <CardTitle className="text-base">{r.target}</CardTitle>
                  <div className="text-xs text-muted-foreground flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" /> Reported by {r.reporter}
                  </div>
                </div>
                <Badge
                  variant={
                    r.status === "open" ? "secondary" :
                    r.status === "removed" ? "destructive" : "outline"
                  }
                >
                  {r.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-3">
                <blockquote className="rounded bg-muted/30 shadow-[inset_4px_0_0_hsl(var(--primary)/0.40),0_2px_10px_rgba(15,23,42,0.08)] p-3 text-sm italic">
                  “{r.excerpt}”
                </blockquote>
                {r.status === "open" && (
                  <div className="flex flex-wrap justify-end gap-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => { setStatus(r.id, "dismissed"); toast("Report dismissed"); }}
                    >
                      <Check className="mr-1 h-3 w-3" /> Dismiss
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => { setStatus(r.id, "removed"); toast.success("Content removed"); }}
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Remove content
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && (
            <Card><CardContent className="p-8 text-center text-sm text-muted-foreground">No reports here.</CardContent></Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ModerationPage;
