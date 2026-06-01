import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../utils/cn";
import { ChevronDown, Edit3, Eye, Plus, Save, X } from "lucide-react";

type FaqStatus = "Published" | "Draft";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: string;
  status: FaqStatus;
  views: number;
  author: {
    name: string;
    email: string;
  };
  updatedAt: string;
};

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

type FaqFormMode = "create" | "update";

type FaqFormState = {
  question: string;
  answer: string;
  category: string;
  status: FaqStatus;
};

const emptyForm: FaqFormState = {
  question: "",
  answer: "",
  category: "",
  status: "Draft",
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

const getApiErrorMessage = (error: unknown, fallback: string) => {
  if (
    typeof error === "object" &&
    error !== null &&
    "response" in error &&
    typeof error.response === "object" &&
    error.response !== null &&
    "data" in error.response &&
    typeof error.response.data === "object" &&
    error.response.data !== null &&
    "message" in error.response.data &&
    typeof error.response.data.message === "string"
  ) {
    return error.response.data.message;
  }

  return fallback;
};

const FAQ = () => {
  const [statusFilter, setStatusFilter] = useState<"Tất cả" | FaqStatus>("Tất cả");
  const [categoryFilter, setCategoryFilter] = useState<"Tất cả" | FaqItem["category"]>("Tất cả");
  const [openId, setOpenId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState<FaqFormMode>("create");
  const [editingFaqId, setEditingFaqId] = useState<string | null>(null);
  const [form, setForm] = useState<FaqFormState>(emptyForm);
  const [formMessage, setFormMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    question: "",
    answer: "",
    category: "",
  });

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
  const isUpdateMode = formMode === "update";

  const resetForm = () => {
    setForm(emptyForm);
    setEditingFaqId(null);
    setFormMessage("");
    setFieldErrors({ question: "", answer: "", category: "" });
  };

  const openCreateForm = () => {
    resetForm();
    setFormMode("create");
    setShowForm(true);
  };

  const openUpdateForm = (faq: FaqItem) => {
    setFormMode("update");
    setEditingFaqId(faq.id);
    setForm({
      question: faq.question,
      answer: faq.answer,
      category: faq.category,
      status: faq.status,
    });
    setFormMessage("");
    setFieldErrors({ question: "", answer: "", category: "" });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    resetForm();
  };

  const updateFormField = <K extends keyof FaqFormState>(field: K, value: FaqFormState[K]) => {
    setForm((currentForm) => ({ ...currentForm, [field]: value }));
    setFormMessage("");

    if (field === "question" || field === "answer" || field === "category") {
      setFieldErrors((currentErrors) => ({ ...currentErrors, [field]: "" }));
    }
  };

  const handleSubmitFaq = async () => {
    const errors = {
      question: form.question.trim() ? "" : "Vui lòng nhập câu hỏi.",
      answer: form.answer.trim() ? "" : "Vui lòng nhập câu trả lời.",
      category: form.category.trim() ? "" : "Vui lòng nhập hoặc chọn danh mục.",
    };

    setFieldErrors(errors);

    if (errors.question || errors.answer || errors.category) {
      return;
    }

    setIsSubmitting(true);
    setFormMessage("");

    const payload = {
      title: form.question.trim(),
      content: form.answer.trim(),
      category: form.category.trim(),
      is_published: form.status === "Published",
    };

    try {
      const response = isUpdateMode && editingFaqId
        ? await api.put<DbFaq>(`/faqs/${editingFaqId}`, payload)
        : await api.post<DbFaq>("/faqs", payload);

      const savedFaq = mapDbFaqToFaqItem(response.data);

      setFaqs((currentFaqs) => {
        if (isUpdateMode) {
          return currentFaqs.map((faq) => (faq.id === savedFaq.id ? savedFaq : faq));
        }

        return [savedFaq, ...currentFaqs];
      });

      setOpenId(savedFaq.id);
      setFormMessage(isUpdateMode ? "Cập nhật FAQ thành công." : "Tạo FAQ thành công.");

      if (!isUpdateMode) {
        setForm(emptyForm);
      }
    } catch (error: unknown) {
      setFormMessage(getApiErrorMessage(error, isUpdateMode ? "Không thể cập nhật FAQ. Vui lòng thử lại." : "Không thể tạo FAQ. Vui lòng thử lại."));
    } finally {
      setIsSubmitting(false);
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
                  onChange={(event) => setCategoryFilter(event.target.value as "Tất cả" | FaqItem["category"])}
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
              <div className="col-span-12 lg:col-span-7">Câu hỏi</div>
              <div className="hidden text-center lg:col-span-1 lg:block">Trạng thái</div>
              <div className="hidden text-center lg:col-span-1 lg:block">Danh mục</div>
              <div className="hidden lg:col-span-2 lg:block">Tác giả</div>
              <div className="hidden text-right lg:col-span-1 lg:block">Thao tác</div>
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
                        className="col-span-12 min-w-0 text-left lg:col-span-7"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold leading-tight">{faq.question}</span>
                          <ChevronDown
                            className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
                          />
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{faq.answer}</p>
                      </button>

                      <div className="col-span-6 flex items-start justify-start lg:col-span-1 lg:justify-center">
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

                      <div className="col-span-6 flex items-start justify-end lg:col-span-1 lg:justify-center">
                        <Badge variant="secondary" className="rounded-full bg-background shadow-sm">
                          {faq.category}
                        </Badge>
                      </div>

                      <div className="col-span-8 text-sm lg:col-span-2">
                        <div className="font-semibold">{faq.author.name}</div>
                        <div className="text-xs text-muted-foreground">{faq.author.email}</div>
                      </div>

                      <div className="col-span-4 flex justify-end lg:col-span-1">
                        <button
                          type="button"
                          onClick={() => openUpdateForm(faq)}
                          className="inline-flex h-9 items-center gap-2 rounded-xl border border-border bg-background px-3 text-xs font-semibold text-foreground shadow-sm transition hover:bg-muted"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          Sửa
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

      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-background shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                    {isUpdateMode ? "Cập nhật nội dung" : "Nội dung mới"}
                  </div>
                  <h2 className="mt-3 text-xl font-bold">
                    {isUpdateMode ? "Cập nhật FAQ" : "Tạo FAQ mới"}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {isUpdateMode
                      ? "Chỉnh sửa câu hỏi, câu trả lời, danh mục và trạng thái xuất bản."
                      : "Nhập nội dung câu hỏi thường gặp để hiển thị trong hệ thống."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeForm}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-background/80 text-muted-foreground shadow-sm transition hover:text-foreground"
                  aria-label="Đóng form FAQ"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="space-y-5 p-6">
              {formMessage && (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium",
                    formMessage.includes("thành công")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700",
                  )}
                >
                  {formMessage}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="faq-question">
                    Câu hỏi
                  </label>
                  <input
                    id="faq-question"
                    type="text"
                    value={form.question}
                    onChange={(event) => updateFormField("question", event.target.value)}
                    placeholder="Nhập câu hỏi FAQ..."
                    className={cn(
                      "h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                      fieldErrors.question ? "border-red-300" : "border-border",
                    )}
                  />
                  {fieldErrors.question && <p className="text-xs font-medium text-red-600">{fieldErrors.question}</p>}
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="faq-answer">
                    Câu trả lời
                  </label>
                  <textarea
                    id="faq-answer"
                    rows={7}
                    value={form.answer}
                    onChange={(event) => updateFormField("answer", event.target.value)}
                    placeholder="Nhập nội dung câu trả lời..."
                    className={cn(
                      "w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                      fieldErrors.answer ? "border-red-300" : "border-border",
                    )}
                  />
                  {fieldErrors.answer && <p className="text-xs font-medium text-red-600">{fieldErrors.answer}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="faq-category">
                    Danh mục
                  </label>
                  <input
                    id="faq-category"
                    type="text"
                    list="faq-category-options"
                    value={form.category}
                    onChange={(event) => updateFormField("category", event.target.value)}
                    placeholder="Nhập hoặc chọn danh mục FAQ..."
                    className={cn(
                      "h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                      fieldErrors.category ? "border-red-300" : "border-border",
                    )}
                  />
                  {fieldErrors.category && <p className="text-xs font-medium text-red-600">{fieldErrors.category}</p>}
                  <datalist id="faq-category-options">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="faq-status">
                    Trạng thái
                  </label>
                  <select
                    id="faq-status"
                    value={form.status}
                    onChange={(event) => updateFormField("status", event.target.value as FaqStatus)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Đã xuất bản</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeForm}
                  className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleSubmitFaq}
                  disabled={isSubmitting}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  <Save className="h-4 w-4" />
                  {isSubmitting ? (isUpdateMode ? "Đang cập nhật..." : "Đang tạo...") : isUpdateMode ? "Lưu cập nhật" : "Tạo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FAQ;
