
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Eye } from "lucide-react";
import { toast } from "sonner";
import { membershipPackagesApi, MembershipPackage as MembershipPackageType } from "@/api/membershipPackages";
import { branchesApi } from "@/api/branches";
import type { Branch } from "@/api/membershipPackages";

function MembershipPackage() {
  const [packages, setPackages] = useState<MembershipPackageType[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<MembershipPackageType | null>(null);
  const [editing, setEditing] = useState(false);
  const [applyToAll, setApplyToAll] = useState(false);
  const [selectedBranches, setSelectedBranches] = useState<number[]>([]);
  const [draft, setDraft] = useState<Partial<MembershipPackageType>>({
    name: "",
    price: "0",
    duration_months: 1,
    description: "",
    benefits: "",
    status: "active",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [packagesRes, branchesRes] = await Promise.all([
        membershipPackagesApi.getAll(),
        branchesApi.getAll(),
      ]);
      setPackages(packagesRes.data);
      setBranches(branchesRes.data);
    } catch (error) {
      toast.error("Failed to fetch data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    return packages.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.description.toLowerCase().includes(query.toLowerCase())
    );
  }, [packages, query]);

  const startCreate = () => {
    setEditing(false);
    setApplyToAll(false);
    setSelectedBranches([]);
    setDraft({
      name: "",
      price: "0",
      duration_months: 1,
      description: "",
      benefits: "",
      status: "active",
    });
    setOpen(true);
  };

  const startEdit = (pkg: MembershipPackageType) => {
    setEditing(true);
    setApplyToAll(pkg.apply_to_all || false);
    setSelectedBranches(pkg.branch_ids || []);
    setDraft(pkg);
    setOpen(true);
  };

  const viewDetail = (pkg: MembershipPackageType) => {
    setSelectedPackage(pkg);
    setDetailOpen(true);
  };

  const submit = async () => {
    try {
      if (!draft.name || !draft.price || !draft.duration_months) {
        toast.error("Please fill in all required fields");
        return;
      }

      if (!applyToAll && selectedBranches.length === 0) {
        toast.error("Please select at least one branch or apply to all branches");
        return;
      }

      const submitData: any = {
        ...draft,
        apply_to_all: applyToAll,
      };

      if (!applyToAll) {
        submitData.branch_ids = selectedBranches;
      }
      console.log(submitData);
      
      if (editing && draft.id) {
        await membershipPackagesApi.update(draft.id, submitData);
        toast.success("Package updated successfully");
      } else {
        await membershipPackagesApi.create(submitData);
        toast.success("Package created successfully");
      }

      setOpen(false);
      fetchData();
    } catch (error) {
      toast.error("Failed to save package");
      console.error(error);
    }
  };

  const remove = async (id: number) => {
    try {
      await membershipPackagesApi.delete(id);
      toast.success("Package removed");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete package");
      console.error(error);
    }
  };

  const toggleActive = async (id: number) => {
    try {
      const pkg = packages.find((p) => p.id === id);
      if (!pkg) return;

      const newStatus = pkg.status === "active" ? "inactive" : "active";
      await membershipPackagesApi.update(id, { status: newStatus });
      fetchData();
    } catch (error) {
      toast.error("Failed to update package status");
      console.error(error);
    }
  };

  const getBranchDisplay = (pkg: MembershipPackageType) => {
    if (pkg.apply_to_all) {
      return <Badge variant="default">All Branches</Badge>;
    }
    return (
      <div className="flex flex-wrap gap-1">
        {pkg.branches && pkg.branches.length > 0 ? (
          pkg.branches.map((b) => (
            <Badge key={b.id} variant="outline" className="text-xs">
              {b.address}
            </Badge>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">No branches</span>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Membership packages</h1>
          <p className="text-sm text-muted-foreground">
            {packages.length} packages · {packages.filter((p) => p.status === "active").length} active
          </p>
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="mr-2 h-3 w-3" />
          New package
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">All packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Search by name or description…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead>Branches</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                  <TableHead className="w-24" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.name}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">{p.description}</TableCell>
                    <TableCell className="text-sm">{p.duration_months} month(s)</TableCell>
                    <TableCell className="text-right tabular-nums text-sm">₫{parseFloat(p.price).toLocaleString("vi-VN")}</TableCell>
                    <TableCell className="text-sm">{getBranchDisplay(p)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={p.status === "active" ? "default" : "secondary"}>
                        {p.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => viewDetail(p)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(p)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-sm text-muted-foreground py-8">
                      No packages found.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
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
                              setSelectedBranches(selectedBranches.filter((id) => id !== branch.id));
                            }
                          }}
                        />
                        <Label htmlFor={`branch-${branch.id}`} className="cursor-pointer font-normal text-sm">
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
                onValueChange={(v) => setDraft({ ...draft, status: v as "active" | "inactive" })}
              >
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button onClick={submit}>{editing ? "Save" : "Create"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Package Details</DialogTitle>
          </DialogHeader>
          {selectedPackage && (
            <div className="space-y-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Name</Label>
                  <p className="text-lg font-semibold">{selectedPackage.name}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <p className="mt-1">
                    <Badge variant={selectedPackage.status === "active" ? "default" : "secondary"}>
                      {selectedPackage.status}
                    </Badge>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Price (VND)</Label>
                  <p className="text-lg font-semibold">₫{parseFloat(selectedPackage.price).toLocaleString("vi-VN")}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Duration</Label>
                  <p className="text-lg font-semibold">{selectedPackage.duration_months} month(s)</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Created</Label>
                  <p className="text-sm">{new Date(selectedPackage.created_at).toLocaleDateString("vi-VN")}</p>
                </div>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="mt-1 text-sm">{selectedPackage.description}</p>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Benefits</Label>
                <div className="mt-2 space-y-1">
                  {selectedPackage.benefits.split("\n").map((benefit, idx) => (
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
                  {selectedPackage.apply_to_all ? (
                    <Badge variant="default">All Branches</Badge>
                  ) : selectedPackage.branches && selectedPackage.branches.length > 0 ? (
                    <div className="flex flex-wrap gap-2">
                      {selectedPackage.branches.map((b) => (
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
          <DialogFooter className="flex gap-2">

            <Button variant="ghost" onClick={() => setDetailOpen(false)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedPackage) {
                  startEdit(selectedPackage);
                  setDetailOpen(false);
                }
              }}
            >
              <Pencil className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default MembershipPackage;
