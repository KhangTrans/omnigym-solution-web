import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { FaqItem } from "./FaqFormDialog";

interface FaqDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  faq: FaqItem | null;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
}

export function FaqDeleteDialog({
  open,
  onOpenChange,
  faq,
  onConfirm,
  isDeleting,
}: FaqDeleteDialogProps) {
  if (!faq) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-full max-w-md overflow-hidden rounded-3xl bg-background shadow-[0_24px_80px_rgba(15,23,42,0.28)] p-0 font-sans">
        <div className="border-b bg-red-50/50 p-6">
          <DialogHeader>
            <div className="inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700 w-fit">
              Xác nhận xóa
            </div>
            <DialogTitle className="mt-3 text-xl font-bold text-foreground">Xóa FAQ này?</DialogTitle>
            <DialogDescription className="mt-2 text-sm leading-6 text-muted-foreground">
              FAQ <strong>"{faq.question}"</strong> sẽ bị xóa khỏi hệ thống. Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="flex justify-end gap-3 p-6 bg-slate-50/50">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isDeleting}
            className="h-10 rounded-xl"
          >
            Hủy
          </Button>
          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex h-10 items-center gap-2 rounded-xl bg-red-600 px-4 text-sm font-semibold text-white shadow-md shadow-red-600/20 transition hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            {isDeleting ? "Đang xóa..." : "Xóa FAQ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
