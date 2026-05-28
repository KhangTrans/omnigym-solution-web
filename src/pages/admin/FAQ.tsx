import { useCallback, useEffect, useMemo, useState } from "react";
import type { AxiosError } from "axios";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import {
  CircleHelp,
  Eye,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import api from "@/api/axios";

type FaqApiItem = {
  id: number;
  created_by: number;
  title: string;
  content: string;
  category: string;
  view_count: number;
  is_published: boolean;
  published_at: string | null;
  created_at: string;
  creator?: {
    id: number;
    full_name: string | null;
    email: string | null;
  } | null;
};

type FaqItem = {
  id: number;
  createdBy: number;
  authorName: string;
  authorEmail: string;
  title: string;
  content: string;
  category: string;
  viewCount: number;
  isPublished: boolean;
  publishedAt: string | null;
  createdAt: string;
};


type ApiErrorResponse = {
  message?: string;
};

function getApiErrorMessage(error: unknown, fallback: string) {
  const axiosError = error as AxiosError<ApiErrorResponse>;
  return axiosError.response?.data?.message ??
    (error instanceof Error ? error.message : fallback);
}

function formatDate(value: string | null) {
  if (!value) return "Chưa xuất bản";
  return new Date(value).toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function mapFaq(item: FaqApiItem): FaqItem {
  return {
    id: item.id,
    createdBy: item.created_by,
    authorName: item.creator?.full_name?.trim() || "Không rõ",
    authorEmail: item.creator?.email?.trim() || "Không rõ",
    title: item.title,
    content: item.content,
    category: item.category,
    viewCount: item.view_count,
    isPublished: item.is_published,
    publishedAt: item.published_at,
    createdAt: item.created_at,
  };
}

function FaqAdminPage() {
  const [items, setItems] = useState<FaqItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "published" | "draft">("all");
  const [category, setCategory] = useState<string>("all");

  const categories = useMemo(() => {
    return Array.from(new Set(items.map((item) => item.category))).filter(Boolean);
  }, [items]);

  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return items.filter((item) => {
      const matchesKeyword =
        !keyword ||
        item.title.toLowerCase().includes(keyword) ||
        item.content.toLowerCase().includes(keyword) ||
        item.category.toLowerCase().includes(keyword) ||
        item.authorEmail.toLowerCase().includes(keyword);
      const matchesStatus =
        status === "all" ||
        (status === "published" ? item.isPublished : !item.isPublished);
      const matchesCategory = category === "all" || item.category === category;
      return matchesKeyword && matchesStatus && matchesCategory;
    });
  }, [items, query, status, category]);

  const stats = useMemo(() => {
    const published = items.filter((item) => item.isPublished).length;
    const drafts = items.length - published;
    const totalViews = items.reduce((sum, item) => sum + item.viewCount, 0);
    return { published, drafts, totalViews };
  }, [items]);

  const loadFaqs = useCallback(async () => {
    try {
      setLoading(true);

      const params: Record<string, string> = {};

      if (category !== "all") {
        params.category = category;
      }

      if (status === "published") {
        params.is_published = "true";
      }

      if (status === "draft") {
        params.is_published = "false";
      }

      const response = await api.get<FaqApiItem[]>("/faqs", { params });
      setItems(response.data.map(mapFaq));
    } catch (error: unknown) {
      toast.error(getApiErrorMessage(error, "Không thể tải danh sách FAQ"));
    } finally {
      setLoading(false);
    }
  }, [category, status]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadFaqs();
    }, 0);

    return () => window.clearTimeout(timer);
  }, [loadFaqs]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">FAQ Management</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý câu hỏi thường gặp cho website và ứng dụng người dùng.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Tổng FAQ</div>
            <div className="mt-2 text-3xl font-bold">{items.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Đã xuất bản / nháp</div>
            <div className="mt-2 text-3xl font-bold">
              {stats.published} / {stats.drafts}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Tổng lượt xem</div>
            <div className="mt-2 flex items-center gap-2 text-3xl font-bold">
              <Eye className="h-5 w-5 text-muted-foreground" />
              {stats.totalViews.toLocaleString("vi-VN")}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Danh sách FAQ</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 lg:grid-cols-[1fr_180px_180px]">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tìm theo tiêu đề, nội dung, danh mục..."
                className="pl-9"
              />
            </div>
            <Select value={status} onValueChange={(value) => setStatus(value as typeof status)}>
              <SelectTrigger>
                <SelectValue placeholder="Trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="published">Đã xuất bản</SelectItem>
                <SelectItem value="draft">Bản nháp</SelectItem>
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                {categories.map((item) => (
                  <SelectItem key={item} value={item}>
                    {item}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="rounded-md bg-card shadow-[0_2px_10px_rgba(15,23,42,0.10)]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Câu hỏi</TableHead>
                  <TableHead className="hidden md:table-cell">Danh mục</TableHead>
                  <TableHead className="hidden md:table-cell">Tác giả</TableHead>
                  <TableHead className="hidden lg:table-cell">Ngày tạo</TableHead>
                  <TableHead className="hidden xl:table-cell">Xuất bản</TableHead>
                  <TableHead className="text-right">Lượt xem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Đang tải danh sách FAQ...
                      </div>
                    </TableCell>
                  </TableRow>
                )}
                {!loading &&
                  filtered.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{item.title}</span>
                            <Badge variant={item.isPublished ? "default" : "secondary"}>
                              {item.isPublished ? "Published" : "Draft"}
                            </Badge>
                          </div>
                          <p className="line-clamp-2 max-w-xl text-xs text-muted-foreground">
                            {item.content}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant="outline">{item.category}</Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="space-y-1">
                          <div className="font-medium">{item.authorName}</div>
                          <div className="text-xs text-muted-foreground">{item.authorEmail}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">{formatDate(item.createdAt)}</TableCell>
                      <TableCell className="hidden xl:table-cell">{formatDate(item.publishedAt)}</TableCell>
                      <TableCell className="text-right tabular-nums">{item.viewCount}</TableCell>
                    </TableRow>
                  ))}
                {!loading && filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <CircleHelp className="h-8 w-8" />
                        Không tìm thấy FAQ phù hợp.
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

    </div>
  );
}

export default FaqAdminPage;
