import { useMemo, useState } from "react";
import { Badge } from "../../components/ui/badge";
import { Card, CardContent } from "../../components/ui/card";
import { cn } from "../../utils/cn";
import { ChevronDown, Eye } from "lucide-react";

type FaqStatus = "Published" | "Draft";

type FaqItem = {
  id: string;
  question: string;
  answer: string;
  category: "Hội viên" | "Cá nhân" | "Thanh toán" | "Đặt lịch";
  status: FaqStatus;
  views: number;
  author: {
    name: string;
    email: string;
  };
  updatedAt: string;
};

const FAQS: FaqItem[] = [
  {
    id: "faq-1",
    question: "Tôi có thể tập thử trước khi đăng ký gói hội viên không?",
    answer:
      "Có. Khách hàng có thể đăng ký buổi tập thử tại các phòng tập đang hỗ trợ chương trình trải nghiệm. Admin cần kiểm tra tình trạng phòng tập, xác nhận khung giờ còn trống và gửi hướng dẫn check-in cho khách hàng trước buổi tập.",
    category: "Hội viên",
    status: "Draft",
    views: 18,
    author: { name: "Admin System", email: "admin@omnigym.com" },
    updatedAt: "2026-05-26",
  },
  {
    id: "faq-2",
    question: "ABC",
    answer:
      "Nội dung FAQ hướng dẫn người dùng về cách sử dụng gói hội viên, điều kiện áp dụng và các lưu ý khi đặt lịch tập tại phòng gym.",
    category: "Hội viên",
    status: "Published",
    views: 42,
    author: { name: "Admin System", email: "admin@omnigym.com" },
    updatedAt: "2026-05-25",
  },
  {
    id: "faq-3",
    question: "Tôi có thể tập thử trước khi đăng ký gói hội viên không?",
    answer:
      "Người dùng cần đăng nhập, chọn phòng tập mong muốn và gửi yêu cầu tập thử. Hệ thống sẽ ghi nhận thông tin để nhân viên hoặc đối tác phòng tập xác nhận lịch hẹn.",
    category: "Hội viên",
    status: "Published",
    views: 96,
    author: { name: "Admin System", email: "admin@omnigym.com" },
    updatedAt: "2026-05-24",
  },
  {
    id: "faq-4",
    question: "fwe",
    answer: "FAQ nháp dùng để kiểm tra giao diện hiển thị trong trang quản trị.",
    category: "Hội viên",
    status: "Draft",
    views: 7,
    author: { name: "Admin System", email: "admin@omnigym.com" },
    updatedAt: "2026-05-23",
  },
  {
    id: "faq-5",
    question: "Tôi có thể tập thử trước khi đăng ký gói hội viên không?",
    answer:
      "Người dùng có thể cập nhật thông tin cá nhân trong trang hồ sơ. Nếu email hoặc số điện thoại bị sai, admin cần hướng dẫn người dùng xác thực lại thông tin trước khi thay đổi dữ liệu quan trọng.",
    category: "Cá nhân",
    status: "Draft",
    views: 31,
    author: { name: "Admin System", email: "admin@omnigym.com" },
    updatedAt: "2026-05-22",
  },
  {
    id: "faq-6",
    question: "Làm sao để thanh toán gói hội viên?",
    answer:
      "Khách hàng có thể thanh toán bằng thẻ, ví điện tử hoặc chuyển khoản tùy theo cấu hình của từng phòng tập. Sau khi giao dịch thành công, hệ thống tự động kích hoạt gói hội viên tương ứng.",
    category: "Thanh toán",
    status: "Published",
    views: 84,
    author: { name: "Admin System", email: "admin@omnigym.com" },
    updatedAt: "2026-05-21",
  },
  {
    id: "faq-7",
    question: "Tôi có thể hủy lịch tập đã đặt không?",
    answer:
      "Có. Người dùng có thể hủy lịch trong thời gian cho phép theo chính sách của từng phòng tập. Với các lịch hủy sát giờ, hệ thống có thể áp dụng phí hoặc giới hạn đặt lịch tiếp theo.",
    category: "Đặt lịch",
    status: "Published",
    views: 52,
    author: { name: "Admin System", email: "admin@omnigym.com" },
    updatedAt: "2026-05-20",
  },
];

