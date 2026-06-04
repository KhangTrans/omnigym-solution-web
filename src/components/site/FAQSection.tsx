import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, Loader2, MessageCircle, Sparkles } from "lucide-react";
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

const smoothEase = [0.16, 1, 0.3, 1] as const;

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
      <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-35" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" aria-hidden />
      <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-primary/10 blur-3xl" aria-hidden />
      <div className="absolute -right-24 bottom-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18, filter: "blur(14px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.58, ease: smoothEase }}
          className="mx-auto max-w-3xl text-center"
        >
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium tracking-wide text-primary shadow-sm backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5" />
            FAQ
          </div>
          <h2 className="mt-5 text-4xl font-semibold leading-tight tracking-[-0.04em] text-foreground sm:text-5xl lg:text-[4.25rem]">
            Câu hỏi thường gặp
          </h2>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
            Tìm nhanh câu trả lời về hội viên, lớp tập, huấn luyện viên và các dịch vụ tại OmniGym.
          </p>
        </motion.div>

        <div className="mt-14 grid gap-6 lg:grid-cols-[0.82fr_1.45fr] lg:items-start">
          <motion.div
            initial={{ opacity: 0, x: -18, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.54, ease: smoothEase }}
            className="relative overflow-hidden rounded-[2rem] border border-primary/10 bg-white/70 p-8 shadow-card backdrop-blur-xl"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(79,138,116,0.14),transparent_55%)]" aria-hidden />
            <div className="relative">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">Bạn vẫn cần hỗ trợ?</h3>
              <p className="mt-4 leading-7 text-muted-foreground">
                Nếu chưa tìm thấy câu trả lời phù hợp, đội ngũ OmniGym luôn sẵn sàng hỗ trợ bạn chọn gói tập, lịch lớp hoặc PT phù hợp.
              </p>
              <a
                href="#contact"
                className="group mt-7 inline-flex items-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5"
              >
                Liên hệ tư vấn
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 18, filter: "blur(12px)" }}
            whileInView={{ opacity: 1, x: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.54, ease: smoothEase, delay: 0.04 }}
            className="max-h-[430px] space-y-3 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-primary/30 scrollbar-track-transparent"
          >
            {isLoading && (
              <div className="flex items-center justify-center gap-3 rounded-[1.75rem] border border-primary/10 bg-white/70 p-8 text-muted-foreground shadow-card backdrop-blur-xl">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                Đang tải câu hỏi thường gặp...
              </div>
            )}

            {!isLoading && faqs.length === 0 && (
              <div className="rounded-[1.75rem] border border-primary/10 bg-white/70 p-8 text-center text-muted-foreground shadow-card backdrop-blur-xl">
                Hiện chưa có FAQ nào được hiển thị.
              </div>
            )}

            {!isLoading && faqs.map((faq) => {
              const isOpen = currentActiveId === faq.id;

              return (
                <div
                  key={faq.id}
                  className={cn(
                    "overflow-hidden rounded-[1.75rem] border bg-white/70 shadow-card backdrop-blur-xl transition-all",
                    isOpen ? "border-primary/30 bg-primary/5" : "border-primary/10 hover:border-primary/20",
                  )}
                >
                  <button
                    type="button"
                    onClick={() => handleToggleFaq(faq, isOpen)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left"
                  >
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">{faq.question}</h3>
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary/5 text-primary">
                      <ChevronDown className={cn("h-4 w-4 transition-transform duration-300", isOpen && "rotate-180")} />
                    </span>
                  </button>

                  {isOpen && (
                    <div className="border-t border-primary/10 px-6 pb-6 pt-4">
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
