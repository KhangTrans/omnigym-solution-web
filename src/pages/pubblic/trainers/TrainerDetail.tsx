import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Award,
  Building2,
  ExternalLink,
  Heart,
  MapPin,
  Phone,
  Star,
  Tag,
  Calendar,
  CheckCircle2,
  ImageOff,
} from "lucide-react";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { trainersApi, type PublicTrainerDetail } from "@/api/trainers";
import { favoriteTrainerAPI } from "@/api/favoriteTrainers";
import { slugify } from "@/utils/slugify";
import { notify } from "@/utils/notify";
import { cn } from "@/utils/cn";

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

export default function TrainerDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trainer, setTrainer] = useState<PublicTrainerDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Favorite state — chỉ load khi user đã đăng nhập.
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteToggling, setFavoriteToggling] = useState(false);
  const isAuthenticated = hasLoggedInUser();

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
        `/trainers/${trainer.id}`,
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
        <section className="mt-16">
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
                      disabled
                      title="Tính năng đặt gói đang phát triển."
                      className="mt-4 w-full bg-primary hover:bg-primary/95 text-primary-foreground rounded-xl disabled:opacity-60 disabled:cursor-not-allowed"
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
