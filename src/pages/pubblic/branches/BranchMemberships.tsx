import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Check, MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  membershipPackagesApi,
  MembershipPackage,
} from "@/api/membershipPackages";
import { toast } from "sonner";

interface BranchMembershipsProps {
  branchId: number;
  branchName: string;
  branchAddress: string;
  branchProvince: string;
}

export default function BranchMemberships({
  branchId,
  branchName,
  branchAddress,
  branchProvince,
}: BranchMembershipsProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // Determine visible cards count based on viewport (default 3)
  const getVisibleCount = () => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth < 640) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  };

  const [visibleCount, setVisibleCount] = useState(getVisibleCount);

  useEffect(() => {
    const handleResize = () => setVisibleCount(getVisibleCount());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true);
        const response = await membershipPackagesApi.getAll();
        const activePackages = (response.data || []).filter((pkg) => {
          if (pkg.status !== "active") return false;
          if (pkg.apply_to_all) return true;
          if (pkg.branch_ids && pkg.branch_ids.includes(branchId)) return true;
          if (pkg.branches && pkg.branches.some((b) => b.id === branchId))
            return true;
          return false;
        });
        activePackages.sort(
          (a, b) => parseFloat(a.price) - parseFloat(b.price),
        );
        setPackages(activePackages);
      } catch (error) {
        console.error("Failed to load membership packages:", error);
        toast.error("Không thể tải danh sách gói hội viên.");
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, [branchId]);

  const maxIndex = Math.max(0, packages.length - visibleCount);

  const goTo = (idx: number) => {
    if (isAnimating) return;
    setIsAnimating(true);
    setActiveIndex(Math.max(0, Math.min(idx, maxIndex)));
    setTimeout(() => setIsAnimating(false), 400);
  };

  const goPrev = () => goTo(activeIndex - 1);
  const goNext = () => goTo(activeIndex + 1);

  // Handle membership registration — redirect to login if not authenticated
  const handleRegister = (pkg: MembershipPackage) => {
    const user = localStorage.getItem("user");
    if (!user) {
      sessionStorage.setItem("postLoginRedirect", location.pathname + location.search);
      navigate("/login");
    } else {
      navigate(`/checkout/${pkg.id}`);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev();
      if (e.key === "ArrowRight") goNext();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [activeIndex, packages.length, visibleCount]);

  // Loading skeleton
  if (loading) {
    return (
      <section className="bg-slate-50/50 py-20 border-t border-slate-100">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
              MEMBERSHIPS
            </span>
            <div className="h-8 w-64 bg-slate-200 animate-pulse mx-auto rounded-md" />
          </div>
          <div className="flex gap-6 overflow-hidden">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex-none w-full sm:w-1/2 lg:w-1/3">
                <Card className="p-8 space-y-6 rounded-3xl border border-slate-100 bg-white animate-pulse">
                  <div className="h-6 w-1/2 bg-slate-100 rounded" />
                  <div className="h-10 w-3/4 bg-slate-100 rounded" />
                  <div className="space-y-2">
                    <div className="h-4 w-full bg-slate-50 rounded" />
                    <div className="h-4 w-5/6 bg-slate-50 rounded" />
                  </div>
                  <div className="h-12 w-full bg-slate-100 rounded-xl" />
                </Card>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-slate-50/50 py-20 border-t border-slate-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
        {/* Header */}
        <span className="text-xs font-extrabold uppercase tracking-widest text-emerald-600">
          MEMBERSHIPS
        </span>
        <h2 className="mt-3 text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
          Gia nhập OmniGym
        </h2>
        <p className="mt-3 text-slate-500 max-w-xl mx-auto text-sm">
          Chọn gói tập phù hợp với mục tiêu của bạn. Hủy gói bất cứ lúc nào,
          không có phụ phí ẩn.
        </p>

        {/* Branch Selector */}
        <div className="mt-10 max-w-xl mx-auto bg-white border border-slate-100 p-5 rounded-2xl shadow-sm text-left space-y-3">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Chi nhánh tập luyện đang xem
          </span>
          <div className="border border-slate-200 bg-slate-50 rounded-xl p-3 text-slate-800 font-semibold text-sm flex items-center justify-between">
            <span>
              {branchName} — {branchProvince}
            </span>
            <Badge className="bg-emerald-50 text-emerald-700 border-none text-[10px] font-medium px-2 py-0.5">
              Đang xem
            </Badge>
          </div>
          <p className="text-xs text-slate-400 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
            <span>{branchAddress}</span>
          </p>
        </div>

        {packages.length === 0 ? (
          <div className="mt-12 text-center py-12 text-slate-400 italic bg-white rounded-3xl border border-slate-100 max-w-xl mx-auto p-8 shadow-sm">
            Hiện tại chi nhánh này chưa áp dụng gói hội viên nào. Vui lòng quay
            lại sau!
          </div>
        ) : (
          <>
            {/* Carousel wrapper */}
            <div className="mt-12 relative">
              {/* Prev button */}
              {visibleCount > 1 && activeIndex > 0 && (
                <button
                  onClick={goPrev}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 p-2.5 rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 hover:shadow-lg transition-all active:scale-95 text-slate-700"
                  aria-label="Gói trước"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
              )}

              {/* Track */}
              <div className="overflow-hidden px-1 py-4">
                <div
                  ref={trackRef}
                  className="flex gap-6 transition-transform duration-400 ease-in-out"
                  style={{
                    transform: `translateX(calc(-${activeIndex} * (100% / ${visibleCount} + ${24 / visibleCount}px)))`,
                  }}
                >
                  {packages.map((pkg, pkgIdx) => {
                    const centerIdx =
                      activeIndex + Math.floor(visibleCount / 2);
                    const isCenter = pkgIdx === centerIdx;
                    const formattedPrice = parseFloat(pkg.price).toLocaleString(
                      "vi-VN",
                    );
                    const benefitsList = (pkg.benefits || "")
                      .split("\n")
                      .map((b) => b.trim())
                      .filter(Boolean);

                    return (
                      <div
                        key={pkg.id}
                        className="flex-none transition-all duration-400"
                        style={{
                          width: `calc(${100 / visibleCount}% - ${((visibleCount - 1) * 24) / visibleCount}px)`,
                          transform: isCenter
                            ? "translateY(-12px) scale(1.03)"
                            : "translateY(0px) scale(1)",
                          zIndex: isCenter ? 10 : 1,
                        }}
                      >
                        <Card
                          className={`relative flex flex-col justify-between p-8 rounded-3xl border bg-white h-full transition-all duration-300 ${
                            isCenter
                              ? "border-emerald-500 shadow-2xl ring-2 ring-emerald-500/25"
                              : "border-slate-100 shadow-sm opacity-80 hover:opacity-100"
                          }`}
                        >
                          <div className="space-y-6 text-left">
                            <div className="space-y-1">
                              <h3 className="text-xl font-bold text-slate-800">
                                {pkg.name}
                              </h3>
                              <p className="text-xs text-slate-400">
                                {pkg.duration_months} tháng ·{" "}
                                {pkg.description ||
                                  "Đăng ký tập luyện không giới hạn"}
                              </p>
                            </div>

                            <div className="flex items-baseline gap-1">
                              <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                                {formattedPrice}đ
                              </span>
                              <span className="text-xs text-slate-400 font-medium">
                                /gói
                              </span>
                            </div>

                            {benefitsList.length > 0 && (
                              <ul className="space-y-3 pt-3 border-t border-slate-100">
                                {benefitsList.map((feat, idx) => (
                                  <li
                                    key={idx}
                                    className="flex items-start gap-2.5 text-xs text-slate-600"
                                  >
                                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 shrink-0 mt-0.5">
                                      <Check className="h-2.5 w-2.5" />
                                    </span>
                                    <span>{feat}</span>
                                  </li>
                                ))}
                              </ul>
                            )}
                          </div>

                          <div className="pt-8">
                            <Button
                              onClick={() => handleRegister(pkg)}
                              variant={isCenter ? "emerald" : "emerald-outline"}
                              className="w-full font-bold rounded-full py-5 transition-all duration-400 hover:scale-[1.02]"
                            >
                              Đăng ký {pkg.name}
                            </Button>
                          </div>
                        </Card>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Next button */}
              {visibleCount > 1 && activeIndex < maxIndex && (
                <button
                  onClick={goNext}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 p-2.5 rounded-full bg-white border border-slate-200 shadow-md hover:bg-slate-50 hover:shadow-lg transition-all active:scale-95 text-slate-700"
                  aria-label="Gói tiếp theo"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Dot indicators */}
            {packages.length > visibleCount && (
              <div className="flex justify-center items-center gap-2 mt-6">
                {Array.from({ length: maxIndex + 1 }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === activeIndex
                        ? "bg-emerald-600 w-6 h-2"
                        : "bg-slate-300 hover:bg-slate-400 w-2 h-2"
                    }`}
                    aria-label={`Đến trang ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </>
        )}

        <p className="mt-8 text-xs text-slate-400">
          Tất cả các gói bao gồm 7 ngày tập thử miễn phí. Phí kích hoạt 0đ.
        </p>
      </div>
    </section>
  );
}
