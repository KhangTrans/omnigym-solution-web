import { motion } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="contact" className="relative overflow-hidden bg-background py-24">
      <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-40" aria-hidden />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-background to-transparent" aria-hidden />
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 24, filter: "blur(16px)" }}
          whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          viewport={{ once: true, margin: "-90px" }}
          transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          className="relative mx-auto overflow-hidden rounded-[2rem] border border-primary/20 bg-white/70 p-6 text-center shadow-card backdrop-blur-xl sm:p-8 lg:p-10"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,138,116,0.16),rgba(79,138,116,0.06)_34%,transparent_68%)]" aria-hidden />
          <div className="absolute inset-0 bg-grid opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_78%)]" aria-hidden />

          <div className="relative mx-auto max-w-4xl">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium tracking-wide text-primary shadow-sm backdrop-blur-md">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Sẵn sàng bắt đầu hành trình mới</span>
            </div>

            <h2 className="text-3xl font-semibold leading-[1.14] tracking-[-0.04em] text-foreground sm:text-4xl md:text-5xl lg:text-[4.25rem]">
              Phiên bản mạnh mẽ nhất của bạn
              <span className="block text-primary">bắt đầu từ hôm nay.</span>
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-relaxed text-muted-foreground sm:text-base md:text-lg">
              Thử nghiệm OmniGym miễn phí trong 7 ngày. Không cần thẻ. Chỉ cần xuất hiện và để chúng tôi giúp bạn duy trì nhịp tập đều đặn hơn.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
              <a
                href="#pricing"
                className="group inline-flex min-w-[230px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5"
              >
                Bắt đầu dùng thử miễn phí
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#"
                className="inline-flex min-w-[210px] items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 py-4 text-sm font-medium text-foreground backdrop-blur-md transition-all hover:bg-muted"
              >
                Đặt lịch tham quan
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
