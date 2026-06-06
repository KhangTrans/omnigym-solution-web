import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Clock, User, Bookmark } from "lucide-react";
import { FaqItem } from "./FaqFormDialog";
import { cn } from "@/utils/cn";

interface FaqDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq: FaqItem | null;
}

const STATUS_LABELS = {
  Published: "Đã xuất bản",
  Draft: "Bản nháp",
};

export function FaqDetailDialog({ open, onOpenChange, faq }: FaqDetailDialogProps) {
  if (!faq) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[640px] w-[95vw] max-h-[95vh] overflow-y-auto font-sans rounded-3xl p-0">
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
          <DialogHeader>
            <div className="flex items-center gap-2">
              <Badge
                className={cn(
                  "rounded-full border-0 px-3 py-1 text-xs",
                  faq.status === "Published"
                    ? "bg-emerald-600 text-white hover:bg-emerald-600"
                    : "bg-muted text-foreground hover:bg-muted"
                )}
              >
                {STATUS_LABELS[faq.status]}
              </Badge>
              <Badge variant="outline" className="rounded-full bg-background border-slate-200">
                {faq.category}
              </Badge>
            </div>
            <DialogTitle className="mt-3 text-xl font-bold text-slate-900 leading-snug">
              {faq.question}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Chi tiết câu hỏi thường gặp
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          <div className="rounded-2xl bg-muted/20 border p-4 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Nội dung câu trả lời</h4>
            <p className="whitespace-pre-line leading-7 text-slate-700 text-sm">
              {faq.answer}
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 p-3 rounded-xl border bg-slate-55/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 shrink-0">
                <Eye className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Lượt xem</p>
                <p className="text-sm font-semibold text-slate-900">{faq.views} lượt xem</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border bg-slate-55/40">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 shrink-0">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Cập nhật lần cuối</p>
                <p className="text-sm font-semibold text-slate-900">{faq.updatedAt || "Chưa có thông tin"}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl border bg-slate-55/40 sm:col-span-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 shrink-0">
                <User className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Tác giả</p>
                <p className="text-sm font-semibold text-slate-900">
                  {faq.author.name} <span className="text-xs text-muted-foreground font-normal">({faq.author.email})</span>
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="border-t p-6 bg-slate-50/50">
          <Button onClick={() => onOpenChange(false)} className="w-full sm:w-auto rounded-xl">
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
