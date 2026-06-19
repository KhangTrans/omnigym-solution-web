import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  ExternalLink,
  MapPin,
  Star,
  Tag,
  Wallet,
  X,
  CalendarCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

/**
 * Shape của 1 trainer dùng để so sánh.
 * Lấy đúng các field đã có trong response của API branch detail
 * (xem `branchesApi.getById` → `branch.service.ts:getBranchByIdOrSlug`).
 *
 * Cố tình để các field optional/nullable vì:
 * - rating/years_experience có thể là `0` (default) → coi như "Chưa có thông tin".
 * - hourly_rate có thể null trong DB → "Liên hệ".
 * - specialization có thể null nếu trainer chưa cập nhật.
 */
export interface CompareTrainer {
  id: number;
  specialization?: string | null;
  rating?: number | string | null;
  review_count?: number | null;
  hourly_rate?: number | string | null;
  years_experience?: number | null;
  level?: string | null;
  avatar_url?: string | null;
  user?: {
    full_name?: string | null;
    avatar_url?: string | null;
  } | null;
}

export interface CompareBranchInfo {
  branch_name?: string | null;
  province?: string | null;
  district?: string | null;
}

interface TrainerCompareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trainers: CompareTrainer[];
  branch: CompareBranchInfo | null;
  onRemoveTrainer?: (trainerId: number) => void;
}

