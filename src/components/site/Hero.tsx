import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Sparkles } from "lucide-react";

const WORDS = ["mạnh mẽ hơn.", "khỏe hơn mỗi ngày.", "không giới hạn."];

function AppStoreIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 text-white"
      fill="currentColor"
      aria-hidden
    >
      <path d="M16.2 12.1c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.7-1.7-3.3-1.7-1.4-.1-2.8.8-3.5.8-.7 0-1.8-.8-3-.8-1.5 0-2.9.9-3.7 2.2-1.6 2.8-.4 6.9 1.1 9.1.7 1.1 1.6 2.3 2.8 2.2 1.1 0 1.6-.7 3-.7 1.4 0 1.8.7 3 .7 1.2 0 2-1.1 2.7-2.2.8-1.2 1.1-2.4 1.1-2.4-.1 0-3.1-1.2-3.1-3.8Zm-2.3-6.6c.6-.8 1-1.9.9-3-.9 0-2 .6-2.7 1.3-.6.7-1.1 1.8-1 2.9 1 .1 2-.5 2.8-1.2Z" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path
        fill="#34A853"
        d="M3.6 2.9c-.3.3-.6.9-.6 1.7v14.8c0 .8.3 1.4.6 1.7l.1.1 8.4-8.4v-.2L3.7 2.8l-.1.1Z"
      />
      <path
        fill="#FBBC04"
        d="m14.8 9.8-2.7 2.7v.2l2.7 2.7.1-.1 3.2-1.8c.9-.5.9-1.3 0-1.8l-3.2-1.8-.1-.1Z"
      />
      <path
        fill="#EA4335"
        d="m14 16.1-2.8-2.8-8.4 8.4c.4.4 1 .4 1.8 0l9.4-5.4Z"
      />
      <path
        fill="#4285F4"
        d="M4.6 2.1c-.8-.4-1.4-.4-1.8 0l8.4 8.4L14 7.7 4.6 2.1Z"
      />
    </svg>
  );
}
const fadeBlurUp = {
  initial: { opacity: 0, y: 16, filter: "blur(14px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)" },
};

const smoothEase = [0.16, 1, 0.3, 1] as const;

