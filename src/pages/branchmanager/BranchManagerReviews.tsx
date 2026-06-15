import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Reply,
  Trash2,
  Lock,
  Building2,
  Loader2,
  Undo2,
} from "lucide-react";
import { useCustomerReviews, type CustomerReview } from "@/lib/admin-reviews-store";
import { branchesApi } from "@/api/branches";
import { toast } from "sonner";
import { cn } from "@/utils/cn";

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={cn(
            "h-3.5 w-3.5",
            i < value ? "fill-amber-400 text-amber-400" : "text-muted-foreground/25"
          )}
        />
      ))}
    </div>
  );
}

export default function BranchManagerReviews() {
  const { reviews, setReply, remove } = useCustomerReviews();
  const [tab, setTab] = useState<"all" | "unanswered" | "positive" | "negative">("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [openReply, setOpenReply] = useState<Record<string, boolean>>({});
  const [branchName, setBranchName] = useState<string>("");
  const [loadingBranch, setLoadingBranch] = useState(false);

  // Lấy thông tin chi nhánh của tài khoản đang đăng nhập
  const currentUser = useMemo(() => {
    try {
      const data = localStorage.getItem("user");
      return data && data !== "undefined" ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  }, []);

  const staffBranchId = useMemo(() => {
    return currentUser?.staff?.branch_id || currentUser?.branch_id;
  }, [currentUser]);

  const roleValue = useMemo(() => {
    if (!currentUser) return "";
    const val = typeof currentUser.role === "object"
      ? currentUser.role?.role_name || currentUser.role?.name
      : currentUser.role;
    return String(val || "").toLowerCase();
  }, [currentUser]);

  const isManager = roleValue === "branchmanager" || Number(currentUser?.role_id) === 3;
  const author = isManager ? "Quản lý chi nhánh" : "Nhân viên phòng tập";

  // Lấy thông tin chi nhánh từ API để hiển thị tên chi nhánh chính xác
  useEffect(() => {
    if (!staffBranchId) return;
    const fetchBranchDetail = async () => {
      try {
        setLoadingBranch(true);
        const res = await branchesApi.getById(staffBranchId);
        if (res.data?.branch_name) {
          setBranchName(res.data.branch_name);
        } else if (res.data?.data?.branch_name) {
          setBranchName(res.data.data.branch_name);
        }
      } catch (err) {
        console.error("Failed to fetch branch detail for manager reviews", err);
      } finally {
        setLoadingBranch(false);
      }
    };
    fetchBranchDetail();
  }, [staffBranchId]);

  // Lọc đánh giá thuộc chi nhánh này
  const branchReviews = useMemo(() => {
    if (!staffBranchId) return reviews; // Fallback show all if not defined
    return reviews.filter((r) => String(r.branchId) === String(staffBranchId));
  }, [reviews, staffBranchId]);

  const filtered = useMemo(() => {
    return branchReviews.filter((r) => {
      if (tab === "all") return true;
      if (tab === "unanswered") return !r.reply;
      return r.sentiment === tab;
    });
  }, [branchReviews, tab]);

  const stats = useMemo(() => {
    const total = branchReviews.length;
    const positive = branchReviews.filter((r) => r.sentiment === "positive").length;
    const negative = branchReviews.filter((r) => r.sentiment === "negative").length;
    const answered = branchReviews.filter((r) => !!r.reply).length;
    const avg =
      total === 0
        ? 0
        : branchReviews.reduce((s, r) => s + r.rating, 0) / total;
    return { total, positive, negative, answered, avg };
  }, [branchReviews]);

  const submitReply = (id: string) => {
    const body = (drafts[id] || "").trim();
    if (!body) {
      toast.error("Nội dung phản hồi không được để trống");
      return;
    }
    setReply(id, {
      body,
      author,
      repliedAt: new Date().toISOString(),
    });
    setDrafts((d) => ({ ...d, [id]: "" }));
    setOpenReply((o) => ({ ...o, [id]: false }));
    toast.success("Đã đăng phản hồi thành công");
  };

  const clearReply = (id: string) => {
    setReply(id, undefined);
    toast.success("Đã xóa phản hồi");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Khu vực làm việc</span>
          <h1 className="text-2xl font-bold tracking-tight mt-1">Quản lý đánh giá khách hàng</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {loadingBranch ? (
              <span className="flex items-center gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Đang tải thông tin chi nhánh...</span>
            ) : branchName ? (
              <>Phản hồi ý kiến đóng góp của hội viên tại chi nhánh <strong>{branchName}</strong>.</>
            ) : (
              "Phản hồi ý kiến đóng góp của hội viên tại chi nhánh phòng tập của bạn."
            )}
          </p>
        </div>
        <Badge variant="secondary" className="gap-1 px-3 py-1 font-semibold text-xs bg-slate-100 border-slate-200">
          <MessageSquare className="h-3.5 w-3.5" /> Tổng {stats.total} đánh giá
        </Badge>
      </div>

      {/* Thống kê nhanh */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="shadow-sm border-slate-100 bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Tổng số đánh giá
            </div>
            <div className="mt-1 text-2xl font-bold text-slate-800">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Điểm trung bình
            </div>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-2xl font-bold text-slate-800">{stats.avg.toFixed(1)}</span>
              <Stars value={Math.round(stats.avg)} />
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Đánh giá Tích cực
            </div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-emerald-600">
              <ThumbsUp className="h-5 w-5 fill-emerald-50" /> {stats.positive}
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-slate-100 bg-card text-card-foreground">
          <CardContent className="p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Chưa phản hồi
            </div>
            <div className="mt-1 flex items-center gap-2 text-2xl font-bold text-amber-600">
              <Reply className="h-5 w-5" /> {stats.total - stats.answered}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Danh sách & Bộ lọc */}
      <Card className="shadow-sm border-slate-100 bg-card text-card-foreground">
        <CardHeader className="flex flex-row items-center justify-between gap-3 border-b border-slate-50 pb-4">
          <CardTitle className="text-base font-bold text-slate-800">
            Danh sách ({filtered.length} đánh giá)
          </CardTitle>
          <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
            <TabsList className="bg-slate-100 rounded-lg p-1">
              <TabsTrigger value="all" className="rounded-md font-semibold text-xs">Tất cả</TabsTrigger>
              <TabsTrigger value="unanswered" className="rounded-md font-semibold text-xs text-amber-600">Chưa phản hồi ({stats.total - stats.answered})</TabsTrigger>
              <TabsTrigger value="positive" className="rounded-md font-semibold text-xs text-emerald-600">Tích cực ({stats.positive})</TabsTrigger>
              <TabsTrigger value="negative" className="rounded-md font-semibold text-xs text-rose-600">Tiêu cực ({stats.negative})</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent className="space-y-4 pt-4">
          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-2">
              <MessageSquare className="h-8 w-8 text-slate-300" />
              <span>Không tìm thấy đánh giá nào.</span>
            </div>
          ) : (
            filtered.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-slate-100 bg-background/40 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {r.avatar ? (
                      <img
                        src={r.avatar}
                        alt={r.customer}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-50"
                      />
                    ) : (
                      <div className="grid h-10 w-10 place-items-center rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold shrink-0">
                        {r.customer.slice(0, 1)}
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-bold text-slate-800">{r.customer}</div>
                        <Stars value={r.rating} />
                        <Badge
                          variant="outline"
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
                      <div className="mt-0.5 text-xs text-muted-foreground flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span>{r.branchName}</span>
                        <span>·</span>
                        <span>
                          {new Date(r.createdAt).toLocaleDateString("vi-VN", {
                            day: "2-digit",
                            month: "2-digit",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit"
                          })}
                        </span>
                      </div>
                      <div className="mt-2 text-sm font-bold text-slate-800">{r.title}</div>
                      <p className="mt-1 text-sm text-slate-600 leading-relaxed">
                        {r.body}
                      </p>

                      {/* Phần phản hồi của chi nhánh */}
                      {r.reply ? (
                        <div className="mt-3 rounded-xl border-l-2 border-emerald-600 bg-slate-50/70 p-3">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-100/50 pb-1.5 mb-1.5">
                            <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                              {r.reply.author}{" "}
                              <span className="font-normal text-muted-foreground">
                                · {new Date(r.reply.repliedAt).toLocaleDateString("vi-VN", {
                                  day: "2-digit",
                                  month: "2-digit",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit"
                                })}
                              </span>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 gap-1 px-2 text-[11px] text-muted-foreground hover:bg-rose-50 hover:text-rose-600 transition-colors"
                              onClick={() => clearReply(r.id)}
                            >
                              <Undo2 className="h-3 w-3" />
                              Thu hồi
                            </Button>
                          </div>
                          <p className="text-sm text-slate-700 leading-relaxed">{r.reply.body}</p>
                        </div>
                      ) : openReply[r.id] ? (
                        <div className="mt-3 space-y-2">
                          <Textarea
                            value={drafts[r.id] || ""}
                            onChange={(e) =>
                              setDrafts((d) => ({ ...d, [r.id]: e.target.value }))
                            }
                            placeholder="Nhập phản hồi chu đáo gửi tới hội viên..."
                            rows={3}
                            className="bg-background"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                setOpenReply((o) => ({ ...o, [r.id]: false }))
                              }
                              className="h-8 text-xs text-slate-500 hover:bg-slate-50"
                            >
                              Hủy bỏ
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => submitReply(r.id)}
                              className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                            >
                              Đăng phản hồi
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 text-xs gap-1.5 border-slate-200 text-slate-600 hover:bg-slate-50"
                            onClick={() =>
                              setOpenReply((o) => ({ ...o, [r.id]: true }))
                            }
                          >
                            <Reply className="h-3.5 w-3.5 text-emerald-600" />
                            Phản hồi đánh giá
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-muted-foreground hover:bg-rose-50 hover:text-rose-600 shrink-0"
                    onClick={() => {
                      remove(r.id);
                      toast.success("Đã xóa đánh giá thành công");
                    }}
                    title="Xóa đánh giá"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
