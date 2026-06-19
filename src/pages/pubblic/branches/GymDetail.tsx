import { useEffect, useRef, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { trainerSlug } from "@/utils/slugify";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import {
  MapPin,
  Phone,
  Clock,
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Star,
  Building2,
  Search,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { branchesApi } from "@/api/branches";
import { toast } from "sonner";
import { motion } from "framer-motion";
import BranchMemberships from "./BranchMemberships";
import { TrainerCompareModal } from "./components/TrainerCompareModal";

type TrainerSortBy = "rating_desc" | "price_asc" | "price_desc" | "newest";

const TRAINER_SORT_OPTIONS: { value: TrainerSortBy; label: string }[] = [
  { value: "rating_desc", label: "Đánh giá cao nhất" },
  { value: "price_asc", label: "Giá thấp → cao" },
  { value: "price_desc", label: "Giá cao → thấp" },
  { value: "newest", label: "Mới nhất" },
];

const formatTrainerPrice = (price: number | null | undefined): string => {
  if (price === null || price === undefined || Number.isNaN(price) || price <= 0) {
    return "Liên hệ";
  }
  try {
    return `${new Intl.NumberFormat("vi-VN").format(price)}đ / buổi`;
  } catch {
    return `${price}đ / buổi`;
  }
};

const buildAvatarFallback = (name: string | null | undefined): string => {
  const safeName = (name || "Trainer").trim() || "Trainer";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=4F8A74&color=fff&size=256`;
};

interface BranchImage {
  id: number;
  image_url: string;
  is_cover: boolean;
  sort_order: number;
}

interface FacilityImage {
  id: number;
  image_url: string;
  is_cover: boolean;
}

interface Facility {
  id: number;
  facility_name: string;
  description?: string;
  icon_url?: string;
  images?: FacilityImage[];
}

interface Trainer {
  id: number;
  bio?: string;
  specialization?: string | null;
  rating?: number | string;
  review_count?: number;
  hourly_rate?: number | string | null;
  level?: string | null;
  avatar_url?: string | null;
  years_experience?: number;
  user?: {
    full_name: string;
    email: string;
    avatar_url?: string;
  };
}

interface BranchDetail {
  id: number;
  branch_name: string;
  address: string;
  province: string;
  district: string;
  hotline?: string;
  opening_house?: string;
  image_url?: string;
  images?: BranchImage[];
  facilities?: Facility[];
  trainers?: Trainer[];
  trainerMeta?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  trainerSpecializations?: string[];
}

export default function GymDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [branch, setBranch] = useState<BranchDetail | null>(null);
  const [loading, setLoading] = useState(true);

  // Reviews state
  const [reviews, setReviews] = useState<any[]>([]);
  const [ratingStats, setRatingStats] = useState({ averageRating: 0, reviewCount: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(true);

  // Review capability state
  const [canReview, setCanReview] = useState(false);
  const [canReviewReason, setCanReviewReason] = useState("");

  // Form state
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const [submittingReview, setSubmittingReview] = useState(false);

  // Hero Carousel and Lightbox state
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageIndex, setLightboxImageIndex] = useState(0);

  // Trainer pagination + filter state (scoped to this branch)
  const [trainerPage, setTrainerPage] = useState(1);
  const trainerLimit = 6;
  const [trainerSearchInput, setTrainerSearchInput] = useState("");
  const [trainerSearch, setTrainerSearch] = useState("");
  const [trainerSpecialization, setTrainerSpecialization] = useState("all");
  const [trainerSortBy, setTrainerSortBy] = useState<TrainerSortBy>("rating_desc");
  const [trainerLoading, setTrainerLoading] = useState(false);
  const [trainerError, setTrainerError] = useState<string | null>(null);
  const [trainerSpecOptions, setTrainerSpecOptions] = useState<string[]>([]);
  const [selectedTrainerIds, setSelectedTrainerIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);

  // Construct images list
  const heroImages = Array.from(
    new Set(
      [
        ...(branch?.images?.map((img) => img.image_url) || []),
        ...(branch?.image_url ? [branch.image_url] : []),
      ].filter(Boolean),
    ),
  );
  if (heroImages.length === 0) {
    heroImages.push(
      "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80",
    );
  }

  // Lightbox keyboard navigation handler
  useEffect(() => {
    if (!lightboxOpen || heroImages.length <= 1) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setLightboxImageIndex((prev) =>
          prev === 0 ? heroImages.length - 1 : prev - 1,
        );
      } else if (e.key === "ArrowRight") {
        setLightboxImageIndex((prev) =>
          prev === heroImages.length - 1 ? 0 : prev + 1,
        );
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxOpen, heroImages.length]);

  const fetchReviewsAndStats = async (branchId: number) => {
    try {
      setReviewsLoading(true);
      const response = await branchesApi.getReviews(branchId);
      const result = response.data?.data ?? response.data;
      setReviews(result.reviews || []);
      setRatingStats(result.stats || { averageRating: 0, reviewCount: 0 });
    } catch (error) {
      console.error("Failed to load reviews:", error);
    } finally {
      setReviewsLoading(false);
    }
  };

  const checkUserReviewStatus = async (branchId: number) => {
    const token = localStorage.getItem("token");
    const userRaw = localStorage.getItem("user");
    if (!token || !userRaw) return;

    try {
      const user = JSON.parse(userRaw);
      if (user.role !== "Customer") return;

      const response = await branchesApi.checkCanReview(branchId);
      const data = response.data;
      setCanReview(data.canReview);
      setCanReviewReason(data.reason || "");
    } catch (error) {
      console.error("Failed to check review status:", error);
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branch?.id) return;
    if (userRating < 1 || userRating > 5) {
      toast.error("Vui lòng chọn số sao từ 1 đến 5.");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await branchesApi.createReview(branch.id, {
        rating: userRating,
        comment: userComment.trim() || undefined
      });
      toast.success(response.data?.message || "Gửi đánh giá thành công!");
      setUserComment("");
      // Reload stats & check eligibility again
      fetchReviewsAndStats(branch.id);
      checkUserReviewStatus(branch.id);
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Không thể gửi đánh giá.";
      toast.error(msg);
    } finally {
      setSubmittingReview(false);
    }
  };

  type TrainerFetchOpts = {
    page?: number;
    search?: string;
    specialization?: string;
    sortBy?: TrainerSortBy;
    showFullPageLoading?: boolean;
  };

  const fetchBranchDetail = async (opts: TrainerFetchOpts = {}) => {
    if (!slug) return;
    const {
      page = 1,
      search = trainerSearch,
      specialization = trainerSpecialization,
      sortBy = trainerSortBy,
      showFullPageLoading = false,
    } = opts;

    try {
      if (showFullPageLoading) {
        setLoading(true);
      } else {
        setTrainerLoading(true);
      }
      setTrainerError(null);

      const response = await branchesApi.getById(slug, {
        trainerPage: page,
        trainerLimit,
        trainerSearch: search.trim() ? search.trim() : undefined,
        trainerSpecialization:
          specialization && specialization !== "all"
            ? specialization
            : undefined,
        trainerSortBy: sortBy,
      });
      const data = response.data?.data ?? response.data;
      setBranch(data);
      setTrainerPage(data?.trainerMeta?.page || 1);
      // Cache distinct specialization options the first time we see them
      if (
        Array.isArray(data?.trainerSpecializations) &&
        data.trainerSpecializations.length > 0 &&
        trainerSpecOptions.length === 0
      ) {
        setTrainerSpecOptions(data.trainerSpecializations);
      }
      if (data?.id && showFullPageLoading) {
        fetchReviewsAndStats(data.id);
        checkUserReviewStatus(data.id);
      }
    } catch (error) {
      console.error("Failed to load branch detail:", error);
      if (showFullPageLoading) {
        toast.error("Không thể tải chi tiết phòng tập.");
      } else {
        setTrainerError("Không thể tải danh sách huấn luyện viên.");
      }
    } finally {
      if (showFullPageLoading) {
        setLoading(false);
      } else {
        setTrainerLoading(false);
      }
    }
  };

  // Initial load: fetch branch detail with current default filters
  useEffect(() => {
    fetchBranchDetail({ page: 1, showFullPageLoading: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // Debounce search input → trainerSearch
  useEffect(() => {
    const timer = setTimeout(() => {
      setTrainerSearch(trainerSearchInput);
    }, 400);
    return () => clearTimeout(timer);
  }, [trainerSearchInput]);

  // Re-fetch trainers (only) when filter/search/sort changes — skip first render
  const isFirstFilterRun = useRef(true);
  useEffect(() => {
    if (isFirstFilterRun.current) {
      isFirstFilterRun.current = false;
      return;
    }
    fetchBranchDetail({
      page: 1,
      search: trainerSearch,
      specialization: trainerSpecialization,
      sortBy: trainerSortBy,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trainerSearch, trainerSpecialization, trainerSortBy]);

  const handleTrainerPageChange = (page: number) => {
    if (
      branch?.trainerMeta &&
      page >= 1 &&
      page <= branch.trainerMeta.totalPages &&
      !trainerLoading
    ) {
      fetchBranchDetail({
        page,
        search: trainerSearch,
        specialization: trainerSpecialization,
        sortBy: trainerSortBy,
      });
    }
  };

  const hasActiveTrainerFilters =
    trainerSearchInput.trim() !== "" ||
    trainerSpecialization !== "all" ||
    trainerSortBy !== "rating_desc";

  const selectedTrainers = (branch?.trainers || []).filter((trainer) =>
    selectedTrainerIds.includes(trainer.id),
  );

  const handleToggleTrainerCompare = (trainerId: number) => {
    setSelectedTrainerIds((prev) => {
      if (prev.includes(trainerId)) {
        return prev.filter((id) => id !== trainerId);
      }
      if (prev.length >= 3) {
        toast.error("Chỉ chọn tối đa 3 huấn luyện viên để so sánh.");
        return prev;
      }
      return [...prev, trainerId];
    });
  };

  const handleOpenCompare = () => {
    if (selectedTrainerIds.length < 2) {
      toast.error("Vui lòng chọn ít nhất 2 huấn luyện viên để so sánh.");
      return;
    }
    setCompareOpen(true);
  };

  const handleResetTrainerFilters = () => {
    setTrainerSearchInput("");
    setTrainerSearch("");
    setTrainerSpecialization("all");
    setTrainerSortBy("rating_desc");
  };

  if (loading && !branch) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-3">
          <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          <p className="text-sm text-slate-500 font-medium">
            Đang tải thông tin phòng tập...
          </p>
        </div>
        <Footer />
      </div>
    );
  }

  if (!branch) {
    return (
      <div className="min-h-screen bg-white text-slate-800 flex flex-col justify-between">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6">
          <Building2 className="h-16 w-16 text-slate-300" />
          <h2 className="mt-4 text-2xl font-bold text-slate-800">
            Không tìm thấy chi nhánh
          </h2>
          <p className="mt-2 text-slate-500">
            Chi nhánh này có thể không tồn tại hoặc đã dừng hoạt động.
          </p>
          <Link to="/gyms" className="mt-6">
            <Button className="bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-full px-6">
              Quay lại danh sách
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const mainImageUrl = heroImages[0];

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-emerald-500 selection:text-white">
      <Navbar />

      {/* SECTION 1: HERO HEADER BANNER (Full-bleed background matching user mockup, optimized clarity) */}
      <section className="relative h-[340px] sm:h-[370px] w-full bg-white border-b border-slate-100 overflow-hidden flex items-center">
        {/* Full-width Background Image Slideshow (optimized opacity & saturation for clarity) */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          {heroImages.map((imgUrl, idx) => (
            <motion.div
              key={imgUrl}
              initial={{ opacity: 0 }}
              animate={{ opacity: idx === heroImageIndex ? 0.7 : 0 }}
              transition={{ duration: 0.8 }}
              className="absolute inset-0"
            >
              <img
                src={imgUrl}
                alt=""
                className="w-full h-full object-cover filter brightness-[1.01] contrast-[0.98] saturate-[0.9]"
              />
            </motion.div>
          ))}

          {/* Multi-directional gradient overlays for seamless blending into the page background */}
          {/* 1. Left-to-right fade (strong on the left for maximum text readability) */}
          <div className="absolute inset-y-0 left-0 w-full md:w-[60%] bg-gradient-to-r from-white via-white/90 to-transparent z-[1]" />
          {/* 2. Right-to-left fade (softer to make the right side background image clearer) */}
          <div className="absolute inset-y-0 right-0 w-full md:w-[40%] bg-gradient-to-l from-white/40 to-transparent z-[1]" />
          {/* 3. Bottom fade to blend cleanly into the page content below */}
          <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/50 to-transparent z-[1]" />
          {/* 4. Top fade to blend with navbar */}
          <div className="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-white/30 to-transparent z-[1]" />
        </div>

        {/* Banner Details Overlay */}
        <div className="relative mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 z-10 text-slate-900 space-y-4">
          <Link
            to="/gyms"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-emerald-700 transition-colors font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Tất cả phòng tập</span>
          </Link>

          <div className="space-y-1.5">
            <span className="text-[11px] uppercase font-extrabold tracking-widest text-emerald-750">
              {branch.district}, {branch.province}
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-[38px] font-black text-slate-900 tracking-tight leading-tight">
              {branch.branch_name}
            </h1>
          </div>

          {/* Inline Metadata List */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-slate-550 pt-0.5">
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{branch.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{branch.opening_house || "06:00 - 22:00"}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              <span>{branch.hotline || "1900 xxxx"}</span>
            </div>
          </div>

          {/* Rating (Green stars matching mockup) */}
          <div className="flex items-center gap-2 pt-0.5">
            <div className="flex items-center text-emerald-600">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-3.5 w-3.5 ${
                    s <= Math.round(ratingStats.averageRating)
                      ? "fill-current text-emerald-600"
                      : "text-slate-300"
                  }`}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {ratingStats.reviewCount > 0
                ? `${ratingStats.averageRating} · ${ratingStats.reviewCount} đánh giá`
                : "Chưa có đánh giá"}
            </span>
          </div>

          {/* Tags list (Badges for facilities) */}
          {branch.facilities && branch.facilities.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1.5">
              {branch.facilities.slice(0, 4).map((fac) => (
                <Badge
                  key={fac.id}
                  className="bg-emerald-50/40 text-slate-700 border border-slate-200/40 shadow-none hover:bg-emerald-100 rounded-full text-[10px] px-3.5 py-1 font-medium"
                >
                  {fac.facility_name}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* SECTION 2: FACILITIES & ROOMS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between border-b border-slate-100 pb-5 mb-10">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Khu vực & Tiện ích
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Khám phá không gian luyện tập chuẩn 5 sao tại {branch.branch_name}
              .
            </p>
          </div>
          <span className="text-sm font-semibold text-slate-400 shrink-0">
            {branch.facilities?.length || 0} khu vực
          </span>
        </div>

        {!branch.facilities || branch.facilities.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-2xl">
            Chi nhánh này hiện chưa được cấu hình danh mục tiện ích.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {branch.facilities.map((fac) => {
              const facImg = fac.images?.[0]?.image_url || mainImageUrl;
              return (
                <Card
                  key={fac.id}
                  className="group relative h-72 rounded-2xl overflow-hidden border-none shadow-md transition-all duration-300 hover:shadow-xl cursor-pointer"
                >
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={facImg}
                      alt={fac.facility_name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  </div>
                  <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                    <h3 className="text-lg font-bold">{fac.facility_name}</h3>
                    <p className="text-xs text-slate-350 line-clamp-2 leading-relaxed">
                      {fac.description ||
                        "Thiết bị hiện đại chuyên sâu hỗ trợ bài bản."}
                    </p>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase text-emerald-400 pt-1 group-hover:translate-x-1 transition-transform">
                      CHI TIẾT TIỆN ÍCH →
                    </span>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION: PHOTO GALLERY (REAL SHARP PICTURES MULTIPLE GALLERY) */}
      {heroImages.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-100">
          <div className="border-b border-slate-100 pb-5 mb-10">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Thư viện hình ảnh
            </h2>
            <p className="mt-2 text-sm text-slate-500">
              Khám phá toàn bộ hình ảnh thực tế tại chi nhánh{" "}
              {branch.branch_name}. Nhấn vào ảnh để xem kích thước lớn.
            </p>
          </div>

          <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
            {heroImages.map((imgUrl, idx) => (
              <div
                key={idx}
                className="relative h-48 rounded-2xl overflow-hidden cursor-pointer group border border-slate-100 shadow-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                tabIndex={0}
                role="button"
                aria-label={`Xem ảnh thư viện ${idx + 1}`}
                onClick={() => {
                  setLightboxImageIndex(idx);
                  setLightboxOpen(true);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightboxImageIndex(idx);
                    setLightboxOpen(true);
                  }
                }}
              >
                <img
                  src={imgUrl}
                  alt={`Thư viện ảnh ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center pointer-events-none">
                  <Activity className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: PERSONAL TRAINERS (filterable, paginated) */}
      <section className="bg-slate-50/50 py-20 border-y border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-slate-900">
                Huấn luyện viên cá nhân
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Đặt lịch tập 1:1 cùng đội ngũ huấn luyện viên được chứng nhận.
              </p>
            </div>
            <span className="text-sm text-muted-foreground shrink-0">
              {branch.trainerMeta?.total || 0} HLV
            </span>
          </div>

          {/* Filter bar (search + specialization + sort + reset) */}
          <div className="mb-8 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
            <div className="grid gap-3 md:grid-cols-4">
              <div className="relative md:col-span-2">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Tìm theo tên hoặc chuyên môn..."
                  className="w-full border-slate-200 bg-slate-50 pl-10 pr-4 text-slate-800 placeholder:text-slate-400 focus-visible:ring-emerald-500"
                  value={trainerSearchInput}
                  onChange={(e) => setTrainerSearchInput(e.target.value)}
                />
              </div>

              <Select
                value={trainerSpecialization}
                onValueChange={(val) => setTrainerSpecialization(val)}
              >
                <SelectTrigger className="w-full border-slate-200 bg-slate-50 text-slate-800 focus:ring-emerald-500">
                  <SelectValue placeholder="Chuyên môn" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-800 border-slate-100">
                  <SelectItem value="all">Tất cả chuyên môn</SelectItem>
                  {trainerSpecOptions.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={trainerSortBy}
                onValueChange={(val) => setTrainerSortBy(val as TrainerSortBy)}
              >
                <SelectTrigger className="w-full border-slate-200 bg-slate-50 text-slate-800 focus:ring-emerald-500">
                  <SelectValue placeholder="Sắp xếp" />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-800 border-slate-100">
                  {TRAINER_SORT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3 flex-wrap">
              <span className="text-xs text-slate-500">
                {trainerLoading
                  ? "Đang tải..."
                  : `Hiển thị ${branch.trainers?.length || 0} / ${branch.trainerMeta?.total || 0} HLV`}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResetTrainerFilters}
                disabled={!hasActiveTrainerFilters || trainerLoading}
                className="h-8 border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg"
              >
                Đặt lại bộ lọc
              </Button>
            </div>
          </div>

          {/* Listing */}
          {trainerError ? (
            <div className="text-center py-12 text-rose-500 bg-white rounded-2xl border border-rose-100">
              <p>{trainerError}</p>
              <Button
                size="sm"
                variant="outline"
                className="mt-4 border-slate-200 text-slate-700 hover:bg-slate-50"
                onClick={() =>
                  fetchBranchDetail({
                    page: 1,
                    search: trainerSearch,
                    specialization: trainerSpecialization,
                    sortBy: trainerSortBy,
                  })
                }
              >
                Thử lại
              </Button>
            </div>
          ) : trainerLoading && (!branch.trainers || branch.trainers.length === 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <div
                  key={i}
                  className="animate-pulse rounded-2xl border border-border bg-card p-0 overflow-hidden shadow-sm"
                >
                  <div className="aspect-[4/5] w-full bg-slate-100" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 w-2/3 rounded bg-slate-100" />
                    <div className="h-3 w-1/2 rounded bg-slate-100" />
                    <div className="h-3 w-1/3 rounded bg-slate-100 mt-3" />
                  </div>
                </div>
              ))}
            </div>
          ) : !branch.trainers || branch.trainers.length === 0 ? (
            <div className="text-center py-12 text-slate-400 italic bg-white rounded-2xl border border-slate-100">
              {hasActiveTrainerFilters
                ? "Không tìm thấy HLV phù hợp với bộ lọc. Hãy thử đổi từ khóa hoặc đặt lại bộ lọc."
                : "Hiện tại chưa có HLV thuộc chi nhánh này."}
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {branch.trainers.map((trainer, i) => {
                  const trainerName =
                    trainer.user?.full_name?.trim() || "Huấn luyện viên";
                  const avatar =
                    trainer.avatar_url ||
                    trainer.user?.avatar_url ||
                    buildAvatarFallback(trainerName);
                  const specialization = trainer.specialization || null;
                  const ratingNum = Number(trainer.rating ?? 0);
                  const reviewCount = trainer.review_count ?? 0;
                  const hourly =
                    trainer.hourly_rate === null ||
                    trainer.hourly_rate === undefined
                      ? null
                      : Number(trainer.hourly_rate);
                  const ratingDisplay =
                    Number.isFinite(ratingNum) && ratingNum > 0
                      ? ratingNum.toFixed(1)
                      : "—";
                  const titleLine =
                    specialization ||
                    (trainer.level
                      ? `${trainer.level} Trainer`
                      : "Personal Trainer");
                  // Build up to 2 specialty chips: prefer split specialization,
                  // fallback to level chip.
                  const specialtyChips: string[] = (() => {
                    if (specialization) {
                      const parts = specialization
                        .split(/[,/&]/)
                        .map((s) => s.trim())
                        .filter(Boolean);
                      if (parts.length > 0) return parts.slice(0, 2);
                    }
                    if (trainer.level) return [trainer.level];
                    return [];
                  })();
                  const isSelectedForCompare = selectedTrainerIds.includes(trainer.id);
                  const isCompareDisabled =
                    !isSelectedForCompare && selectedTrainerIds.length >= 3;

                  return (
                    <motion.div
                      key={trainer.id}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.35, delay: i * 0.05 }}
                    >
                      <Link
                        to={`/trainers/${trainerSlug(trainerName, trainer.id)}`}
                        className={`group flex h-full flex-col overflow-hidden rounded-2xl border bg-card shadow-sm transition-transform hover:-translate-y-1 hover:shadow-md ${
                          isSelectedForCompare
                            ? "border-emerald-300 ring-2 ring-emerald-400/70"
                            : "border-border"
                        }`}
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-slate-100">
                          <img
                            src={avatar}
                            alt={trainerName}
                            loading="lazy"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                buildAvatarFallback(trainerName);
                            }}
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <div className="absolute bottom-2 left-2 inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-2 py-0.5 text-xs font-semibold">
                            <Star className="h-3 w-3 fill-primary text-primary" />
                            {ratingDisplay}
                          </div>
                          <button
                            type="button"
                            className={`absolute right-2 top-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold shadow-sm backdrop-blur transition-colors ${
                              isSelectedForCompare
                                ? "border-emerald-200 bg-emerald-600 text-white"
                                : isCompareDisabled
                                  ? "border-slate-200 bg-white/80 text-slate-400 cursor-not-allowed"
                                  : "border-slate-200 bg-white/90 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700"
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleToggleTrainerCompare(trainer.id);
                            }}
                            aria-pressed={isSelectedForCompare}
                            aria-label={`Chọn ${trainerName} để so sánh`}
                          >
                            <Checkbox
                              checked={isSelectedForCompare}
                              disabled={isCompareDisabled}
                              className="h-3.5 w-3.5 border-current pointer-events-none data-[state=checked]:bg-white data-[state=checked]:text-emerald-600"
                              aria-hidden="true"
                              tabIndex={-1}
                            />
                            So sánh
                          </button>
                        </div>
                        <div className="flex flex-1 flex-col p-4">
                          <h3 className="font-bold leading-tight line-clamp-1">
                            {trainerName}
                          </h3>
                          <p
                            className="text-xs text-muted-foreground line-clamp-1"
                            title={titleLine}
                          >
                            {titleLine}
                          </p>
                          {specialtyChips.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-1">
                              {specialtyChips.map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                          <div className="mt-auto pt-4 flex items-center justify-between text-xs">
                            <span className="text-muted-foreground">
                              {formatTrainerPrice(hourly)}
                              {reviewCount > 0
                                ? ` · ${reviewCount} đánh giá`
                                : ""}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                              Xem
                              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {/* Trainer Pagination Controls */}
              {branch.trainerMeta && branch.trainerMeta.totalPages > 1 && (
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <Button
                    variant="outline"
                    disabled={trainerPage === 1 || trainerLoading}
                    onClick={() => handleTrainerPageChange(trainerPage - 1)}
                    className="h-9 px-3.5 border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Trước
                  </Button>

                  <span className="text-xs font-semibold text-slate-500">
                    Trang {trainerPage} / {branch.trainerMeta.totalPages}
                  </span>

                  <Button
                    variant="outline"
                    disabled={
                      trainerPage === branch.trainerMeta.totalPages ||
                      trainerLoading
                    }
                    onClick={() => handleTrainerPageChange(trainerPage + 1)}
                    className="h-9 px-3.5 border-slate-200 hover:bg-slate-50 text-slate-700"
                  >
                    Sau
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {selectedTrainerIds.length > 0 && (
        <div className="fixed bottom-5 right-5 z-40 flex flex-col items-end gap-2">
          {selectedTrainerIds.length < 2 && (
            <span className="rounded-full bg-slate-900/90 px-3 py-1 text-xs font-medium text-white shadow-lg">
              Chọn ít nhất 2 HLV để so sánh
            </span>
          )}
          <Button
            type="button"
            disabled={selectedTrainerIds.length < 2}
            onClick={handleOpenCompare}
            className="rounded-full bg-emerald-600 px-5 py-5 text-white shadow-lg hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-500"
          >
            So sánh ({selectedTrainerIds.length}/3)
          </Button>
        </div>
      )}

      {/* SECTION 4: MEMBER REVIEWS */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 border-t border-slate-100">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Đánh giá từ Hội viên
          </h2>
          <div className="flex justify-center items-center gap-2">
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className={`h-4 w-4 ${
                    s <= Math.round(ratingStats.averageRating)
                      ? "fill-current text-amber-400"
                      : "text-slate-200"
                  }`}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-500">
              {ratingStats.reviewCount > 0
                ? `${ratingStats.averageRating} · ${ratingStats.reviewCount} đánh giá thành viên`
                : "Chưa có đánh giá thành viên"}
            </span>
          </div>
        </div>

        {/* Form viết đánh giá của khách hàng */}
        {canReview ? (
          <Card className="mb-12 max-w-xl mx-auto p-6 rounded-2xl border border-emerald-100 bg-emerald-50/10 shadow-sm">
            <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <span>Gửi đánh giá của bạn</span>
            </h3>
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-700">Điểm số:</span>
                <div className="flex items-center text-amber-400">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setUserRating(star)}
                      className="focus:outline-none transition-transform hover:scale-110 p-0.5"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          star <= userRating ? "fill-amber-400 text-amber-400" : "text-slate-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-slate-700 block">Nhận xét của bạn:</label>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Hãy chia sẻ trải nghiệm tập luyện thực tế của bạn tại đây để giúp phòng gym cải thiện chất lượng tốt hơn nhé..."
                  rows={4}
                  className="w-full rounded-xl border border-slate-200 p-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 bg-white"
                />
              </div>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={submittingReview}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-full px-6 py-2 transition-all shadow-md active:scale-95"
                >
                  {submittingReview ? "Đang gửi..." : "Gửi đánh giá"}
                </Button>
              </div>
            </form>
          </Card>
        ) : (
          canReviewReason && (
            <div className="mb-12 max-w-xl mx-auto p-4 rounded-xl bg-slate-50 border border-slate-150 text-center text-xs text-slate-500 leading-relaxed font-medium">
              💡 {canReviewReason}
            </div>
          )
        )}

        {/* Hiển thị danh sách đánh giá */}
        {reviewsLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 text-slate-400 italic bg-slate-50 rounded-2xl max-w-3xl mx-auto">
            Chưa có đánh giá nào cho chi nhánh này. Hãy là người đầu tiên trải nghiệm và đánh giá nhé!
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-3 max-w-7xl mx-auto">
            {reviews.map((rev) => (
              <Card
                key={rev.id}
                className="p-6 rounded-2xl border border-slate-100 bg-white shadow-sm flex flex-col justify-between animate-fadeIn"
              >
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    {rev.customer?.user?.avatar_url ? (
                      <img
                        src={rev.customer.user.avatar_url}
                        alt={rev.customer.user.full_name}
                        className="h-10 w-10 rounded-full object-cover border border-slate-100"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-emerald-700/10 text-emerald-800 flex items-center justify-center font-bold text-sm">
                        {(rev.customer?.user?.full_name || "H").charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <h4 className="font-bold text-slate-800 text-sm">
                        {rev.customer?.user?.full_name || "Hội viên ẩn danh"}
                      </h4>
                      <span className="text-[10px] text-slate-400">
                        {new Date(rev.created_at).toLocaleDateString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-400">
                    {Array.from({ length: rev.rating }).map((_, i) => (
                      <Star key={i} className="h-3.5 w-3.5 fill-current" />
                    ))}
                    {Array.from({ length: 5 - rev.rating }).map((_, i) => (
                      <Star key={i + 5} className="h-3.5 w-3.5 text-slate-200" />
                    ))}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed italic">
                    "{rev.comment || "Không có nội dung nhận xét."}"
                  </p>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* SECTION 5: DYNAMIC MEMBERSHIP PACKAGES */}
      <BranchMemberships
        branchId={branch.id}
        branchName={branch.branch_name}
        branchAddress={branch.address}
        branchProvince={branch.province}
      />

      <Footer />

      <TrainerCompareModal
        open={compareOpen}
        onOpenChange={setCompareOpen}
        trainers={selectedTrainers}
        branch={branch}
        onRemoveTrainer={(trainerId) =>
          setSelectedTrainerIds((prev) => prev.filter((id) => id !== trainerId))
        }
      />

      {/* Lightbox Dialog Modal for full photo views */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl p-1 bg-black/95 border-none rounded-2xl overflow-hidden flex items-center justify-center">
          <DialogTitle className="sr-only">Thư viện ảnh chi tiết</DialogTitle>
          <DialogDescription className="sr-only">Xem ảnh kích thước lớn của phòng tập</DialogDescription>
          <div className="relative w-full h-full flex items-center justify-center min-h-[50vh] max-h-[85vh]">
            <img
              src={heroImages[lightboxImageIndex]}
              alt={`Gym Gallery Preview ${lightboxImageIndex + 1}`}
              className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl transition-all duration-300"
            />

            {/* Prev/Next buttons */}
            {heroImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxImageIndex((prev) =>
                      prev === 0 ? heroImages.length - 1 : prev - 1,
                    )
                  }
                  className="absolute left-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setLightboxImageIndex((prev) =>
                      prev === heroImages.length - 1 ? 0 : prev + 1,
                    )
                  }
                  className="absolute right-4 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all hover:scale-105 active:scale-95"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>

                {/* Image Counter */}
                <div className="absolute bottom-4 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold text-slate-350">
                  {lightboxImageIndex + 1} / {heroImages.length}
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
