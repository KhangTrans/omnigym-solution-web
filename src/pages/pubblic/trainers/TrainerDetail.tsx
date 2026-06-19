import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  Calendar,
  CheckCircle2,
  ExternalLink,
  Heart,
  MapPin,
  Phone,
  Star,
  Tag,
  ImageOff,
  CreditCard,
  Info,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trainersApi, type PublicTrainerDetail, type TrainerScheduleShift } from "@/api/trainers";
import { favoriteTrainerAPI } from "@/api/favoriteTrainers";
import { slugify, trainerSlug, extractIdFromSlug } from "@/utils/slugify";
import { notify } from "@/utils/notify";
import { cn } from "@/utils/cn";
import { TrainerSchedule } from "./components/TrainerSchedule";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";




/**
 * Kiểm tra user có đang đăng nhập không bằng localStorage —
 * đồng nhất với pattern hiện đang dùng ở Navbar / CustomerLayout.
 */
const hasLoggedInUser = (): boolean => {
  const userData = localStorage.getItem("user");
  const token = localStorage.getItem("token");
  if (!userData || !token) return false;
  if (userData === "undefined" || userData === "null") return false;
  return true;
};

const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Liên hệ";
  }
  return `${Number(value).toLocaleString("vi-VN")}đ`;
};

const formatDate = (raw: string | null | undefined): string => {
  if (!raw) return "—";
  try {
    return new Date(raw).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const buildAvatarFallback = (name: string | null | undefined): string => {
  const safeName = (name || "Trainer").slice(0, 32);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=4F8A74&color=fff&size=400`;
};

const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export default function TrainerDetail() {
  const { slug } = useParams<{ slug: string }>();
  const id = slug ? String(extractIdFromSlug(slug)) : undefined;
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<PublicTrainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Lịch làm việc state
  const [schedule, setSchedule] = useState<TrainerScheduleShift[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [weekStart, setWeekStart] = useState<Date>(() => {
    const x = new Date();
    const diff = (x.getDay() + 6) % 7; // Monday = 0
    x.setDate(x.getDate() - diff);
    x.setHours(0, 0, 0, 0);
    return x;
  });
  const [selectedDay, setSelectedDay] = useState<string>(() =>
    formatLocalDate(new Date())
  );

  // Favorite state — chỉ load khi user đã đăng nhập.
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteToggling, setFavoriteToggling] = useState(false);
  const isAuthenticated = hasLoggedInUser();

  const [closures, setClosures] = useState<any[]>([]);
  const [daysOff, setDaysOff] = useState<any[]>([]);

  // States quản lý AlertDialog xác nhận đặt lịch
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingSlot, setPendingSlot] = useState<{ date: string; slot: string } | null>(null);
  const [bookingError, setBookingError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<Array<{ date: string; time: string }>>([]);

  useEffect(() => {
    try {
      const rawClosures = localStorage.getItem("gym_trainer_closures_v1");
      const rawDaysOff = localStorage.getItem("gym_trainer_days_off_v1");

      setClosures(rawClosures ? JSON.parse(rawClosures) : []);
      setDaysOff(rawDaysOff ? JSON.parse(rawDaysOff) : []);
    } catch (e) {
      console.error(e);
    }
  }, [id]);

  const handleToggleSlot = (date: string, time: string) => {
    if (!isAuthenticated) {
      notify.info("Vui lòng đăng nhập để đặt lịch tập.");
      sessionStorage.setItem("postLoginRedirect", `/trainers/${slug}`);
      navigate("/login");
      return;
    }
    setSelectedSlots((prev) => {
      const exists = prev.some((s) => s.date === date && s.time === time);
      if (exists) {
        return prev.filter((s) => !(s.date === date && s.time === time));
      } else {
        return [...prev, { date, time }];
      }
    });
  };

  const handleBookSlot = (date: string, slot: string) => {
    if (!isAuthenticated) {
      notify.info("Vui lòng đăng nhập để đặt lịch tập.");
      sessionStorage.setItem("postLoginRedirect", `/trainers/${slug}`);
      navigate("/login");
      return;
    }
    // Backward compatibility for single click
    setSelectedSlots([{ date, time: slot }]);
    setConfirmOpen(true);
  };

  const executeBooking = async () => {
    if (selectedSlots.length === 0) return;
    setBookingLoading(true);
    try {
      // Gọi API đặt lịch hàng loạt phía Backend
      await trainersApi.bookSlot({
        trainer_id: Number(id),
        slots: selectedSlots
      });

      // Tải lại lịch (schedule giờ đã bao gồm trạng thái booked/available)
      const start_date = formatLocalDate(weekStart);
      const future = new Date(weekStart);
      future.setDate(weekStart.getDate() + 6);
      const end_date = formatLocalDate(future);

      const scheduleRes = await trainersApi.getSchedule(id!, start_date, end_date);
      setSchedule(scheduleRes.data.data);

      const count = selectedSlots.length;
      notify.success(`Đặt thành công ${count} lịch tập với HLV!`);
      setConfirmOpen(false);
      setSelectedSlots([]);
      setBookingError(null);
    } catch (error: any) {
      const errorMsg = error?.response?.data?.message || "";
      if (errorMsg.includes("Vui lòng mua gói tập hoặc mua lẻ") || errorMsg.includes("Bạn không có buổi tập nào còn lại")) {
        setBookingError("Bạn hiện chưa đăng ký đủ số buổi tập PT còn hiệu lực với huấn luyện viên này. Vui lòng mua gói tập mới hoặc chọn phương thức mua lẻ từng buổi.");
      } else {
        setBookingError(errorMsg || "Không thể đặt lịch. Vui lòng thử lại.");
      }
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        setErrorMessage(null);
        setNotFound(false);
        const response = await trainersApi.getById(id);
        if (cancelled) return;
        setTrainer(response.data.data);
      } catch (error: unknown) {
        if (cancelled) return;
        const err = error as {
          response?: { status?: number; data?: { message?: string } };
        };
        const status = err?.response?.status;
        if (status === 404) {
          setNotFound(true);
        } else {
          setErrorMessage(
            err?.response?.data?.message ||
              "Không thể tải thông tin huấn luyện viên. Vui lòng thử lại sau.",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id]);

  // Load lịch làm việc và lịch bận của trainer trong tuần được chọn
  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    async function loadSchedule() {
      try {
        setScheduleLoading(true);
        const start_date = formatLocalDate(weekStart);

        const future = new Date(weekStart);
        future.setDate(weekStart.getDate() + 6); // Lấy 7 ngày tiếp theo
        const end_date = formatLocalDate(future);

        const scheduleRes = await trainersApi.getSchedule(id!, start_date, end_date);

        if (cancelled) return;
        setSchedule(scheduleRes.data.data);
      } catch (error) {
        console.error("Không thể tải lịch trực của trainer", error);
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }
    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [id, weekStart]);

  // Load trạng thái favorite khi đã có trainer + user đã login.
  useEffect(() => {
    if (!id || !isAuthenticated) {
      return;
    }
    let cancelled = false;
    async function loadStatus() {
      try {
        const response = await favoriteTrainerAPI.getStatus(id!);
        if (cancelled) return;
        setIsFavorited(!!response.data.data?.is_favorited);
      } catch {
        // Không phá luồng đọc detail nếu API status lỗi (vd token vừa hết hạn).
        if (!cancelled) setIsFavorited(false);
      }
    }
    loadStatus();
    return () => {
      cancelled = true;
    };
  }, [id, isAuthenticated]);

  async function handleToggleFavorite() {
    if (!trainer) return;

    // Guest → redirect login, không gọi API.
    if (!isAuthenticated) {
      notify.info("Vui lòng đăng nhập để lưu huấn luyện viên yêu thích.");
      sessionStorage.setItem(
        "postLoginRedirect",
        `/trainers/${trainerSlug(trainer.full_name, trainer.id)}`,
      );
      navigate("/login");
      return;
    }

    if (favoriteToggling) return;

    // Optimistic update — đảo trạng thái UI ngay, rollback nếu API fail.
    const nextValue = !isFavorited;
    setIsFavorited(nextValue);
    setFavoriteToggling(true);

    try {
      if (nextValue) {
        await favoriteTrainerAPI.add(trainer.id);
        notify.success("Đã thêm vào danh sách yêu thích.");
      } else {
        await favoriteTrainerAPI.remove(trainer.id);
        notify.success("Đã bỏ khỏi danh sách yêu thích.");
      }
    } catch (error: unknown) {
      // Rollback
      setIsFavorited(!nextValue);
      const err = error as {
        response?: { data?: { message?: string } };
      };
      notify.error(
        err?.response?.data?.message ||
          "Không thể cập nhật trạng thái yêu thích. Vui lòng thử lại.",
      );
    } finally {
      setFavoriteToggling(false);
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-16 animate-pulse">
          <div className="h-6 w-32 bg-slate-100 rounded mb-8" />
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-1 space-y-4">
              <div className="aspect-[4/5] bg-slate-100 rounded-2xl" />
              <div className="h-5 bg-slate-100 rounded w-2/3" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="lg:col-span-2 space-y-6">
              <div className="h-8 bg-slate-100 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-full" />
              <div className="h-4 bg-slate-100 rounded w-5/6" />
              <div className="h-4 bg-slate-100 rounded w-2/3" />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
                <div className="h-16 bg-slate-100 rounded-xl" />
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // 404 state
  if (notFound || !trainer) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 grid place-items-center px-4 py-24 text-center">
          <div className="max-w-md">
            <div className="mx-auto h-16 w-16 grid place-items-center rounded-full bg-slate-100">
              <ImageOff className="h-7 w-7 text-slate-400" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-slate-900">
              Không tìm thấy huấn luyện viên
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Huấn luyện viên này có thể đã ngừng hoạt động hoặc đường dẫn không
              hợp lệ.
            </p>
            <Button asChild className="mt-6">
              <Link to="/gyms">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Về danh sách phòng tập
              </Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Generic error state
  if (errorMessage) {
    return (
      <div className="min-h-screen bg-white flex flex-col">
        <Navbar />
        <main className="flex-1 grid place-items-center px-4 py-24 text-center">
          <div className="max-w-md">
            <h1 className="text-2xl font-bold text-rose-600">Đã có lỗi xảy ra</h1>
            <p className="mt-2 text-sm text-slate-500">{errorMessage}</p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <Button
                variant="outline"
                onClick={() => window.location.reload()}
              >
                Thử lại
              </Button>
              <Button asChild>
                <Link to="/gyms">Về danh sách phòng tập</Link>
              </Button>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const avatar =
    trainer.avatar_url ||
    trainer.user?.avatar_url ||
    buildAvatarFallback(trainer.full_name);

  const ratingDisplay =
    trainer.rating > 0 ? trainer.rating.toFixed(1) : "Chưa có";

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-10 lg:py-16">
        {/* Back link */}
        {trainer.branch && trainer.branch.branch_name ? (
          <Link
            to={`/gyms/${slugify(trainer.branch.branch_name)}`}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về {trainer.branch.branch_name}
          </Link>
        ) : (
          <Link
            to="/gyms"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-slate-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Trở về danh sách phòng tập
          </Link>
        )}

        {/* Hero */}
        <section className="mt-6 grid gap-8 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <div className="aspect-[4/5] overflow-hidden rounded-2xl border border-slate-100 bg-slate-50">
              <img
                src={avatar}
                alt={trainer.full_name || "Huấn luyện viên"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = buildAvatarFallback(
                    trainer.full_name,
                  );
                }}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2">
              {trainer.specialization ? (
                <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-500/20 rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide">
                  {trainer.specialization}
                </Badge>
              ) : null}
              {trainer.level ? (
                <Badge className="bg-slate-100 text-slate-700 rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-wide capitalize">
                  {trainer.level} Trainer
                </Badge>
              ) : null}
            </div>

            <div className="mt-3 flex items-start gap-3">
              <h1 className="flex-1 text-3xl sm:text-4xl font-bold tracking-tight text-slate-900">
                {trainer.full_name || "Huấn luyện viên"}
              </h1>
              <button
                type="button"
                onClick={handleToggleFavorite}
                disabled={favoriteToggling}
                aria-label={
                  isFavorited
                    ? "Bỏ khỏi danh sách yêu thích"
                    : "Lưu vào danh sách yêu thích"
                }
                aria-pressed={isFavorited}
                title={
                  isFavorited
                    ? "Bỏ khỏi danh sách yêu thích"
                    : "Lưu vào danh sách yêu thích"
                }
                className={cn(
                  "shrink-0 inline-flex h-11 w-11 items-center justify-center rounded-full border transition-all",
                  "hover:scale-105 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed",
                  isFavorited
                    ? "border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100"
                    : "border-slate-200 bg-white text-slate-500 hover:border-rose-200 hover:text-rose-500",
                )}
              >
                <Heart
                  className={cn(
                    "h-5 w-5 transition-transform",
                    isFavorited && "fill-rose-500 text-rose-500",
                  )}
                />
              </button>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
              <span className="inline-flex items-center gap-1.5">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-semibold text-slate-700">
                  {ratingDisplay}
                </span>
                {trainer.review_count > 0 ? (
                  <span>· {trainer.review_count} đánh giá</span>
                ) : null}
              </span>
              {trainer.years_experience > 0 ? (
                <span className="inline-flex items-center gap-1.5">
                  <Award className="h-4 w-4 text-emerald-600" />
                  {trainer.years_experience} năm kinh nghiệm
                </span>
              ) : null}
              {trainer.branch && trainer.branch.branch_name ? (
                <Link
                  to={`/gyms/${slugify(trainer.branch.branch_name)}`}
                  className="inline-flex items-center gap-1.5 hover:text-slate-900"
                >
                  <Building2 className="h-4 w-4" />
                  {trainer.branch.branch_name}
                </Link>
              ) : null}
            </div>

            {/* Bio */}
            <div className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Giới thiệu
              </h2>
              <p className="mt-2 text-base leading-relaxed text-slate-700 whitespace-pre-line">
                {trainer.bio?.trim()
                  ? trainer.bio
                  : "Huấn luyện viên chưa cập nhật phần giới thiệu."}
              </p>
            </div>

            {/* Quick stats */}
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Stat label="Kinh nghiệm" value={`${trainer.years_experience || 0} năm`} />
              <Stat label="Giá theo giờ" value={formatPrice(trainer.hourly_rate)} />
              <Stat label="Đánh giá" value={ratingDisplay} />
            </div>

            {/* Contact (optional) */}
            {(trainer.phone_number || trainer.address) && (
              <div className="mt-6 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                {trainer.phone_number ? (
                  <span className="inline-flex items-center gap-1.5">
                    <Phone className="h-4 w-4 text-emerald-600" />
                    {trainer.phone_number}
                  </span>
                ) : null}
                {trainer.address ? (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="h-4 w-4 text-emerald-600" />
                    {trainer.address}
                  </span>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* Certifications */}
        <section className="mt-16">
          <SectionHeader
            title="Chứng chỉ"
            subtitle="Các chứng chỉ chuyên môn đã được xác minh."
          />
          {trainer.certificates.length === 0 ? (
            <EmptyState text="Huấn luyện viên chưa có chứng chỉ được công khai." />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trainer.certificates.map((cert) => (
                <Card
                  key={cert.id}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden"
                >
                  {cert.image_url ? (
                    <div className="aspect-[4/3] overflow-hidden bg-slate-50">
                      <img
                        src={cert.image_url}
                        alt={cert.cert_name || "Chứng chỉ"}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  ) : null}
                  <CardContent className="p-5">
                    <div className="flex items-start gap-2">
                      <Award className="h-4 w-4 mt-0.5 shrink-0 text-emerald-600" />
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-slate-900 line-clamp-2">
                          {cert.cert_name || "Chứng chỉ chuyên môn"}
                        </h3>
                        {cert.issued_by ? (
                          <p className="text-xs text-slate-500 mt-0.5">
                            Cấp bởi {cert.issued_by}
                          </p>
                        ) : null}
                      </div>
                    </div>
                    <div className="mt-3 space-y-1 text-xs text-slate-500">
                      {cert.certificate_number ? (
                        <Row
                          icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />}
                          label="Mã"
                          value={cert.certificate_number}
                        />
                      ) : null}
                      {cert.issued_at ? (
                        <Row
                          icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />}
                          label="Ngày cấp"
                          value={formatDate(cert.issued_at)}
                        />
                      ) : null}
                      {cert.expires_at ? (
                        <Row
                          icon={<Calendar className="h-3.5 w-3.5 text-slate-400" />}
                          label="Hết hạn"
                          value={formatDate(cert.expires_at)}
                        />
                      ) : null}
                    </div>
                    {cert.image_url ? (
                      <a
                        href={cert.image_url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700"
                      >
                        Xem ảnh chứng chỉ
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    ) : null}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Packages */}
        <section id="trainer-packages-section" className="mt-16">
          <SectionHeader
            title="Gói tập với huấn luyện viên"
            subtitle={
              trainer.level
                ? `Các gói áp dụng cho cấp độ ${trainer.level}.`
                : "Các gói tập đang được cung cấp."
            }
          />
          {trainer.packages.length === 0 ? (
            <EmptyState
              text={
                trainer.level
                  ? "Hiện chưa có gói tập tương ứng cấp độ này."
                  : "Hiện chưa có gói tập được cấu hình."
              }
            />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {trainer.packages.map((pkg) => (
                <Card
                  key={pkg.id}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow"
                >
                  <CardContent className="p-5 flex flex-col h-full">
                    <h3 className="font-bold text-slate-900">{pkg.package_name}</h3>
                    <p className="text-xs text-slate-500 mt-1 capitalize">
                      {pkg.mode} · {pkg.session_count} buổi
                    </p>
                    {pkg.description ? (
                      <p className="mt-3 text-sm text-slate-600 line-clamp-3">
                        {pkg.description}
                      </p>
                    ) : null}
                    <div className="mt-auto pt-5 space-y-1">
                      <div className="flex items-baseline gap-2">
                        <Tag className="h-4 w-4 text-emerald-600" />
                        <span className="text-xl font-extrabold text-slate-900">
                          {formatPrice(pkg.package_price)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500">
                        {formatPrice(pkg.price_per_session)} / buổi
                      </p>
                    </div>
                    <Button
                      type="button"
                      onClick={() => {
                        if (!isAuthenticated) {
                          notify.info("Vui lòng đăng nhập để đặt gói tập.");
                          sessionStorage.setItem("postLoginRedirect", `/trainers/${slug}`);
                          navigate("/login");
                          return;
                        }
                        navigate(`/checkout-trainer-package/${trainer.id}/${pkg.id}`);
                      }}
                      className="mt-4 w-full bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl"
                    >
                      Đặt gói tập
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* Lịch làm việc */}
        <section className="mt-16">
          <SectionHeader
            title="Lịch tuần làm việc"
            subtitle="Xem khung giờ làm việc của huấn luyện viên và đặt lịch tập (mỗi buổi 1h30 phút)."
          />
          <TrainerSchedule
            trainerId={id!}
            schedule={schedule}
            scheduleLoading={scheduleLoading}
            weekStart={weekStart}
            setWeekStart={setWeekStart}
            selectedDay={selectedDay}
            setSelectedDay={setSelectedDay}
            daysOff={daysOff}
            closures={closures}
            handleBookSlot={handleBookSlot}
            selectedSlots={selectedSlots}
            onToggleSlot={handleToggleSlot}
            bookedTimes={schedule.reduce<Record<string, string[]>>((acc, entry) => {
              const dateKey = entry.date.split("T")[0];
              if (!acc[dateKey]) acc[dateKey] = [];
              entry.slots.filter(s => s.status === "booked").forEach(s => acc[dateKey].push(s.start_time));
              return acc;
            }, {})}
          />

          {selectedSlots.length > 0 && (
            <Card className="mt-6 border border-emerald-100 bg-emerald-50/20 p-5 rounded-2xl shadow-sm">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex-1">
                  <h4 className="font-bold text-slate-800 text-base">
                    Bạn đã chọn {selectedSlots.length} buổi tập
                  </h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Danh sách các buổi tập đăng ký:
                  </p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    {selectedSlots.map((slot, index) => (
                      <Badge
                        key={`${slot.date}-${slot.time}-${index}`}
                        variant="secondary"
                        className="bg-white border border-slate-200 text-slate-700 font-semibold py-1 px-2.5 rounded-xl flex items-center gap-1.5 shadow-sm text-xs"
                      >
                        <span>{formatDate(slot.date)} - {slot.time}</span>
                        <button
                          onClick={() => handleToggleSlot(slot.date, slot.time)}
                          className="text-slate-400 hover:text-rose-500 transition-colors focus:outline-none font-bold text-xs"
                          title="Hủy chọn"
                        >
                          ✕
                        </button>
                      </Badge>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={() => {
                    setConfirmOpen(true);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-6 py-2.5 rounded-xl shadow-md shrink-0 w-full md:w-auto"
                >
                  Xác nhận đặt lịch ({selectedSlots.length} buổi)
                </Button>
              </div>
            </Card>
          )}
        </section>

        {/* Reviews */}
        <section className="mt-16">
          <SectionHeader
            title="Đánh giá học viên"
            subtitle={
              trainer.review_count > 0
                ? `Tổng ${trainer.review_count} đánh giá · trung bình ${ratingDisplay}/5`
                : "Hiện chưa có học viên nào đánh giá."
            }
          />
          {trainer.reviews.length === 0 ? (
            <EmptyState
              text="Chưa có đánh giá. Hãy là người đầu tiên trải nghiệm và để lại nhận xét."
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {trainer.reviews.map((rev) => (
                <Card
                  key={rev.id}
                  className="rounded-2xl border border-slate-100 bg-white shadow-sm"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{rev.author}</p>
                        <p className="text-xs text-slate-400">
                          {formatDate(rev.created_at)}
                        </p>
                      </div>
                      <div className="inline-flex items-center gap-1 text-sm font-bold text-amber-500">
                        <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                        {rev.rating.toFixed(1)}
                      </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-600 leading-relaxed">
                      {rev.comment || "Học viên không để lại nhận xét."}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Dialog đặt lịch & chọn hình thức thanh toán */}
      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          setConfirmOpen(open);
          if (!open) {
            setBookingError(null);
          }
        }}
      >
        <AlertDialogContent className="max-w-md rounded-2xl border-0 p-6 shadow-lg bg-white">
          <AlertDialogHeader className="space-y-3">
            <AlertDialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              Đặt lịch tập với HLV {trainer?.full_name}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-500 text-sm">
              {selectedSlots.length === 1 ? (
                <span>
                  Khung giờ: <strong className="text-slate-700">{selectedSlots[0].time}</strong> ngày <strong className="text-slate-700">{formatDate(selectedSlots[0].date)}</strong>
                </span>
              ) : (
                <span className="block">
                  Số lượng buổi chọn: <strong className="text-slate-700">{selectedSlots.length} buổi</strong>
                  <span className="block mt-2 max-h-28 overflow-y-auto bg-slate-50 p-2 rounded-lg text-xs space-y-1">
                    {selectedSlots.map((s, idx) => (
                      <span key={idx} className="block text-slate-600 font-medium">
                        • {formatDate(s.date)} vào lúc {s.time}
                      </span>
                    ))}
                  </span>
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {bookingError && (
            <div className="mt-3 p-3.5 bg-rose-50 border border-rose-100 rounded-xl text-xs text-rose-600 font-medium leading-relaxed flex gap-2 items-start animate-in fade-in slide-in-from-top-1">
              <Info className="h-4.5 w-4.5 text-rose-500 shrink-0 mt-0.5" />
              <span>{bookingError}</span>
            </div>
          )}

          <div className="mt-5 space-y-3">
            {/* Option A: Dùng gói tập */}
            <button
              type="button"
              onClick={executeBooking}
              disabled={bookingLoading}
              className="w-full flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <div className="mt-0.5 rounded-lg bg-emerald-100 p-2 text-emerald-700 group-hover:scale-105 transition-transform shrink-0">
                {bookingLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Tag className="h-5 w-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-slate-800 text-sm">
                  {bookingLoading ? "Đang đặt lịch…" : `Đặt bằng gói tập PT (${selectedSlots.length} buổi)`}
                </p>
                <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                  {bookingLoading
                    ? "Vui lòng chờ trong giây lát…"
                    : `Sử dụng ${selectedSlots.length} buổi từ gói tập đã mua của bạn.`}
                </p>
              </div>
            </button>

            {/* Option B: Mua lẻ */}
            {selectedSlots.length === 1 ? (
              <button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  if (selectedSlots.length > 0) {
                    navigate(
                      `/checkout-slot/${trainer?.id}/${selectedSlots[0].date}/${selectedSlots[0].time}`,
                    );
                  }
                }}
                disabled={bookingLoading}
                className="w-full flex items-start gap-3 p-4 rounded-xl border border-slate-100 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all text-left group disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <div className="mt-0.5 rounded-lg bg-blue-100 p-2 text-blue-700 group-hover:scale-105 transition-transform">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <p className="font-semibold text-slate-800 text-sm">Mua lẻ slot này</p>
                    <span className="text-xs font-bold text-primary">
                      {formatPrice(trainer?.hourly_rate)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs mt-0.5 leading-normal">
                    Thanh toán trực tiếp cho buổi tập này qua cổng PayOS.
                  </p>
                </div>
              </button>
            ) : (
              <div className="p-3.5 bg-blue-50/50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium leading-relaxed flex gap-2 items-start">
                <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
                <span>Để đặt lịch bằng hình thức mua lẻ (PayOS), vui lòng chọn và đặt riêng từng buổi một. Đặt lịch hàng loạt chỉ hỗ trợ trừ số buổi từ Gói tập PT đã mua.</span>
              </div>
            )}
          </div>

          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 pt-5 mt-4 border-t border-slate-50">
            <AlertDialogCancel
              onClick={() => {
                setConfirmOpen(false);
                setBookingError(null);
              }}
              className="h-10 sm:flex-1 rounded-xl border border-slate-200 bg-white text-slate-700 font-medium hover:bg-slate-50 order-2 sm:order-1"
            >
              Đóng
            </AlertDialogCancel>

            {bookingError && (
              <Button
                type="button"
                onClick={() => {
                  setConfirmOpen(false);
                  setPendingSlot(null);
                  setBookingError(null);
                  const packagesSection = document.getElementById(
                    "trainer-packages-section",
                  );
                  if (packagesSection) {
                    packagesSection.scrollIntoView({ behavior: "smooth" });
                  }
                }}
                className="h-10 sm:flex-1 rounded-xl bg-primary text-white font-medium hover:bg-primary/95 order-1 sm:order-2"
              >
                Xem các gói PT
              </Button>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Footer />
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
      ) : null}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-100 bg-slate-50/50 p-3">
      <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
        {label}
      </p>
      <p className="mt-1 text-base font-bold text-slate-900">{value}</p>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {icon}
      <span className="text-slate-400">{label}:</span>
      <span className="text-slate-700 font-medium">{value}</span>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="text-center py-10 text-slate-400 italic bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
      {text}
    </div>
  );
}
