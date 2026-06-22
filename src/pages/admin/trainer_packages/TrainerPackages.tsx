import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { trainerPackagesApi, type TrainerPackage } from '@/api/trainerPackages';
import { TrainerPackageFormDialog } from './TrainerPackageFormDialog';
import { TrainerPackageDetailDialog } from './TrainerPackageDetailDialog';

const TRAINER_LEVELS: TrainerPackage['trainer_level'][] = ['junior', 'senior', 'master'];
const TRAINER_MODES: TrainerPackage['mode'][] = ['1-on-1', 'group'];

function formatVND(value: number) {
  return new Intl.NumberFormat('vi-VN').format(Math.round(value)) + ' VND';
}

const emptyDraft: Partial<TrainerPackage> = {
  package_name: '',
  session_count: 1,
  package_price: 0,
  duration_days: 30,
  trainer_level: 'junior',
  mode: '1-on-1',
  description: '',
  is_active: true,
};

function TrainerPackages() {
  const [packages, setPackages] = useState<TrainerPackage[]>([]);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<TrainerPackage | null>(null);
  const [draft, setDraft] = useState<Partial<TrainerPackage>>(emptyDraft);

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      const response = await trainerPackagesApi.getAll();
      setPackages(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Không tải được gói PT');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const filteredPackages = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return packages;

    return packages.filter((pkg) =>
      [pkg.package_name, pkg.description, pkg.trainer_level, pkg.mode]
        .filter((field): field is string => typeof field === 'string')
        .some((field) => field.toLowerCase().includes(q)),
    );
  }, [packages, query]);

  const pricePerSession = useMemo(() => {
    if (!draft.session_count || draft.session_count <= 0) return 0;
    return Math.round((draft.package_price ?? 0) / draft.session_count);
  }, [draft.package_price, draft.session_count]);

  const startCreate = () => {
    setEditing(false);
    setDraft(emptyDraft);
    setFormOpen(true);
  };

  const startEdit = (pkg: TrainerPackage) => {
    setEditing(true);
    setDraft(pkg);
    setFormOpen(true);
  };

  const openDetail = (pkg: TrainerPackage) => {
    setSelectedPackage(pkg);
    setDetailOpen(true);
  };

  const submit = async () => {
    try {
      if (!draft.package_name?.trim()) {
        toast.error('Tên gói PT là bắt buộc');
        return;
      }
      if (!draft.session_count || draft.session_count <= 0) {
        toast.error('Số buổi phải lớn hơn 0');
        return;
      }
      if (draft.package_price === undefined || draft.package_price < 0) {
        toast.error('Giá gói phải lớn hơn hoặc bằng 0');
        return;
      }
      if (!draft.duration_days || draft.duration_days <= 0) {
        toast.error('Thời hạn phải lớn hơn 0');
        return;
      }
      if (!draft.trainer_level) {
        toast.error('Chọn cấp độ huấn luyện viên');
        return;
      }
      if (!draft.mode) {
        toast.error('Chọn hình thức PT');
        return;
      }

      const payload = {
        package_name: draft.package_name,
        session_count: draft.session_count,
        package_price: draft.package_price,
        trainer_level: draft.trainer_level,
        mode: draft.mode,
        description: draft.description,
        duration_days: draft.duration_days,
        is_active: draft.is_active,
      };

      if (editing && draft.id) {
        await trainerPackagesApi.update(draft.id, payload);
        toast.success('Gói PT đã được cập nhật');
      } else {
        await trainerPackagesApi.create(payload as any);
        toast.success('Gói PT đã được tạo');
      }

      setFormOpen(false);
      fetchPackages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Lưu gói PT thất bại');
      console.error(error);
    }
  };

  const toggleActive = async (pkg: TrainerPackage) => {
    try {
      await trainerPackagesApi.update(pkg.id, { is_active: !pkg.is_active });
      fetchPackages();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Cập nhật trạng thái thất bại');
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gói PT</h1>
          <p className="text-sm text-muted-foreground">
            {packages.length} gói · Quản lý gói PT cá nhân
          </p>
        </div>
        <Button size="sm" onClick={startCreate}>
          <Plus className="mr-2 h-3 w-3" />
          Tạo gói PT
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tất cả gói PT</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Tìm theo tên, cấp độ, hình thức…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="rounded-xl bg-card shadow-[0_2px_12px_rgba(15,23,42,0.08)] overflow-x-auto admin-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gói</TableHead>
                  <TableHead>Cấp độ</TableHead>
                  <TableHead>Hình thức</TableHead>
                  <TableHead className="text-right">Số buổi</TableHead>
                  <TableHead className="text-right">Thời hạn</TableHead>
                  <TableHead className="text-right">Giá/buổi</TableHead>
                  <TableHead className="text-right">Tổng giá</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="w-32" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPackages.map((pkg) => (
                  <TableRow key={pkg.id}>
                    <TableCell>
                      <div className="font-medium">{pkg.package_name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1 max-w-xs">
                        {pkg.description}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{pkg.trainer_level}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="gap-1">
                        {pkg.mode}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{pkg.session_count}</TableCell>
                    <TableCell className="text-right tabular-nums">{pkg.duration_days} ngày</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">
                      {formatVND(pkg.price_per_session)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums font-medium">
                      {formatVND(pkg.package_price)}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => toggleActive(pkg)}
                        className="cursor-pointer"
                        title="Chuyển đổi trạng thái"
                      >
                        <Badge
                          variant={pkg.is_active ? 'default' : 'secondary'}
                          className={
                            pkg.is_active
                              ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }
                        >
                          {pkg.is_active ? 'Hoạt động' : 'Không hoạt động'}
                        </Badge>
                      </button>
                    </TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openDetail(pkg)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => startEdit(pkg)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPackages.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-sm text-muted-foreground py-8">
                      {loading ? 'Đang tải gói...' : 'Không tìm thấy gói PT.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <TrainerPackageFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editing={editing}
        draft={draft}
        setDraft={setDraft}
        onSubmit={submit}
      />
      <TrainerPackageDetailDialog
        open={detailOpen}
        onOpenChange={setDetailOpen}
        pkg={selectedPackage}
      />
    </div>
  );
}

export default TrainerPackages;
