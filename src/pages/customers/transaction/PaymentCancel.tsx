import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { paymentsApi, Transaction } from "@/api/payments";
import { XCircle, RefreshCw, MapPin, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function PaymentCancel() {
  const [searchParams] = useSearchParams();
  const orderCode = searchParams.get("orderCode");

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderCode) {
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      try {
        const res = await paymentsApi.getTransactionStatus(Number(orderCode));
        setTransaction(res.data);
      } catch (err) {
        console.error("Error fetching cancelled transaction details:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchTransaction();
  }, [orderCode]);

  const packageId = transaction?.customer_subscription?.membership_id;

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
        <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35" aria-hidden />
        <Navbar />
        <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-semibold text-slate-500">Đang tải thông tin giao dịch...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
      <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(239,68,68,0.05),transparent_55%)]" aria-hidden />
      
      <Navbar />

      <main className="relative flex-1 max-w-2xl w-full mx-auto px-4 sm:px-6 py-16 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
          className="w-full"
        >
          <Card className="border border-red-100 bg-white shadow-glow rounded-[2rem] overflow-hidden">
            <CardContent className="p-8 sm:p-10 text-center space-y-8">
              {/* Cancel Icon */}
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 text-red-500">
                <XCircle className="h-12 w-12" />
              </div>

              <div className="space-y-2">
                <Badge className="bg-red-50 text-red-600 border-none px-3 py-1 text-xs font-semibold rounded-full">
                  Thanh toán bị hủy
                </Badge>
                <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
                  Giao dịch đã bị hủy
                </h1>
                <p className="text-sm text-slate-500 max-w-md mx-auto">
                  Bạn đã hủy giao dịch hoặc cổng thanh toán ghi nhận yêu cầu hủy. Tài khoản của bạn không bị trừ tiền cho giao dịch này.
                </p>
              </div>

              {transaction && (
                <div className="bg-slate-50 rounded-[1.5rem] p-5 text-left space-y-2 border border-slate-100/50 max-w-md mx-auto text-sm">
                  <div className="flex justify-between py-1 border-b border-slate-200/50">
                    <span className="text-slate-400">Mã đơn hàng</span>
                    <span className="font-semibold text-slate-700">#{orderCode}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Số tiền cần thanh toán</span>
                    <span className="font-bold text-slate-700">
                      {parseFloat(String(transaction.amount)).toLocaleString("vi-VN")}đ
                    </span>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row gap-4 justify-center">
                <Button asChild variant="outline" className="rounded-full py-5 px-6 font-semibold flex items-center justify-center gap-2">
                  <Link to="/gyms">
                    <MapPin className="h-4 w-4" />
                    Xem chi nhánh khác
                  </Link>
                </Button>
                
                {packageId && (
                  <Button asChild className="rounded-full py-5 px-6 font-semibold bg-primary hover:bg-primary-deep text-white flex items-center justify-center gap-2 shadow-glow">
                    <Link to={`/checkout/${packageId}`}>
                      <RefreshCw className="h-4 w-4" />
                      Thử thanh toán lại
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
