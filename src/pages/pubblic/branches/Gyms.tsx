import { useEffect, useState, useTransition } from "react";
import { Link } from "react-router-dom";
import { Navbar } from "@/components/site/Navbar";
import { Footer } from "@/components/site/Footer";
import { slugify } from "@/utils/slugify";
import {
  MapPin,
  Phone,
  Clock,
  Search,
  Building2,
  X,
  ChevronLeft,
  ChevronRight,
  Activity,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useProvinces } from "@/lib/vn-locations";
import { branchesApi } from "@/api/branches";
import { toast } from "sonner";
import { motion } from "framer-motion";


interface Branch {
  id: number;
  branch_name: string;
  address: string;
  province: string;
  district: string;
  hotline?: string;
  opening_house?: string;
  image_url?: string;
}

export default function Gyms() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [, startTransition] = useTransition();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("all");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const limit = 6;

  const { provinces, loading: loadingProvinces } = useProvinces();

  const activeProvinceObj = provinces.find((p) => p.name === selectedProvince);

  // Fetch branches from backend
  const fetchBranches = async (page = 1) => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm.trim() || undefined,
        province: selectedProvince !== "all" ? selectedProvince : undefined,
        district: selectedDistrict !== "all" ? selectedDistrict : undefined,
        page,
        limit,
        status: "active",
      };

      const response = await branchesApi.getAll(params);
      const resData = response.data;

      if (resData && typeof resData === "object" && "branches" in resData) {
        setBranches(resData.branches || []);
        setCurrentPage(resData.meta?.page || 1);
        setTotalPages(resData.meta?.totalPages || 1);
        setTotalCount(resData.meta?.total || 0);
      } else if (Array.isArray(resData)) {
        setBranches(resData);
        setTotalPages(1);
        setCurrentPage(1);
        setTotalCount(resData.length);
      } else {
        setBranches([]);
        setTotalPages(1);
        setCurrentPage(1);
        setTotalCount(0);
      }
    } catch (error) {
      console.error("Error fetching branches:", error);
      toast.error("Không thể kết nối máy chủ để tải danh sách chi nhánh.");
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch on query change
  useEffect(() => {
    fetchBranches(1);
  }, [searchTerm, selectedProvince, selectedDistrict]);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      fetchBranches(page);
      window.scrollTo({ top: 300, behavior: "smooth" });
    }
  };

  const handleResetFilters = () => {
    startTransition(() => {
      setSearchTerm("");
      setSelectedProvince("all");
      setSelectedDistrict("all");
    });
  };



  return (
    <div className="relative min-h-screen bg-slate-50/40 text-slate-900 font-sans selection:bg-emerald-500 selection:text-white overflow-hidden">
      {/* Global Moving Grid Background */}
      <div className="absolute inset-0 bg-grid-animated opacity-[0.25] pointer-events-none z-0" />
      
      <Navbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-transparent py-20 md:py-28 border-b border-slate-100 z-10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.06),transparent_60%)]" />
        <div className="absolute top-1/4 left-1/4 h-72 w-72 rounded-full bg-emerald-500/5 blur-[80px]" />
        
        <div className="relative mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-50/80 px-4 py-1.5 text-xs font-semibold text-emerald-700 backdrop-blur-md"
          >
            <Activity className="h-3.5 w-3.5 text-emerald-600 animate-pulse" />
            HỆ THỐNG PHÒNG TẬP CAO CẤP
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-6 text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl text-slate-900"
          >
            Tìm <span className="bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">Không Gian Tập Luyện</span> Gần Bạn Nhất
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mx-auto mt-4 max-w-2xl text-lg text-slate-500"
          >
            OmniGym sở hữu hệ thống phòng tập hiện đại bậc nhất, phân bố rộng khắp với đầy đủ tiện ích chuẩn 5 sao hỗ trợ tối đa cho hành trình bứt phá của bạn.
          </motion.p>
        </div>
      </section>

      {/* Filter & Search Bar */}
      <section className="relative -mt-10 px-4 sm:px-6 lg:px-8 z-10">
        <div className="mx-auto max-w-7xl">
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-xl backdrop-blur-xl">
            <div className="grid gap-4 md:grid-cols-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Tìm tên chi nhánh, địa chỉ..."
                  className="w-full border-slate-200 bg-slate-50 pl-10 pr-4 text-slate-800 placeholder:text-slate-400 focus-visible:ring-emerald-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Province Selector */}
              <div>
                <Select
                  value={selectedProvince}
                  onValueChange={(val) => {
                    setSelectedProvince(val);
                    setSelectedDistrict("all");
                  }}
                >
                  <SelectTrigger className="w-full border-slate-200 bg-slate-50 text-slate-800 focus:ring-emerald-500">
                    <SelectValue placeholder={loadingProvinces ? "Đang tải tỉnh thành..." : "Chọn Tỉnh / Thành"} />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-800 border-slate-100">
                    <SelectItem value="all">Tất cả Tỉnh / Thành</SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p.code} value={p.name}>
                        {p.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Selector */}
              <div>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={selectedProvince === "all"}
                >
                  <SelectTrigger className="w-full border-slate-200 bg-slate-50 text-slate-800 focus:ring-emerald-500 disabled:opacity-50">
                    <SelectValue placeholder="Chọn Quận / Huyện" />
                  </SelectTrigger>
                  <SelectContent className="bg-white text-slate-800 border-slate-100">
                    <SelectItem value="all">Tất cả Quận / Huyện</SelectItem>
                    {activeProvinceObj?.districts.map((d) => (
                      <SelectItem key={d.code} value={d.name}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Clear button */}
              <Button
                variant="outline"
                className="w-full border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl"
                onClick={handleResetFilters}
              >
                Đặt lại bộ lọc
              </Button>
            </div>

            {/* Results count indicator */}
            {!loading && (
              <div className="mt-4 text-sm text-slate-500">
                Tìm thấy <span className="font-semibold text-emerald-650">{totalCount}</span> chi nhánh phù hợp
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Listing Grid */}
      <main className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 z-10">
        {loading ? (
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 space-y-4 shadow-sm">
                <div className="h-48 rounded-xl bg-slate-100" />
                <div className="h-6 w-3/4 rounded bg-slate-100" />
                <div className="h-4 w-1/2 rounded bg-slate-100" />
                <div className="h-10 rounded bg-slate-100" />
              </div>
            ))}
          </div>
        ) : branches.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-slate-100 p-8 shadow-sm">
            <Building2 className="mx-auto h-16 w-16 text-slate-300" />
            <h3 className="mt-4 text-xl font-semibold text-slate-700">Không tìm thấy chi nhánh nào</h3>
            <p className="mt-2 text-slate-500">Hãy thử nhập từ khóa khác hoặc xóa bộ lọc.</p>
            <Button
              className="mt-6 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold rounded-full px-6 transition-all hover:scale-[1.02]"
              onClick={handleResetFilters}
            >
              Xem tất cả chi nhánh
            </Button>
          </div>
        ) : (
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: { opacity: 0 },
              show: {
                opacity: 1,
                transition: { staggerChildren: 0.08 },
              },
            }}
            className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3"
          >
            {branches.map((branch) => (
              <motion.div
                key={branch.id}
                variants={{
                  hidden: { opacity: 0, y: 25 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
                }}
              >
                <Card className="group overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm transition-all duration-350 hover:-translate-y-1.5 hover:shadow-xl hover:border-emerald-500/20">
                  <div className="relative h-52 w-full overflow-hidden bg-slate-50">
                    {branch.image_url ? (
                      <img
                        src={branch.image_url}
                        alt={branch.branch_name}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-slate-300">
                        <Building2 className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-slate-900/10 to-transparent" />
                    
                    <div className="absolute bottom-3 left-4 right-4 flex flex-wrap gap-1.5">
                      <Badge className="bg-emerald-50/90 text-emerald-700 border border-emerald-500/20 rounded-full text-[10px] px-2.5 py-0.5 font-medium">
                        {branch.province}
                      </Badge>
                      {branch.district && (
                        <Badge className="bg-white/95 text-slate-600 border border-slate-200 rounded-full text-[10px] px-2.5 py-0.5 font-medium">
                          {branch.district}
                        </Badge>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <h3 className="text-xl font-bold text-slate-850 group-hover:text-emerald-600 transition-colors">
                      {branch.branch_name}
                    </h3>
                    
                    <div className="mt-4 space-y-2.5 text-sm text-slate-500">
                      <div className="flex items-start gap-2.5">
                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="line-clamp-2 text-slate-600">{branch.address}</span>
                      </div>
                      
                      <div className="flex items-center gap-2.5">
                        <Phone className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-slate-600">{branch.hotline || "1900 xxxx (Chưa cấu hình)"}</span>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <Clock className="h-4 w-4 shrink-0 text-emerald-600" />
                        <span className="text-slate-600">Giờ mở cửa: {branch.opening_house || "06:00 - 22:00"}</span>
                      </div>
                    </div>

                    <Link to={`/gyms/${slugify(branch.branch_name || "")}`} className="block mt-6">
                      <Button
                        className="w-full group bg-primary hover:bg-primary/95 text-primary-foreground font-medium rounded-xl transition-all duration-300 py-5 hover:scale-[1.01] active:scale-[0.99]"
                      >
                        <span>Khám phá chi nhánh</span>
                        <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="mt-16 flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === 1 || loading}
              onClick={() => handlePageChange(currentPage - 1)}
              className="border-slate-200 hover:bg-slate-50 text-slate-650"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {Array.from({ length: totalPages }, (_, idx) => idx + 1).map((p) => (
              <Button
                key={p}
                variant={currentPage === p ? "default" : "outline"}
                onClick={() => handlePageChange(p)}
                className={`h-9 w-9 rounded-md font-medium text-sm transition-all ${
                  currentPage === p
                    ? "bg-primary hover:bg-primary/95 text-primary-foreground"
                    : "border-slate-200 hover:bg-slate-50 text-slate-650"
                }`}
                disabled={loading}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline"
              size="icon"
              disabled={currentPage === totalPages || loading}
              onClick={() => handlePageChange(currentPage + 1)}
              className="border-slate-200 hover:bg-slate-50 text-slate-650"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </main>

      <Footer />


    </div>
  );
}
