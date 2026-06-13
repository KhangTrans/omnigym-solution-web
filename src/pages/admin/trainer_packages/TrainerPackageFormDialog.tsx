import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TrainerPackage } from '@/api/trainerPackages';

interface TrainerPackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  draft: Partial<TrainerPackage>;
  setDraft: (payload: Partial<TrainerPackage>) => void;
  onSubmit: () => void;
}

export function TrainerPackageFormDialog({
  open,
  onOpenChange,
  editing,
  draft,
  setDraft,
  onSubmit,
}: TrainerPackageFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto admin-scrollbar">
        <DialogHeader>
          <DialogTitle>{editing ? 'Sửa gói PT' : 'Tạo gói PT mới'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div>
            <Label>Tên gói</Label>
            <Input
              value={draft.package_name || ''}
              onChange={(e) => setDraft({ ...draft, package_name: e.target.value })}
              placeholder="Ví dụ: Gói tập tăng cơ 24 buổi"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Số buổi</Label>
              <Input
                type="number"
                min={1}
                value={draft.session_count ?? 0}
                onChange={(e) => setDraft({ ...draft, session_count: Number(e.target.value) })}
              />
            </div>
            <div>
              <Label>Giá gói (VND)</Label>
              <Input
                type="text"
                value={draft.package_price ? draft.package_price.toLocaleString('vi-VN') : ''}
                onChange={(e) => {
                  const formatted = e.target.value.replace(/\D/g, '');
                  setDraft({ ...draft, package_price: formatted ? Number(formatted) : 0 });
                }}
                placeholder="e.g. 12.000.000"
              />
            </div>
          </div>
          <div>
            <Label className="flex items-center gap-2">
              Price per session
              <span className="text-xs text-muted-foreground">(auto-calculated)</span>
            </Label>
            <div className="mt-1 flex items-center justify-between rounded-md border bg-muted/40 px-3 py-2">
              <span className="text-sm font-medium tabular-nums">
                {draft.session_count && draft.session_count > 0
                  ? new Intl.NumberFormat('vi-VN').format(
                      Math.round((draft.package_price ?? 0) / draft.session_count),
                    )
                  : '0'}{' '}
                VND
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Trainer level</Label>
              <Select
                value={draft.trainer_level || 'junior'}
                onValueChange={(value) => setDraft({ ...draft, trainer_level: value as TrainerPackage['trainer_level'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="junior">Junior</SelectItem>
                  <SelectItem value="senior">Senior</SelectItem>
                  <SelectItem value="master">Master</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Format</Label>
              <RadioGroup
                value={draft.mode || '1-on-1'}
                onValueChange={(value) => setDraft({ ...draft, mode: value as TrainerPackage['mode'] })}
                className="mt-2 flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="1-on-1" id="mode-1on1" />
                  <Label htmlFor="mode-1on1" className="cursor-pointer font-normal">
                    1-on-1
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="group" id="mode-group" />
                  <Label htmlFor="mode-group" className="cursor-pointer font-normal">
                    Group
                  </Label>
                </div>
              </RadioGroup>
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              rows={4}
              value={draft.description || ''}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
            />
          </div>
          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Trạng thái</Label>
              <p className="text-xs text-muted-foreground">Gói không hoạt động sẽ không hiển thị với khách hàng.</p>
            </div>
            <Switch
              checked={draft.is_active ?? true}
              onCheckedChange={(value) => setDraft({ ...draft, is_active: value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button onClick={onSubmit}>{editing ? 'Lưu thay đổi' : 'Tạo gói'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
