import React, { useState, useEffect } from 'react';
import { Star } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '../../../../components/ui/dialog';
import { branchesApi } from '../../../../api/branches';
import { notify } from '../../../../utils/notify';

interface BranchReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  branchId: number | null;
  branchName: string;
  onSuccess?: () => void;
}

export const BranchReviewModal: React.FC<BranchReviewModalProps> = ({
  open,
  onOpenChange,
  branchId,
  branchName,
  onSuccess,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setRating(5);
      setComment("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchId) return;

    try {
      setSubmitting(true);
      const response = await branchesApi.createReview(branchId, {
        rating,
        comment: comment.trim() || undefined,
      });
      notify.success(response.data?.message || "Đánh giá chi nhánh thành công!");
      onOpenChange(false);
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: any) {
      const msg = error.response?.data?.message || error.message || "Không thể gửi đánh giá.";
      notify.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 bg-card border border-border rounded-2xl shadow-xl">
        <DialogTitle className="text-lg font-bold text-foreground flex items-center gap-2">
          <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
          <span>Đánh giá chi nhánh</span>
        </DialogTitle>
        <DialogDescription className="text-xs text-muted-foreground mt-1">
          Chia sẻ trải nghiệm của bạn tại <strong>{branchName}</strong> sau buổi tập hôm nay.
        </DialogDescription>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-foreground">Điểm số:</span>
            <div className="flex items-center text-amber-400">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110 p-0.5"
                >
                  <Star
                    className={`h-6 w-6 ${
                      star <= rating ? "fill-amber-400 text-amber-400" : "text-muted-foreground"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-foreground block">Nhận xét của bạn:</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Ví dụ: Phòng tập sạch sẽ, máy móc đầy đủ, nhân viên nhiệt tình hỗ trợ..."
              rows={4}
              className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm outline-none focus:ring-1 focus:ring-primary focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 text-sm font-semibold text-muted-foreground rounded-xl hover:bg-muted transition-all active:scale-95"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl px-5 py-2 text-sm transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {submitting ? "Đang gửi..." : "Gửi đánh giá"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
