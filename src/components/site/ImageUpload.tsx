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
}: Props) {
  const [isUploading, setIsUploading] = React.useState(false);

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

  return (
    <div className={cn("space-y-1", className)}>
      {label && (
        <div className="text-xs font-medium">
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
          <label className={cn(
            "inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground shadow-sm transition-colors hover:bg-background hover:text-foreground hover:border-input",
            isUploading && "opacity-50 cursor-not-allowed"
          )}>
            {isUploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {isUploading ? "Đang tải lên..." : (value ? "Thay đổi ảnh" : "Tải ảnh lên")}
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