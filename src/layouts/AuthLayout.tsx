import { Outlet } from "react-router-dom";
import { Dumbbell } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import heroImg from "../assets/hero-gym.jpg";

export default function AuthLayout() {
  return (
    <div className="min-h-screen w-full grid lg:grid-cols-[1fr_1.1fr] bg-white text-slate-900 overflow-hidden font-sans">
      {/* Left: form area */}
      <div className="relative flex flex-col px-8 py-10 sm:px-12 lg:px-20 bg-white z-10 overflow-y-auto no-scrollbar">
        <div className="flex items-center gap-2 mb-12">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#4F8A74] text-white">
            <Dumbbell className="h-5 w-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">
            OmniGym
          </span>
        </div>

        <div className="flex flex-1 items-center justify-center py-4">
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
      <div className="relative hidden lg:block overflow-hidden bg-slate-900">
        <motion.div
            initial={{ scale: 1.05, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="absolute inset-0"
        >
            <img
            src={heroImg}
            alt="Athletes training"
            className="h-full w-full object-cover brightness-[0.4] contrast-[1.1]"
            />
        </motion.div>
        
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
            <div 
                className="absolute inset-0" 
                style={{ 
                    backgroundImage: `
                    linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)
                    `,
                    backgroundSize: '40px 40px' 
                }} 
            />
        </div>

        <div className="absolute inset-0 flex flex-col justify-end p-20 text-white z-20">
          <div className="max-w-xl">
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
              className="text-base text-slate-300 mb-10 max-w-md leading-relaxed"
            >
              Tham gia cùng cộng đồng hơn 12.000+ hội viên đang cùng OmniGym chinh phục phiên bản khỏe mạnh nhất của chính mình.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.8 }}
              className="flex gap-12 border-t border-white/10 pt-8"
            >
              {[
                { label: "Hội viên", value: "12k+" },
                { label: "Lớp học", value: "50+" },
                { label: "Đánh giá", value: "4.9★" }
              ].map((stat, idx) => (
                <div key={idx} className="flex flex-col gap-0.5">
                  <div className="text-xl font-bold">{stat.value}</div>
                  <div className="text-[10px] uppercase tracking-[0.1em] text-slate-400 font-semibold">{stat.label}</div>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
