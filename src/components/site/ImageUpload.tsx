import * as React from "react";
import { Image as ImageIcon, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (dataUrl: string) => void;
  label?: string;
  required?: boolean;
  maxBytes?: number; // default 4MB
  className?: string;
  previewClassName?: string;
  hint?: string;
};

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(file);
  });
}

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
  async function handle(file: File | null | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }
    if (file.size > maxBytes) {
      toast.error(`Image too large (max ${Math.round(maxBytes / 1024 / 1024)}MB)`);
      return;
    }
    try {
      onChange(await readAsDataUrl(file));
    } catch {
      toast.error("Could not read file");
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
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm hover:bg-accent">
            <Upload className="h-4 w-4" />
            {value ? "Replace image" : "Upload image"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => void handle(e.target.files?.[0])}
            />
          </label>
          <p className="text-xs text-muted-foreground">
            {hint ?? `PNG, JPG or GIF · max ${Math.round(maxBytes / 1024 / 1024)}MB`}
          </p>
        </div>
      </div>
    </div>
  );
}