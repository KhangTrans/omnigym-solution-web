import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trainersApi, type PublicTrainerDetail } from "@/api/trainers";
import { paymentsApi } from "@/api/payments";
import { toast } from "sonner";
import {
  ArrowLeft,
  CreditCard,
  Loader2,
  ShieldCheck,
  Calendar,
  User,
  Mail,
  Clock,
  MapPin
} from "lucide-react";
import { formatDateDisplay, calculateEndTime } from "@/utils/bookingUtils";

export default function CheckoutSlot() {
  const { trainerId, date, time } = useParams<{ trainerId: string; date: string; time: string }>();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState<PublicTrainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // 1. Auth check
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      toast.error("Bạn cần đăng nhập để thực hiện thanh toán.");
      sessionStorage.setItem("postLoginRedirect", `/checkout-slot/${trainerId}/${date}/${time}`);
      navigate("/login");
      return;
    }
    setCurrentUser(JSON.parse(rawUser));

    // 2. Fetch Trainer info
    const fetchTrainerInfo = async () => {
      if (!trainerId) return;
      try {
        setLoading(true);
        const response = await trainersApi.getById(trainerId);
        if (response.data && response.data.data) {
          setTrainer(response.data.data);
        } else {
          toast.error("Không tìm thấy thông tin huấn luyện viên.");
          navigate("/gyms");
        }
      } catch (error) {
        console.error("Failed to load trainer details:", error);
        toast.error("Không thể tải thông tin thanh toán.");
        navigate("/gyms");
      } finally {
        setLoading(false);
      }
    };

    fetchTrainerInfo();
  }, [trainerId, date, time, navigate]);

  const handleCheckout = async () => {
    if (!trainer || !date || !time) return;
    try {
      setCheckoutLoading(true);
      const res = await paymentsApi.checkoutSlot(trainer.id, date, time);
      if (res.data && res.data.checkoutUrl) {
        toast.success("Đang chuyển hướng đến cổng thanh toán PayOS...");
        window.location.href = res.data.checkoutUrl;
      } else {
        toast.error("Tạo link thanh toán thất bại. Vui lòng thử lại.");
      }
    } catch (error: any) {
      console.error("Checkout error:", error);
      const errMsg = error?.response?.data?.message || "Lỗi hệ thống khi tạo giao dịch.";
      toast.error(errMsg);
    } finally {
      setCheckoutLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
        <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35" aria-hidden />
        <Navbar />
        <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="text-sm font-semibold text-slate-500">Đang tải thông tin đơn hàng của bạn...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!trainer || !date || !time) return null;

  const hourlyRate = trainer.hourly_rate || 0;
  const formattedPrice = hourlyRate.toLocaleString("vi-VN");



  const endTime = calculateEndTime(time);

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground flex flex-col">
      {/* Background patterns */}
      <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35" aria-hidden />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,138,116,0.08),transparent_55%)]" aria-hidden />
      
      <Navbar />

      <main className="relative flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Back Link */}
        <div className="mb-8">
          <Link
            to={`/trainers/${trainer.id}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors font-medium group"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
            Quay lại trang huấn luyện viên
          </Link>
        </div>

        {/* Header Title */}
        <div className="mb-10 text-center md:text-left">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
            Xác nhận đặt lịch & Thanh toán lẻ
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng kiểm tra kỹ ngày tập và khung giờ đặt trước khi thực hiện thanh toán.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Booking Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Booking Details Card */}
            <Card className="border border-primary/10 bg-white/70 shadow-card backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-1">
                    <Badge className="bg-amber-50 text-amber-700 border border-amber-500/20 px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider">
                      Single Session Booking
                    </Badge>
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">Buổi tập lẻ với Huấn luyện viên</h2>
                    <p className="text-sm text-slate-500">Huấn luyện viên: <strong className="text-slate-700">{trainer.full_name}</strong> ({trainer.level} Trainer)</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-3xl font-extrabold text-slate-900">{formattedPrice}đ</span>
                    <span className="text-xs text-muted-foreground block mt-1">Buổi tập 1h30 phút</span>
                  </div>
                </div>

                {/* Date & Time display */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <Calendar className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Ngày tập luyện</span>
                      <strong className="text-slate-800 text-sm capitalize">{formatDateDisplay(date)}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 bg-slate-50/80 p-4 rounded-2xl border border-slate-100">
                    <Clock className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium uppercase tracking-wider">Khung giờ tập (90 phút)</span>
                      <strong className="text-slate-800 text-sm">{time} - {endTime}</strong>
                    </div>
                  </div>
                </div>

                {/* Branch Location */}
                {trainer.branch && (
                  <div className="space-y-2 pt-2">
                    <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-primary" />
                      Địa điểm tập luyện
                    </h3>
                    <p className="text-xs text-slate-600 pl-6 leading-relaxed">
                      {trainer.branch.branch_name} <br />
                      <span className="text-slate-400">{trainer.branch.address}, {trainer.branch.district}, {trainer.branch.province}</span>
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Customer Details Card */}
            <Card className="border border-primary/10 bg-white/70 shadow-card backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Thông tin khách hàng đặt lịch
                </h3>
                
                {currentUser && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Họ và tên</span>
                      <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                        <User className="h-4 w-4 text-slate-400" />
                        {currentUser.full_name || "Chưa cập nhật"}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 font-medium uppercase tracking-wider">Email liên hệ</span>
                      <div className="flex items-center gap-2 text-slate-700 font-semibold text-sm">
                        <Mail className="h-4 w-4 text-slate-400" />
                        {currentUser.email}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Right Column: Pricing & Action */}
          <div className="lg:col-span-4">
            <Card className="border border-primary/15 bg-white shadow-glow rounded-[2rem] overflow-hidden sticky top-24">
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">
                  Tóm tắt đơn hàng
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Phí thuê theo giờ (1 slot lẻ)</span>
                    <span>{formattedPrice}đ</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Thuế VAT (0%)</span>
                    <span>0đ</span>
                  </div>
                  <div className="border-t border-slate-100 pt-4 flex justify-between items-baseline">
                    <span className="font-bold text-slate-800">Tổng cộng</span>
                    <span className="text-2xl font-extrabold text-primary">{formattedPrice}đ</span>
                  </div>
                </div>

                <div className="pt-2">
                  <Button
                    onClick={handleCheckout}
                    disabled={checkoutLoading}
                    className="w-full font-bold rounded-full py-6 text-sm bg-primary hover:bg-primary-deep text-white shadow-glow transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {checkoutLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tạo giao dịch...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4" />
                        Thanh toán qua PayOS
                      </>
                    )}
                  </Button>
                </div>

                {/* Secure checkout disclaimer */}
                <div className="flex items-center justify-center gap-2 text-[11px] text-slate-400">
                  <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span>Giao dịch bảo mật SSL an toàn & bảo mật.</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
