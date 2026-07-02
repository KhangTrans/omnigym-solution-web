import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BanknoteArrowDown, BriefcaseBusiness, Dumbbell, Loader2, RefreshCw, Search, Users } from "lucide-react";
import { toast } from "sonner";
import { salaryApi, type SalaryItem, type SalaryListResponse, type SalaryType } from "@/api/salaries";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Props = {
  scope: "admin" | "branchmanager";
};

const salaryTypeLabel: Record<SalaryItem["type"], string> = {
  staff: "Nhân viên",
  trainer: "Trainer",
};

const monthOptions = Array.from({ length: 12 }, (_, index) => index + 1);
const currentDate = new Date();
const currentYear = currentDate.getFullYear();
const yearOptions = [currentYear - 1, currentYear, currentYear + 1];

const currency = (amount: number) =>
  new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount || 0);

function SummaryCard({
  title,
  value,
  helper,
  icon: Icon,
}: {
  title: string;
  value: string;
  helper: string;
  icon: typeof Users;
}) {
  return (
    <Card className="border-0 bg-muted/30 shadow-none">
      <CardContent className="flex items-start justify-between gap-3 p-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {title}
          </div>
          <div className="text-2xl font-bold tracking-tight">{value}</div>
          <div className="text-xs text-muted-foreground">{helper}</div>
        </div>
        <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function SalaryList({ scope }: Props) {
  const [loading, setLoading] = useState(false);
  const [payload, setPayload] = useState<SalaryListResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [month, setMonth] = useState(currentDate.getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [type, setType] = useState<SalaryType>("all");

  const title = scope === "admin" ? "Danh sách lương" : "Lương nhân sự chi nhánh";
  const subtitle =
    scope === "admin"
      ? "Theo dõi lương nhân viên và trainer theo kỳ."
      : "Theo dõi lương nhân viên và trainer trong chi nhánh bạn quản lý.";

  const loadSalaries = async () => {
    try {
      setLoading(true);
      setErrorMessage("");
      const response = await salaryApi.list({
        month,
        year,
        type: "all",
        search: searchInput.trim() || undefined,
      });
      setPayload(response.data.data);
    } catch (error: any) {
      const message = error.response?.data?.message || "Không thể tải danh sách lương.";
      setPayload(null);
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadSalaries();
  }, [month, year]);

  const allItems = payload?.items || [];
  const summary = payload?.summary;
  const rules = payload?.rules;

  const groupedCounts = useMemo(() => {
    return {
      all: allItems.length,
      staff: allItems.filter((item) => item.type === "staff").length,
      trainer: allItems.filter((item) => item.type === "trainer").length,
    };
  }, [allItems]);

  const items = useMemo(() => {
    if (type === "all") return allItems;
    return allItems.filter((item) => item.type === type);
  }, [allItems, type]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {scope === "admin" ? "Admin workspace" : "Branch workspace"}
          </div>
          <h1 className="mt-1 text-2xl font-bold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
        </div>
        <Button variant="outline" onClick={() => void loadSalaries()} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Làm mới
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          title="Tổng nhân sự"
          value={String(summary?.total_people || 0)}
          helper={`${summary?.staff_count || 0} nhân viên, ${summary?.trainer_count || 0} trainer`}
          icon={Users}
        />
        <SummaryCard
          title="Lương nhân viên"
          value={currency(summary?.staff_salary || 0)}
          helper={`Mức ca mặc định ${currency(rules?.staff_shift_rate || 0)}`}
          icon={BriefcaseBusiness}
        />
        <SummaryCard
          title="Lương trainer"
          value={currency(summary?.trainer_salary || 0)}
          helper="Theo booking completed"
          icon={Dumbbell}
        />
        <SummaryCard
          title="Tổng chi lương"
          value={currency(summary?.total_salary || 0)}
          helper={`Kỳ ${summary?.period || `${year}-${String(month).padStart(2, "0")}`}`}
          icon={BanknoteArrowDown}
        />
      </div>

      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="space-y-4 px-0">
          <CardTitle className="text-base">Bảng lương theo kỳ</CardTitle>
          <div className="grid gap-3 xl:grid-cols-[340px_minmax(0,1fr)] xl:items-center">
            <Tabs value={type} onValueChange={(value) => setType(value as SalaryType)} className="w-full">
              <TabsList className="grid w-[340px] grid-cols-3">
                <TabsTrigger value="all" className="w-full justify-center transition-none">
                  Tất cả ({groupedCounts.all})
                </TabsTrigger>
                <TabsTrigger value="staff" className="w-full justify-center transition-none">
                  Nhân viên ({groupedCounts.staff})
                </TabsTrigger>
                <TabsTrigger value="trainer" className="w-full justify-center transition-none">
                  Trainer ({groupedCounts.trainer})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex flex-col gap-3 sm:flex-row xl:justify-end">
              <Select value={String(month)} onValueChange={(value) => setMonth(Number(value))}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Tháng" />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((item) => (
                    <SelectItem key={item} value={String(item)}>
                      Tháng {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={String(year)} onValueChange={(value) => setYear(Number(value))}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Năm" />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((item) => (
                    <SelectItem key={item} value={String(item)}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="relative w-full sm:w-[280px]">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") void loadSalaries();
                  }}
                  placeholder="Tìm theo tên, email, số điện thoại..."
                  className="pl-8"
                />
              </div>
              <Button onClick={() => void loadSalaries()} disabled={loading}>
                Lọc
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="px-0 pt-0">
          {loading ? (
            <div className="flex h-40 items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : errorMessage ? (
            <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-14 text-center shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-amber-100 text-amber-700">
                <AlertCircle className="h-5 w-5" />
              </div>
              <div className="space-y-1">
                <div className="text-sm font-semibold text-amber-900">Không thể tải bảng lương</div>
                <div className="text-sm text-amber-800">{errorMessage}</div>
              </div>
            </div>
          ) : items.length === 0 ? (
            <div className="rounded-xl border border-slate-200 border-dashed bg-card py-16 text-center text-sm text-muted-foreground shadow-[0_2px_12px_rgba(15,23,42,0.06)]">
              Chưa có dữ liệu lương cho kỳ đã chọn.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-100 bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)]">
              <Table className="table-fixed">
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[220px]">Nhân sự</TableHead>
                    <TableHead className="w-[110px]">Loại</TableHead>
                    <TableHead className="w-[160px]">Chi nhánh</TableHead>
                    <TableHead className="w-[130px] text-right">Mức tính</TableHead>
                    <TableHead className="w-[190px] text-right">Ca / buổi</TableHead>
                    <TableHead className="w-[150px] text-right">Lương gộp</TableHead>
                    <TableHead className="w-[150px] text-right">Thực nhận</TableHead>
                    <TableHead className="w-[280px]">Ghi chú</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="align-top">
                        <div className="font-medium">{item.full_name || "Chưa cập nhật"}</div>
                        <div className="truncate text-xs text-muted-foreground">{item.email || item.phone_number || "—"}</div>
                      </TableCell>
                      <TableCell className="align-top">
                        <Badge variant={item.type === "staff" ? "secondary" : "outline"}>
                          {salaryTypeLabel[item.type]}
                        </Badge>
                      </TableCell>
                      <TableCell className="align-top">{item.branch_name || "—"}</TableCell>
                      <TableCell className="align-top text-right font-medium">{currency(item.base_rate)}</TableCell>
                      <TableCell className="align-top text-right">
                        {item.type === "staff" ? (
                          <div className="space-y-1 text-xs">
                            <div>{item.scheduled_shifts} ca</div>
                            <div className="text-muted-foreground">
                              {item.present_shifts} đúng giờ, {item.late_shifts} trễ, {item.half_day_shifts} nửa ca
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-1 text-xs">
                            <div>{item.completed_sessions} buổi</div>
                            <div className="invisible">Giữ chiều cao</div>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top text-right font-medium">{currency(item.gross_salary)}</TableCell>
                      <TableCell className="align-top text-right font-semibold text-primary">{currency(item.net_salary)}</TableCell>
                      <TableCell className="align-top text-xs text-muted-foreground">
                        {item.type === "staff"
                          ? `${item.absent_shifts} ca vắng. ${item.source_note}`
                          : item.source_note}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
