import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  ArrowUpRight,
  CalendarCheck2,
  ClipboardList,
  DollarSign,
  FileText,
  ScanFace,
  Users,
  UserSquare2,
} from "lucide-react";

const cards = [
  { label: "Trainer applications", value: "12", icon: ClipboardList, hint: "Pending review" },
  { label: "Branch posts", value: "28", icon: FileText, hint: "Ready for approval" },
  { label: "Attendance records", value: "146", icon: ScanFace, hint: "Today and history" },
  { label: "Revenue", value: "$84,230", icon: DollarSign, hint: "This month" },
];

export default function BranchManagerDashboard() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Branch workspace</div>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-foreground">
            Branch Manager Dashboard
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Chỉ hiển thị những chức năng branch/staff cần làm việc, không đụng vào admin shared features.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1">
          Workspace live
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <Card key={c.label} className="border bg-card text-card-foreground">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  {c.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{c.value}</div>
                <div className="mt-1 text-xs text-muted-foreground">{c.hint}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Quick actions</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            <Button asChild variant="outline" className="justify-between">
              <Link to="/branchmanager/trainer-applications">
                Review trainer apps <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/branchmanager/posts">
                Manage posts <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/branchmanager/attendance">
                View attendance <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" className="justify-between">
              <Link to="/branchmanager/revenue">
                Revenue overview <ArrowUpRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Branch/staff scope</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <Row icon={Users} text="User list for branch operations" />
            <Row icon={UserSquare2} text="Work shifts management" />
            <Row icon={CalendarCheck2} text="Customer check-in monitoring" />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Row({ icon: Icon, text }: { icon: typeof Users; text: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border bg-muted/30 px-3 py-2">
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{text}</span>
    </div>
  );
}
