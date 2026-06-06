
import { useMemo, useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { PackageFormDialog } from "./components/PackageFormDialog";
import { PackageDetailDialog } from "./components/PackageDetailDialog";
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

      <PackageFormDialog
        open={open}
        onOpenChange={setOpen}
        editing={editing}
        draft={draft}
        setDraft={setDraft}
        branches={branches}
        selectedBranches={selectedBranches}
        setSelectedBranches={setSelectedBranches}
        applyToAll={applyToAll}
        setApplyToAll={setApplyToAll}
        onSubmit={submit}
      />

      <PackageDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        pkg={selectedPackage}
      />
    </div>
  )
}

export default MembershipPackage;
