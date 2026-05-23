import { Navbar } from "../../components/site/Navbar";
import { Hero } from "../../components/site/Hero";
import { About } from "../../components/site/About";
import { Plans } from "../../components/site/Plans";
import { Testimonials } from "../../components/site/Testimonials";
import { FinalCTA } from "../../components/site/FinalCTA";
import { Footer } from "../../components/site/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Plans />
        <Testimonials />
        <FinalCTA />
      </main>
      <Footer />
    </div>
  );
}
