import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Branch, MembershipPackage } from "@/api/membershipPackages";

interface PackageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editing: boolean;
  draft: Partial<MembershipPackage>;
  setDraft: (draft: Partial<MembershipPackage>) => void;
  branches: Branch[];
  selectedBranches: number[];
  setSelectedBranches: (branches: number[]) => void;
  applyToAll: boolean;
  setApplyToAll: (applyToAll: boolean) => void;
  onSubmit: () => void;
}

export function PackageFormDialog({
  open,
  onOpenChange,
  editing,
  draft,
  setDraft,
  branches,
  selectedBranches,
  setSelectedBranches,
  applyToAll,
  setApplyToAll,
  onSubmit,
}: PackageFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? "Edit package" : "New package"}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Name</Label>
              <Input
                value={draft.name || ""}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g., Platinum - All Branches"
              />
            </div>
            <div>
              <Label>Duration (months)</Label>
              <Input
                type="number"
                value={draft.duration_months || 1}
                onChange={(e) => setDraft({ ...draft, duration_months: +e.target.value })}
                min="1"
              />
            </div>
          </div>
          <div>
            <Label>Price (VND)</Label>
            <Input
              type="text"
              value={draft.price ? parseFloat(draft.price).toLocaleString("vi-VN") : ""}
              onChange={(e) => {
                const value = e.target.value.replace(/\./g, "");
                if (value === "" || /^\d*$/.test(value)) {
                  setDraft({ ...draft, price: value || "0" });
                }
              }}
              placeholder="e.g., 3.999.000"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={draft.description || ""}
              onChange={(e) => setDraft({ ...draft, description: e.target.value })}
              placeholder="e.g., Áp dụng tất cả chi nhánh"
              rows={2}
            />
          </div>
          <div>
            <Label>Benefits</Label>
            <Textarea
              value={draft.benefits || ""}
              onChange={(e) => setDraft({ ...draft, benefits: e.target.value })}
              placeholder="e.g., Tất cả quyền lợi"
              rows={3}
            />
          </div>

          <div className="border-t pt-4">
            <Label className="text-base font-semibold">Branches</Label>
            <div className="mt-3 space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="apply-all"
                  checked={applyToAll}
                  onCheckedChange={(checked) => {
                    setApplyToAll(checked as boolean);
                    if (checked) {
                      setSelectedBranches([]);
                    }
                  }}
                />
                <Label htmlFor="apply-all" className="cursor-pointer font-normal">
                  Apply to all branches
                </Label>
              </div>

              {!applyToAll && (
                <div className="ml-6 space-y-2 p-3 border rounded-md bg-muted/50 max-h-48 overflow-y-auto">
                  {branches.map((branch) => (
                    <div key={branch.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`branch-${branch.id}`}
                        checked={selectedBranches.includes(branch.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedBranches([...selectedBranches, branch.id]);
                          } else {
                            setSelectedBranches(
                              selectedBranches.filter((id) => id !== branch.id)
                            );
                          }
                        }}
                      />
                      <Label
                        htmlFor={`branch-${branch.id}`}
                        className="cursor-pointer font-normal text-sm"
                      >
                        {branch.address}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-md border p-3">
            <div>
              <Label>Status</Label>
              <p className="text-xs text-muted-foreground">
                Inactive packages are hidden from new sign-ups.
              </p>
            </div>
            <Select
              value={draft.status || "active"}
              onValueChange={(v) =>
                setDraft({ ...draft, status: v as "active" | "inactive" })
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={onSubmit}>{editing ? "Save" : "Create"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
