import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paymentsApi, Transaction } from "@/api/payments";
import { membershipPackagesApi, MembershipPackage } from "@/api/membershipPackages";
import { trainersApi } from "@/api/trainers";
import { toast } from "sonner";
import { CheckCircle2, Calendar, CreditCard, ArrowRight, Home, User, Loader2, Sparkles, Info } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [pkg, setPkg] = useState<MembershipPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // States for Auto-scheduling PT package bookings after payment
  const [showAutoScheduleModal, setShowAutoScheduleModal] = useState(false);
  const [autoStartDate, setAutoStartDate] = useState<string>("");
  const [autoPreferredTime, setAutoPreferredTime] = useState<string>("08:00");
  const [autoSelectedDays, setAutoSelectedDays] = useState<number[]>([]);
  const [autoScheduleLoading, setAutoScheduleLoading] = useState(false);

  useEffect(() => {
    if (!orderCode) {
      setErrorMsg("Không tìm thấy mã đơn hàng thanh toán.");
      setLoading(false);
      return;
    }

    let isMounted = true;
    let pollCount = 0;
    const maxPolls = 5;

    const verifyPayment = async () => {
      try {
        const res = await paymentsApi.getTransactionStatus(Number(orderCode));
        const tx = res.data;

        // If transaction is still pending, poll a few times (as webhook might need a split second)
        if (tx.transaction_status === "pending" && pollCount < maxPolls) {
          pollCount++;
          setTimeout(verifyPayment, 2000);
          return;
        }

        if (!isMounted) return;

        if (tx.transaction_status === "paid") {
          setTransaction(tx);
          // Fetch package details
          if (tx.customer_subscription?.membership_id) {
            const pkgRes = await membershipPackagesApi.getById(tx.customer_subscription.membership_id);
            setPkg(pkgRes.data);
          } else if (tx.customer_trainer_package) {
            // Automatically pre-populate default start date to next Monday
            const nextMonday = new Date();
            const day = nextMonday.getDay();
            const daysToAdd = day === 0 ? 1 : 8 - day;
            nextMonday.setDate(nextMonday.getDate() + daysToAdd);
            const year = nextMonday.getFullYear();
            const month = String(nextMonday.getMonth() + 1).padStart(2, '0');
            const d = String(nextMonday.getDate()).padStart(2, '0');
            setAutoStartDate(`${year}-${month}-${d}`);
            setShowAutoScheduleModal(true);
          }
          setLoading(false);
        } else if (tx.transaction_status === "cancelled") {
          toast.error("Giao dịch này đã bị hủy.");
          navigate(`/payment/cancel?orderCode=${orderCode}`);
        } else {
          setErrorMsg("Giao dịch chưa hoàn tất thanh toán hoặc có lỗi xảy ra.");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error verifying payment status:", err);
        if (isMounted) {
          setErrorMsg("Không thể xác thực trạng thái giao dịch với máy chủ.");
          setLoading(false);
        }
      }
    };

    verifyPayment();

    return () => {
      isMounted = false;
    };
  }, [orderCode, navigate]);

  const handleAutoSchedule = async () => {
    if (!transaction?.customer_trainer_package) return;
    const trainerId = transaction.customer_trainer_package.trainer_id;
    if (autoSelectedDays.length === 0) {
      toast.error("Vui lòng chọn ít nhất một thứ trong tuần.");
      return;
    }
    setAutoScheduleLoading(true);
    try {
      const recurring_slots = autoSelectedDays.map((dayValue) => {
        // Map FE (0=Sunday, 1=Monday... 6=Saturday) to BE (1=Monday... 7=Sunday)
        const dayOfWeek = dayValue === 0 ? 7 : dayValue;
        return {
          dayOfWeek,
          time: autoPreferredTime,
        };
      });

      const response = await trainersApi.autoGenerateBookings({
        trainer_id: trainerId,
        start_date: autoStartDate,
        recurring_slots,
      });

      toast.success(response.data.message || "Tự động xếp lịch tập thành công!");
      setShowAutoScheduleModal(false);
      navigate("/profile");
    } catch (err: any) {
      console.error("Auto schedule error:", err);
      const errorMsg = err?.response?.data?.message || "Không thể tự động xếp lịch. Vui lòng thử lại.";
      toast.error(errorMsg);
    } finally {
      setAutoScheduleLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
        <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35" aria-hidden />
        <Navbar />
        <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-semibold text-slate-500">Đang xác thực trạng thái thanh toán từ PayOS...</p>
            <p className="text-xs text-slate-400">Quá trình này có thể mất vài giây. Vui lòng không đóng trình duyệt.</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,138,116,0.08),transparent_55%)]" aria-hidden />
      
      <Navbar />

      <main className="relative flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
        {errorMsg ? (
          <Card className="border border-red-100 bg-white shadow-glow p-8 rounded-[2rem] text-center w-full space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 text-red-500">
              <CheckCircle2 className="h-10 w-10 rotate-180" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Thanh toán thất bại</h1>
            <p className="text-sm text-slate-500 max-w-md mx-auto">{errorMsg}</p>
            <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild variant="outline" className="rounded-full px-6">
                <Link to="/gyms">Quay lại Gói Tập</Link>
              </Button>
              <Button asChild className="rounded-full px-6 bg-primary text-white">
                <Link to="/">Về Trang Chủ</Link>
              </Button>
            </div>
          </Card>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="w-full"
          >
            <Card className="border border-primary/15 bg-white shadow-glow rounded-[2rem] overflow-hidden">
              <CardContent className="p-8 sm:p-10 text-center space-y-8">
                {/* Checkmark Animation & Sparkles */}
                <div className="relative inline-flex items-center justify-center">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-20 h-20 rounded-full bg-primary/10 text-primary flex items-center justify-center"
                  >
                    <CheckCircle2 className="h-12 w-12 text-primary" />
                  </motion.div>
                  <Sparkles className="absolute -top-2 -right-2 h-6 w-6 text-yellow-500 animate-pulse" />
                </div>

                <div className="space-y-2">
                  <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 text-xs font-semibold rounded-full">
                    Thanh toán thành công
                  </Badge>
                  <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                    Cảm ơn bạn đã đăng ký!
                  </h1>
                  <p className="text-sm text-slate-500 max-w-md mx-auto">
                    Giao dịch của bạn đã hoàn tất và gói thành viên đã được kích hoạt thành công trên tài khoản.
                  </p>
                </div>

                {/* Details Table */}
                <div className="bg-slate-50 rounded-[1.5rem] p-6 text-left space-y-4 border border-slate-100/50">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Thông tin hóa đơn thanh toán
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                      <span className="text-slate-500">Mã giao dịch (Order Code)</span>
                      <span className="font-semibold text-slate-800">#{orderCode}</span>
                    </div>
                    {transaction?.customer_trainer_package ? (
                      <>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                          <span className="text-slate-500">Gói tập PT đăng ký</span>
                          <span className="font-semibold text-primary">
                            {transaction.customer_trainer_package.trainer_package?.package_name || "Gói tập cá nhân"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                          <span className="text-slate-500">Huấn luyện viên</span>
                          <span className="font-semibold text-slate-800">
                            HLV {transaction.customer_trainer_package.trainer?.user?.full_name || "PT"}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-1">
                          <span className="text-slate-500">Tổng số ca tập</span>
                          <span className="font-semibold text-slate-800">
                            {transaction.customer_trainer_package.total_sessions} buổi
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                          <span className="text-slate-500">Gói tập đăng ký</span>
                          <span className="font-semibold text-primary">{pkg?.name || "OmniGym Member Package"}</span>
                        </div>
                        <div className="flex justify-between items-start py-1">
                          <span className="text-slate-500 shrink-0">Thời hạn sử dụng</span>
                          <div className="text-right">
                            <span className="font-semibold text-slate-800 block">
                              {formatDate(transaction?.customer_subscription?.start_date)} - {formatDate(transaction?.customer_subscription?.end_date)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">({pkg?.duration_months || 1} tháng hiệu lực)</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
                  <Button asChild variant="outline" className="rounded-full py-5 px-6 font-semibold flex items-center justify-center gap-2">
                    <Link to="/">
                      <Home className="h-4 w-4" />
                      Về trang chủ
                    </Link>
                  </Button>
                  {transaction?.customer_trainer_package ? (
                    <Button
                      onClick={() => setShowAutoScheduleModal(true)}
                      className="rounded-full py-5 px-6 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center gap-2 shadow-glow"
                    >
                      <Calendar className="h-4 w-4" />
                      Tự động xếp lịch ngay
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button asChild className="rounded-full py-5 px-6 font-semibold bg-primary hover:bg-primary-deep text-white flex items-center justify-center gap-2 shadow-glow">
                      <Link to="/profile">
                        <User className="h-4 w-4" />
                        Xem hồ sơ cá nhân
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      {/* Hộp thoại Tự động xếp lịch sau thanh toán thành công */}
      <Dialog open={showAutoScheduleModal} onOpenChange={setShowAutoScheduleModal}>
        <DialogContent className="max-w-md rounded-2xl border-0 p-6 shadow-lg bg-white">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-emerald-600 animate-pulse" />
              Lên lịch tập PT định kỳ tự động
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm">
              Bạn vừa mua thành công gói tập PT <strong>{transaction?.customer_trainer_package?.trainer_package?.package_name || "gói tập"}</strong> ({transaction?.customer_trainer_package?.total_sessions} buổi). Hãy chọn lịch tập mong muốn của bạn!
            </DialogDescription>
          </DialogHeader>

          <div className="mt-4 space-y-4 text-sm">
            <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs text-emerald-800 leading-normal flex gap-2">
              <CheckCircle2 className="h-4.5 w-4.5 text-emerald-600 shrink-0 mt-0.5" />
              <span>Hệ thống sẽ tự động tìm lịch trống và xếp <strong>toàn bộ {transaction?.customer_trainer_package?.total_sessions} buổi tập</strong> của bạn với HLV <strong>{transaction?.customer_trainer_package?.trainer?.user?.full_name || "PT"}</strong>.</span>
            </div>

            {/* Ngày bắt đầu */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Ngày bắt đầu tập:</label>
              <input
                type="date"
                value={autoStartDate}
                onChange={(e) => setAutoStartDate(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800 font-medium"
              />
            </div>

            {/* Khung giờ */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Khung giờ tập ưa thích:</label>
              <select
                 value={autoPreferredTime}
                 onChange={(e) => setAutoPreferredTime(e.target.value)}
                 className="w-full h-10 px-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-slate-800 font-medium"
              >
                <option value="05:00">05:00 – 06:30 (Sáng)</option>
                <option value="06:30">06:30 – 08:00 (Sáng)</option>
                <option value="08:00">08:00 – 09:30 (Sáng)</option>
                <option value="09:30">09:30 – 11:00 (Sáng)</option>
                <option value="11:00">11:00 – 12:30 (Sáng)</option>
                <option value="13:00">13:00 – 14:30 (Chiều)</option>
                <option value="14:30">14:30 – 16:00 (Chiều)</option>
                <option value="16:00">16:00 – 17:30 (Chiều)</option>
                <option value="17:30">17:30 – 19:00 (Tối)</option>
                <option value="19:00">19:00 – 20:30 (Tối)</option>
              </select>
            </div>

            {/* Chọn thứ */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">Chọn các thứ trong tuần (Tối đa 4 ngày):</label>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "T2", value: 1 },
                  { label: "T3", value: 2 },
                  { label: "T4", value: 3 },
                  { label: "T5", value: 4 },
                  { label: "T6", value: 5 },
                  { label: "T7", value: 6 },
                  { label: "CN", value: 0 },
                ].map((day) => {
                  const isSelected = autoSelectedDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => {
                        setAutoSelectedDays((prev) => {
                          if (prev.includes(day.value)) {
                            return prev.filter((d) => d !== day.value);
                          } else {
                            if (prev.length >= 4) {
                              toast.error("Chỉ được chọn tối đa 4 ngày trong tuần.");
                              return prev;
                            }
                            return [...prev, day.value];
                          }
                        });
                      }}
                      className={cn(
                        "h-10 w-10 rounded-full font-bold text-xs flex items-center justify-center transition-all border",
                        isSelected
                          ? "bg-emerald-600 border-emerald-600 text-white shadow-sm scale-105"
                          : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-5 mt-4 border-t border-slate-50">
            <button
              type="button"
              disabled={autoScheduleLoading}
              onClick={() => setShowAutoScheduleModal(false)}
              className="h-10 sm:flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 order-2 sm:order-1"
            >
              Để sau
            </button>
            <Button
              type="button"
              disabled={autoScheduleLoading || autoSelectedDays.length === 0}
              onClick={handleAutoSchedule}
              className="h-10 sm:flex-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-md flex items-center justify-center gap-1.5 order-1 sm:order-2"
            >
              {autoScheduleLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Đang xếp lịch...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  Xếp lịch tự động
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
