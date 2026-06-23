import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  Trash2,
  Eye,
  EyeOff,
  MessageSquareQuote,
  Building2,
  Loader2,
} from "lucide-react";
import { useCustomerReviews, type CustomerReview } from "@/lib/admin-reviews-store";
import { branchesApi } from "@/api/branches";
import { toast } from "sonner";
import { cn } from "@/utils/cn";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

function Stars({ n }: { n: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < n ? "fill-amber-400 text-amber-400" : "text-muted-foreground/30",
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewsPage() {
  const { reviews, setSentiment, setStatus, remove } = useCustomerReviews();
  const [tab, setTab] = useState<"all" | "positive" | "negative">("all");
  const [branchFilter, setBranchFilter] = useState<string>("all");
  const [branches, setBranches] = useState<any[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);

  useEffect(() => {
    const fetchBranches = async () => {
      try {
        setLoadingBranches(true);
        const res = await branchesApi.getAll({ limit: 100 });
        if (res.data?.data) {
          setBranches(res.data.data);
        } else if (Array.isArray(res.data)) {
          setBranches(res.data);
        }
      } catch (err) {
        console.error("Failed to fetch branches for reviews filter", err);
      } finally {
        setLoadingBranches(false);
      }
    };
    fetchBranches();
  }, []);

  const stats = useMemo(() => {
    const positive = reviews.filter((r) => r.sentiment === "positive").length;
    const negative = reviews.filter((r) => r.sentiment === "negative").length;
    const avg =
      reviews.length === 0
        ? 0
        : reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

    // Tính toán theo chi nhánh từ API hoặc dữ liệu trong reviews
    const branchMap: Record<string, { name: string; total: number; positive: number; negative: number; sum: number }> = {};
    
    // Khởi tạo các chi nhánh đã tải về
    branches.forEach((b) => {
      branchMap[String(b.id)] = {
        name: b.branch_name,
        total: 0,
        positive: 0,
        negative: 0,
        sum: 0,
      };
    });

    // Gom dữ liệu từ reviews
    reviews.forEach((r) => {
      const bId = String(r.branchId);
      if (!branchMap[bId]) {
        branchMap[bId] = {
          name: r.branchName,
          total: 0,
          positive: 0,
          negative: 0,
          sum: 0,
        };
      }
      branchMap[bId].total += 1;
      branchMap[bId].sum += r.rating;
      if (r.sentiment === "positive") {
        branchMap[bId].positive += 1;
      } else {
        branchMap[bId].negative += 1;
      }
    });

    const perBranch = Object.entries(branchMap)
      .map(([id, info]) => ({
        id,
        name: info.name,
        total: info.total,
        avg: info.total === 0 ? 0 : info.sum / info.total,
      }))
      .filter((b) => b.total > 0);

    return { positive, negative, avg, perBranch, total: reviews.length };
  }, [reviews, branches]);

  const filtered = reviews.filter((r) => {
    if (tab !== "all" && r.sentiment !== tab) return false;
    if (branchFilter !== "all" && String(r.branchId) !== branchFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Đánh giá của khách hàng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Phân loại phản hồi hội viên, gắn thẻ cảm xúc và theo dõi uy tín của từng chi nhánh phòng tập.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 px-3 py-1 font-semibold text-xs">
          <MessageSquareQuote className="h-3.5 w-3.5" /> Tổng {stats.total} đánh giá
        </Badge>
      </div>

      {/* Top stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tổng số đánh giá
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Điểm trung bình
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800">{stats.avg.toFixed(1)}</span>
              <Stars n={Math.round(stats.avg)} />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Đánh giá Tích cực
            </div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-600">
              <ThumbsUp className="h-5 w-5 fill-emerald-50" /> {stats.positive}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Đánh giá Tiêu cực
            </div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-rose-600">
              <ThumbsDown className="h-5 w-5 fill-rose-50" /> {stats.negative}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts section */}
      <div className="grid gap-3 lg:grid-cols-2">
        <Card className="shadow-sm border-slate-100">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold text-slate-800">Tỷ lệ Cảm xúc khách hàng</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: "Tích cực", value: stats.positive },
                    { name: "Tiêu cực", value: stats.negative },
                  ]}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={2}
                  label={(e) => `${e.name}: ${e.value}`}
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#f43f5e" />
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-100">
          <CardHeader className="pb-3 border-b border-slate-50">
            <CardTitle className="text-base font-bold text-slate-800">Số lượng theo chi nhánh</CardTitle>
          </CardHeader>
          <CardContent className="h-[260px] pt-4">
            {stats.perBranch.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.perBranch.map((b) => ({ name: b.name, value: b.total }))}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label={(e) => `${e.name} (${e.value})`}
                  >
                    {stats.perBranch.map((_, i) => (
                      <Cell
                        key={i}
                        fill={`hsl(${(i * 135) % 360}, 65%, 55%)`}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                Chưa có dữ liệu đánh giá phân bổ chi nhánh.
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-4 rounded-xl shadow-sm border border-slate-100">
        <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
          <TabsList className="bg-slate-100 rounded-lg p-1">
            <TabsTrigger value="all" className="rounded-md font-semibold text-xs">Tất cả ({reviews.length})</TabsTrigger>
            <TabsTrigger value="positive" className="rounded-md font-semibold text-xs text-emerald-600">Tích cực ({stats.positive})</TabsTrigger>
            <TabsTrigger value="negative" className="rounded-md font-semibold text-xs text-rose-600">Tiêu cực ({stats.negative})</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center gap-2">
          {loadingBranches && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
          <Select value={branchFilter} onValueChange={setBranchFilter}>
            <SelectTrigger className="w-[240px] bg-background">
              <SelectValue placeholder="Chọn chi nhánh lọc" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chi nhánh</SelectItem>
              {branches.map((g) => (
                <SelectItem key={g.id} value={String(g.id)}>
                  {g.branch_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Review List */}
      <div className="space-y-4">
        {filtered.map((r) => (
          <ReviewCard
            key={r.id}
            r={r}
            onSentiment={(s) => {
              setSentiment(r.id, s);
              toast.success(`Đã đánh dấu là ${s === "positive" ? "Tích cực" : "Tiêu cực"}`);
            }}
            onStatus={(s) => {
              setStatus(r.id, s);
              toast.success(s === "hidden" ? "Đã ẩn đánh giá khỏi trang chủ" : "Đã công khai hiển thị đánh giá");
            }}
            onDelete={() => {
              remove(r.id);
              toast.success("Đã xóa đánh giá thành công");
            }}
          />
        ))}
        {filtered.length === 0 && (
          <Card className="border border-dashed py-12">
            <CardContent className="text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <MessageSquareQuote className="h-8 w-8 text-slate-300" />
              <span>Không có đánh giá nào phù hợp với bộ lọc hiện tại.</span>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

interface ReviewCardProps {
  r: CustomerReview;
  onSentiment: (s: "positive" | "negative") => void;
  onStatus: (s: CustomerReview["status"]) => void;
  onDelete: () => void;
}

function ReviewCard({ r, onSentiment, onStatus, onDelete }: ReviewCardProps) {
  return (
    <Card className="shadow-sm border-slate-100 hover:shadow-md transition-shadow">
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-3 border-b border-slate-50/50">
        <div className="flex items-start gap-3">
          {r.avatar ? (
            <img
              src={r.avatar}
              alt={r.customer}
              className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100"
            />
          ) : (
            <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
              {r.customer.slice(0, 1)}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold text-slate-800">{r.customer}</span>
              <Stars n={r.rating} />
              <Badge
                variant={r.sentiment === "positive" ? "secondary" : "destructive"}
                className={cn(
                  "text-[10px] font-bold px-2 py-0.5 rounded-full border-0",
                  r.sentiment === "positive"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                )}
              >
                {r.sentiment === "positive" ? "Tích cực" : "Tiêu cực"}
              </Badge>
              {r.status === "hidden" && (
                <Badge variant="outline" className="text-[10px] border-slate-200 text-slate-400 bg-slate-50">
                  Đang ẩn
                </Badge>
              )}
            </div>
            <CardTitle className="text-base font-bold text-slate-800">{r.title}</CardTitle>
            <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-2">
              <Building2 className="h-3.5 w-3.5" /> {r.branchName} ·{" "}
              {new Date(r.createdAt).toLocaleDateString("vi-VN", {
                day: "2-digit",
                month: "2-digit",
                year: "numeric",
                hour: "2-digit",
                minute: "2-digit"
              })}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-3">
        <p className="text-sm text-slate-600 leading-relaxed">{r.body}</p>
        <div className="flex flex-wrap justify-end gap-2 border-t border-slate-50 pt-3">
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSentiment("positive")}
            className={cn(
              "h-8 text-xs gap-1 border-slate-200 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700 hover:border-emerald-200 transition-colors",
              r.sentiment === "positive" && "bg-emerald-50 border-emerald-200 text-emerald-700"
            )}
          >
            <ThumbsUp className="h-3 w-3" /> Tích cực
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onSentiment("negative")}
            className={cn(
              "h-8 text-xs gap-1 border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 transition-colors",
              r.sentiment === "negative" && "bg-rose-50 border-rose-200 text-rose-700"
            )}
          >
            <ThumbsDown className="h-3 w-3" /> Tiêu cực
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() =>
              onStatus(r.status === "hidden" ? "published" : "hidden")
            }
            className="h-8 text-xs gap-1 text-slate-500 hover:bg-slate-50"
          >
            {r.status === "hidden" ? (
              <>
                <Eye className="h-3.5 w-3.5 text-emerald-600" /> Công khai
              </>
            ) : (
              <>
                <EyeOff className="h-3.5 w-3.5 text-amber-600" /> Ẩn đi
              </>
            )}
          </Button>
          <Button size="sm" variant="ghost" onClick={onDelete} className="h-8 text-xs gap-1 text-rose-500 hover:bg-rose-50 hover:text-rose-600">
            <Trash2 className="h-3.5 w-3.5" />
            Xóa bỏ
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
