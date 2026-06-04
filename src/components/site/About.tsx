import { motion } from "framer-motion";
import { Users, Dumbbell, Clock, ArrowUpRight } from "lucide-react";

const features = [
  {
    icon: Users,
    title: "Huấn luyện viên chuyên gia",
    desc: "Các huấn luyện viên được chứng nhận xây dựng kế hoạch phù hợp với trình độ, thể trạng và mục tiêu của bạn.",
    stat: "1:1 Coaching",
  },
  {
    icon: Dumbbell,
    title: "Thiết bị hiện đại",
    desc: "Máy móc cao cấp và khu free-weight được bố trí khoa học, tối ưu cho cả người mới lẫn người tập chuyên sâu.",
    stat: "1000m²+ Space",
  },
  {
    icon: Clock,
    title: "Mở cửa 24/7",
    desc: "Chủ động tập luyện theo lịch trình riêng với không gian an toàn, linh hoạt và luôn sẵn sàng cho bạn.",
    stat: "Anytime Access",
  },
];

export function About() {
  return (
    <section id="about" className="relative overflow-hidden bg-background py-24">
      <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-60" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid items-start gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24, filter: "blur(14px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
              Về OmniGym
            </div>

            <h2 className="mt-6 text-4xl font-semibold leading-[1.02] tracking-[-0.04em] text-foreground sm:text-5xl lg:text-6xl">
              Không chỉ là một phòng tập —{' '}
              <span className="text-primary">đó là một phong trào.</span>
            </h2>

            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-[1.15rem]">
              Chúng tôi kết hợp huấn luyện thông minh, cơ sở vật chất cao cấp và một cộng đồng tích cực để mỗi buổi tập đều có ý nghĩa. Dù bạn mới bắt đầu hay đang theo đuổi một cột mốc lớn hơn, OmniGym luôn giúp bạn giữ đúng nhịp độ và động lực.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#pricing"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-glow transition-transform hover:-translate-y-0.5"
              >
                Xem gói tập
                <ArrowUpRight className="h-4 w-4" />
              </a>
              <div className="flex items-center gap-6 text-sm text-muted-foreground">
                <div>
                  <div className="text-2xl font-semibold text-foreground">12k+</div>
                  <div>Hội viên</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-foreground">4.9★</div>
                  <div>Đánh giá trung bình</div>
                </div>
              </div>
            </div>
          </motion.div>

          <div className="grid gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 24, filter: "blur(14px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.58, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                className="group relative overflow-hidden rounded-[24px] bg-white/90 p-5 shadow-[0_10px_32px_rgba(15,23,42,0.06)] backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_44px_rgba(79,138,116,0.11)]"
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                    <f.icon className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="text-lg font-semibold tracking-tight text-foreground">
                        {f.title}
                      </h3>
                      <span className="w-fit rounded-full border border-primary/15 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                        {f.stat}
                      </span>
                    </div>
                    <p className="mt-2.5 max-w-xl text-sm leading-6 text-muted-foreground">
                      {f.desc}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
