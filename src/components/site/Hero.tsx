import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Play } from "lucide-react";
import heroImage from "../../assets/hero-gym.jpg";

const WORDS = ["mạnh mẽ hơn.", "khỏe mạnh hơn.", "không giới hạn."];

export function Hero() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section id="home" className="relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-60" aria-hidden />
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-primary opacity-20 blur-3xl" aria-hidden />

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-12 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:py-28 lg:px-8">
        <div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-primary"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            Mùa mới · Gói chỉ từ $19
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="mt-6 text-6xl font-black leading-[1.05] tracking-tighter text-foreground sm:text-7xl lg:text-8xl"
          >
            Tập luyện hết mình.<br />
            Sống{" "}
            <span className="relative inline-block align-baseline">
              <AnimatePresence mode="wait">
                <motion.span
                  key={WORDS[i]}
                  initial={{ opacity: 0, y: 20, filter: "blur(16px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -20, filter: "blur(16px)" }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="inline-block text-primary pb-2"
                >
                  {WORDS[i]}
                </motion.span>
              </AnimatePresence>
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-6 max-w-xl text-lg text-muted-foreground"
          >
            Phòng tập hiện đại được xây dựng dựa trên mục tiêu của bạn. Huấn luyện viên chuyên gia, thiết bị đẳng cấp thế giới,
            và một cộng đồng thúc đẩy bạn tiến lên — mở cửa 24/7.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="mt-8 flex flex-wrap items-center gap-4"
          >
            <a
              href="#pricing"
              className="group inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-7 py-3.5 text-sm font-semibold text-[var(--primary-foreground)] shadow-glow transition-transform hover:scale-[1.03]"
            >
              Tham gia ngay
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </a>
            <a
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-6 py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <Play className="h-4 w-4 text-primary" />
              Xem gói tập
            </a>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.7 }}
            className="mt-12 flex items-center gap-8"
          >
            {[
              { k: "12k+", v: "Thành viên tích cực" },
              { k: "50+", v: "Lớp học hàng tuần" },
              { k: "4.9★", v: "Đánh giá thành viên" },
            ].map((s) => (
              <div key={s.v}>
                <div className="text-2xl font-bold text-foreground">{s.k}</div>
                <div className="text-xs text-muted-foreground">{s.v}</div>
              </div>
            ))}
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative"
        >
          <div className="absolute -inset-4 rounded-3xl bg-primary opacity-30 blur-2xl" aria-hidden />
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-glow">
            <img
              src={heroImage}
              alt="Vận động viên tập luyện với tạ tay tại phòng tập OmniGym"
              width={1280}
              height={1280}
              className="h-full w-full object-cover aspect-[4/5]"
            />
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="absolute -bottom-6 -left-6 hidden sm:flex items-center gap-3 rounded-2xl border border-border bg-background px-5 py-4 shadow-card"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-9 w-9 rounded-full border-2 border-background bg-primary" />
              ))}
            </div>
            <div className="text-sm">
              <div className="font-semibold text-foreground">Đang hoạt động</div>
              <div className="text-muted-foreground text-xs">48 thành viên đang tập luyện</div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