export function Hero() {
  const [i, setI] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setI((v) => (v + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <section
      id="home"
      className="relative overflow-hidden bg-background text-foreground"
    >
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(79,138,116,0.12)_0%,rgba(79,138,116,0.05)_24%,rgba(255,255,255,0)_58%)]"
        aria-hidden
      />
      <motion.div
        aria-hidden
        initial={{
          opacity: 0,
          y: -170,
          x: -80,
          rotate: -16,
          filter: "blur(34px)",
        }}
        animate={{
          opacity: [0, 0.2, 0.14],
          y: [-170, -30, 20],
          x: [-80, -10, 20],
          filter: "blur(42px)",
        }}
        transition={{ duration: 2.4, ease: "easeOut" }}
        className="pointer-events-none absolute -left-20 -top-28 h-[720px] w-[520px] bg-[linear-gradient(120deg,rgba(79,138,116,0.22)_0%,rgba(79,138,116,0.11)_34%,rgba(79,138,116,0.04)_58%,transparent_76%)]"
      />
      <motion.div
        aria-hidden
        initial={{ opacity: 0, y: -90 }}
        animate={{ opacity: [0, 0.12, 0.08], y: [-90, 0, 18] }}
        transition={{ duration: 2.8, ease: "easeOut", delay: 0.15 }}
        className="pointer-events-none absolute left-1/2 top-0 h-[430px] w-[820px] -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(79,138,116,0.16),rgba(79,138,116,0.06)_38%,transparent_72%)] blur-3xl"
      />
      <div
        className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-60"
        aria-hidden
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl items-center justify-center px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28">
        <div className="mx-auto max-w-6xl">
          <motion.div
            {...fadeBlurUp}
            transition={{ duration: 0.7, delay: 0.05, ease: smoothEase }}
            className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-4 py-2 text-xs font-medium tracking-wide text-primary shadow-sm backdrop-blur-md"
          >
            <span className="rounded-full bg-primary px-2 py-1 text-[8px] font-medium text-primary-foreground">
              New
            </span>
            <span>48 thành viên đang hoạt động lúc này</span>
          </motion.div>

          <motion.h1
            {...fadeBlurUp}
            transition={{ duration: 0.86, delay: 0.12, ease: smoothEase }}
            className="mt-8 text-4xl font-semibold leading-[1.14] tracking-[-0.04em] text-foreground sm:text-5xl sm:leading-[1.12] md:text-6xl lg:text-[4.9rem] xl:text-[5.35rem]"
          >
            <span className="block">Chạm tới phiên bản</span>
            <span className="block">tốt hơn của bạn</span>
            <span className="mt-2 flex flex-nowrap items-baseline justify-center gap-x-[0.18em] whitespace-nowrap text-foreground">
              <span>cùng OmniGym</span>
              <span className="relative inline-grid min-h-[1.08em] min-w-[6.9em] place-items-start align-baseline text-left text-primary">
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={WORDS[i]}
                    initial={{ opacity: 0, y: 10, filter: "blur(10px)" }}
                    animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: -10, filter: "blur(10px)" }}
                    transition={{ duration: 0.46, ease: smoothEase }}
                    className="absolute inset-0 inline-flex items-baseline justify-start whitespace-nowrap leading-none will-change-transform"
                  >
                    {WORDS[i]}
                  </motion.span>
                </AnimatePresence>
                <span
                  className="invisible whitespace-nowrap leading-none"
                  aria-hidden
                >
                  khỏe hơn mỗi ngày.
                </span>
              </span>
            </span>
          </motion.h1>

          <motion.p
            {...fadeBlurUp}
            transition={{ duration: 0.7, delay: 0.19, ease: smoothEase }}
            className="mx-auto mt-7 max-w-3xl text-sm font-normal leading-relaxed text-muted-foreground sm:text-base md:text-lg"
          >
            Ứng dụng và hệ sinh thái tập luyện giúp bạn quản lý gói tập, đặt
            lịch PT, theo dõi tiến trình và duy trì động lực mỗi ngày — trong
            một trải nghiệm gọn, hiện đại và tập trung.
          </motion.p>

          <motion.div
            {...fadeBlurUp}
            transition={{ duration: 0.7, delay: 0.26, ease: smoothEase }}
            className="mt-10 flex flex-wrap items-center justify-center gap-4"
          >
            <a
              href="#pricing"
              className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-4 text-sm font-semibold text-primary-foreground shadow-glow transition-all hover:-translate-y-0.5"
            >
              Bắt đầu ngay
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#about"
              className="inline-flex min-w-[220px] items-center justify-center gap-2 rounded-2xl border border-border bg-background px-6 py-4 text-sm font-medium text-foreground backdrop-blur-md transition-all hover:bg-muted"
            >
              <Sparkles className="h-4 w-4" />
              Khám phá thêm
            </a>
          </motion.div>

          <motion.div
            {...fadeBlurUp}
            transition={{ duration: 0.72, delay: 0.34, ease: smoothEase }}
            className="mt-10 flex flex-col items-center justify-center gap-2 sm:flex-row sm:gap-4"
          >
            <a
              href="#"
              className="inline-flex min-w-[132px] items-center justify-center gap-1.5 rounded-md border border-white/20 bg-black px-2.5 py-1.5 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
              aria-label="Download on the App Store"
            >
              <AppStoreIcon />
              <span className="text-left leading-none">
                <span className="block text-[7px] font-medium tracking-tight text-white">
                  Download on the
                </span>
                <span className="mt-0.5 block text-[15px] font-semibold tracking-[-0.04em] text-white">
                  App Store
                </span>
              </span>
            </a>
            {/* <span className="text-sm font-medium text-muted-foreground">hoặc</span> */}
            <a
              href="#"
              className="inline-flex min-w-[145px] items-center justify-center gap-1.5 rounded-md border border-white/20 bg-black px-2.5 py-1.5 text-white shadow-[0_8px_18px_rgba(0,0,0,0.16)] ring-1 ring-black/10 transition-all hover:-translate-y-0.5 hover:bg-zinc-900"
              aria-label="Get it on Google Play"
            >
              <PlayStoreIcon />
              <span className="text-left leading-none">
                <span className="block text-[8px] font-medium uppercase tracking-wide text-white">
                  Get it on
                </span>
                <span className="mt-0.5 block text-[15px] font-semibold tracking-[-0.04em] text-white">
                  Google Play
                </span>
              </span>
            </a>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
