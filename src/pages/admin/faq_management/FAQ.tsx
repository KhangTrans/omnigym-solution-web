import { useEffect, useMemo, useState } from "react";
import api from "../../../api/axios";
import { Badge } from "../../../components/ui/badge";
import { Card, CardContent } from "../../../components/ui/card";
import { cn } from "../../../utils/cn";
import { ChevronDown, Edit3, Eye, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

// Import new separated components
import { FaqFormDialog, FaqItem, FaqStatus } from "./components/FaqFormDialog";
import { FaqDetailDialog } from "./components/FaqDetailDialog";
import { FaqDeleteDialog } from "./components/FaqDeleteDialog";

type DbFaq = {
  id: number;
  title: string;
  content: string;
  category: string;
  view_count?: number;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
  creator?: {
    full_name?: string;
    email?: string;
  };
};

const mapDbFaqToFaqItem = (faq: DbFaq): FaqItem => ({
  id: String(faq.id),
  question: faq.title,
  answer: faq.content,
  category: faq.category,
  status: faq.is_published ? "Published" : "Draft",
  views: faq.view_count ?? 0,
  author: {
    name: faq.creator?.full_name ?? "Admin System",
    email: faq.creator?.email ?? "",
  },
  updatedAt: faq.updated_at
    ? new Intl.DateTimeFormat("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(faq.updated_at))
    : faq.created_at
      ? new Intl.DateTimeFormat("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(faq.created_at))
      : "",
});

const STATUS_LABELS: Record<FaqStatus, string> = {
  Published: "Đã xuất bản",
  Draft: "Bản nháp",
};

const FAQ = () => {
  const [statusFilter, setStatusFilter] = useState<"Tất cả" | FaqStatus>("Tất cả");
  const [categoryFilter, setCategoryFilter] = useState<"Tất cả" | string>("Tất cả");
  const [openId, setOpenId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");

  // Dialog State
  const [selectedFaq, setSelectedFaq] = useState<FaqItem | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "update">("create");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showDetail, setShowDetail] = useState(false);

  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setIsLoading(true);
        setLoadMessage("");
        const response = await api.get<DbFaq[]>("/faqs");
        setFaqs(response.data.map(mapDbFaqToFaqItem));
      } catch {
        setLoadMessage("Không thể tải danh sách FAQ từ dữ liệu.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const filteredFaqs = useMemo(() => {
    return faqs.filter((faq) => {
      const matchesStatus = statusFilter === "Tất cả" || faq.status === statusFilter;
      const matchesCategory = categoryFilter === "Tất cả" || faq.category === categoryFilter;

      return matchesStatus && matchesCategory;
    });
  }, [categoryFilter, faqs, statusFilter]);

  const publishedCount = faqs.filter((faq) => faq.status === "Published").length;
  const draftCount = faqs.length - publishedCount;
  const totalViews = faqs.reduce((sum, faq) => sum + faq.views, 0);
  const categories = Array.from(new Set(faqs.map((faq) => faq.category)));
  const statusOptions: Array<"Tất cả" | FaqStatus> = ["Tất cả", "Published", "Draft"];

  const openCreateForm = () => {
    setFormMode("create");
    setSelectedFaq(null);
    setShowForm(true);
  };

  const openUpdateForm = (faq: FaqItem) => {
    setFormMode("update");
    setSelectedFaq(faq);
    setShowForm(true);
  };

  const openDeleteConfirm = (faq: FaqItem) => {
    setSelectedFaq(faq);
    setShowDelete(true);
  };

  const handleSubmitFaq = async (payload: { title: string; content: string; category: string; is_published: boolean }) => {
    setIsSubmitting(true);
    try {
      const isUpdate = formMode === "update";
      const response = isUpdate && selectedFaq
        ? await api.put<DbFaq>(`/faqs/${selectedFaq.id}`, payload)
        : await api.post<DbFaq>("/faqs", payload);

      const savedFaq = mapDbFaqToFaqItem(response.data);

      setFaqs((currentFaqs) => {
        if (isUpdate) {
          return currentFaqs.map((faq) => (faq.id === savedFaq.id ? savedFaq : faq));
        }
        return [savedFaq, ...currentFaqs];
      });

      toast.success(isUpdate ? "Cập nhật FAQ thành công." : "Tạo FAQ thành công.");
      setShowForm(false);
    } catch (error) {
      console.error("Failed to submit FAQ:", error);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteFaq = async () => {
    if (!selectedFaq) return;
    setIsDeleting(true);
    try {
      await api.delete(`/faqs/${selectedFaq.id}`);
      setFaqs((currentFaqs) => currentFaqs.filter((faq) => faq.id !== selectedFaq.id));
      setOpenId((currentOpenId) => (currentOpenId === selectedFaq.id ? null : currentOpenId));
      toast.success("Xóa FAQ thành công.");
      setShowDelete(false);
      setSelectedFaq(null);
    } catch (error: any) {
      console.error("Failed to delete FAQ:", error);
      const msg = error.response?.data?.message || "Không thể xóa FAQ. Vui lòng thử lại.";
      toast.error(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý FAQ</h1>
          <p className="text-sm text-muted-foreground">
            Quản lý câu hỏi thường gặp cho website và ứng dụng người dùng.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateForm}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Tạo FAQ
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <CardContent className="p-5">
            <p className="text-sm text-foreground">Tổng FAQ</p>
            <div className="mt-3 text-3xl font-bold tabular-nums">{faqs.length}</div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <CardContent className="p-5">
            <p className="text-sm text-foreground">Đã xuất bản / nháp</p>
            <div className="mt-3 text-3xl font-bold tabular-nums">
              {publishedCount} / {draftCount}
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <CardContent className="p-5">
            <p className="text-sm text-foreground">Tổng lượt xem</p>
            <div className="mt-3 flex items-center gap-3 text-3xl font-bold tabular-nums">
              <Eye className="h-6 w-6" />
              {totalViews}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-6 p-5">
          <div className="rounded-2xl bg-muted/30 p-4">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-4">
              <div className="min-w-0 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Trạng thái
                </div>
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as "Tất cả" | FaqStatus)}
                  className="block h-11 w-full min-w-0 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>
                      {status === "Tất cả" ? status : STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>

              <div className="min-w-0 space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Danh mục
                </div>
                <select
                  value={categoryFilter}
                  onChange={(event) => setCategoryFilter(event.target.value as "Tất cả" | string)}
                  className="block h-11 w-full min-w-0 rounded-xl border border-border bg-background px-4 text-sm font-medium text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                >
                  {["Tất cả", ...categories].map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md">
            <div className="grid grid-cols-12 border-b px-2 py-3 text-sm font-semibold">
              <div className="col-span-12 lg:col-span-6">Câu hỏi</div>
              <div className="hidden translate-x-6 text-center lg:col-span-1 lg:block">Trạng thái</div>
              <div className="hidden translate-x-6 text-center lg:col-span-1 lg:block">Danh mục</div>
              <div className="hidden translate-x-6 lg:col-span-2 lg:block">Tác giả</div>
              <div className="hidden text-center lg:col-span-2 lg:block">Thao tác</div>
            </div>

            <div className="divide-y">
              {isLoading && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Đang tải danh sách FAQ...
                </div>
              )}

              {!isLoading && loadMessage && (
                <div className="py-10 text-center text-sm text-red-600">
                  {loadMessage}
                </div>
              )}

              {!isLoading && !loadMessage && filteredFaqs.map((faq) => {
                const expanded = openId === faq.id;

                return (
                  <div key={faq.id}>
                    <div className="grid w-full grid-cols-12 gap-4 px-2 py-4 transition-colors hover:bg-muted/40">
                      <button
                        type="button"
                        onClick={() => setOpenId(expanded ? null : faq.id)}
                        className="col-span-12 min-w-0 text-left lg:col-span-6"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold leading-tight">{faq.question}</span>
                          <ChevronDown
                            className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
                          />
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{faq.answer}</p>
                      </button>

                      <div className="col-span-6 flex items-start justify-start lg:col-span-1 lg:translate-x-6 lg:justify-center">
                        <Badge
                          className={cn(
                            "inline-flex w-24 justify-center rounded-full border-0 px-3 py-1 text-xs",
                            faq.status === "Published"
                              ? "bg-emerald-600 text-white hover:bg-emerald-600"
                              : "bg-muted text-foreground hover:bg-muted",
                          )}
                        >
                          {STATUS_LABELS[faq.status]}
                        </Badge>
                      </div>

                      <div className="col-span-6 flex items-start justify-end lg:col-span-1 lg:translate-x-6 lg:justify-center">
                        <Badge variant="secondary" className="rounded-full bg-background shadow-sm">
                          {faq.category}
                        </Badge>
                      </div>

                      <div className="col-span-8 text-sm lg:col-span-2 lg:translate-x-6">
                        <div className="font-semibold">{faq.author.name}</div>
                        <div className="text-xs text-muted-foreground">{faq.author.email}</div>
                      </div>

                      <div className="col-span-4 flex flex-nowrap justify-end gap-2 lg:col-span-2 lg:justify-center">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFaq(faq);
                            setShowDetail(true);
                          }}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                          title="Xem chi tiết"
                        >
                          <Eye className="h-3.5 w-3.5 text-blue-600" />
                          Xem
                        </button>
                        <button
                          type="button"
                          onClick={() => openUpdateForm(faq)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Sửa
                        </button>
                        <button
                          type="button"
                          onClick={() => openDeleteConfirm(faq)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 text-xs font-semibold text-red-600 shadow-sm transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-70"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Xóa
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="grid gap-4 bg-muted/30 px-4 pb-5 pt-1 text-sm lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="rounded-lg bg-background p-4 shadow-sm">
                          <div className="mb-2 font-semibold">Chi tiết câu trả lời</div>
                          <p className="whitespace-pre-line leading-7 text-muted-foreground">{faq.answer}</p>
                        </div>
                        <div className="rounded-lg bg-background p-4 shadow-sm">
                          <div className="font-semibold">Thông tin</div>
                          <dl className="mt-3 space-y-2 text-muted-foreground">
                            <div className="grid grid-cols-[92px_minmax(0,1fr)] items-start gap-3">
                              <dt className="whitespace-nowrap">Lượt xem</dt>
                              <dd className="text-right font-medium text-foreground">{faq.views}</dd>
                            </div>
                            <div className="grid grid-cols-[92px_minmax(0,1fr)] items-start gap-3">
                              <dt className="whitespace-nowrap">Cập nhật</dt>
                              <dd className="text-right font-medium text-foreground">{faq.updatedAt}</dd>
                            </div>
                            <div className="grid grid-cols-[92px_minmax(0,1fr)] items-start gap-3">
                              <dt className="whitespace-nowrap">Trạng thái</dt>
                              <dd className="text-right font-medium text-foreground">{STATUS_LABELS[faq.status]}</dd>
                            </div>
                          </dl>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {!isLoading && !loadMessage && filteredFaqs.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Không có FAQ phù hợp với bộ lọc đã chọn.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Separated Dialog Modals */}
      <FaqFormDialog
        open={showForm}
        onOpenChange={setShowForm}
        mode={formMode}
        faq={selectedFaq}
        categories={categories}
        onSubmit={handleSubmitFaq}
        isSubmitting={isSubmitting}
      />

      <FaqDetailDialog
        open={showDetail}
        onOpenChange={setShowDetail}
        faq={selectedFaq}
      />

      <FaqDeleteDialog
        open={showDelete}
        onOpenChange={setShowDelete}
        faq={selectedFaq}
        onConfirm={handleDeleteFaq}
        isDeleting={isDeleting}
      />
    </div>
  );
};

export default FAQ;
