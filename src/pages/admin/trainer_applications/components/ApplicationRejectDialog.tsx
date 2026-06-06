import { Loader2, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface ApplicationRejectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rejectionReason: string;
  setRejectionReason: (reason: string) => void;
  onSubmit: () => void;
  processing: boolean;
}

export function ApplicationRejectDialog({
  open,
  onOpenChange,
  rejectionReason,
  setRejectionReason,
  onSubmit,
  processing,
}: ApplicationRejectDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Từ chối hồ sơ Trainer</DialogTitle>
          <DialogDescription>
            Nhập lý do để người dùng biết cần bổ sung hoặc chỉnh sửa thông tin
            nào.
          </DialogDescription>
        </DialogHeader>
        <Textarea
          value={rejectionReason}
          onChange={(e) => setRejectionReason(e.target.value)}
          placeholder="Ví dụ: Chứng chỉ chưa rõ ảnh, thiếu thông tin định danh..."
          rows={5}
        />
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={processing}
          >
            Hủy
          </Button>
          <Button
            variant="destructive"
            onClick={onSubmit}
            disabled={processing}
          >
            {processing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            Từ chối
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
