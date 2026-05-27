import { cn } from "../../utils/cn";

const LABELS = ["Dễ", "Trung bình", "Khó"] as const;
const COLORS = [
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
] as const;

export function DifficultyBar({
  level = 1,
  showLabel = true,
  className,
}: {
  level?: 1 | 2 | 3;
  showLabel?: boolean;
  className?: string;
}) {
  const lvl = Math.min(3, Math.max(1, level)) as 1 | 2 | 3;
  const color = COLORS[lvl - 1];
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex gap-1" aria-label={`Độ khó: ${LABELS[lvl - 1]}`}>
        {[1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn(
              "h-1.5 w-6 rounded-full transition-colors",
              i <= lvl ? color : "bg-muted",
            )}
          />
        ))}
      </div>
      {showLabel && (
        <span className="text-xs font-medium text-muted-foreground">
          {LABELS[lvl - 1]}
        </span>
      )}
    </div>
  );
}