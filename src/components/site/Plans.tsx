import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Cơ bản",
    price: 19,
    desc: "Bắt đầu với những điều thiết yếu.",
    features: ["Truy cập khu vực tập chung", "Tủ đồ & phòng tắm", "Bài tập trên ứng dụng di động"],
    featured: false,
  },
  {
    name: "Tiêu chuẩn",
    price: 39,
    desc: "Gói phổ biến nhất của chúng tôi.",
    features: ["Bao gồm tất cả gói Cơ bản", "Tất cả các lớp nhóm", "1 buổi PT / tháng", "Truy cập phòng xông hơi"],
    featured: true,
  },
  {
    name: "Cao cấp",
    price: 69,
    desc: "Tập luyện không giới hạn.",
    features: ["Bao gồm tất cả gói Tiêu chuẩn", "Không giới hạn buổi PT", "Kế hoạch dinh dưỡng", "Thẻ mời khách"],
    featured: false,
  },
];

export function Plans() {
  return (
    <section id="pricing" className="relative py-24 bg-muted/30">
      <div className="absolute inset-0 opacity-5" 
           style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, gray 1px, transparent 0)', backgroundSize: '20px 20px' }} 
           aria-hidden />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.58, ease: [0.16, 1, 0.3, 1] }}
          className="mx-auto max-w-2xl text-center"
        >
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">Gói hội viên</p>
          <h2 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl text-foreground">Chọn nhịp độ của bạn</h2>
          <p className="mt-4 text-lg text-muted-foreground">Không hợp đồng ràng buộc. Hủy bất cứ lúc nào. Tất cả các gói đều bao gồm 7 ngày dùng thử miễn phí.</p>
        </motion.div>

        <div className="mt-14 grid items-stretch gap-6 md:grid-cols-3">
          {plans.map((p, i) => (
            <motion.div
              key={p.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.52, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
              className={`relative flex h-full min-h-[520px] flex-col rounded-3xl border bg-card p-8 transition-transform hover:-translate-y-1 ${
                p.featured
                  ? "border-primary shadow-lg"
                  : "border-border shadow-md"
              }`}
            >
              {p.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-1 text-xs font-semibold text-primary-foreground">
                  Phổ biến nhất
                </span>
              )}
              <h3 className="text-xl font-bold text-foreground">{p.name}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{p.desc}</p>
              <div className="mt-6 flex items-baseline gap-1">
                <span className="text-5xl font-extrabold tracking-tight text-foreground">${p.price}</span>
                <span className="text-muted-foreground">/tháng</span>
              </div>
              <ul className="mt-6 flex-1 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-center gap-3 text-sm text-foreground/80">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <a
                href="#contact"
                className={`mt-auto inline-flex w-full items-center justify-center rounded-full px-5 py-3 text-sm font-semibold transition-transform hover:scale-[1.02] ${
                  p.featured
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "border border-border bg-background text-foreground hover:bg-muted"
                }`}
              >
                Chọn {p.name}
              </a>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
