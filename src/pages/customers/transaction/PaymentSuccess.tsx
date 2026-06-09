import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paymentsApi, Transaction } from "@/api/payments";
import { membershipPackagesApi, MembershipPackage } from "@/api/membershipPackages";
import { toast } from "sonner";
import { CheckCircle2, Calendar, CreditCard, ArrowRight, Home, User, Loader2, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentSuccess() {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode");
  const navigate = useNavigate();

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [pkg, setPkg] = useState<MembershipPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

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
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                      <span className="text-slate-500">Gói tập đăng ký</span>
                      <span className="font-semibold text-primary">{pkg?.name || "OmniGym Member Package"}</span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                      <span className="text-slate-500">Giá trị thanh toán</span>
                      <span className="font-bold text-slate-800">
                        {transaction?.amount ? parseFloat(String(transaction.amount)).toLocaleString("vi-VN") : "0"}đ
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-1 border-b border-slate-200/50">
                      <span className="text-slate-500">Phương thức</span>
                      <span className="font-semibold text-slate-800">Cổng thanh toán PayOS</span>
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
                  <Button asChild className="rounded-full py-5 px-6 font-semibold bg-primary hover:bg-primary-deep text-white flex items-center justify-center gap-2 shadow-glow">
                    <Link to="/profile">
                      <User className="h-4 w-4" />
                      Xem hồ sơ cá nhân
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
