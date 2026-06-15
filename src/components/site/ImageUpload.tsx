import * as React from "react";
import { Image as ImageIcon, Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { uploadImageToCloudinary } from "@/utils/cloudinary";

type Props = {
  value: string;
  onChange: (url: string) => void;
  label?: string;
  required?: boolean;
  maxBytes?: number; // default 4MB
  className?: string;
  previewClassName?: string;
  hint?: string;
  variant?: "default" | "avatar";
};

export function ImageUpload({
  value,
  onChange,
  label,
  required,
  maxBytes = 4 * 1024 * 1024,
  className,
  previewClassName,
  hint,
  variant = "default",
}: Props) {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  async function handle(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Vui lòng tải lên file hình ảnh");
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`Ảnh quá lớn (tối đa ${Math.round(maxBytes / 1024 / 1024)}MB)`);
      return;
    }
    
    try {
      setIsUploading(true);
      const url = await uploadImageToCloudinary(file);
      onChange(url);
      toast.success("Tải ảnh lên thành công");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Không thể tải ảnh lên Cloudinary");
    } finally {
      setIsUploading(false);
    }
  }

  if (variant === "avatar") {
    return (
      <div className={cn("space-y-1.5", className)}>
        {label && (
          <div className="text-xs font-semibold text-slate-700">
            {label}
            {required && " *"}
          </div>
        )}
        <div
          className={cn(
            "relative overflow-hidden rounded-xl border border-dashed border-slate-200 bg-muted hover:bg-slate-50 transition-all cursor-pointer group flex items-center justify-center",
            previewClassName
          )}
          onClick={(e) => {
            // Prevent triggering upload dialog if the remove button is clicked
            if ((e.target as HTMLElement).closest('.remove-btn')) {
              return;
            }
            fileInputRef.current?.click();
          }}
        >
          {/* Main Image or Placeholder */}
          {value ? (
            <img src={value} alt="Avatar" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <div className="flex flex-col items-center justify-center text-muted-foreground/60 p-4">
              <ImageIcon className="h-6 w-6 mb-1" />
              <span className="text-[10px] font-medium">Chọn ảnh</span>
            </div>
          )}

          {/* Hover / Uploading Overlay */}
          <div className={cn(
            "absolute inset-0 bg-black/40 flex items-center justify-center transition-opacity opacity-0 group-hover:opacity-100",
            isUploading && "opacity-100"
          )}>
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin text-white" />
            ) : (
              <Upload className="h-6 w-6 text-white" />
            )}
          </div>

          {/* Absolute positioned delete button */}
          {value && !isUploading && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
                onChange("");
              }}
              aria-label="Remove image"
              className="remove-btn absolute right-2 top-2 grid h-6 w-6 place-items-center rounded-full bg-white/80 hover:bg-white text-slate-700 shadow-sm transition-all"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => void handle(e.target.files?.[0])}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="text-xs font-semibold text-slate-700">
          {label}
          {required && " *"}
        </div>
      )}
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "relative h-20 w-20 shrink-0 overflow-hidden rounded-md border border-border bg-muted",
            previewClassName,
          )}
        >
          {value ? (
            <>
              <img src={value} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => onChange("")}
                aria-label="Remove image"
                className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-background/80 text-foreground shadow hover:bg-background"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          ) : (
            <div className="grid h-full w-full place-items-center text-muted-foreground">
              <ImageIcon className="h-5 w-5" />
            </div>
          )}
        </div>
        <div className="flex-1 space-y-1">
          <label 
            className={cn(
              "inline-flex cursor-pointer items-center justify-center rounded-md border border-input bg-background p-2.5 text-sm text-foreground shadow-sm transition-colors hover:bg-background hover:text-foreground hover:border-input",
              isUploading && "opacity-50 cursor-not-allowed"
            )}
            title={isUploading ? "Đang tải lên..." : (value ? "Thay đổi ảnh" : "Tải ảnh lên")}
          >
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={isUploading}
              onChange={(e) => void handle(e.target.files?.[0])}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {hint ?? `PNG, JPG hoặc GIF · tối đa ${Math.round(maxBytes / 1024 / 1024)}MB`}
          </p>
        </div>
      </div>
    </div>
  );
}