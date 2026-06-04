import { Outlet } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import heroImg from "../assets/hero-gym.jpg";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-2 bg-background text-foreground overflow-hidden font-sans">
      {/* Left: form area */}
      <div className="relative flex flex-col px-8 py-10 sm:px-12 lg:px-20 bg-background z-10 overflow-y-auto no-scrollbar border-r border-border text-left">
        {/* Subtle grid for the left side */}
        <div className="absolute inset-0 bg-grid bg-grid-fade opacity-[0.03] pointer-events-none" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-12">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-card">
              <Dumbbell className="h-5 w-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-foreground">
              OmniGym
            </span>
          </div>
        </div>

        <div className="flex flex-1 items-center justify-center py-4 relative z-10">
          <div className="w-full max-w-sm">
            <AnimatePresence mode="wait">
              <Outlet />
            </AnimatePresence>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 mt-auto font-medium">
          © {new Date().getFullYear()} OmniGym. Tất cả quyền được bảo lưu.
        </div>

        <style>{`
          .no-scrollbar::-webkit-scrollbar { display: none; }
          .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        `}</style>
      </div>

      {/* Right: Visionary Hero Section */}
      <div className="relative hidden lg:block overflow-hidden bg-background">
        <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0"
        >
            <img
            src={heroImg}
            alt="Athletes training"
            className="h-full w-full object-cover"
            />
        </motion.div>
        
        <div className="absolute inset-0 bg-gradient-to-tr from-primary/70 via-primary/30 to-transparent" />
        <div className="absolute inset-0 bg-grid-animated bg-grid-fade opacity-30" />

        <div className="absolute inset-0 flex flex-col justify-end p-20 text-primary-foreground z-20">
          <Card className="max-w-xl border-white/10 bg-background/10 text-primary-foreground shadow-2xl backdrop-blur-md">
            <CardContent className="p-8 text-left">
              <Badge variant="secondary" className="mb-4 bg-white/15 text-primary-foreground hover:bg-white/15">
                Hệ sinh thái tập luyện toàn diện
              </Badge>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
            >
                <h2 className="text-5xl font-bold leading-tight tracking-tight mb-4">
                    Tập luyện có mục tiêu. <br />
                    Sống <span className="italic">không giới hạn.</span>
                </h2>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="text-base text-primary-foreground/90 mb-10 max-w-md leading-relaxed"
            >
              Tham gia cùng cộng đồng hơn 12.000+ hội viên đang cùng OmniGym chinh phục phiên bản khỏe mạnh nhất của chính mình.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex gap-12 pt-8"
            >
              {[
                { label: "Hội viên", value: "12k+" },
                { label: "Lớp học", value: "50+" },
                { label: "Đánh giá", value: "4.9★" }
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-primary-foreground/70 font-semibold">{stat.label}</div>
                </div>
              ))}
            </motion.div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
