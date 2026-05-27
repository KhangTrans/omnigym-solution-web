import { motion } from "framer-motion";
import { Users, Dumbbell, Clock } from "lucide-react";

const features = [
  { icon: Users, title: "Huấn luyện viên chuyên gia", desc: "Các huấn luyện viên được chứng nhận xây dựng kế hoạch phù hợp với trình độ và mục tiêu của bạn." },
  { icon: Dumbbell, title: "Thiết bị hiện đại", desc: "Máy móc cao cấp và tạ tự do trên diện tích hơn 1.000 m2." },
  { icon: Clock, title: "Mở cửa 24/7", desc: "Tập luyện theo lịch trình của bạn với quyền truy cập an toàn suốt ngày đêm." },
];

export function About() {
  return (
    <section className="relative py-24 bg-background overflow-hidden">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
        <div className="absolute inset-0 bg-grid opacity-[0.03] pointer-events-none" />
        
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid gap-12 lg:grid-cols-2 lg:gap-20 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Về OmniGym</p>
            <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl text-foreground">
              Không chỉ là một phòng tập — <span className="text-primary">đó là một phong trào.</span>
            </h2>
            <p className="mt-5 text-lg text-muted-foreground">
              Chúng tôi kết hợp huấn luyện thông minh, cơ sở vật chất cao cấp và một cộng đồng sôi động
              để mỗi buổi tập đều có ý nghĩa. Cho dù bạn mới bắt đầu hay đang theo đuổi kỷ lục cá nhân mới,
              bạn sẽ tìm thấy nhịp độ của mình tại đây.
            </p>
          </motion.div>

          <div className="grid gap-4">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-80px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="flex gap-5 rounded-2xl border border-border bg-card p-6 shadow-md transition-transform hover:-translate-y-1"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg text-foreground">{f.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{f.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
