import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Check, ChevronLeft, ChevronRight, Loader2, MapPin, Search, SlidersHorizontal } from "lucide-react";
import { Link } from "react-router-dom";
import {
  membershipPackagesApi,
  type MembershipPackage,
} from "@/api/membershipPackages";

const splitBenefits = (benefits?: string) => {
  if (!benefits?.trim()) return [];

  return benefits
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);
};

export function Plans() {
  const [packages, setPackages] = useState<MembershipPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [durationFilter, setDurationFilter] = useState("all");
  const [branchFilter, setBranchFilter] = useState("all");
  const dragStartX = useRef<number | null>(null);
  const dragDeltaX = useRef(0);

  useEffect(() => {
    let mounted = true;

    const fetchPackages = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await membershipPackagesApi.getAll();
        if (!mounted) return;

        setPackages(
          (response.data || []).filter((pkg) => pkg.status === "active"),
        );
      } catch (err) {
        console.error("Failed to load membership packages", err);
        if (mounted) {
          setError("Không thể tải bảng giá. Vui lòng thử lại sau.");
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPackages();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredPackages = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase();

    return packages.filter((pkg) => {
      const matchesSearch =
        !keyword ||
        pkg.name.toLowerCase().includes(keyword) ||
        pkg.description?.toLowerCase().includes(keyword) ||
        pkg.benefits?.toLowerCase().includes(keyword);

      const matchesDuration =
        durationFilter === "all" || String(pkg.duration_months) === durationFilter;

      const matchesBranch =
        branchFilter === "all" ||
        (branchFilter === "allBranches" && pkg.apply_to_all) ||
        (branchFilter === "specificBranches" && !pkg.apply_to_all);

      return matchesSearch && matchesDuration && matchesBranch;
    });
  }, [branchFilter, durationFilter, packages, searchTerm]);

  const durationOptions = useMemo(
    () => Array.from(new Set(packages.map((pkg) => pkg.duration_months))).sort((a, b) => a - b),
    [packages],
  );

  const maxIndex = Math.max(filteredPackages.length - 3, 0);
  const canSlide = filteredPackages.length > 3;

  const goPrev = () => {
    setCurrentIndex((index) => (index === 0 ? maxIndex : index - 1));
  };

  const goNext = () => {
    setCurrentIndex((index) => (index >= maxIndex ? 0 : index + 1));
  };

  const startDrag = (clientX: number) => {
    if (!canSlide) return;
    dragStartX.current = clientX;
    dragDeltaX.current = 0;
  };

  const moveDrag = (clientX: number) => {
    if (dragStartX.current === null) return;
    dragDeltaX.current = clientX - dragStartX.current;
  };

  const endDrag = () => {
    if (dragStartX.current === null) return;

    const swipeThreshold = 50;
    if (dragDeltaX.current > swipeThreshold) {
      goPrev();
    } else if (dragDeltaX.current < -swipeThreshold) {
      goNext();
    }

    dragStartX.current = null;
    dragDeltaX.current = 0;
  };

  return (
    <section id="pricing" className="relative py-24 bg-muted/30">
      <div className="absolute inset-0 opacity-5" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 0)', backgroundSize: '20px 20px' }} 
           aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Gói hội viên</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl text-foreground">Chọn nhịp độ của bạn</h2>
          <p className="mt-4 text-lg text-muted-foreground">Bảng giá được lấy trực tiếp từ hệ thống gói thành viên hiện tại.</p>
        </motion.div>

        {loading && (
          <div className="mt-14 flex items-center justify-center gap-3 rounded-3xl border border-border bg-card p-10 text-muted-foreground shadow-md">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
            Đang tải bảng giá...
          </div>
        )}

        {!loading && error && (
          <div className="mt-14 rounded-3xl border border-destructive/20 bg-destructive/5 p-10 text-center text-destructive">
            {error}
          </div>
        )}

        {!loading && !error && packages.length === 0 && (
          <div className="mt-14 rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground shadow-md">
            Hiện chưa có gói thành viên nào đang hoạt động.
          </div>
        )}

        {!loading && !error && packages.length > 0 && (
          <div className="mt-14">
            <div className="mb-8 grid gap-3 rounded-3xl border border-border bg-card/80 p-4 shadow-sm backdrop-blur md:grid-cols-[minmax(0,1fr)_220px_220px]">
              <label className="relative block">
                <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setCurrentIndex(0);
                  }}
                  placeholder="Tìm kiếm gói thành viên..."
                  className="h-12 w-full rounded-2xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary"
                />
              </label>
              <label className="relative block">
                <SlidersHorizontal className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={durationFilter}
                  onChange={(event) => {
                    setDurationFilter(event.target.value);
                    setCurrentIndex(0);
                  }}
                  className="h-12 w-full appearance-none rounded-2xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="all">Tất cả thời hạn</option>
                  {durationOptions.map((months) => (
                    <option key={months} value={months}>
                      {months} tháng
                    </option>
                  ))}
                </select>
              </label>
              <label className="relative block">
                <MapPin className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <select
                  value={branchFilter}
                  onChange={(event) => {
                    setBranchFilter(event.target.value);
                    setCurrentIndex(0);
                  }}
                  className="h-12 w-full appearance-none rounded-2xl border border-border bg-background pl-11 pr-4 text-sm outline-none transition-colors focus:border-primary"
                >
                  <option value="all">Tất cả chi nhánh</option>
                  <option value="allBranches">Áp dụng toàn hệ thống</option>
                  <option value="specificBranches">Theo chi nhánh cụ thể</option>
                </select>
              </label>
            </div>

            {filteredPackages.length === 0 ? (
              <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground shadow-md">
                Không tìm thấy gói thành viên phù hợp.
              </div>
            ) : (
              <>
                <div
                  className="relative cursor-grab overflow-hidden active:cursor-grabbing"
                  onMouseDown={(event) => startDrag(event.clientX)}
                  onMouseMove={(event) => moveDrag(event.clientX)}
                  onMouseUp={endDrag}
                  onMouseLeave={endDrag}
                  onTouchStart={(event) => startDrag(event.touches[0].clientX)}
                  onTouchMove={(event) => moveDrag(event.touches[0].clientX)}
                  onTouchEnd={endDrag}
                >
                  <div
                    className="flex transition-transform duration-500 ease-out"
                    style={{ transform: `translateX(-${currentIndex * (100 / 3)}%)` }}
                  >
                    {filteredPackages.map((p, i) => {
                      const features = splitBenefits(p.benefits);
                      const formattedPrice = Number(p.price).toLocaleString("vi-VN");

                      return (
                        <motion.div
                          key={p.id}
                          initial={{ opacity: 0, y: 18 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-80px" }}
                          transition={{ duration: 0.52, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                          className="relative mx-3 flex h-full min-h-[520px] w-full flex-[0_0_calc(100%-1.5rem)] flex-col rounded-3xl border border-border bg-card p-8 shadow-md transition-transform hover:-translate-y-1 md:flex-[0_0_calc(50%-1.5rem)] xl:flex-[0_0_calc(33.333%-1.5rem)]"
                        >
                          <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
                          <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                            {p.description || "Gói thành viên OmniGym linh hoạt cho nhu cầu tập luyện của bạn."}
                          </p>
                          <div className="mt-6 flex items-baseline gap-1">
                            <span className="text-5xl font-extrabold tracking-tight text-foreground">{formattedPrice}đ</span>
                            <span className="text-muted-foreground">/{p.duration_months} tháng</span>
                          </div>
                          <div className="mt-4 flex items-center gap-2 text-xs font-medium text-muted-foreground">
                            <MapPin className="h-4 w-4 text-primary" />
                            {p.apply_to_all
                              ? "Áp dụng tất cả chi nhánh"
                              : `${p.branches?.length || 0} chi nhánh áp dụng`}
                          </div>
                          <ul className="mt-6 flex-1 space-y-3">
                            {(features.length > 0 ? features : ["Truy cập khu vực tập luyện", "Hỗ trợ tại chi nhánh", "Theo dõi gói thành viên"]).map((f) => (
                              <li key={f} className="flex items-center gap-3 text-sm text-foreground/80">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <Check className="h-3 w-3" />
                                </span>
                                {f}
                              </li>
                            ))}
                          </ul>
                          <Link
                            to={`/checkout/${p.id}`}
                            className="mt-auto inline-flex w-full items-center justify-center rounded-full border border-border bg-background px-5 py-3 text-sm font-semibold text-foreground transition-transform hover:scale-[1.02] hover:bg-muted"
                          >
                            Đăng ký {p.name}
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>

                {canSlide && (
                  <div className="mt-8 flex items-center justify-center gap-4">
                    <button
                      type="button"
                      onClick={goPrev}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-muted"
                      aria-label="Xem gói thành viên trước"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <div className="flex items-center gap-2">
                      {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => setCurrentIndex(index)}
                          className={`h-2.5 rounded-full transition-all ${
                            index === currentIndex
                              ? "w-8 bg-primary"
                              : "w-2.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
                          }`}
                          aria-label={`Chuyển tới nhóm gói ${index + 1}`}
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={goNext}
                      className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-colors hover:bg-muted"
                      aria-label="Xem gói thành viên tiếp theo"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