const buildAvatarFallback = (name: string | null | undefined): string => {
  const safeName = (name || "Trainer").trim() || "Trainer";
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=4F8A74&color=fff&size=256`;
};

const formatPriceDisplay = (
  raw: number | string | null | undefined,
): string => {
  if (raw === null || raw === undefined || raw === "") return "Liên hệ";
  const num = Number(raw);
  if (!Number.isFinite(num) || num <= 0) return "Liên hệ";
  try {
    return `${new Intl.NumberFormat("vi-VN").format(num)}đ / buổi`;
  } catch {
    return `${num}đ / buổi`;
  }
};

const toFiniteNumber = (
  raw: number | string | null | undefined,
): number | null => {
  if (raw === null || raw === undefined || raw === "") return null;
  const num = Number(raw);
  return Number.isFinite(num) ? num : null;
};

/**
 * Style highlight cho cell có giá trị "tốt nhất" trên 1 dòng số.
 * Dùng background xanh nhạt + viền + badge "Tốt nhất" để dễ nhận diện.
 */
const HIGHLIGHT_CELL_CLASS =
  "bg-emerald-50 ring-1 ring-emerald-200 ring-inset";

const BestBadge = () => (
  <Badge className="ml-2 bg-emerald-600 hover:bg-emerald-600 text-white border-none rounded-full text-[10px] font-semibold px-2 py-0.5 shadow-sm">
    Tốt nhất
  </Badge>
);

const EmptyValue = () => (
  <span className="text-slate-400 italic text-xs">Chưa có thông tin</span>
);

export function TrainerCompareModal({
  open,
  onOpenChange,
  trainers,
  branch,
  onRemoveTrainer,
}: TrainerCompareModalProps) {
  // Tính giá trị "tốt nhất" cho từng tiêu chí số.
  // - rating: cao nhất là tốt nhất (chỉ tính rating > 0).
  // - hourly_rate: thấp nhất là tốt nhất (chỉ tính > 0; null/0 = Liên hệ → bỏ qua).
  // - years_experience: cao nhất là tốt nhất (chỉ tính > 0).
  const ratingValues = trainers.map((t) => toFiniteNumber(t.rating));
  const priceValues = trainers.map((t) => {
    const num = toFiniteNumber(t.hourly_rate);
    return num !== null && num > 0 ? num : null;
  });
  const expValues = trainers.map((t) => {
    const num = toFiniteNumber(t.years_experience);
    return num !== null && num > 0 ? num : null;
  });

  const validRatings = ratingValues.filter(
    (v): v is number => v !== null && v > 0,
  );
  const validPrices = priceValues.filter((v): v is number => v !== null);
  const validExps = expValues.filter((v): v is number => v !== null);

  // Chỉ highlight khi có ÍT NHẤT 2 giá trị hợp lệ và không phải tất cả bằng nhau.
  const bestRating =
    validRatings.length >= 2 && new Set(validRatings).size > 1
      ? Math.max(...validRatings)
      : null;
  const bestPrice =
    validPrices.length >= 2 && new Set(validPrices).size > 1
      ? Math.min(...validPrices)
      : null;
  const bestExp =
    validExps.length >= 2 && new Set(validExps).size > 1
      ? Math.max(...validExps)
      : null;

  // Khu vực hoạt động: lấy từ branch (cùng chi nhánh thì giống nhau).
  // Đây là field text, không có khái niệm "tốt hơn" → không highlight.
  const branchArea = (() => {
    const parts: string[] = [];
    if (branch?.district) parts.push(branch.district);
    if (branch?.province) parts.push(branch.province);
    return parts.join(", ");
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-5xl w-[95vw] max-h-[92vh] p-0 overflow-hidden rounded-2xl border-slate-200 shadow-xl"
      >
        {/* Header */}
        <div className="px-5 sm:px-6 py-4 sm:py-5 border-b border-slate-100 bg-white">
          <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            So sánh Huấn luyện viên
          </DialogTitle>
          <DialogDescription className="mt-1 text-xs sm:text-sm text-slate-500">
            {branch?.branch_name
              ? `Đang so sánh ${trainers.length} HLV tại ${branch.branch_name}.`
              : `Đang so sánh ${trainers.length} HLV.`}{" "}
            Giá trị tốt nhất ở mỗi tiêu chí số sẽ được làm nổi bật.
          </DialogDescription>
        </div>

        {/* Body — bảng so sánh, scroll ngang trên mobile */}
        <div className="overflow-auto max-h-[calc(92vh-130px)]">
          <div className="min-w-[640px] sm:min-w-0">
            <table className="w-full border-collapse text-sm">
              {/* Hàng tiêu đề: ảnh + tên + nút "Xem hồ sơ" */}
              <thead>
                <tr className="bg-slate-50/60">
                  <th className="sticky left-0 z-10 bg-slate-50/60 w-[150px] sm:w-[180px] text-left px-4 py-4 align-bottom border-b border-slate-100 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Tiêu chí
                  </th>
                  {trainers.map((trainer) => {
                    const fullName =
                      trainer.user?.full_name?.trim() || "Huấn luyện viên";
                    const avatar =
                      trainer.user?.avatar_url ||
                      trainer.avatar_url ||
                      buildAvatarFallback(fullName);
                    return (
                      <th
                        key={trainer.id}
                        className="px-4 py-4 align-bottom border-b border-slate-100 min-w-[180px]"
                      >
                        <div className="relative flex flex-col items-center text-center gap-2">
                          {onRemoveTrainer && (
                            <button
                              type="button"
                              onClick={() => onRemoveTrainer(trainer.id)}
                              className="absolute -top-1 -right-1 h-7 w-7 grid place-items-center rounded-full bg-white border border-slate-200 text-slate-400 hover:text-rose-500 hover:border-rose-200 transition-colors shadow-sm"
                              aria-label={`Bỏ chọn ${fullName}`}
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <img
                            src={avatar}
                            alt={fullName}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src =
                                buildAvatarFallback(fullName);
                            }}
                            className="h-20 w-20 rounded-full object-cover border-2 border-white shadow-md ring-1 ring-slate-100"
                          />
                          <div>
                            <h3
                              className="font-bold text-slate-900 text-sm leading-tight line-clamp-1"
                              title={fullName}
                            >
                              {fullName}
                            </h3>
                            {trainer.level && (
                              <p className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 mt-0.5">
                                {trainer.level}
                              </p>
                            )}
                          </div>
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 px-3 text-xs border-slate-200 hover:bg-slate-50 text-slate-700 rounded-full"
                          >
                            <Link
                              to={`/trainers/${trainer.id}`}
                              onClick={() => onOpenChange(false)}
                            >
                              Xem hồ sơ
                              <ExternalLink className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="text-slate-800">
                {/* Giá / buổi */}
                <CompareRow
                  label="Giá / buổi"
                  icon={<Wallet className="h-3.5 w-3.5" />}
                >
                  {trainers.map((trainer, idx) => {
                    const num = priceValues[idx];
                    const isBest = bestPrice !== null && num === bestPrice;
                    return (
                      <CompareCell key={trainer.id} highlighted={isBest}>
                        <span className="font-semibold">
                          {formatPriceDisplay(trainer.hourly_rate)}
                        </span>
                        {isBest && <BestBadge />}
                      </CompareCell>
                    );
                  })}
                </CompareRow>

                {/* Chuyên môn */}
                <CompareRow
                  label="Chuyên môn"
                  icon={<Tag className="h-3.5 w-3.5" />}
                >
                  {trainers.map((trainer) => {
                    const spec = trainer.specialization?.trim();
                    return (
                      <CompareCell key={trainer.id}>
                        {spec ? (
                          <div className="flex flex-wrap gap-1 justify-center">
                            {spec
                              .split(/[,/&]/)
                              .map((s) => s.trim())
                              .filter(Boolean)
                              .map((s) => (
                                <span
                                  key={s}
                                  className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-800 border border-emerald-100"
                                >
                                  {s}
                                </span>
                              ))}
                          </div>
                        ) : (
                          <EmptyValue />
                        )}
                      </CompareCell>
                    );
                  })}
                </CompareRow>

                {/* Số buổi đã dạy — hiện tại chưa có data trong DB */}
                {/* TODO: cập nhật khi có hệ thống booking/training session */}
                <CompareRow
                  label="Số buổi đã dạy"
                  icon={<CalendarCheck className="h-3.5 w-3.5" />}
                >
                  {trainers.map((trainer) => (
                    <CompareCell key={trainer.id}>
                      <EmptyValue />
                    </CompareCell>
                  ))}
                </CompareRow>

                {/* Rating */}
                <CompareRow
                  label="Đánh giá"
                  icon={<Star className="h-3.5 w-3.5" />}
                >
                  {trainers.map((trainer, idx) => {
                    const num = ratingValues[idx];
                    const reviewCount = Number(trainer.review_count ?? 0);
                    const isBest =
                      bestRating !== null &&
                      num !== null &&
                      num === bestRating;
                    return (
                      <CompareCell key={trainer.id} highlighted={isBest}>
                        {num !== null && num > 0 ? (
                          <div className="inline-flex items-center gap-1.5">
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                            <span className="font-semibold">
                              {num.toFixed(1)}
                            </span>
                            {reviewCount > 0 && (
                              <span className="text-xs text-slate-500">
                                ({reviewCount})
                              </span>
                            )}
                            {isBest && <BestBadge />}
                          </div>
                        ) : (
                          <EmptyValue />
                        )}
                      </CompareCell>
                    );
                  })}
                </CompareRow>

                {/* Kinh nghiệm */}
                <CompareRow
                  label="Kinh nghiệm"
                  icon={<Award className="h-3.5 w-3.5" />}
                >
                  {trainers.map((trainer, idx) => {
                    const num = expValues[idx];
                    const isBest =
                      bestExp !== null && num !== null && num === bestExp;
                    return (
                      <CompareCell key={trainer.id} highlighted={isBest}>
                        {num !== null && num > 0 ? (
                          <div className="inline-flex items-center">
                            <span className="font-semibold">
                              {num} năm
                            </span>
                            {isBest && <BestBadge />}
                          </div>
                        ) : (
                          <EmptyValue />
                        )}
                      </CompareCell>
                    );
                  })}
                </CompareRow>

                {/* Khu vực hoạt động */}
                <CompareRow
                  label="Khu vực hoạt động"
                  icon={<MapPin className="h-3.5 w-3.5" />}
                >
                  {trainers.map((trainer) => (
                    <CompareCell key={trainer.id}>
                      {branchArea ? (
                        <span className="text-sm text-slate-700">
                          {branchArea}
                        </span>
                      ) : (
                        <EmptyValue />
                      )}
                    </CompareCell>
                  ))}
                </CompareRow>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 sm:py-4 border-t border-slate-100 bg-white flex items-center justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-full px-5 border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Đóng
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Helper sub-components để giữ JSX gọn ───────────────────────────

interface CompareRowProps {
  label: string;
  icon?: ReactNode;
  children: ReactNode;
}

function CompareRow({ label, icon, children }: CompareRowProps) {
  return (
    <tr className="border-b border-slate-100 last:border-b-0 hover:bg-slate-50/40 transition-colors">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white text-left px-4 py-4 align-middle border-r border-slate-100"
      >
        <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-700">
          {icon ? (
            <span className="text-emerald-600 shrink-0">{icon}</span>
          ) : null}
          <span>{label}</span>
        </span>
      </th>
      {children}
    </tr>
  );
}

interface CompareCellProps {
  children: ReactNode;
  highlighted?: boolean;
}

function CompareCell({ children, highlighted = false }: CompareCellProps) {
  return (
    <td
      className={`px-4 py-4 align-middle text-center ${
        highlighted ? HIGHLIGHT_CELL_CLASS : ""
      }`}
    >
      {children}
    </td>
  );
}
