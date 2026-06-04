import { motion } from "framer-motion";
import { Navbar } from "../../components/site/Navbar";
import { Hero } from "../../components/site/Hero";
import { About } from "../../components/site/About";
import { Plans } from "../../components/site/Plans";
import { Testimonials } from "../../components/site/Testimonials";
import { FinalCTA } from "../../components/site/FinalCTA";
import { FAQSection } from "../../components/site/FAQSection";
import { Footer } from "../../components/site/Footer";
import { ScrollProgressButton } from "../../components/site/ScrollProgressButton";

const reveal = {
  initial: { opacity: 0, y: 18, filter: "blur(14px)" },
  whileInView: { opacity: 1, y: 0, filter: "blur(0px)" },
  viewport: { once: true, margin: "-90px" as const },
  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] as const },
};

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <motion.div {...reveal}>
          <About />
        </motion.div>
        <motion.div {...reveal}>
          <Plans />
        </motion.div>
        <motion.div {...reveal}>
          <Testimonials />
        </motion.div>
        <motion.div {...reveal}>
          <FAQSection />
        </motion.div>
        <motion.div {...reveal}>
          <FinalCTA />
        </motion.div>
      </main>
      <Footer />
      <ScrollProgressButton />
    </div>
  );
}
