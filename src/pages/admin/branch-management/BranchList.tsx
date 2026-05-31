import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Search, MapPin, Phone, Clock, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { branchesApi } from "@/api/branches";
import { toast } from "sonner";

export default function BranchList() {
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const response = await branchesApi.getAll();
      setBranches(response.data);
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

  const filteredBranches = branches.filter((branch) =>
    branch.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    branch.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Quản lý chi nhánh</h1>
          <p className="text-sm text-muted-foreground">
            Danh sách và thông tin các chi nhánh trong hệ thống
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/branch-management/create">
            <Plus className="mr-2 h-4 w-4" /> Thêm chi nhánh
          </Link>
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm kiếm chi nhánh..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tên chi nhánh</TableHead>
                <TableHead>Địa chỉ</TableHead>
                <TableHead>Liên hệ</TableHead>
                <TableHead>Giờ mở cửa</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : filteredBranches.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-24 text-center">
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
                            alt=""
                            className="h-10 w-10 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-10 w-10 items-center justify-center rounded-md bg-muted">
                            <Building2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{branch.branch_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        {branch.address}, {branch.district}, {branch.province}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        {branch.hotline}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {branch.opening_house}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/admin/branch-management/edit/${branch.id}`}>
                          Chỉnh sửa
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
