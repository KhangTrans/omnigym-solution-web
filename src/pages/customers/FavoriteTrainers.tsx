import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Heart, MapPin, Star, Award, Trash2, Loader2 } from "lucide-react";
import {
  favoriteTrainerAPI,
  type FavoriteTrainerItem,
} from "../../api/favoriteTrainers";
import { notify } from "../../utils/notify";
import { cn } from "../../utils/cn";

const formatPrice = (value: number | null | undefined): string => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) {
    return "Liên hệ";
  }
  return `${Number(value).toLocaleString("vi-VN")}đ`;
};

const buildAvatarFallback = (name: string | null | undefined): string => {
  const safeName = (name || "Trainer").slice(0, 32);
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(
    safeName,
  )}&background=4F8A74&color=fff&size=400`;
};

export default function FavoriteTrainers() {
  const [items, setItems] = useState<FavoriteTrainerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [removingId, setRemovingId] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        setLoading(true);
        setErrorMessage(null);
        const response = await favoriteTrainerAPI.getMyFavorites();
        if (cancelled) return;
        setItems(response.data.data || []);
      } catch (error: unknown) {
        if (cancelled) return;
        const err = error as {
          response?: { data?: { message?: string } };
        };
        setErrorMessage(
          err?.response?.data?.message ||
            "Không thể tải danh sách trainer yêu thích.",
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleRemove(trainerId: number) {
    if (removingId !== null) return;
    setRemovingId(trainerId);
    // Optimistic remove
    const prev = items;
    setItems((current) =>
      current.filter((item) => item.trainer.id !== trainerId),
    );
    try {
      await favoriteTrainerAPI.remove(trainerId);
      notify.success("Đã bỏ khỏi danh sách yêu thích.");
    } catch (error: unknown) {
      // Rollback nếu lỗi
      setItems(prev);
      const err = error as {
        response?: { data?: { message?: string } };
      };
      notify.error(
        err?.response?.data?.message ||
          "Không thể bỏ trainer khỏi yêu thích. Vui lòng thử lại.",
      );
    } finally {
      setRemovingId(null);
    }
  }

  return (
    <div className="p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-rose-50 text-rose-500">
          <Heart className="h-5 w-5 fill-rose-500" />
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Huấn luyện viên yêu thích
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Danh sách HLV bạn đã lưu để xem lại nhanh và đặt lịch sau này.
          </p>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <LoadingState />
        ) : errorMessage ? (
          <ErrorState
            message={errorMessage}
            onRetry={() => window.location.reload()}
          />
        ) : items.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <FavoriteCard
                key={item.favorite_id}
                item={item}
                isRemoving={removingId === item.trainer.id}
                onRemove={() => handleRemove(item.trainer.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function FavoriteCard({
  item,
  isRemoving,
  onRemove,
}: {
  item: FavoriteTrainerItem;
  isRemoving: boolean;
  onRemove: () => void;
}) {
  const trainer = item.trainer;
  const trainerName = trainer.full_name?.trim() || "Huấn luyện viên";
  const avatar = trainer.avatar_url || buildAvatarFallback(trainerName);
  const ratingNum = Number(trainer.rating ?? 0);
  const ratingDisplay = ratingNum > 0 ? ratingNum.toFixed(1) : "Chưa có";
  const titleLine =
    trainer.specialization ||
    (trainer.level ? `${trainer.level} Trainer` : "Personal Trainer");

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <Link
        to={`/trainers/${trainer.id}`}
        className="flex flex-col"
        aria-label={`Xem chi tiết ${trainerName}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
          <img
            src={avatar}
            alt={trainerName}
            loading="lazy"
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                buildAvatarFallback(trainerName);
            }}
          />
          {trainer.level ? (
            <span className="absolute left-3 top-3 inline-flex items-center rounded-full bg-white/90 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-700 backdrop-blur">
              {trainer.level}
            </span>
          ) : null}
        </div>

        <div className="flex flex-1 flex-col p-4">
          <h3 className="font-bold leading-tight text-slate-900 line-clamp-1">
            {trainerName}
          </h3>
          <p className="mt-0.5 text-xs text-slate-500 line-clamp-1 capitalize">
            {titleLine}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500">
            <span className="inline-flex items-center gap-1">
              <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-slate-700">
                {ratingDisplay}
              </span>
              {trainer.review_count > 0 ? (
                <span>({trainer.review_count})</span>
              ) : null}
            </span>
            {trainer.years_experience > 0 ? (
              <span className="inline-flex items-center gap-1">
                <Award className="h-3.5 w-3.5 text-emerald-600" />
                {trainer.years_experience} năm KN
              </span>
            ) : null}
          </div>

          {trainer.branch ? (
            <div className="mt-2 flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3.5 w-3.5 text-slate-400" />
              <span className="truncate">{trainer.branch.branch_name}</span>
            </div>
          ) : null}

          <div className="mt-3 border-t border-slate-100 pt-3 text-sm">
            <span className="font-semibold text-slate-900">
              {formatPrice(trainer.hourly_rate)}
            </span>
            {trainer.hourly_rate ? (
              <span className="ml-1 text-xs font-normal text-slate-500">
                / giờ
              </span>
            ) : null}
          </div>
        </div>
      </Link>

      <button
        type="button"
        onClick={onRemove}
        disabled={isRemoving}
        aria-label={`Bỏ ${trainerName} khỏi danh sách yêu thích`}
        title="Bỏ khỏi danh sách yêu thích"
        className={cn(
          "absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-full border border-rose-200 bg-white/95 text-rose-500 shadow-sm backdrop-blur transition-all",
          "hover:bg-rose-50 hover:scale-105 active:scale-95",
          "disabled:opacity-60 disabled:cursor-not-allowed",
        )}
      >
        {isRemoving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Trash2 className="h-4 w-4" />
        )}
      </button>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm"
        >
          <div className="aspect-[4/3] animate-pulse bg-slate-100" />
          <div className="space-y-2 p-4">
            <div className="h-4 w-3/4 animate-pulse rounded bg-slate-100" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 px-6 py-16 text-center">
      <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-400">
        <Heart className="h-7 w-7" />
      </div>
      <h2 className="mt-6 text-lg font-semibold text-slate-900">
        Chưa có HLV yêu thích nào
      </h2>
      <p className="mt-2 text-sm text-slate-500">
        Vào trang chi tiết của một huấn luyện viên và bấm trái tim để lưu vào
        đây.
      </p>
      <Link
        to="/gyms"
        className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:-translate-y-0.5"
      >
        Khám phá phòng tập & HLV
      </Link>
    </div>
  );
}

function ErrorState({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div className="rounded-2xl border border-rose-100 bg-rose-50/40 px-6 py-12 text-center">
      <p className="text-sm font-semibold text-rose-600">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 inline-flex items-center gap-2 rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-50"
      >
        Thử lại
      </button>
    </div>
  );
}
