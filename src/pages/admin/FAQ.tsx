import { useEffect, useMemo, useState } from "react";
import api from "../../api/axios";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../utils/cn";
import { ChevronDown, Eye, Pencil, Plus, X } from "lucide-react";

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

const formatFaqDateTime = (value?: string) => {
  if (!value) return "";

  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  }).format(new Date(value));
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
  updatedAt: formatFaqDateTime(faq.updated_at),
});

const STATUS_LABELS: Record<FaqStatus, string> = {
  Published: "Đã xuất bản",
  Draft: "Bản nháp",
};

const FAQ = () => {
  const [statusFilter, setStatusFilter] = useState<"Tất cả" | FaqStatus>("Tất cả");
  const [categoryFilter, setCategoryFilter] = useState<"Tất cả" | FaqItem["category"]>("Tất cả");
  const [openId, setOpenId] = useState<string | null>(null);
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadMessage, setLoadMessage] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newStatus, setNewStatus] = useState<FaqStatus>("Draft");
  const [createMessage, setCreateMessage] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({
    question: "",
    answer: "",
    category: "",
  });
  const [editingFaq, setEditingFaq] = useState<FaqItem | null>(null);
  const [editQuestion, setEditQuestion] = useState("");
  const [editAnswer, setEditAnswer] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStatus, setEditStatus] = useState<FaqStatus>("Draft");
  const [editMessage, setEditMessage] = useState("");
  const [editFieldErrors, setEditFieldErrors] = useState({
    question: "",
    answer: "",
    category: "",
  });
  const [isUpdating, setIsUpdating] = useState(false);

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

  const resetCreateForm = () => {
    setNewQuestion("");
    setNewAnswer("");
    setNewCategory("");
    setNewStatus("Draft");
    setCreateMessage("");
    setFieldErrors({ question: "", answer: "", category: "" });
  };

  const closeCreateForm = () => {
    setShowCreateForm(false);
    resetCreateForm();
  };

  const openUpdateForm = (faq: FaqItem) => {
    setEditingFaq(faq);
    setEditQuestion(faq.question);
    setEditAnswer(faq.answer);
    setEditCategory(faq.category);
    setEditStatus(faq.status);
    setEditMessage("");
    setEditFieldErrors({ question: "", answer: "", category: "" });
  };

  const closeUpdateForm = () => {
    setEditingFaq(null);
    setEditQuestion("");
    setEditAnswer("");
    setEditCategory("");
    setEditStatus("Draft");
    setEditMessage("");
    setEditFieldErrors({ question: "", answer: "", category: "" });
  };

  const handleUpdateFaq = async () => {
    if (!editingFaq) return;

    const errors = {
      question: editQuestion.trim() ? "" : "Vui lòng nhập câu hỏi.",
      answer: editAnswer.trim() ? "" : "Vui lòng nhập câu trả lời.",
      category: editCategory.trim() ? "" : "Vui lòng nhập hoặc chọn danh mục.",
    };

    setEditFieldErrors(errors);

    if (errors.question || errors.answer || errors.category) {
      return;
    }

    setIsUpdating(true);
    setEditMessage("");

    try {
      const response = await api.put(`/faqs/${editingFaq.id}`, {
        title: editQuestion.trim(),
        content: editAnswer.trim(),
        category: editCategory.trim(),
        is_published: editStatus === "Published",
      });

      const updatedFaq = mapDbFaqToFaqItem(response.data as DbFaq);
      setFaqs((currentFaqs) =>
        currentFaqs.map((faq) => (faq.id === updatedFaq.id ? updatedFaq : faq)),
      );
      setEditingFaq(updatedFaq);
      setEditMessage("Cập nhật FAQ thành công.");
    } catch (error: unknown) {
      const message =
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
          ? error.response.data.message
          : "Không thể cập nhật FAQ. Vui lòng thử lại.";

      setEditMessage(message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCreateFaq = async () => {
    const errors = {
      question: newQuestion.trim() ? "" : "Vui lòng nhập câu hỏi.",
      answer: newAnswer.trim() ? "" : "Vui lòng nhập câu trả lời.",
      category: newCategory.trim() ? "" : "Vui lòng nhập hoặc chọn danh mục.",
    };

    setFieldErrors(errors);

    if (errors.question || errors.answer || errors.category) {
      return;
    }

    setIsCreating(true);
    setCreateMessage("");

    try {
      const response = await api.post("/faqs", {
        title: newQuestion.trim(),
        content: newAnswer.trim(),
        category: newCategory.trim(),
        is_published: newStatus === "Published",
      });

      const createdFaq = response.data as DbFaq;
      setFaqs((currentFaqs) => [mapDbFaqToFaqItem(createdFaq), ...currentFaqs]);
      resetCreateForm();
      setCreateMessage("Tạo FAQ thành công.");
    } catch (error: unknown) {
      const message =
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
          ? error.response.data.message
          : "Không thể tạo FAQ. Vui lòng thử lại.";

      setCreateMessage(message);
    } finally {
      setIsCreating(false);
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
          onClick={() => setShowCreateForm(true)}
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
            <div className="grid border-b px-2 py-3 text-sm font-semibold lg:grid-cols-[minmax(0,1fr)_120px_120px_180px_130px] lg:gap-4">
              <div>Câu hỏi</div>
              <div className="hidden text-center lg:block">Trạng thái</div>
              <div className="hidden text-center lg:block">Danh mục</div>
              <div className="hidden lg:block">Tác giả</div>
              <div className="hidden text-center lg:block">Thao tác</div>
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
                    <div className="grid w-full gap-4 px-2 py-4 transition-colors hover:bg-muted/40 lg:grid-cols-[minmax(0,1fr)_120px_120px_180px_130px]">
                      <button
                        type="button"
                        onClick={() => setOpenId(expanded ? null : faq.id)}
                        className="min-w-0 text-left"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold leading-tight">{faq.question}</span>
                          <ChevronDown
                            className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
                          />
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{faq.answer}</p>
                      </button>

                      <div className="flex items-start justify-start lg:justify-center">
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

                      <div className="flex items-start justify-start lg:justify-center">
                        <Badge variant="secondary" className="rounded-full bg-background shadow-sm">
                          {faq.category}
                        </Badge>
                      </div>

                      <div className="text-sm">
                        <div className="font-semibold">{faq.author.name}</div>
                        <div className="text-xs text-muted-foreground">{faq.author.email}</div>
                      </div>

                      <div className="flex justify-start lg:justify-center">
                        <button
                          type="button"
                          onClick={() => openUpdateForm(faq)}
                          className="inline-flex h-9 min-w-[128px] whitespace-nowrap items-center justify-center gap-2 rounded-xl border border-border bg-background px-4 text-sm font-semibold text-foreground shadow-sm transition hover:border-primary hover:text-primary"
                        >
                          <Pencil className="h-4 w-4 shrink-0" />
                          Cập nhật
                        </button>
                      </div>
                    </div>

                    {expanded && (
                      <div className="grid gap-4 bg-muted/30 px-4 pb-5 pt-1 text-sm lg:grid-cols-[minmax(0,1fr)_280px]">
                        <div className="rounded-lg bg-background p-4 shadow-sm">
                          <div className="mb-2 font-semibold">Chi tiết câu trả lời</div>
                          <p className="leading-7 text-muted-foreground">{faq.answer}</p>
                        </div>
                        <div className="rounded-lg bg-background p-4 shadow-sm">
                          <div className="font-semibold">Thông tin</div>
                          <dl className="mt-3 space-y-2 text-muted-foreground">
                            <div className="flex justify-between gap-3">
                              <dt>Lượt xem</dt>
                              <dd className="font-medium text-foreground">{faq.views}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt>Cập nhật</dt>
                              <dd className="font-medium text-foreground">{faq.updatedAt}</dd>
                            </div>
                            <div className="flex justify-between gap-3">
                              <dt>Trạng thái</dt>
                              <dd className="font-medium text-foreground">{STATUS_LABELS[faq.status]}</dd>
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

      {showCreateForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-background shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">Tạo FAQ mới</h2>
                <p className="text-sm text-muted-foreground">
                  Nhập nội dung câu hỏi thường gặp để hiển thị trong hệ thống.
                </p>
              </div>
              <button
                type="button"
                onClick={closeCreateForm}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
                aria-label="Đóng form tạo FAQ"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {createMessage && (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium",
                    createMessage.includes("thành công")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700",
                  )}
                >
                  {createMessage}
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
                    value={newQuestion}
                    onChange={(event) => {
                      setNewQuestion(event.target.value);
                      setCreateMessage("");
                      setFieldErrors((currentErrors) => ({ ...currentErrors, question: "" }));
                    }}
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
                    rows={5}
                    value={newAnswer}
                    onChange={(event) => {
                      setNewAnswer(event.target.value);
                      setCreateMessage("");
                      setFieldErrors((currentErrors) => ({ ...currentErrors, answer: "" }));
                    }}
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
                    value={newCategory}
                    onChange={(event) => {
                      setNewCategory(event.target.value);
                      setCreateMessage("");
                      setFieldErrors((currentErrors) => ({ ...currentErrors, category: "" }));
                    }}
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
                    value={newStatus}
                    onChange={(event) => setNewStatus(event.target.value as FaqStatus)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Đã xuất bản</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeCreateForm}
                  className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleCreateFaq}
                  disabled={isCreating}
                  className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isCreating ? "Đang tạo..." : "Tạo"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingFaq && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-2xl bg-background shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="flex items-start justify-between gap-4 border-b p-5">
              <div>
                <h2 className="text-lg font-semibold">Cập nhật FAQ</h2>
                <p className="text-sm text-muted-foreground">
                  Chỉnh sửa câu hỏi, câu trả lời, danh mục và trạng thái FAQ.
                </p>
              </div>
              <button
                type="button"
                onClick={closeUpdateForm}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition hover:text-foreground"
                aria-label="Đóng form cập nhật FAQ"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              {editMessage && (
                <div
                  className={cn(
                    "rounded-xl border px-4 py-3 text-sm font-medium",
                    editMessage.includes("thành công")
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-red-200 bg-red-50 text-red-700",
                  )}
                >
                  {editMessage}
                </div>
              )}

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="edit-faq-question">
                    Câu hỏi
                  </label>
                  <input
                    id="edit-faq-question"
                    type="text"
                    value={editQuestion}
                    onChange={(event) => {
                      setEditQuestion(event.target.value);
                      setEditMessage("");
                      setEditFieldErrors((currentErrors) => ({ ...currentErrors, question: "" }));
                    }}
                    placeholder="Nhập câu hỏi FAQ..."
                    className={cn(
                      "h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                      editFieldErrors.question ? "border-red-300" : "border-border",
                    )}
                  />
                  {editFieldErrors.question && <p className="text-xs font-medium text-red-600">{editFieldErrors.question}</p>}
                </div>

                <div className="space-y-2 lg:col-span-2">
                  <label className="text-sm font-semibold" htmlFor="edit-faq-answer">
                    Câu trả lời
                  </label>
                  <textarea
                    id="edit-faq-answer"
                    rows={5}
                    value={editAnswer}
                    onChange={(event) => {
                      setEditAnswer(event.target.value);
                      setEditMessage("");
                      setEditFieldErrors((currentErrors) => ({ ...currentErrors, answer: "" }));
                    }}
                    placeholder="Nhập nội dung câu trả lời..."
                    className={cn(
                      "w-full resize-none rounded-xl border bg-background px-4 py-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                      editFieldErrors.answer ? "border-red-300" : "border-border",
                    )}
                  />
                  {editFieldErrors.answer && <p className="text-xs font-medium text-red-600">{editFieldErrors.answer}</p>}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="edit-faq-category">
                    Danh mục
                  </label>
                  <input
                    id="edit-faq-category"
                    type="text"
                    list="edit-faq-category-options"
                    value={editCategory}
                    onChange={(event) => {
                      setEditCategory(event.target.value);
                      setEditMessage("");
                      setEditFieldErrors((currentErrors) => ({ ...currentErrors, category: "" }));
                    }}
                    placeholder="Nhập hoặc chọn danh mục FAQ..."
                    className={cn(
                      "h-11 w-full rounded-xl border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20",
                      editFieldErrors.category ? "border-red-300" : "border-border",
                    )}
                  />
                  {editFieldErrors.category && <p className="text-xs font-medium text-red-600">{editFieldErrors.category}</p>}
                  <datalist id="edit-faq-category-options">
                    {categories.map((category) => (
                      <option key={category} value={category} />
                    ))}
                  </datalist>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold" htmlFor="edit-faq-status">
                    Trạng thái
                  </label>
                  <select
                    id="edit-faq-status"
                    value={editStatus}
                    onChange={(event) => setEditStatus(event.target.value as FaqStatus)}
                    className="h-11 w-full rounded-xl border border-border bg-background px-4 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="Draft">Bản nháp</option>
                    <option value="Published">Đã xuất bản</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 border-t pt-4">
                <button
                  type="button"
                  onClick={closeUpdateForm}
                  className="h-10 rounded-xl bg-muted px-4 text-sm font-semibold text-muted-foreground transition hover:text-foreground"
                >
                  Hủy
                </button>
                <button
                  type="button"
                  onClick={handleUpdateFaq}
                  disabled={isUpdating}
                  className="h-10 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isUpdating ? "Đang cập nhật..." : "Cập nhật"}
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
