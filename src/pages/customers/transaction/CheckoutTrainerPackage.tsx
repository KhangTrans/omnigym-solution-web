import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trainersApi, type PublicTrainerDetail, type PublicTrainerPackage } from "@/api/trainers";
import { paymentsApi } from "@/api/payments";
import { toast } from "sonner";
import {
  ArrowLeft,
  Check,
  CreditCard,
  Loader2,
  ShieldCheck,
  Calendar,
  User,
  Mail,
  Dumbbell,
  Clock
} from "lucide-react";

export default function CheckoutTrainerPackage() {
  const { trainerId, packageId } = useParams<{ trainerId: string; packageId: string }>();
  const navigate = useNavigate();

  const [trainer, setTrainer] = useState<PublicTrainerDetail | null>(null);
  const [pkg, setPkg] = useState<PublicTrainerPackage | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    // 1. Auth check
    const rawUser = localStorage.getItem("user");
    if (!rawUser) {
      toast.error("Bạn cần đăng nhập để thực hiện thanh toán.");
      sessionStorage.setItem("postLoginRedirect", `/checkout-trainer-package/${trainerId}/${packageId}`);
      navigate("/login");
      return;
    }
    setCurrentUser(JSON.parse(rawUser));

    // 2. Fetch Trainer & Package info
    const fetchData = async () => {
      if (!trainerId || !packageId) return;
      try {
        setLoading(true);
        const response = await trainersApi.getById(trainerId);
        if (response.data && response.data.data) {
          const trData = response.data.data;
          setTrainer(trData);
          const foundPkg = trData.packages.find((p) => p.id === Number(packageId));
          if (foundPkg) {
            setPkg(foundPkg);
          } else {
            toast.error("Không tìm thấy gói tập của huấn luyện viên này.");
            navigate(`/trainers/${trainerId}`);
          }
        } else {
          toast.error("Không tìm thấy thông tin huấn luyện viên.");
          navigate("/gyms");
        }
      } catch (error) {
        console.error("Failed to load checkout details:", error);
        toast.error("Không thể tải thông tin thanh toán.");
        navigate("/gyms");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [trainerId, packageId, navigate]);

  const handleCheckout = async () => {
    if (!trainer || !pkg) return;
    try {
      setCheckoutLoading(true);
      const res = await paymentsApi.checkoutTrainerPackage(trainer.id, pkg.id);
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

  if (!trainer || !pkg) return null;

  const formattedPrice = pkg.package_price.toLocaleString("vi-VN");
  const pricePerSession = pkg.price_per_session.toLocaleString("vi-VN");

  // Calculate validity text
  let validityDays = "30 ngày";
  if (pkg.session_count > 10 && pkg.session_count <= 30) {
    validityDays = "90 ngày (3 tháng)";
  } else if (pkg.session_count > 30) {
    validityDays = "180 ngày (6 tháng)";
  }

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
            Xác nhận thanh toán gói PT
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Vui lòng kiểm tra lại thông tin gói tập và huấn luyện viên trước khi tiến hành thanh toán.
          </p>
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Trainer & Package Details */}
          <div className="lg:col-span-8 space-y-6">
            {/* Package Review Card */}
            <Card className="border border-primary/10 bg-white/70 shadow-card backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
                  <div className="space-y-1">
                    <Badge className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 text-xs font-semibold rounded-full uppercase tracking-wider">
                      PT Package
                    </Badge>
                    <h2 className="text-2xl font-bold text-slate-800 mt-2">{pkg.package_name}</h2>
                    <p className="text-sm text-slate-500">Huấn luyện viên: <strong className="text-slate-700">{trainer.full_name}</strong> ({trainer.level} Trainer)</p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-3xl font-extrabold text-slate-900">{formattedPrice}đ</span>
                    <span className="text-xs text-muted-foreground block mt-1">Gói {pkg.session_count} buổi</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-semibold text-slate-800 flex items-center gap-2 text-sm">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    Mô tả & Chế độ tập luyện
                  </h3>
                  <div className="text-sm text-slate-500 leading-relaxed pl-6 space-y-2">
                    <p>
                      {pkg.description || "Gói tập luyện cá nhân chất lượng cao cùng huấn luyện viên để đạt mục tiêu vóc dáng nhanh chóng."}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <Check className="h-4 w-4 text-emerald-600" />
                        <span>Chế độ: <strong className="text-slate-800 capitalize">{pkg.mode}</strong></span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-xl border border-slate-100">
                        <Clock className="h-4 w-4 text-emerald-600" />
                        <span>Thời hạn sử dụng: <strong className="text-slate-800">{validityDays}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Customer Details Card */}
            <Card className="border border-primary/10 bg-white/70 shadow-card backdrop-blur-xl rounded-[2rem] overflow-hidden">
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  Thông tin khách hàng mua gói
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

          {/* Right Column: Summary & Payment */}
          <div className="lg:col-span-4">
            <Card className="border border-primary/15 bg-white shadow-glow rounded-[2rem] overflow-hidden sticky top-24">
              <div className="p-6 sm:p-8 space-y-6">
                <h3 className="text-lg font-bold text-slate-800 pb-4 border-b border-slate-100">
                  Tóm tắt đơn hàng
                </h3>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between text-slate-500">
                    <span>Giá gói ({pkg.session_count} buổi)</span>
                    <span>{formattedPrice}đ</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Đơn giá chi tiết</span>
                    <span>{pricePerSession}đ/buổi</span>
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