const STATUS_LABELS: Record<FaqStatus, string> = {
  Published: "Đã xuất bản",
  Draft: "Bản nháp",
};

const FAQ = () => {
  const [statusFilter, setStatusFilter] = useState<"Tất cả" | FaqStatus>("Tất cả");
  const [categoryFilter, setCategoryFilter] = useState<"Tất cả" | FaqItem["category"]>("Tất cả");
  const [openId, setOpenId] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    return FAQS.filter((faq) => {
      const matchesStatus = statusFilter === "Tất cả" || faq.status === statusFilter;
      const matchesCategory = categoryFilter === "Tất cả" || faq.category === categoryFilter;

      return matchesStatus && matchesCategory;
    });
  }, [categoryFilter, statusFilter]);

  const publishedCount = FAQS.filter((faq) => faq.status === "Published").length;
  const draftCount = FAQS.length - publishedCount;
  const totalViews = FAQS.reduce((sum, faq) => sum + faq.views, 0);
  const categories = Array.from(new Set(FAQS.map((faq) => faq.category)));
  const statusOptions: Array<"Tất cả" | FaqStatus> = ["Tất cả", "Published", "Draft"];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Quản lý FAQ</h1>
        <p className="text-sm text-muted-foreground">
          Quản lý câu hỏi thường gặp cho website và ứng dụng người dùng.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-0 shadow-[0_8px_30px_rgba(15,23,42,0.06)]">
          <CardContent className="p-5">
            <p className="text-sm text-foreground">Tổng FAQ</p>
            <div className="mt-3 text-3xl font-bold tabular-nums">{FAQS.length}</div>
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
              <div className="col-span-12 lg:col-span-8">Câu hỏi</div>
              <div className="hidden text-center lg:col-span-1 lg:block">Trạng thái</div>
              <div className="hidden text-center lg:col-span-1 lg:block">Danh mục</div>
              <div className="hidden lg:col-span-2 lg:block">Tác giả</div>
            </div>

            <div className="divide-y">
              {filteredFaqs.map((faq) => {
                const expanded = openId === faq.id;

                return (
                  <div key={faq.id}>
                    <button
                      type="button"
                      onClick={() => setOpenId(expanded ? null : faq.id)}
                      className="grid w-full grid-cols-12 gap-4 px-2 py-4 text-left transition-colors hover:bg-muted/40"
                    >
                      <div className="col-span-12 min-w-0 lg:col-span-8">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold leading-tight">{faq.question}</span>
                          <ChevronDown
                            className={cn("h-4 w-4 shrink-0 transition-transform", expanded && "rotate-180")}
                          />
                        </div>
                        <p className="mt-1 truncate text-sm text-muted-foreground">{faq.answer}</p>
                      </div>

                      <div className="col-span-6 flex items-start justify-center lg:col-span-1">
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

                      <div className="col-span-6 flex items-start justify-center lg:col-span-1">
                        <Badge variant="secondary" className="rounded-full bg-background shadow-sm">
                          {faq.category}
                        </Badge>
                      </div>

                      <div className="col-span-12 text-sm lg:col-span-2">
                        <div className="font-semibold">{faq.author.name}</div>
                        <div className="text-xs text-muted-foreground">{faq.author.email}</div>
                      </div>
                    </button>

                    {expanded && (
                      <div className="grid gap-4 bg-muted/30 px-4 pb-5 pt-1 text-sm lg:grid-cols-[1fr_220px]">
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

              {filteredFaqs.length === 0 && (
                <div className="py-10 text-center text-sm text-muted-foreground">
                  Không có FAQ phù hợp với bộ lọc đã chọn.
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FAQ;
