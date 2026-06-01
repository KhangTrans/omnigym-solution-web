import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, MessageCircle } from "lucide-react";
import api from "../../api/axios";
import { cn } from "../../utils/cn";

type DbFaq = {
  id: number;
  title: string;
  content: string;
  category: string;
  is_published: boolean;
};

type PublicFaq = {
  id: string;
  question: string;
  answer: string;
  category: string;
};

const mapDbFaqToPublicFaq = (faq: DbFaq): PublicFaq => ({
  id: String(faq.id),
  question: faq.title,
  answer: faq.content,
  category: faq.category,
});

export function FAQSection() {
  const [faqs, setFaqs] = useState<PublicFaq[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [viewedFaqIds, setViewedFaqIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setIsLoading(true);
        const response = await api.get<DbFaq[]>("/faqs/public");
        const publishedFaqs = response.data.filter((faq) => faq.is_published).map(mapDbFaqToPublicFaq);
        setFaqs(publishedFaqs);
      } catch {
        setFaqs([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFaqs();
  }, []);

  const currentActiveId = faqs.some((faq) => faq.id === activeId) ? activeId : null;

  const handleToggleFaq = (faq: PublicFaq, isOpen: boolean) => {
    if (isOpen) {
      setActiveId(null);
      return;
    }

    setActiveId(faq.id);

    if (faq.id.startsWith("fallback-") || viewedFaqIds.includes(faq.id)) {
      return;
    }

    setViewedFaqIds((currentIds) => [...currentIds, faq.id]);
    api.post(`/faqs/public/${faq.id}/view`).catch(() => undefined);
  };

  return (
    <section id="faq" className="relative overflow-hidden bg-background py-24">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent" />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-3xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">FAQ</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Câu hỏi thường gặp
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tìm nhanh câu trả lời về hội viên, lớp tập, huấn luyện viên và các dịch vụ tại OmniGym.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-8 lg:grid-cols-[0.9fr_1.4fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="rounded-3xl border border-border bg-card p-8 shadow-md"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-md shadow-primary/20">
              <MessageCircle className="h-6 w-6" />
            </div>
            <h3 className="mt-6 text-2xl font-bold text-foreground">Bạn vẫn cần hỗ trợ?</h3>
            <p className="mt-3 leading-7 text-muted-foreground">
              Nếu chưa tìm thấy câu trả lời phù hợp, đội ngũ OmniGym luôn sẵn sàng hỗ trợ bạn chọn gói tập, lịch lớp hoặc PT phù hợp.
            </p>
            <a
              href="#contact"
              className="mt-6 inline-flex rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-md shadow-primary/20 transition hover:bg-primary/90"
            >
              Liên hệ tư vấn
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6 }}
            className="max-h-[430px] space-y-4 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent"
          >
            {isLoading && (
              <div className="flex items-center justify-center gap-3 rounded-3xl border border-border bg-card p-8 text-muted-foreground shadow-md">
                <Loader2 className="h-5 w-5 animate-spin" />
                Đang tải câu hỏi thường gặp...
              </div>
            )}

            {!isLoading && faqs.length === 0 && (
              <div className="rounded-3xl border border-border bg-card p-8 text-center text-muted-foreground shadow-md">
                Hiện chưa có FAQ nào được hiển thị.
              </div>
            )}

            {!isLoading && faqs.map((faq) => {
              const isOpen = currentActiveId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={cn(
                    "overflow-hidden rounded-3xl border bg-card shadow-md transition",
                    isOpen ? "border-primary/40 shadow-primary/10" : "border-border",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleFaq(faq, isOpen)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <div>
                      <h3 className="text-lg font-bold text-foreground">{faq.question}</h3>
                    </div>
                    <ChevronDown className={cn("h-5 w-5 shrink-0 text-muted-foreground transition", isOpen && "rotate-180 text-primary")} />
                  </button>

                  {isOpen && (
                    <div className="border-t border-border px-6 pb-6 pt-4">
                      <p className="whitespace-pre-line leading-7 text-muted-foreground">{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
