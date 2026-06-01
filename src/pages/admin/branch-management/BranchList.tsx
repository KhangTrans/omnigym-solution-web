import { useEffect, useMemo, useState } from "react";
import {
  Building2,
  Clock,
  Eye,
  Image as ImageIcon,
  MapPin,
  Pencil,
  Plus,
  Search,
  Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogDescription,
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
import { branchesApi } from "@/api/branches";
import { authApi } from "@/api/auth";
import { useProvinces } from "@/lib/vn-locations";
import { uploadImageToCloudinary } from "@/utils/cloudinary";
import { toast } from "sonner";

type BranchRecord = {
  id: number | string;
  partner_id?: number | string;
  branch_name: string;
  address: string;
  province: string;
  district: string;
  status?: string | null;
  hotline?: string | null;
  opening_house?: string | null;
  image_url?: string | null;
};

type BranchDraft = {
  partner_id: number;
  branch_name: string;
  address: string;
  province: string;
  district: string;
  hotline: string;
  opening_house: string;
  image_url: string;
};

const emptyDraft = (partnerId = 1): BranchDraft => ({
  partner_id: partnerId,
  branch_name: "",
  address: "",
  province: "",
  district: "",
  hotline: "",
  opening_house: "06:00 - 22:00",
  image_url: "",
});

export default function BranchList() {
  const [branches, setBranches] = useState<BranchRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [partnerId, setPartnerId] = useState(1);
  const [draft, setDraft] = useState<BranchDraft>(emptyDraft());
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailBranch, setDetailBranch] = useState<BranchRecord | null>(null);
  const { provinces, loading: loadingProvinces } = useProvinces();

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchesApi.getAll();
      setBranches(Array.isArray(response.data) ? response.data : response.data?.data ?? []);
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Không thể tải danh sách chi nhánh");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBranches();
  }, []);

  useEffect(() => {
    const loadPartner = async () => {
      try {
        const response = await authApi.getMe();
        const user = response.data.user || response.data;
        const resolvedPartnerId = Number(user?.partner?.id || 1);
        setPartnerId(resolvedPartnerId);
        setDraft((prev) => ({ ...prev, partner_id: resolvedPartnerId }));
      } catch (error) {
        console.error("Failed to load partner profile", error);
      }
    };

    void loadPartner();
  }, []);

  const filteredBranches = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return branches;

    return branches.filter((branch) =>
      [
        branch.branch_name,
        branch.address,
        branch.province,
        branch.district,
        branch.hotline ?? "",
        branch.opening_house ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(term),
    );
  }, [branches, searchTerm]);

  const stats = useMemo(() => {
    const uniqueProvinces = new Set(
      branches.map((branch) => branch.province).filter(Boolean),
    ).size;
    const withHotline = branches.filter((branch) => Boolean(branch.hotline)).length;
    return { total: branches.length, provinces: uniqueProvinces, withHotline };
  }, [branches]);

  function startCreate() {
    setEditingId(null);
    setDraft(emptyDraft(partnerId));
    setOpen(true);
  }

  function startEdit(branch: BranchRecord) {
    setEditingId(branch.id);
    setDraft({
      partner_id: partnerId,
      branch_name: branch.branch_name ?? "",
      address: branch.address ?? "",
      province: branch.province ?? "",
      district: branch.district ?? "",
      hotline: branch.hotline ?? "",
      opening_house: branch.opening_house ?? "06:00 - 22:00",
      image_url: branch.image_url ?? "",
    });
    setOpen(true);
  }

  async function openDetail(id: number | string) {
    try {
      setDetailOpen(true);
      setDetailLoading(true);
      setDetailBranch(null);
      const response = await branchesApi.getById(id);
      setDetailBranch(response.data?.data ?? response.data ?? null);
    } catch (error) {
      console.error("Failed to load branch detail", error);
      toast.error("Không thể tải chi tiết chi nhánh");
      setDetailOpen(false);
    } finally {
      setDetailLoading(false);
    }
  }

  const selectedProvince = provinces.find((province) => province.name === draft.province);

  const canSubmit =
    draft.partner_id > 0 &&
    draft.branch_name.trim().length >= 2 &&
    draft.address.trim().length >= 5 &&
    Boolean(draft.province) &&
    Boolean(draft.district) &&
    Boolean(draft.opening_house.trim()) &&
    Boolean(draft.image_url.trim());

  async function submit() {
    if (!canSubmit) {
      toast.error("Vui lòng nhập đầy đủ thông tin bắt buộc");
      return;
    }

    try {
      setSaving(true);
      const payload = {
        partner_id: draft.partner_id,
        branch_name: draft.branch_name.trim(),
        address: draft.address.trim(),
        province: draft.province.trim(),
        district: draft.district.trim(),
        hotline: draft.hotline.trim() || undefined,
        opening_house: draft.opening_house.trim(),
        image_url: draft.image_url.trim(),
      };

      if (editingId !== null) {
        await branchesApi.update(editingId, payload);
        toast.success("Cập nhật chi nhánh thành công");
      } else {
        await branchesApi.create(payload);
        toast.success("Tạo chi nhánh thành công");
      }

      setOpen(false);
      await fetchBranches();
    } catch (error) {
      console.error("Failed to save branch", error);
      toast.error("Không thể lưu chi nhánh");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageSelect(file: File | null | undefined) {
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageToCloudinary(file);
      setDraft((prev) => ({ ...prev, image_url: imageUrl }));
      toast.success("Upload ảnh thành công");
    } catch (error) {
      console.error("Failed to upload image", error);
      toast.error("Upload ảnh thất bại");
    } finally {
      setUploadingImage(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý chi nhánh</h1>
          <p className="text-sm text-muted-foreground">
            {stats.total} chi nhánh · {stats.withHotline} có hotline · đồng bộ cùng phong cách quản trị của hệ thống
          </p>

        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="mr-2 h-3 w-3" /> Thêm chi nhánh
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Chi nhánh
              </span>
              <Building2 className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wide text-muted-foreground">
                Tỉnh thành
              </span>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="mt-1 text-2xl font-bold">{stats.provinces}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
        <CardHeader>
          <CardTitle className="text-base">Tất cả chi nhánh</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, địa chỉ, tỉnh, quận, hotline..."
              className="pl-9"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="rounded-md bg-card shadow-[0_2px_10px_rgba(15,23,42,0.10)] overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Chi nhánh</TableHead>
                  <TableHead>Địa chỉ</TableHead>
                  <TableHead className="hidden md:table-cell">Liên hệ</TableHead>
                  <TableHead className="hidden lg:table-cell">Giờ mở cửa</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      Đang tải danh sách chi nhánh...
                    </TableCell>
                  </TableRow>
                ) : filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center text-sm text-muted-foreground">
                      Không tìm thấy chi nhánh nào.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {branch.image_url ? (
                            <img
                              src={branch.image_url}
                              alt={branch.branch_name}
                              className="h-10 w-10 rounded-md object-cover border"
                            />
                          ) : (
                            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                              <ImageIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="font-medium">{branch.branch_name}</div>
                            <div className="mt-1 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                              <Badge variant="secondary" className="rounded-full px-2 py-0">
                                {branch.province}
                              </Badge>
                              {branch.district && (
                                <Badge variant="outline" className="rounded-full px-2 py-0">
                                  {branch.district}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {branch.address}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5" />
                            {branch.hotline || "Chưa có hotline"}
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5" />
                            {branch.province}, {branch.district}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5" />
                          {branch.opening_house || "Chưa cập nhật"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => void openDetail(branch.id)} aria-label="Xem chi tiết chi nhánh">
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={() => startEdit(branch)} aria-label="Chỉnh sửa chi nhánh">
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-hidden p-0">
          <div className="relative h-36 w-full overflow-hidden bg-muted">
            {draft.image_url ? (
              <img src={draft.image_url} alt="Preview" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-3 left-6 right-6 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  {editingId !== null ? "Editing branch" : "New branch"}
                </div>
                <div className="truncate text-lg font-semibold">
                  {draft.branch_name || "Untitled branch"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {draft.province || "Location not set"}
                  {draft.district ? ` · ${draft.district}` : ""}
                </div>
              </div>
              <Badge variant="secondary" className="shrink-0">
                Branch
              </Badge>
            </div>
          </div>

          <div className="px-6 pt-5">
            <DialogHeader className="space-y-1">
              <DialogTitle>
                {editingId !== null ? "Cập nhật chi nhánh" : "Thêm chi nhánh mới"}
              </DialogTitle>
              <DialogDescription>
                Nhập thông tin cơ bản, chọn ảnh và lưu chi nhánh theo chuẩn quản trị.
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="grid gap-4 px-6 py-5">
            <div className="grid gap-2">
              <Label>Tên chi nhánh</Label>
              <Input
                value={draft.branch_name}
                onChange={(e) => setDraft({ ...draft, branch_name: e.target.value })}
                placeholder="Ví dụ: OmniGym Quận 1"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Tỉnh / Thành phố</Label>
                <Select
                  value={draft.province}
                  onValueChange={(value) =>
                    setDraft({ ...draft, province: value, district: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder={loadingProvinces ? "Đang tải..." : "Chọn tỉnh thành"} />
                  </SelectTrigger>
                  <SelectContent>
                    {provinces.map((province) => (
                      <SelectItem key={province.code} value={province.name}>
                        {province.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label>Quận / Huyện</Label>
                <Select
                  value={draft.district}
                  onValueChange={(value) => setDraft({ ...draft, district: value })}
                  disabled={!draft.province}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn quận huyện" />
                  </SelectTrigger>
                  <SelectContent>
                    {selectedProvince?.districts.map((district) => (
                      <SelectItem key={district.code} value={district.name}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Địa chỉ</Label>
              <Input
                value={draft.address}
                onChange={(e) => setDraft({ ...draft, address: e.target.value })}
                placeholder="Số 123, Đường ABC..."
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Hotline</Label>
                <Input
                  value={draft.hotline}
                  onChange={(e) => setDraft({ ...draft, hotline: e.target.value })}
                  placeholder="0901234567"
                />
              </div>
              <div className="grid gap-2">
                <Label>Giờ mở cửa</Label>
                <Input
                  value={draft.opening_house}
                  onChange={(e) => setDraft({ ...draft, opening_house: e.target.value })}
                  placeholder="06:00 - 22:00"
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Ảnh đại diện</Label>
              <div className="flex items-start gap-3">
                {draft.image_url ? (
                  <img
                    src={draft.image_url}
                    alt="Preview"
                    className="h-20 w-28 rounded-md border object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-28 items-center justify-center rounded-md border bg-muted text-muted-foreground">
                    <ImageIcon className="h-5 w-5" />
                  </div>
                )}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Button type="button" variant="outline" asChild disabled={uploadingImage}>
                      <label className="cursor-pointer">
                        {uploadingImage ? "Đang tải ảnh..." : "Chọn file ảnh"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => void handleImageSelect(e.target.files?.[0])}
                        />
                      </label>
                    </Button>
                    {draft.image_url && (
                      <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setDraft({ ...draft, image_url: "" })}
                        disabled={uploadingImage}
                      >
                        Xóa ảnh
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Chọn một file ảnh từ máy tính, hệ thống sẽ tự upload và lưu URL.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="border-t bg-muted/30 px-6 py-3">
            <Button variant="ghost" onClick={() => setOpen(false)}>
              Hủy
            </Button>
            <Button onClick={() => void submit()} disabled={saving || !canSubmit}>
              {saving ? "Đang lưu..." : editingId !== null ? "Lưu thay đổi" : "Tạo mới"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-h-[90vh] max-w-3xl gap-0 overflow-hidden p-0">
          <div className="relative h-44 w-full overflow-hidden bg-muted">
            {detailBranch?.image_url ? (
              <img
                src={detailBranch.image_url}
                alt={detailBranch.branch_name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="grid h-full w-full place-items-center text-muted-foreground">
                <ImageIcon className="h-8 w-8" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
            <div className="absolute bottom-3 left-6 right-6 flex items-end justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">
                  Branch detail
                </div>
                <div className="truncate text-lg font-semibold">
                  {detailBranch?.branch_name || "Chi tiết chi nhánh"}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {detailBranch?.province || ""}
                  {detailBranch?.district ? ` · ${detailBranch.district}` : ""}
                </div>
              </div>
              {detailBranch?.status && (
                <Badge
                  variant={detailBranch.status === "active" ? "default" : "secondary"}
                  className="shrink-0"
                >
                  {detailBranch.status}
                </Badge>
              )}
            </div>
          </div>

          <div className="px-6 pt-5">
            <DialogHeader className="space-y-1">
              <DialogTitle>Chi tiết chi nhánh</DialogTitle>
              <DialogDescription>
                Thông tin đọc từ API chi tiết branch.
              </DialogDescription>
            </DialogHeader>
          </div>

          {detailLoading ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Đang tải chi tiết...
            </div>
          ) : detailBranch ? (
            <div className="grid gap-5 px-6 pb-6 pt-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Hotline
                  </div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">
                    {detailBranch.hotline || "Chưa có"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Giờ mở cửa
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {detailBranch.opening_house || "Chưa cập nhật"}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Trạng thái
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    {detailBranch.status ? (
                      <Badge variant={detailBranch.status === "active" ? "default" : "secondary"}>
                        {detailBranch.status}
                      </Badge>
                    ) : (
                      <span className="text-base text-muted-foreground">Không rõ</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </div>
                <div className="text-base leading-7 text-foreground">
                  {detailBranch.address}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Location
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="rounded-full px-3 py-1 text-xs">
                    {detailBranch.province}
                  </Badge>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                    {detailBranch.district}
                  </Badge>
                </div>
              </div>

              {/* <div className="space-y-3">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Meta
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-lg border bg-background p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Branch ID
                    </div>
                    <div className="mt-1 text-base font-medium">{detailBranch.id}</div>
                  </div>
                  <div className="rounded-lg border bg-background p-4">
                    <div className="text-xs uppercase tracking-wide text-muted-foreground">
                      Partner ID
                    </div>
                    <div className="mt-1 text-base font-medium">
                      {detailBranch.partner_id ?? "-"}
                    </div>
                  </div>
                </div>
              </div> */}
            </div>
          ) : (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Không có dữ liệu chi tiết.
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
