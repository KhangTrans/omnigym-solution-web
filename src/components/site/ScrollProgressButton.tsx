import { useEffect, useRef, useState } from "react";
import { ArrowUp } from "lucide-react";
import { motion, useScroll, useTransform } from "framer-motion";

export function ScrollProgressButton() {
  const { scrollYProgress } = useScroll();
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 360]);
  const [isScrollingDown, setIsScrollingDown] = useState(false);
  const lastScrollY = useRef(0);

  useEffect(() => {
    lastScrollY.current = window.scrollY;

    const onScroll = () => {
      const currentY = window.scrollY;
      const delta = currentY - lastScrollY.current;

      if (Math.abs(delta) > 4) {
        setIsScrollingDown(delta > 0);
        lastScrollY.current = currentY;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToTop = () => {
    setIsScrollingDown(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      type="button"
      aria-label="Quay lại đầu trang"
      onClick={scrollToTop}
      className="group fixed bottom-6 right-6 z-50 grid h-14 w-14 place-items-center rounded-full border border-primary/20 bg-white/55 text-primary shadow-card backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:bg-white/75 sm:bottom-8 sm:right-8"
    >
      <motion.svg
        viewBox="0 0 56 56"
        className="absolute inset-0 h-full w-full"
        style={{ rotate }}
        aria-hidden
      >
        <defs>
          <linearGradient id="scroll-progress-gradient" x1="8" y1="8" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stopColor="var(--primary)" stopOpacity="0.35" />
            <stop offset="0.5" stopColor="var(--primary-glow)" stopOpacity="0.95" />
            <stop offset="1" stopColor="var(--primary)" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <circle
          cx="28"
          cy="28"
          r="25"
          fill="none"
          stroke="rgba(79, 138, 116, 0.14)"
          strokeWidth="1.5"
        />
        <motion.circle
          cx="28"
          cy="28"
          r="25"
          fill="none"
          stroke="url(#scroll-progress-gradient)"
          strokeWidth="2.5"
          strokeLinecap="round"
          pathLength="1"
          strokeDasharray="1"
          style={{ pathLength: scrollYProgress }}
        />
      </motion.svg>

      <span className="absolute inset-[7px] rounded-full border border-white/70 bg-background/70 shadow-sm" aria-hidden />
      <motion.span
        className="relative grid place-items-center"
        animate={{ rotate: isScrollingDown ? 180 : 0, y: isScrollingDown ? 1 : 0 }}
        transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
      >
        <ArrowUp className="h-5 w-5 transition-transform group-hover:-translate-y-0.5" />
      </motion.span>
    </button>
  );
}
