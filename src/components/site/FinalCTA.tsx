import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

export function FinalCTA() {
  return (
    <section id="contact" className="relative py-24 bg-background">
      <div className="absolute inset-0 opacity-10" 
           style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, gray 1px, transparent 0)', backgroundSize: '40px 40px' }} 
           aria-hidden />
      <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="relative overflow-hidden rounded-3xl bg-primary p-10 sm:p-16 text-center shadow-lg"
        >
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '20px 20px' }} 
               aria-hidden />
          <div className="relative">
            <h2 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Phiên bản mạnh mẽ nhất của bạn<br />bắt đầu từ hôm nay.
            </h2>
            <p className="mt-5 text-lg text-primary-foreground/90 max-w-xl mx-auto">
              Thử nghiệm OmniGym miễn phí trong 7 ngày. Không cần thẻ. Chỉ cần xuất hiện.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-4">
              <a
                href="#pricing"
                className="group inline-flex items-center gap-2 rounded-full bg-background px-7 py-3.5 text-sm font-semibold text-primary shadow-md transition-transform hover:scale-[1.03]"
              >
                Bắt đầu dùng thử miễn phí
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#"
                className="inline-flex items-center gap-2 rounded-full border border-primary-foreground/30 px-7 py-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary-foreground/10 transition-colors"
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
