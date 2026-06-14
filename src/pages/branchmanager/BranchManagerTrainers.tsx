import { useEffect, useMemo, useState } from "react";
import { BadgeCheck, Loader2, RefreshCw, Search, Award, Star, Mail, Phone, MapPin, DollarSign, Dumbbell, Eye, Calendar, Building2, Lock, Unlock } from "lucide-react";
import { toast } from "sonner";
import { trainersApi, type Trainer } from "@/api/trainers";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const trainerLevelLabel: Record<string, string> = {
  junior: "Junior",
  senior: "Senior",
  master: "Master",
};

export const levelBadgeClass: Record<string, string> = {
  junior: "bg-sky-50 text-sky-700 border-sky-200",
  senior: "bg-indigo-50 text-indigo-700 border-indigo-200",
  master: "bg-rose-50 text-rose-700 border-rose-200",
};

export default function BranchManagerTrainers() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  
  // Dialog state
  const [selectedTrainer, setSelectedTrainer] = useState<Trainer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // Confirm lock/unlock state
  const [confirmTarget, setConfirmTarget] = useState<{
    trainer: Trainer;
    action: "lock" | "unlock";
  } | null>(null);
  const [submittingStatus, setSubmittingStatus] = useState(false);

  async function fetchTrainers() {
    setLoading(true);
    try {
      const res = await trainersApi.getApproved();
      setTrainers(res.data.data || []);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Không thể tải danh sách huấn luyện viên");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void fetchTrainers();
  }, []);

  const filteredTrainers = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    return trainers
      .filter((t) => levelFilter === "all" || t.level === levelFilter)
      .filter((t) => {
        if (!keyword) return true;
        const name = t.user?.full_name || "";
        const email = t.user?.email || "";
        const specialization = t.specialization || "";
        const phone = t.phone_number || "";
        return [name, email, specialization, phone]
          .some((val) => val.toLowerCase().includes(keyword));
      });
  }, [trainers, search, levelFilter]);

  const levelCounts = useMemo(() => {
    return trainers.reduce(
      (acc, t) => {
        acc.all += 1;
        if (t.level && t.level in acc) {
          acc[t.level as keyof typeof acc] += 1;
        }
        return acc;
      },
      { all: 0, junior: 0, senior: 0, master: 0 }
    );
  }, [trainers]);

  const formatCurrency = (amount?: number) => {
    if (!amount) return "Chưa cập nhật";
    if (amount >= 1000) {
      return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount) + "/giờ";
    }
    return `$${amount}/giờ`;
  };

  const handleOpenDetail = (trainer: Trainer) => {
    setSelectedTrainer(trainer);
    setDetailOpen(true);
  };

  const isLocked = (trainer: Trainer) =>
    String(trainer.user?.status || "").toLowerCase() === "locked";

  async function handleConfirmStatus() {
    if (!confirmTarget || submittingStatus) return;
    const { trainer, action } = confirmTarget;
    const nextStatus: "active" | "locked" =
      action === "lock" ? "locked" : "active";
    try {
      setSubmittingStatus(true);
      const res = await trainersApi.updateStatus(trainer.id, nextStatus);
      toast.success(res.data.message || "Cập nhật thành công.");
      setConfirmTarget(null);
      await fetchTrainers();
    } catch (error: any) {
      toast.error(
        error.response?.data?.message || "Cập nhật trạng thái thất bại.",
      );
    } finally {
      setSubmittingStatus(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">Branch workspace</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground mt-1 font-sans">Danh sách Huấn luyện viên</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quản lý và xem danh sách các HLV đã được duyệt hoạt động tại chi nhánh.
          </p>
        </div>
        <Button variant="secondary" onClick={() => void fetchTrainers()} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Làm mới
        </Button>
      </div>

      {/* Summary Cards - Đã bỏ viền và đổi thành bg-muted/30 */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card className="border-0 shadow-none bg-muted/30">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tổng số HLV</span>
            <span className="text-2xl font-bold mt-1 text-foreground">{levelCounts.all}</span>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-muted/30">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-semibold text-sky-700 uppercase tracking-wider">Junior</span>
            <span className="text-2xl font-bold text-sky-700 mt-1">{levelCounts.junior}</span>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-muted/30">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Senior</span>
            <span className="text-2xl font-bold text-indigo-700 mt-1">{levelCounts.senior}</span>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-none bg-muted/30">
          <CardContent className="p-4 flex flex-col justify-center">
            <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">Master</span>
            <span className="text-2xl font-bold text-rose-700 mt-1">{levelCounts.master}</span>
          </CardContent>
        </Card>
      </div>

      {/* Main content wrapper */}
      <div className="space-y-4">
        {/* Bộ lọc và Tìm kiếm kiểu bài Post */}
        <div className="flex flex-wrap items-center gap-3">
          <Tabs value={levelFilter} onValueChange={setLevelFilter}>
            <TabsList>
              <TabsTrigger value="all">Tất cả ({levelCounts.all})</TabsTrigger>
              <TabsTrigger value="junior">Junior ({levelCounts.junior})</TabsTrigger>
              <TabsTrigger value="senior">Senior ({levelCounts.senior})</TabsTrigger>
              <TabsTrigger value="master">Master ({levelCounts.master})</TabsTrigger>
            </TabsList>
          </Tabs>
          <div className="relative w-full md:w-72">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm huấn luyện viên..."
              className="pl-8"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Table View */}
        {loading ? (
          <div className="flex h-40 items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTrainers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed rounded-xl bg-card">
            <Dumbbell className="h-10 w-10 text-muted-foreground/60 mb-2" />
            <p className="text-sm font-medium text-muted-foreground">Không tìm thấy huấn luyện viên nào.</p>
          </div>
        ) : (
          <div className="rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)] overflow-x-auto border-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Ảnh</TableHead>
                  <TableHead>Họ và tên</TableHead>
                  <TableHead>Chuyên môn / Cấp độ</TableHead>
                  <TableHead>Đánh giá & Kinh nghiệm</TableHead>
                  <TableHead>Chi phí</TableHead>
                  <TableHead>Liên hệ & Chi nhánh</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTrainers.map((trainer) => (
                  <TableRow
                    key={trainer.id}
                    className="hover:bg-muted/50"
                  >
                    {/* Ảnh đại diện */}
                    <TableCell>
                      {trainer.user?.avatar_url || trainer.avatar_url ? (
                        <img
                          src={trainer.user?.avatar_url || trainer.avatar_url}
                          alt={trainer.user?.full_name}
                          className="h-12 w-12 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border text-sm">
                          {(trainer.user?.full_name || "T").charAt(0).toUpperCase()}
                        </div>
                      )}
                    </TableCell>

                    {/* Họ và tên & Email */}
                    <TableCell>
                      <div className="font-semibold text-foreground flex items-center gap-2">
                        <span>{trainer.user?.full_name || "Chưa cập nhật"}</span>
                        {isLocked(trainer) && (
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0.5 px-2 bg-red-50 text-red-700 border-red-200"
                          >
                            Đã đình chỉ
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span>{trainer.user?.email || "N/A"}</span>
                      </div>
                    </TableCell>

                    {/* Chuyên môn / Cấp độ */}
                    <TableCell>
                      <div className="font-medium text-foreground">{trainer.specialization || "Chưa cập nhật"}</div>
                      {trainer.level && (
                        <Badge variant="outline" className={`mt-1 text-[10px] py-0.5 px-2 ${levelBadgeClass[trainer.level]}`}>
                          {trainerLevelLabel[trainer.level]}
                        </Badge>
                      )}
                    </TableCell>

                    {/* Đánh giá & Kinh nghiệm */}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                        <span className="text-sm font-semibold">{Number(trainer.rating || 0).toFixed(1)}</span>
                        <span className="text-xs text-muted-foreground">({trainer.review_count} reviews)</span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                        <Dumbbell className="h-3.5 w-3.5 shrink-0" />
                        <span>{trainer.years_experience} năm kinh nghiệm</span>
                      </div>
                    </TableCell>

                    {/* Chi phí */}
                    <TableCell>
                      <span className="font-semibold text-primary">{formatCurrency(trainer.hourly_rate)}</span>
                    </TableCell>

                    {/* Liên hệ & Chi nhánh */}
                    <TableCell>
                      {trainer.phone_number && (
                        <div className="text-xs text-foreground flex items-center gap-1">
                          <Phone className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <span>{trainer.phone_number}</span>
                        </div>
                      )}
                      {trainer.branch && (
                        <div className="text-xs text-emerald-700 font-semibold flex items-center gap-1 mt-1">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-emerald-600" />
                          <span>{trainer.branch.branch_name}</span>
                        </div>
                      )}
                    </TableCell>

                    {/* Thao tác */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDetail(trainer)}
                          title="Xem chi tiết"
                        >
                          <Eye className="h-4 w-4 text-slate-700" />
                        </Button>
                        {isLocked(trainer) ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setConfirmTarget({ trainer, action: "unlock" })
                            }
                            title="Mở khoá tài khoản"
                            className="text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50"
                          >
                            <Unlock className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() =>
                              setConfirmTarget({ trainer, action: "lock" })
                            }
                            title="Đình chỉ tài khoản"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Lock className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Trainer Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-[560px] max-h-[90vh] overflow-y-auto admin-scrollbar">
          {selectedTrainer && (
            <>
              <DialogHeader className="border-b pb-4">
                <DialogTitle className="text-xl flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-emerald-600" /> Chi tiết thông tin Huấn luyện viên
                </DialogTitle>
                <DialogDescription>
                  Xem toàn bộ hồ sơ của huấn luyện viên đã được phê duyệt.
                </DialogDescription>
              </DialogHeader>

              {/* Profile Card */}
              <div className="space-y-5 py-4">
                <div className="flex items-center gap-4">
                  {selectedTrainer.user?.avatar_url || selectedTrainer.avatar_url ? (
                    <img
                      src={selectedTrainer.user?.avatar_url || selectedTrainer.avatar_url}
                      alt={selectedTrainer.user?.full_name}
                      className="h-20 w-20 rounded-full object-cover border shadow-sm"
                    />
                  ) : (
                    <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary border text-2xl shadow-sm">
                      {(selectedTrainer.user?.full_name || "T").charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{selectedTrainer.user?.full_name || "Chưa cập nhật"}</h3>
                    <div className="flex flex-wrap gap-2 items-center">
                      {selectedTrainer.level && (
                        <Badge className={levelBadgeClass[selectedTrainer.level]}>
                          {trainerLevelLabel[selectedTrainer.level]}
                        </Badge>
                      )}
                      <span className="text-sm text-muted-foreground flex items-center gap-1">
                        <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                        {Number(selectedTrainer.rating || 0).toFixed(1)} ({selectedTrainer.review_count} đánh giá)
                      </span>
                    </div>
                  </div>
                </div>

                {/* Main details list */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-xl bg-muted/30 p-4 border text-sm">
                  <div className="space-y-1">
                    <span className="text-xs uppercase text-muted-foreground font-semibold">Chuyên môn</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Award className="h-4 w-4 text-primary" /> {selectedTrainer.specialization || "Chưa cập nhật"}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase text-muted-foreground font-semibold">Kinh nghiệm</span>
                    <p className="font-semibold text-foreground flex items-center gap-1.5 mt-0.5">
                      <Dumbbell className="h-4 w-4 text-primary" /> {selectedTrainer.years_experience} năm trong nghề
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase text-muted-foreground font-semibold">Chi phí dạy / giờ</span>
                    <p className="font-bold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                      <DollarSign className="h-4 w-4" /> {formatCurrency(selectedTrainer.hourly_rate)}
                    </p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-xs uppercase text-muted-foreground font-semibold">Chi nhánh</span>
                    <p className="font-semibold text-emerald-700 flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-4 w-4" /> {selectedTrainer.branch?.branch_name || "N/A"}
                    </p>
                  </div>
                </div>

                {/* Biography */}
                {selectedTrainer.bio && (
                  <div className="space-y-2 border-t pt-4">
                    <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Giới thiệu bản thân</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed italic bg-muted/10 p-3 rounded-lg border">
                      "{selectedTrainer.bio}"
                    </p>
                  </div>
                )}

                {/* Contact information */}
                <div className="space-y-3 border-t pt-4">
                  <h4 className="text-sm font-semibold text-foreground uppercase tracking-wide">Thông tin liên hệ</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Mail className="h-4 w-4 shrink-0" />
                      <span className="truncate">{selectedTrainer.user?.email || "Chưa cập nhật"}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4 shrink-0" />
                      <span>{selectedTrainer.phone_number || "Chưa cập nhật"}</span>
                    </div>
                    {selectedTrainer.address && (
                      <div className="flex items-center gap-2 md:col-span-2">
                        <MapPin className="h-4 w-4 shrink-0" />
                        <span>{selectedTrainer.address}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Approval details */}
                {selectedTrainer.approved_at && (
                  <div className="border-t pt-4 flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" /> Ngày duyệt hoạt động:
                    </span>
                    <span>
                      {new Date(selectedTrainer.approved_at).toLocaleDateString("vi-VN", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="border-t pt-4 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setDetailOpen(false)}>
                  Đóng
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirm lock/unlock dialog */}
      <Dialog
        open={!!confirmTarget}
        onOpenChange={(open) => {
          if (!open && !submittingStatus) setConfirmTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-[440px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {confirmTarget?.action === "lock" ? (
                <>
                  <Lock className="h-5 w-5 text-red-600" /> Đình chỉ huấn luyện viên
                </>
              ) : (
                <>
                  <Unlock className="h-5 w-5 text-emerald-600" /> Mở khoá huấn luyện viên
                </>
              )}
            </DialogTitle>
            <DialogDescription>
              {confirmTarget?.action === "lock"
                ? `HLV ${confirmTarget?.trainer.user?.full_name || ""} sẽ không thể đăng nhập vào hệ thống cho đến khi được mở khoá.`
                : `HLV ${confirmTarget?.trainer.user?.full_name || ""} sẽ được phép đăng nhập trở lại.`}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="ghost"
              onClick={() => setConfirmTarget(null)}
              disabled={submittingStatus}
            >
              Huỷ
            </Button>
            <Button
              variant={confirmTarget?.action === "lock" ? "destructive" : "default"}
              onClick={handleConfirmStatus}
              disabled={submittingStatus}
              className="gap-2"
            >
              {submittingStatus && <Loader2 className="h-4 w-4 animate-spin" />}
              {confirmTarget?.action === "lock" ? "Đình chỉ" : "Mở khoá"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
