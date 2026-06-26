import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import type { TrainerPackage } from '@/api/trainerPackages';

interface TrainerPackageDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: TrainerPackage | null;
}

export function TrainerPackageDetailDialog({
  open,
  onOpenChange,
  pkg,
}: TrainerPackageDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto admin-scrollbar">
        <DialogHeader>
          <DialogTitle>Chi tiết gói PT</DialogTitle>
        </DialogHeader>
        {pkg && (
          <div className="space-y-4 py-2">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-xl font-semibold">{pkg.package_name}</h2>
                <p className="text-sm text-muted-foreground mt-1">{pkg.description || 'Chưa có mô tả.'}</p>
              </div>
              <Badge variant={pkg.is_active ? 'default' : 'secondary'}>
                {pkg.is_active ? 'Hoạt động' : 'Không hoạt động'}
              </Badge>
            </div>

            <div className="rounded-lg border bg-muted/30 p-4 grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Total price</p>
                <p className="font-semibold text-lg tabular-nums">{new Intl.NumberFormat('vi-VN').format(pkg.package_price)} VND</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Price per session</p>
                <p className="font-semibold text-lg tabular-nums">{new Intl.NumberFormat('vi-VN').format(pkg.price_per_session)} VND</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Sessions</p>
                <p className="font-medium">{pkg.session_count} buổi</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Thời hạn</p>
                <p className="font-medium">{pkg.duration_days} ngày</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Trainer level</p>
                <p className="font-medium capitalize">{pkg.trainer_level}</p>
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Format</p>
                <p className="font-medium capitalize">{pkg.mode}</p>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
