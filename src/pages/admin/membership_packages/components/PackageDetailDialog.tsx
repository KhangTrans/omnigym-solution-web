import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type { MembershipPackage } from "@/api/membershipPackages";

interface PackageDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pkg: MembershipPackage | null;
}

export function PackageDetailDialog({
  open,
  onOpenChange,
  pkg,
}: PackageDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto admin-scrollbar">
        <DialogHeader>
          <DialogTitle>Package Details</DialogTitle>
        </DialogHeader>
        {pkg && (
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Name</Label>
                <p className="text-lg font-semibold">{pkg.name}</p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Status</Label>
                <p className="mt-1">
                  <Badge variant={pkg.status === "active" ? "default" : "secondary"}>
                    {pkg.status}
                  </Badge>
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Price (VND)</Label>
                <p className="text-lg font-semibold">
                  ₫{parseFloat(pkg.price).toLocaleString("vi-VN")}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Duration</Label>
                <p className="text-lg font-semibold">
                  {pkg.duration_months} month(s)
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Created</Label>
                <p className="text-sm">
                  {pkg.created_at
                    ? new Date(pkg.created_at).toLocaleDateString("vi-VN")
                    : "-"}
                </p>
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Description</Label>
              <p className="mt-1 text-sm">{pkg.description || "-"}</p>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Benefits</Label>
              <div className="mt-2 space-y-1">
                {(pkg.benefits || "").split("\n").map((benefit, idx) => (
                  <div key={idx} className="text-sm flex items-start">
                    <span className="mr-2">•</span>
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-muted-foreground">Branches</Label>
              <div className="mt-2 space-y-2">
                {pkg.apply_to_all ? (
                  <Badge variant="default">All Branches</Badge>
                ) : pkg.branches && pkg.branches.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {pkg.branches.map((b) => (
                      <Badge key={b.id} variant="outline">
                        {b.address}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No branches</span>
                )}
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
