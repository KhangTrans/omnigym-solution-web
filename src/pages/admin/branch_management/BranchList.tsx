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
  Trash2,
  Loader2,
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
  monthly_leave_limit?: number | null;
  image_url?: string | null;
  branch_ip?: string | null;
};

type BranchImageDraft = {
  image_url: string;
  is_cover?: boolean;
  sort_order?: number;
};

type BranchFacilityDraft = {
  facility_name: string;
  description?: string;
  icon_url?: string;
  images: BranchImageDraft[];
};

type BranchDraft = {
  partner_id: number;
  branch_name: string;
  address: string;
  province: string;
  district: string;
  hotline: string;
  opening_house: string;
  monthly_leave_limit: number;
  image_url: string;
  branch_ip: string;
  images: BranchImageDraft[];
  facilities: BranchFacilityDraft[];
};

const emptyDraft = (partnerId = 1): BranchDraft => ({
  partner_id: partnerId,
  branch_name: "",
  address: "",
  province: "",
  district: "",
  hotline: "",
  opening_house: "06:00 - 22:00",
  monthly_leave_limit: 0,
  image_url: "",
  branch_ip: "",
  images: [],
  facilities: [],
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
  const [fetchingIp, setFetchingIp] = useState(false);

  const detectCurrentIp = async () => {
    try {
      setFetchingIp(true);
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      if (data.ip) {
        setDraft((prev) => ({ ...prev, branch_ip: data.ip }));
        toast.success(`Đã tự động điền IP hiện tại: ${data.ip}`);
      }
    } catch (error) {
      console.error("Lỗi lấy IP:", error);
      toast.error("Không thể lấy IP tự động. Bạn có thể truy cập https://www.whatismyip.com để xem.");
    } finally {
      setFetchingIp(false);
    }
  };

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

  async function startEdit(branch: BranchRecord) {
    try {
      setEditingId(branch.id);
      setDraft(emptyDraft(partnerId));
      setOpen(true);

      const response = await branchesApi.getById(branch.id);
      const fullBranch = response.data?.data ?? response.data;

      if (fullBranch) {
        setDraft({
          partner_id: Number(fullBranch.partner_id || partnerId),
          branch_name: fullBranch.branch_name ?? "",
          address: fullBranch.address ?? "",
          province: fullBranch.province ?? "",
          district: fullBranch.district ?? "",
          hotline: fullBranch.hotline ?? "",
          opening_house: fullBranch.opening_house ?? "06:00 - 22:00",
          monthly_leave_limit: Number(fullBranch.monthly_leave_limit ?? 0),
          image_url: fullBranch.image_url ?? "",
          branch_ip: fullBranch.branch_ip ?? "",
          images: fullBranch.images ?? [],
          facilities: fullBranch.facilities ?? [],
        });
      }
    } catch (error) {
      console.error("Failed to load branch details for editing", error);
      toast.error("Không thể tải chi tiết chi nhánh để chỉnh sửa");
      setOpen(false);
    }
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
        monthly_leave_limit: Math.max(0, Number(draft.monthly_leave_limit) || 0),
        image_url: draft.image_url.trim(),
        branch_ip: draft.branch_ip.trim() || undefined,
        images: draft.images,
        facilities: draft.facilities,
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

  async function handleImageSelect(file: File | null | undefined, index?: number) {
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageToCloudinary(file);
      if (index !== undefined) {
        setDraft((prev) => {
          const newImages = [...prev.images];
          newImages[index] = { ...newImages[index], image_url: imageUrl };
          return { ...prev, images: newImages };
        });
      } else {
        setDraft((prev) => ({ ...prev, image_url: imageUrl }));
      }
      toast.success("Upload ảnh thành công");
    } catch (error) {
      console.error("Failed to upload image", error);
      toast.error("Upload ảnh thất bại");
    } finally {
      setUploadingImage(false);
    }
  }

  const addImage = () => {
    setDraft((prev) => ({
      ...prev,
      images: [...prev.images, { image_url: "", is_cover: false, sort_order: prev.images.length + 1 }]
    }));
  };

  const removeImage = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const toggleCover = (index: number) => {
    setDraft((prev) => {
      const newImages = prev.images.map((img, i) => ({
        ...img,
        is_cover: i === index ? !img.is_cover : false
      }));
      return { ...prev, images: newImages };
    });
  };

  const addFacility = () => {
    setDraft((prev) => ({
      ...prev,
      facilities: [...prev.facilities, { facility_name: "", description: "", images: [] }]
    }));
  };

  const removeFacility = (index: number) => {
    setDraft((prev) => ({
      ...prev,
      facilities: prev.facilities.filter((_, i) => i !== index)
    }));
  };

  const updateFacility = (index: number, field: 'facility_name' | 'description', value: string) => {
    setDraft((prev) => {
      const newFacilities = [...prev.facilities];
      newFacilities[index] = { ...newFacilities[index], [field]: value };
      return { ...prev, facilities: newFacilities };
    });
  };

  const addFacilityImage = (facilityIndex: number) => {
    setDraft((prev) => {
      const newFacilities = [...prev.facilities];
      const fac = newFacilities[facilityIndex];
      fac.images = [...(fac.images || []), { image_url: "", is_cover: false, sort_order: (fac.images || []).length + 1 }];
      return { ...prev, facilities: newFacilities };
    });
  };

  const removeFacilityImage = (facilityIndex: number, imageIndex: number) => {
    setDraft((prev) => {
      const newFacilities = [...prev.facilities];
      const fac = newFacilities[facilityIndex];
      fac.images = fac.images.filter((_, i) => i !== imageIndex);
      return { ...prev, facilities: newFacilities };
    });
  };

  const toggleFacilityCover = (facilityIndex: number, imageIndex: number) => {
    setDraft((prev) => {
      const newFacilities = [...prev.facilities];
      const fac = newFacilities[facilityIndex];
      fac.images = fac.images.map((img, i) => ({
        ...img,
        is_cover: i === imageIndex ? !img.is_cover : false
      }));
      return { ...prev, facilities: newFacilities };
    });
  };

  async function handleFacilityImageSelect(file: File | null | undefined, facilityIndex: number, imageIndex: number) {
    if (!file) return;

    try {
      setUploadingImage(true);
      const imageUrl = await uploadImageToCloudinary(file);
      setDraft((prev) => {
        const newFacilities = [...prev.facilities];
        const fac = newFacilities[facilityIndex];
        const newImages = [...(fac.images || [])];
        newImages[imageIndex] = { ...newImages[imageIndex], image_url: imageUrl };
        fac.images = newImages;
        return { ...prev, facilities: newFacilities };
      });
      toast.success("Upload ảnh tiện ích thành công");
    } catch (error) {
      console.error("Failed to upload facility image", error);
      toast.error("Upload ảnh tiện ích thất bại");
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
                  <TableHead className="hidden xl:table-cell">Nghỉ/tháng</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
                      Đang tải danh sách chi nhánh...
                    </TableCell>
                  </TableRow>
                ) : filteredBranches.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-sm text-muted-foreground">
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
                      <TableCell className="hidden xl:table-cell text-sm text-muted-foreground">
                        <Badge variant="outline" className="rounded-full tabular-nums">
                          {Number(branch.monthly_leave_limit ?? 0)} ngày
                        </Badge>
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

          <div className="grid gap-4 px-6 py-5 overflow-y-auto max-h-[55vh] [&::-webkit-scrollbar]:w-0 [scrollbar-width:none] [-ms-overflow-style:none]">
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

              <div className="flex items-center justify-between">
                <Label>Địa chỉ IP tĩnh công cộng (WiFi Chi nhánh)</Label>
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0 text-xs font-semibold text-emerald-600 hover:text-emerald-750"
                  onClick={detectCurrentIp}
                  disabled={fetchingIp}
                >
                  {fetchingIp ? "Đang lấy IP..." : "Lấy IP hiện tại của tôi"}
                </Button>
              </div>
              <Input
                value={draft.branch_ip}
                onChange={(e) => setDraft({ ...draft, branch_ip: e.target.value })}
                placeholder="Ví dụ: 14.232.12.89 (để trống nếu không bắt buộc điểm danh qua WiFi)"
              />
              <Label>Giới hạn số ngày nghỉ trong tháng</Label>
              <Input
                type="number"
                min={0}
                step={1}
                value={draft.monthly_leave_limit}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    monthly_leave_limit: Math.max(0, Number(e.target.value) || 0),
                  })
                }
                placeholder="Ví dụ: 4"
              />
              <p className="text-xs text-muted-foreground">
                Số ngày nghỉ tối đa nhân viên thuộc chi nhánh này được phép đăng ký trong mỗi tháng.
              </p>
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

            {/* Thư viện ảnh chi tiết */}
            <div className="mt-2 border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Thư viện ảnh chi nhánh</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addImage}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" /> Thêm ảnh chi tiết
                </Button>
              </div>

              {draft.images.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Chưa có hình ảnh chi tiết nào.</p>
              ) : (
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {draft.images.map((img, idx) => (
                    <div key={idx} className="relative rounded-md border p-3 space-y-2 bg-card">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeImage(idx)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>

                      <div className="flex items-center gap-3 pr-6">
                        {img.image_url ? (
                          <img
                            src={img.image_url}
                            alt=""
                            className="h-12 w-16 rounded object-cover border"
                          />
                        ) : (
                          <div className="flex h-12 w-16 items-center justify-center rounded border bg-muted text-muted-foreground">
                            <ImageIcon className="h-4 w-4" />
                          </div>
                        )}
                        <div className="relative flex-1">
                          <Button variant="outline" size="sm" type="button" className="w-full relative">
                            {uploadingImage ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : "Chọn ảnh"}
                            <input
                              type="file"
                              className="absolute inset-0 cursor-pointer opacity-0"
                              accept="image/*"
                              onChange={(e) => void handleImageSelect(e.target.files?.[0], idx)}
                              disabled={uploadingImage}
                            />
                          </Button>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`cover-${idx}`}
                          checked={img.is_cover || false}
                          onChange={() => toggleCover(idx)}
                          className="h-4 w-4 rounded border-gray-300 accent-primary"
                        />
                        <label htmlFor={`cover-${idx}`} className="text-xs select-none">
                          Đặt làm ảnh bìa thư viện
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tiện ích chi nhánh */}
            <div className="mt-2 border-t pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">Tiện ích chi nhánh</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addFacility}
                >
                  <Plus className="mr-2 h-3.5 w-3.5" /> Thêm tiện ích
                </Button>
              </div>

              {draft.facilities.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Chưa có tiện ích nào được thêm.</p>
              ) : (
                <div className="space-y-3">
                  {draft.facilities.map((fac, idx) => (
                    <div key={idx} className="flex flex-col gap-3 rounded-md border p-3 bg-card relative">
                      {/* Tiện ích Info */}
                      <div className="flex gap-2 items-start">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 flex-1">
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Tên tiện ích*</Label>
                            <Input
                              placeholder="Ví dụ: Bể bơi, Wifi..."
                              value={fac.facility_name}
                              onChange={(e) => updateFacility(idx, 'facility_name', e.target.value)}
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] text-muted-foreground uppercase">Mô tả ngắn</Label>
                            <Input
                              placeholder="Ví dụ: Bể bơi bốn mùa..."
                              value={fac.description || ""}
                              onChange={(e) => updateFacility(idx, 'description', e.target.value)}
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0 h-9 w-9 mt-5"
                          onClick={() => removeFacility(idx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Hình ảnh tiện ích */}
                      <div className="border-t pt-2 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-semibold text-muted-foreground">Hình ảnh của tiện ích này</span>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-6 text-[10px] px-2"
                            onClick={() => addFacilityImage(idx)}
                          >
                            <Plus className="mr-1 h-3 w-3" /> Thêm ảnh tiện ích
                          </Button>
                        </div>

                        {(!fac.images || fac.images.length === 0) ? (
                          <p className="text-[10px] text-muted-foreground italic pl-1">Chưa có ảnh tiện ích nào.</p>
                        ) : (
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                            {fac.images.map((img, imgIdx) => (
                              <div key={imgIdx} className="relative rounded border p-2 bg-background space-y-1">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-1 top-1 h-5 w-5 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeFacilityImage(idx, imgIdx)}
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>

                                <div className="flex items-center gap-2 pr-6">
                                  {img.image_url ? (
                                    <img
                                      src={img.image_url}
                                      alt=""
                                      className="h-8 w-12 rounded object-cover border"
                                    />
                                  ) : (
                                    <div className="flex h-8 w-12 items-center justify-center rounded border bg-muted text-muted-foreground">
                                      <ImageIcon className="h-3.5 w-3.5" />
                                    </div>
                                  )}
                                  <div className="relative flex-1">
                                    <Button variant="outline" size="sm" type="button" className="w-full h-7 text-[10px] px-2 relative">
                                      {uploadingImage ? <Loader2 className="mr-1 h-2.5 w-2.5 animate-spin" /> : "Chọn ảnh"}
                                      <input
                                        type="file"
                                        className="absolute inset-0 cursor-pointer opacity-0"
                                        accept="image/*"
                                        onChange={(e) => void handleFacilityImageSelect(e.target.files?.[0], idx, imgIdx)}
                                        disabled={uploadingImage}
                                      />
                                    </Button>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1.5 pl-0.5">
                                  <input
                                    type="checkbox"
                                    id={`fac-cover-${idx}-${imgIdx}`}
                                    checked={img.is_cover || false}
                                    onChange={() => toggleFacilityCover(idx, imgIdx)}
                                    className="h-3 w-3 rounded border-gray-300 accent-primary"
                                  />
                                  <label htmlFor={`fac-cover-${idx}-${imgIdx}`} className="text-[10px] select-none">
                                    Ảnh bìa tiện ích
                                  </label>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  Chi tiết chi nhánh
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
            </DialogHeader>
          </div>

          {detailLoading ? (
            <div className="px-6 py-8 text-center text-sm text-muted-foreground">
              Đang tải chi tiết...
            </div>
          ) : detailBranch ? (
            <div className="grid gap-5 px-6 pb-6 pt-4 overflow-y-auto max-h-[60vh] [&::-webkit-scrollbar]:w-0 [scrollbar-width:none] [-ms-overflow-style:none]">
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
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    Nghỉ/tháng
                  </div>
                  <div className="mt-1 text-2xl font-semibold tabular-nums">
                    {Number(detailBranch.monthly_leave_limit ?? 0)} ngày
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Địa chỉ cụ thể
                </div>
                <div className="text-base leading-7 text-foreground">
                  {detailBranch.address}
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Khu vực
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

              {/* Thư viện ảnh chi nhánh */}
              {(detailBranch as any).images && (detailBranch as any).images.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Thư viện ảnh chi nhánh
                  </div>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {(detailBranch as any).images.map((img: any, idx: number) => (
                      <div key={idx} className="relative aspect-video rounded-md overflow-hidden border bg-muted">
                        <img
                          src={img.image_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                        {img.is_cover && (
                          <Badge className="absolute left-1.5 top-1.5 text-[9px] px-1.5 py-0" variant="default">
                            Bìa
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Tiện ích chi nhánh */}
              {(detailBranch as any).facilities && (detailBranch as any).facilities.length > 0 && (
                <div className="space-y-3 border-t pt-4">
                  <div className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    Tiện ích chi nhánh
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {(detailBranch as any).facilities.map((fac: any, idx: number) => (
                      <div key={idx} className="rounded-md border p-3 bg-muted/30 space-y-3">
                        <div>
                          <div className="font-semibold text-sm text-foreground">{fac.facility_name}</div>
                          {fac.description && (
                            <div className="text-xs text-muted-foreground mt-0.5">{fac.description}</div>
                          )}
                        </div>

                        {fac.images && fac.images.length > 0 && (
                          <div className="space-y-1.5">
                            <div className="text-[10px] text-muted-foreground uppercase font-medium">Ảnh tiện ích:</div>
                            <div className="grid grid-cols-3 gap-1">
                              {fac.images.map((img: any, imgIdx: number) => (
                                <div key={imgIdx} className="relative aspect-video rounded overflow-hidden border bg-muted">
                                  <img
                                    src={img.image_url}
                                    alt=""
                                    className="h-full w-full object-cover"
                                  />
                                  {img.is_cover && (
                                    <span className="absolute left-1 top-1 bg-primary text-[8px] text-primary-foreground px-1 py-0 rounded">
                                      Bìa
                                    </span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

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
